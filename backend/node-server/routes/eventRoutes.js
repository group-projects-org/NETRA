const express = require("express");
const db = require("../db");
const router = express.Router();
const verifyToken = require("../middleware/authMiddleware");
const allowRoles = require("../middleware/roleMiddleware");
router.post("/create", async (req, res) => {
    let connection;
    let transactionStarted = false;
    try {
        const { title, message, eventDate, startTime, endTime, audienceType, examinerIds, department } = req.body;
        // Validate required fields
        if (typeof title !== "string" || !title.trim() || typeof eventDate !== "string" || typeof startTime !== "string" || typeof endTime !== "string" || !["ALL_EXAMINERS", "SELECTED_EXAMINERS"].includes(audienceType)) {
            return res.status(400).json({ success: false, message: "Invalid or missing event details." });
        }
        // Validate date and time
        const date = new Date(`${eventDate}T00:00:00Z`);
        const timeRegex = /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/;
        if (!/^\d{4}-\d{2}-\d{2}$/.test(eventDate) || Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== eventDate || !timeRegex.test(startTime) || !timeRegex.test(endTime) || endTime <= startTime) {
            return res.status(400).json({ success: false, message: "Invalid date or time. End time must be after start time." });
        }
        if (message !== undefined && typeof message !== "string") {
            return res.status(400).json({ success: false, message: "Invalid event message." });
        }
        connection = await db.getConnection();
        await connection.beginTransaction();
        transactionStarted = true;

        let ids = [];
        // Fetch recipients
        if (audienceType === "ALL_EXAMINERS") {
            const [rows] = await connection.execute("SELECT id FROM examiners WHERE account_status = 'ACTIVE'");
            ids = rows.map(row => row.id);
        } else {
            if (typeof department !== "string" || !department.trim() || !Array.isArray(examinerIds) || examinerIds.length === 0 || examinerIds.some(id => !Number.isSafeInteger(id) || id <= 0)) {
                throw new Error("Invalid department or examiner selection.");
            }

            ids = [...new Set(examinerIds)];

            const placeholders = ids.map(() => "?").join(",");
            const [rows] = await connection.execute(
                `SELECT id FROM examiners WHERE id IN (${placeholders}) AND department = ? AND account_status = 'ACTIVE'`,
                [...ids, department.trim()]
            );

            if (rows.length !== ids.length) {
                throw new Error("Some selected examiners are invalid or inactive.");
            }
        }

        if (ids.length === 0) {
            throw new Error("No active examiners found.");
        }

        // Create event
        const [event] = await connection.execute(
            `INSERT INTO events (title, message, event_date, start_time, end_time) VALUES (?, ?, ?, ?, ?)`,
            [title.trim(), message?.trim() || null, eventDate, startTime, endTime]
        );

        const eventId = event.insertId;
        // Assign event to examiners
        const values = ids.map(() => "(?, ?)").join(",");
        const params = ids.flatMap(id => [eventId, id]);
        await connection.execute(
            `INSERT INTO event_recipients (event_id, examiner_id) VALUES ${values}`,params
        );
        // Create notification
        const notificationMessage = message?.trim() || `${title.trim()} scheduled for ${eventDate} from ${startTime} to ${endTime}.`;
        const [notification] = await connection.execute(
            "INSERT INTO notifications (title, message) VALUES (?, ?)",
            [title.trim(), notificationMessage]
        );
        const notificationId = notification.insertId;
        // Save notification recipients
        const notificationParams = ids.flatMap(id => [notificationId, id]);
        await connection.execute(
            `INSERT INTO notification_recipients (notification_id, examiner_id) VALUES ${ids.map(() => "(?, ?)").join(",")}`,
            notificationParams
        );
        // Commit transaction
        await connection.commit();
        transactionStarted = false;
        // Send real-time notifications
        const io = req.app.get("io");
        if (io) {
            ids.forEach(id => {
                io.to(`examiner_${id}`).emit("notification:new", {
                    notificationId,
                    title: title.trim(),
                    message: notificationMessage,
                    createdAt: new Date().toISOString(),
                    isRead: false
                });
            });
        }
        return res.status(201).json({
            success: true,
            message: "Event created successfully.",
            data: { eventId, notificationId, recipientCount: ids.length }
        });
    } catch (error) {
        if (connection && transactionStarted) {
            await connection.rollback();
        }
        console.error("Create Event Error:", error);
        return res.status(400).json({ success: false, message: error.message || "Unable to create event." });
    } finally {
        if (connection) connection.release();
    }
});


router.get("/my-events", verifyToken, allowRoles("EXAMINER"), async (req, res) => {
    try {
        const examinerId = req.user.id;

        const [events] = await db.execute(
            `SELECT e.id, e.title, e.message, DATE_FORMAT(e.event_date, '%Y-%m-%d') AS event_date, e.start_time, e.end_time, e.created_at
             FROM events e
             INNER JOIN event_recipients er ON e.id = er.event_id
             WHERE er.examiner_id = ?
             ORDER BY e.event_date ASC, e.start_time ASC`,
            [examinerId]
        );

        return res.status(200).json({
            success: true,
            count: events.length,
            data: events
        });

    } catch (error) {
        console.error("Fetch Examiner Events Error:", error);
        return res.status(500).json({
            success: false,
            message: "Unable to fetch events."
        });
    }
});

router.get("/:id", verifyToken, allowRoles("EXAMINER"), async (req, res) => {
    try {
        const examinerId = req.user.id;
        const eventId = Number(req.params.id);

        if (!Number.isSafeInteger(eventId) || eventId <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid event ID."
            });
        }

        const [events] = await db.execute(
            `SELECT e.id, e.title, e.message, DATE_FORMAT(e.event_date, '%Y-%m-%d') AS event_date, e.start_time, e.end_time, e.created_at
             FROM events e
             INNER JOIN event_recipients er ON e.id = er.event_id
             WHERE e.id = ? AND er.examiner_id = ?`,
            [eventId, examinerId]
        );

        if (events.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Event not found."
            });
        }

        return res.status(200).json({
            success: true,
            data: events[0]
        });

    } catch (error) {
        console.error("Fetch Event Details Error:", error);
        return res.status(500).json({
            success: false,
            message: "Unable to fetch event details."
        });
    }
});

module.exports = router;