const dotenv = require("dotenv");
const path = require("path");

dotenv.config({path: path.resolve(__dirname, ".env")});

const express = require("express");
const cors = require("cors");

const examinerRoutes = require("./routes/ExaminerRoutes");
const authRoutes = require("./routes/authRoutes");
const db = require("./db");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
    res.json({message: "NETRA API is running", success: true});
});

app.get("/api/health/db", async (req, res) => {
    try {
        const [rows] = await db.query("SELECT 1 AS result");
        res.status(200).json({success: true, message: "MySQL connected successfully", data: rows,});
    } catch (error) {
        console.error("Database Error Code:", error.code);
        console.error("Database Error Message:", error.message);
        res.status(500).json({success: false, message: "Database connection failed", errorCode: error.code, errorMessage: error.message});
    }
});

app.use("/api/admin/examiners", examinerRoutes);
app.use("/api/auth", authRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {console.log(`NETRA server running on port ${PORT}`);});