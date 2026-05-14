const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT) || 587,
  secure: false, // TLS via STARTTLS
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

/**
 * Send an email with optional attachments
 */
const sendEmail = async ({ to, subject, html, attachments = [] }) => {
  return transporter.sendMail({
    from: process.env.EMAIL_FROM || '"Maritime Dept" <noreply@maritime.edu>',
    to,
    subject,
    html,
    attachments,
  });
};

// ── HTML Email Templates ──────────────────────────────────────────────────────

const header = `
  <div style="background:#1d4ed8;padding:28px 32px;text-align:center">
    <h2 style="color:#fff;margin:0;font-size:18px;font-family:Arial,sans-serif">
      Department of Maritime Transport &amp; Logistics
    </h2>
  </div>`;

const footer = `
  <div style="background:#f1f5f9;padding:16px 32px;text-align:center;font-size:12px;color:#64748b;font-family:Arial,sans-serif">
    This is an automated message. Please do not reply.
  </div>`;

const templates = {
  /**
   * Email verification message
   */
  verification: (name, link) => `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden">
      ${header}
      <div style="padding:32px;background:#fff">
        <h3 style="color:#1e293b;margin-top:0">Hi ${name},</h3>
        <p style="color:#475569">Welcome! Please verify your email address to complete your registration.</p>
        <div style="text-align:center;margin:28px 0">
          <a href="${link}"
             style="background:#1d4ed8;color:#fff;padding:14px 32px;border-radius:6px;text-decoration:none;font-weight:bold;font-size:15px;display:inline-block">
            Verify My Email
          </a>
        </div>
        <p style="color:#94a3b8;font-size:13px">This link expires in 24 hours. If you did not register, ignore this email.</p>
      </div>
      ${footer}
    </div>`,

  /**
   * Payment receipt notification
   */
  paymentReceipt: (name, label, amount, txRef) => `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden">
      ${header}
      <div style="padding:32px;background:#fff">
        <h3 style="color:#16a34a;margin-top:0">✓ Payment Successful</h3>
        <p style="color:#475569">Hi ${name}, your payment has been received.</p>
        <table style="width:100%;border-collapse:collapse;margin:20px 0;font-size:14px">
          <tr style="background:#f8fafc">
            <td style="padding:10px 14px;font-weight:bold;color:#1e293b;border-bottom:1px solid #e2e8f0">Payment</td>
            <td style="padding:10px 14px;color:#475569;border-bottom:1px solid #e2e8f0">${label}</td>
          </tr>
          <tr>
            <td style="padding:10px 14px;font-weight:bold;color:#1e293b;border-bottom:1px solid #e2e8f0">Amount</td>
            <td style="padding:10px 14px;color:#475569;border-bottom:1px solid #e2e8f0">₦${Number(amount).toLocaleString()}</td>
          </tr>
          <tr style="background:#f8fafc">
            <td style="padding:10px 14px;font-weight:bold;color:#1e293b">Reference</td>
            <td style="padding:10px 14px;color:#475569">${txRef}</td>
          </tr>
        </table>
        <p style="color:#475569">Your PDF receipt is attached to this email.</p>
      </div>
      ${footer}
    </div>`,
};

module.exports = { sendEmail, templates };
