const express = require("express");
const db = require("../db");
const verifyToken = require("../middleware/authMiddleware");
const allowRoles = require("../middleware/roleMiddleware");
const router = express.Router();
// GET: Fetch blueprints assigned to logged-in examiner
router.get("/", verifyToken, allowRoles("EXAMINER"), async (req, res) => {
  try {
    // Examiner ki database ID JWT token se milegi
    const examinerId = req.user.id;
    // Fetch only assigned blueprints
const [blueprints] = await db.execute(
  `SELECT
      qb.id AS blueprintId,
      qb.exam_name AS examName,
      qb.subject,
      qb.total_marks AS totalMarks,
      qb.marks_mode AS marksMode,
      qb.marks_per_question AS marksPerQuestion,
      qb.easy_marks AS easyMarks,
      qb.medium_marks AS mediumMarks,
      qb.hard_marks AS hardMarks,
      qb.deadline,
      qb.distribution_type AS distributionType,
      qb.target_department AS targetDepartment,
      br.assigned_at AS assignedAt
   FROM blueprint_recipients br
   JOIN question_blueprints qb
   ON qb.id = br.blueprint_id
   WHERE br.examiner_id = ?
   ORDER BY br.assigned_at DESC`,
  [examinerId]
);
  // Fetch topic-wise sections for each blueprint
    const result = await Promise.all(
      blueprints.map(async (blueprint) => {
        const [sections] = await db.execute(
          `SELECT topic_name AS topicName,easy_questions AS easyQuestions,medium_questions AS mediumQuestions,hard_questions AS hardQuestions
           FROM blueprint_sections
           WHERE blueprint_id = ?
           ORDER BY id`,
          [blueprint.blueprintId]
        );
        return {
          ...blueprint,sections,
        };
      })
    );
    return res.status(200).json({
      success: true,
      message: "Assigned blueprints fetched successfully.",
      count: result.length,
      data: result,
    });
  } catch (error) {
    console.error("Fetch Examiner Blueprints Error:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to fetch assigned blueprints.",
    });
  }
});
module.exports = router;
