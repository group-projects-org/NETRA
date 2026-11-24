const express = require("express");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const db = require("../db");
const { sendExaminerCredentials } = require("../services/mailjetService");
const router = express.Router();
// Generate a unique Examiner ID
async function generateExaminerId() {
  for (let attempt = 0; attempt < 10; attempt++) {
    const randomNumber = crypto.randomInt(10000000, 99999999);
    const examinerId = `NETRA-${randomNumber}`;

    const [rows] = await db.execute(
      "SELECT id FROM examiners WHERE examiner_id = ?",
      [examinerId]
    );

    if (rows.length === 0) {
      return examinerId;
    }
  }

  throw new Error("Unable to generate a unique Examiner ID");
}

// Generate a random temporary password
function generateTemporaryPassword() {
  return crypto.randomBytes(12).toString("base64url");
}

// POST: Create a new examiner
router.post("/add", async (req, res) => {
  try {
    const { fullName, email, phone, department } = req.body;

    // Server-side validation
    if (
      !fullName?.trim() ||
      !email?.trim() ||
      !phone?.trim() ||
      !department?.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "All fields are required.",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return res.status(400).json({
        success: false,
        message: "Invalid email address.",
      });
    }

    if (!/^\d{10,15}$/.test(phone.trim())) {
      return res.status(400).json({
        success: false,
        message: "Invalid phone number.",
      });
    }

    // Check whether email already exists
    const [existingExaminer] = await db.execute(
      "SELECT id FROM examiners WHERE email = ?",
      [normalizedEmail]
    );

    if (existingExaminer.length > 0) {
      return res.status(409).json({
        success: false,
        message: "An examiner with this email already exists.",
      });
    }

    const examinerId = await generateExaminerId();
    const temporaryPassword = generateTemporaryPassword();

    // Hash password before storing it
    const passwordHash = await bcrypt.hash(temporaryPassword, 12);

    // Save examiner in MySQL
    const [result] = await db.execute(
      `INSERT INTO examiners
       (examiner_id, full_name, email, phone, department,
        password_hash, must_change_password, account_status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        examinerId,
        fullName.trim(),
        normalizedEmail,
        phone.trim(),
        department.trim(),
        passwordHash,
        1,
        "ACTIVE",
      ]
    );

    // Send credentials to the examiner's email
    try {
      await sendExaminerCredentials({
        fullName: fullName.trim(),
        email: normalizedEmail,
        examinerId,
        temporaryPassword,
      });
    } catch (emailError) {
      console.error("Examiner email error:", emailError.message);

      // Remove the examiner if the email request failed
      try {
        await db.execute("DELETE FROM examiners WHERE id = ?", [
          result.insertId,
        ]);

        return res.status(502).json({
          success: false,
          message:
            "Examiner could not be created because the email could not be sent. Please try again later.",
        });
      } catch (deleteError) {
        console.error("Examiner cleanup error:", deleteError.message);

        return res.status(500).json({
          success: false,
          message:
            "Examiner was created, but the email could not be sent. Please contact the administrator.",
        });
      }
    }

    // Email request accepted by Mailjet
    return res.status(201).json({
      success: true,
      message: "Examiner created and credentials email sent successfully.",
      data: {
        id: result.insertId,
        examinerId,
        fullName: fullName.trim(),
        email: normalizedEmail,
        accountStatus: "ACTIVE",
        mustChangePassword: true,
      },
    });
  } catch (error) {
    console.error("Create examiner error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error while creating examiner.",
    });
  }
});

module.exports = router;