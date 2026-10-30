const express = require("express");
const bcrypt = require("bcrypt");
const db = require("../db");

const router = express.Router();

// Examiner Login API
router.post("/examiner/login", async (req, res) => {
  try {
    const { examinerId, password } = req.body;

    // Validate input
    if (!examinerId?.trim() || !password) {
      return res.status(400).json({
        success: false,
        message: "Examiner ID and password are required.",
      });
    }

    // Find examiner in database
    const [rows] = await db.execute(
      `SELECT id, examiner_id, full_name, email,
              password_hash, must_change_password, account_status
       FROM examiners
       WHERE examiner_id = ?`,
      [examinerId.trim()]
    );

    if (rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Invalid Examiner ID or password.",
      });
    }

    const examiner = rows[0];

    // Check account status
    if (examiner.account_status !== "ACTIVE") {
      return res.status(403).json({
        success: false,
        message: "Your account is not active. Please contact the administrator.",
      });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(
      password,
      examiner.password_hash
    );

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid Examiner ID or password.",
      });
    }

    // Successful login response
    return res.status(200).json({
      success: true,
      message: "Login successful.",
      data: {
        id: examiner.id,
        examinerId: examiner.examiner_id,
        fullName: examiner.full_name,
        email: examiner.email,
        mustChangePassword: Boolean(examiner.must_change_password),
      },
    });

  } catch (error) {
    console.error("Examiner Login Error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to login. Please try again.",
    });
  }
});

module.exports = router;
