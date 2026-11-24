require("dotenv").config();
const { sendExaminerCredentials } = require("./services/mailjetService");
async function testMailjet() {
  try {
    const result = await sendExaminerCredentials({
      fullName: "NETRA Test",
      email: process.env.MJ_TEST_RECIPIENT,
      examinerId: "NETRA-TEST-001",
      temporaryPassword: "TestPassword123!",
    });

    console.log("Test email accepted by Mailjet!");
    console.log("Message ID:", result?.To?.[0]?.MessageID);
  } catch (error) {
    console.error("Mailjet test failed:", error.message);
    console.error("Status code:", error.statusCode || "Not available");
  }
}

testMailjet();
