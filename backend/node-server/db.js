const mysql = require("mysql2/promise");
const path = require("path");
const fs = require("fs");

const requiredVariables = ["DB_HOST", "DB_USER", "DB_PASSWORD", "DB_NAME"];
const missingVariables = requiredVariables.filter((key) => !process.env[key]);

if (missingVariables.length > 0) {
    throw new Error(`Missing database environment variables: ${missingVariables.join(", ")}`);
}

const poolConfig = {
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,

    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
};

if (process.env.DB_SSL === "true") {
    const caPath = path.resolve(__dirname, process.env.DB_SSL_CA);
    if (!fs.existsSync(caPath)) throw new Error(`MySQL CA certificate not found: ${caPath}`);
    poolConfig.ssl = {ca: fs.readFileSync(caPath)};
}

const pool = mysql.createPool(poolConfig);
module.exports = pool;