const express = require("express");
const db = require("../db");
const router = express.Router();
router.post("/create", async (req, res) => {
    let connection;
    let transactionStarted = false;
    try {
        const { examName, subject, totalMarks, marksMode,marksPerQuestion,easyMarks,mediumMarks,hardMarks,deadline, distributionType, targetDepartment, examinerIds, sections } = req.body;
        // Validate basic blueprint details
        if (typeof examName !== "string" || !examName.trim() || typeof subject !== "string" || !subject.trim() || !Number.isSafeInteger(totalMarks) || totalMarks <= 0 || !["UNIFORM", "DIFFICULTY_BASED"].includes(marksMode)||typeof deadline !== "string" || !["ALL", "DEPARTMENT"].includes(distributionType) || !Array.isArray(sections) || sections.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid or missing blueprint details."
            });
        }
        // Validate deadline format: YYYY-MM-DD HH:mm:ss
        const deadlineRegex = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/;
        if (!deadlineRegex.test(deadline)) {
            return res.status(400).json({
                success: false,
                message: "Deadline must be in YYYY-MM-DD HH:mm:ss format."
            });
        }
        // Validate department-wise selection
        if (distributionType === "DEPARTMENT") {
            if (typeof targetDepartment !== "string" || !targetDepartment.trim() || !Array.isArray(examinerIds) || examinerIds.length === 0 || examinerIds.some(id => !Number.isSafeInteger(id) || id <= 0)
            ) {
                return res.status(400).json({
                    success: false,
                    message: "Select a department and its examiners."
                });
            }
        }
        // Validate topic-wise difficulty
        for (const section of sections) {
            if (
                typeof section.topicName !== "string" ||!section.topicName.trim() || !Number.isSafeInteger(section.easyQuestions) ||!Number.isSafeInteger(section.mediumQuestions) ||!Number.isSafeInteger(section.hardQuestions) || section.easyQuestions < 0 ||section.mediumQuestions < 0 || section.hardQuestions < 0) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid topic or difficulty question count."
                });
            }
        }

let calculatedMarks = 0;

if (marksMode === "UNIFORM") {
    // Validate uniform marks
    if (
        !Number.isSafeInteger(marksPerQuestion) ||
        marksPerQuestion <= 0
    ) {
        return res.status(400).json({
            success: false,
            message: "Marks per question must be a positive integer."
        });
    }

    // Calculate total questions
    const totalQuestions = sections.reduce(
        (total, section) =>
            total +
            section.easyQuestions +
            section.mediumQuestions +
            section.hardQuestions,
        0
    );

    calculatedMarks = totalQuestions * marksPerQuestion;
}

if (marksMode === "DIFFICULTY_BASED") {
    // Validate difficulty-wise marks
    if (
        !Number.isSafeInteger(easyMarks) ||
        easyMarks <= 0 ||
        !Number.isSafeInteger(mediumMarks) ||
        mediumMarks <= 0 ||
        !Number.isSafeInteger(hardMarks) ||
        hardMarks <= 0
    ) {
        return res.status(400).json({
            success: false,
            message: "Easy, Medium and Hard marks must be positive integers."
        });
    }

    // Calculate difficulty-wise question counts
    const totalEasy = sections.reduce(
        (total, section) => total + section.easyQuestions,
        0
    );

    const totalMedium = sections.reduce(
        (total, section) => total + section.mediumQuestions,
        0
    );

    const totalHard = sections.reduce(
        (total, section) => total + section.hardQuestions,
        0
    );

    calculatedMarks =
        totalEasy * easyMarks +
        totalMedium * mediumMarks +
        totalHard * hardMarks;
}

// Validate calculated marks
if (calculatedMarks !== totalMarks) {
    return res.status(400).json({
        success: false,
        message: "Total marks do not match the marking scheme.",
        calculatedMarks
    });
}

        connection = await db.getConnection();
        await connection.beginTransaction();
        transactionStarted = true;
        let recipientIds = [];
        // Fetch recipients
        if (distributionType === "ALL") {
            const [rows] = await connection.execute(
                `SELECT id FROM examiners WHERE account_status = 'ACTIVE'`
            );
            recipientIds = rows.map(row => row.id);
        } else {
            // Remove duplicate selected IDs
            recipientIds = [...new Set(examinerIds)];
            const placeholders = recipientIds .map(() => "?").join(",");
            const [rows] = await connection.execute(
                `SELECT id FROM examiners WHERE id IN (${placeholders}) AND department = ? AND account_status = 'ACTIVE'`,
                [
                    ...recipientIds,
                    targetDepartment.trim()
                ]
            );
            if (rows.length !== recipientIds.length) {
                throw new Error(
                    "Some selected examiners are invalid or inactive."
                );
            }
        }
        if (recipientIds.length === 0) {
            throw new Error("No active examiners found.");
        }
        // Save blueprint
        const [blueprintResult] = await connection.execute(
            `INSERT INTO question_blueprints
                (
                    exam_name,subject,total_marks,deadline,distribution_type,target_department,marks_mode,marks_per_question,easy_marks,medium_marks,hard_marks
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                examName.trim(),subject.trim(),totalMarks,deadline,distributionType,distributionType === "DEPARTMENT" ? targetDepartment.trim() : null,marksMode,marksMode==="UNIFORM"?marksPerQuestion:null,marksMode==="DIFFICULTY_BASED"?easyMarks:null,marksMode==="DIFFICULTY_BASED"?mediumMarks:null,marksMode==="DIFFICULTY_BASED"?hardMarks:null
            ]
        );
        const blueprintId = blueprintResult.insertId;
        // Save topic-wise sections
        for (const section of sections) {
            await connection.execute(
                `INSERT INTO blueprint_sections
                    (
                        blueprint_id,topic_name,easy_questions,medium_questions,hard_questions
                    )
                    VALUES (?, ?, ?, ?, ?)`,
                [
                    blueprintId,section.topicName.trim(),section.easyQuestions,section.mediumQuestions,section.hardQuestions
                ]
            );
        }
        // Assign blueprint to selected examiners
        const recipientValues = recipientIds.map(examinerId => [
            blueprintId,examinerId
        ]);

        const recipientPlaceholders = recipientValues.map(() => "(?, ?)") .join(",");
        const recipientParams = recipientValues.flat();
        await connection.execute(
            `INSERT INTO blueprint_recipients (blueprint_id, examiner_id)
             VALUES ${recipientPlaceholders}`, recipientParams
        );
        await connection.commit();
        transactionStarted = false;
        return res.status(201).json({
            success: true,
            message: "Blueprint created and assigned successfully.",
            data: {
                blueprintId,
                assignedExaminerCount: recipientIds.length,
                marksMode,
                totalMarks,
                calculatedMarks
            }
        });
    } catch (error) {
        if (connection && transactionStarted) {
            await connection.rollback();
        }
        console.error("Blueprint creation error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Unable to create and assign blueprint."
        });
    } finally {
        if (connection) {
            connection.release();
        }
    }
}
);
module.exports = router;
