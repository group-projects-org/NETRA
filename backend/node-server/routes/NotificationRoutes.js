const express = require("express");
const db = require("../db");
const router = express.Router();
const verifyToken = require("../middleware/authMiddleware");
const allowRoles = require("../middleware/roleMiddleware");
// Fetch examiners by department
router.get("/examiners", async (req, res) => {
    try {
        const { department } = req.query;
        if (!department?.trim()) {
            return res.status(400).json({
                success: false,
                message: "Department is required."
            });
        }
        const [examiners] = await db.execute(
            `SELECT id, examiner_id, full_name, email, department
             FROM examiners
             WHERE department = ?
             AND account_status = 'ACTIVE'
             ORDER BY full_name ASC`,
            [department.trim()]
        );
        return res.status(200).json({
            success: true,
            count: examiners.length,
            data: examiners
        });

    } catch (error) {
        console.error("Fetch Department Examiners Error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to fetch examiners."
        });
    }
});
router.post("/send", async (req, res) => {
    let connection;
    let transactionStarted = false;
    try {
        const { title, message, examinerIds, audienceType } = req.body;
        let uniqueExaminerIds = [];
        if (typeof title !== "string" || !title.trim() || typeof message !== "string" || !message.trim() || !["ALL_EXAMINERS", "SELECTED_EXAMINERS"].includes(audienceType) || (audienceType === "SELECTED_EXAMINERS" && (!Array.isArray(examinerIds) || examinerIds.length === 0)))
             return res.status(400).json({ success: false, message: "Title, message and valid recipients are required." });
        if (audienceType === "SELECTED_EXAMINERS" && examinerIds.some(id => !Number.isSafeInteger(id) || id <= 0)) {
             return res.status(400).json({ success: false, message: "Invalid examiner IDs." });
        }
        connection = await db.getConnection();
        await connection.beginTransaction();
        transactionStarted = true;
        if (audienceType === "ALL_EXAMINERS") {
            const [rows] = await connection.execute("SELECT id FROM examiners WHERE account_status = 'ACTIVE'");
            uniqueExaminerIds = rows.map(row => row.id);
        } else {
            uniqueExaminerIds = [...new Set(examinerIds)];
            const placeholders = uniqueExaminerIds.map(() => "?").join(",");
            const [examiners] = await connection.execute(
                `SELECT id FROM examiners WHERE id IN (${placeholders}) AND account_status = 'ACTIVE'`, uniqueExaminerIds);
            if (examiners.length !== uniqueExaminerIds.length) {
                await connection.rollback();
                transactionStarted = false;
                return res.status(400).json({ 
                    success: false, message: "One or more selected examiners are invalid or inactive." });
            }
        }
        if (uniqueExaminerIds.length === 0) {
            await connection.rollback();
            transactionStarted = false;
            return res.status(400).json({ success: false, message: "No active examiners found." });
        }
        const [notificationResult] = await connection.execute
        ("INSERT INTO notifications (title, message) VALUES (?, ?)", [title.trim(), message.trim()]);
        const notificationId = notificationResult.insertId;
        const recipientValues = uniqueExaminerIds.map(() => "(?, ?)").join(", ");
        const recipientParams = uniqueExaminerIds.flatMap(id => [notificationId, id]);
        await connection.execute
        (`INSERT INTO notification_recipients (notification_id, examiner_id) VALUES ${recipientValues}`, recipientParams);
        await connection.commit();
        transactionStarted = false;
        const io = req.app.get("io");
        if (io)
             uniqueExaminerIds.forEach(examinerId => io.to(`examiner_${examinerId}`).emit("notification:new", { notificationId, title: title.trim(), message: message.trim(), createdAt: new Date().toISOString(), isRead: false }));
        return res.status(201).json({ 
            success: true, message: "Notification sent successfully.", data: { notificationId, recipientCount: uniqueExaminerIds.length } });
    } catch (error) {
        if (connection && transactionStarted) await connection.rollback();
        console.error("Send Notification Error:", error);
        return res.status(500).json({ success: false, message: "Unable to send notification." });
    } finally {
        if (connection) connection.release();
    }
});

