const Mailjet = require("node-mailjet");
const mailjet = Mailjet.apiConnect(
  process.env.MJ_APIKEY_PUBLIC,
  process.env.MJ_APIKEY_PRIVATE
);

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

async function sendExaminerCredentials({
  fullName,
  email,
  examinerId,
  temporaryPassword,
}) {
  const safeName = escapeHtml(fullName);
  const safeId = escapeHtml(examinerId);
  const safePassword = escapeHtml(temporaryPassword);

  const response = await mailjet
    .post("send", { version: "v3.1" })
    .request({
      Messages: [
        {
          From: {
            Email: process.env.MJ_SENDER_EMAIL,
            Name: process.env.MJ_SENDER_NAME || "NETRA",
          },
          To: [
            {
              Email: email,
              Name: fullName,
            },
          ],
          Subject: "Your NETRA Examiner Account",
          TextPart: `Hello ${fullName},

Your NETRA examiner account has been created.

Examiner ID: ${examinerId}
Temporary Password: ${temporaryPassword}

Please log in and change your password immediately.

NETRA Admin Team`,
          HTMLPart: `
            <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto">
              <h2>Welcome to NETRA</h2>
              <p>Hello ${safeName},</p>
              <p>Your examiner account has been created successfully.</p>
              <p><strong>Examiner ID:</strong> ${safeId}</p>
              <p><strong>Temporary Password:</strong> ${safePassword}</p>
              <p>Please log in and change your password immediately.</p>
              <p>Regards,<br/>NETRA Admin Team</p>
            </div>
          `,
        },
      ],
    });

  const message = response.body?.Messages?.[0];

  if (message?.Status !== "success") {
    throw new Error("Mailjet did not confirm email delivery.");
  }

  return message;
}

module.exports = { sendExaminerCredentials };