// GET: Fetch recent notifications for admin dashboard
router.get(
    "/recent",
    verifyToken,
    allowRoles("ADMIN"),
    async (req, res) => {
        try {
            const [notifications] = await db.execute(
                `SELECT
                    n.id AS notificationId,
                    n.title,
                    n.message,
                    n.created_at AS createdAt,
                    COUNT(nr.examiner_id) AS recipientCount
                 FROM notifications n
                 LEFT JOIN notification_recipients nr
                    ON n.id = nr.notification_id
                 GROUP BY n.id, n.title, n.message, n.created_at
                 ORDER BY n.created_at DESC
                 LIMIT 5`
            );

            return res.status(200).json({
                success: true,
                data: notifications
            });

        } catch (error) {
            console.error("Fetch Recent Notifications Error:", error);

            return res.status(500).json({
                success: false,
                message: "Unable to fetch recent notifications."
            });
        }
    }
);

// GET: Fetch notifications for logged-in examiner
router.get(
    "/my-notifications",
    verifyToken,
    allowRoles("EXAMINER"),
    async (req, res) => {
        try {
            const examinerId = req.user.id;

            const [notifications] = await db.execute(
                `SELECT
                    n.id AS notificationId,
                    n.title,
                    n.message,
                    n.created_at AS createdAt,
                    nr.is_read AS isRead,
                    nr.read_at AS readAt
                 FROM notification_recipients nr
                 INNER JOIN notifications n
                    ON nr.notification_id = n.id
                 WHERE nr.examiner_id = ?
                 ORDER BY n.created_at DESC`,
                [examinerId]
            );

            return res.status(200).json({
                success: true,
                count: notifications.length,
                data: notifications.map(item => ({
                    ...item,
                    isRead: Boolean(item.isRead)
                }))
            });

        } catch (error) {
            console.error("Fetch Examiner Notifications Error:", error);

            return res.status(500).json({
                success: false,
                message: "Unable to fetch notifications."
            });
        }
    }
);

// PATCH: Mark notification as read
router.patch(
    "/:notificationId/read",
    verifyToken,
    allowRoles("EXAMINER"),
    async (req, res) => {
        try {
            const examinerId = req.user.id;
            const { notificationId } = req.params;

            if (!/^[1-9]\d*$/.test(notificationId)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid notification ID."
                });
            }

            const [result] = await db.execute(
                `UPDATE notification_recipients
                 SET is_read = 1,
                     read_at = CURRENT_TIMESTAMP
                 WHERE notification_id = ?
                 AND examiner_id = ?`,
                [notificationId, examinerId]
            );

            if (result.affectedRows === 0) {
                return res.status(404).json({
                    success: false,
                    message: "Notification not found for this examiner."
                });
            }

            return res.status(200).json({
                success: true,
                message: "Notification marked as read."
            });

        } catch (error) {
            console.error("Mark Notification Read Error:", error);

            return res.status(500).json({
                success: false,
                message: "Unable to update notification status."
            });
        }
    }
);
// GET: Fetch unread notification count for logged-in examiner
router.get(
  "/unread-count",
  verifyToken,
  allowRoles("EXAMINER"),
  async (req, res) => {
    try {
      const examinerId = req.user.id;

      const [rows] = await db.execute(
        `SELECT COUNT(*) AS unreadCount
         FROM notification_recipients
         WHERE examiner_id = ? AND is_read = 0`,
        [examinerId]
      );

      return res.status(200).json({
        success: true,
        unreadCount: rows[0].unreadCount
      });
    } catch (error) {
      console.error("Fetch Unread Notification Count Error:", error);
      return res.status(500).json({
        success: false,
        message: "Unable to fetch unread notification count."
      });
    }
  }
);

// PATCH: Mark all notifications as read for logged-in examiner
router.patch(
  "/mark-all-read",
  verifyToken,
  allowRoles("EXAMINER"),
  async (req, res) => {
    try {
      const examinerId = req.user.id;

      const [result] = await db.execute(
        `UPDATE notification_recipients
         SET is_read = 1,
             read_at = CURRENT_TIMESTAMP
         WHERE examiner_id = ? AND is_read = 0`,
        [examinerId]
      );

      return res.status(200).json({
        success: true,
        message: "All notifications marked as read.",
        updatedCount: result.affectedRows
      });
    } catch (error) {
      console.error("Mark All Notifications As Read Error:", error);
      return res.status(500).json({
        success: false,
        message: "Unable to mark all notifications as read."
      });
    }
  }
);
module.exports = router;