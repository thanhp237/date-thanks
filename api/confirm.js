const nodemailer = require("nodemailer");

const REQUIRED_ENV = ["SMTP_HOST", "SMTP_PORT", "SMTP_USER", "SMTP_PASS", "TO_EMAIL"];

function sendJson(response, statusCode, body) {
  response.statusCode = statusCode;
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  response.end(JSON.stringify(body));
}

function sanitizeText(value, maxLength = 600) {
  return String(value || "")
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function isValidDate(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value || "");
}

function isValidTime(value) {
  return /^\d{2}:\d{2}$/.test(value || "");
}

module.exports = async function handler(request, response) {
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    return sendJson(response, 405, { ok: false, error: "Method not allowed" });
  }

  const missingEnv = REQUIRED_ENV.filter((key) => !process.env[key]);
  if (missingEnv.length) {
    return sendJson(response, 500, {
      ok: false,
      error: `Missing environment variables: ${missingEnv.join(", ")}`
    });
  }

  const body = request.body || {};
  const vibe = sanitizeText(body.vibe, 120);
  const date = sanitizeText(body.date, 20);
  const time = sanitizeText(body.time, 20);
  const formattedDate = sanitizeText(body.formattedDate, 120);
  const inviteText = sanitizeText(body.inviteText, 800);
  const userAgent = sanitizeText(body.userAgent, 300);

  if (!vibe || !isValidDate(date) || !isValidTime(time)) {
    return sendJson(response, 400, {
      ok: false,
      error: "Thông tin lịch hẹn chưa hợp lệ."
    });
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 10000
  });

  const safeFormattedDate = formattedDate || date;
  const safeVibe = escapeHtml(vibe);
  const safeDate = escapeHtml(safeFormattedDate);
  const safeTime = escapeHtml(time);
  const safeInviteText = escapeHtml(inviteText || "(Không có nội dung)");
  const subject = `Em đã chốt lịch: ${vibe}`;
  const text = [
    "Có người vừa bấm Chốt lịch trên trang date.",
    "",
    `Vibe: ${vibe}`,
    `Ngày: ${safeFormattedDate}`,
    `Giờ: ${time}`,
    "",
    "Tin nhắn gợi ý:",
    inviteText || "(Không có nội dung)",
    "",
    `User-Agent: ${userAgent || "(Không có)"}`
  ].join("\n");

  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.55;color:#251a24">
      <h2 style="margin:0 0 12px;color:#08766f">Em đã chốt lịch rồi</h2>
      <p><strong>Vibe:</strong> ${safeVibe}</p>
      <p><strong>Ngày:</strong> ${safeDate}</p>
      <p><strong>Giờ:</strong> ${safeTime}</p>
      <hr style="border:none;border-top:1px solid #eee;margin:18px 0">
      <p><strong>Tin nhắn gợi ý:</strong></p>
      <p>${safeInviteText}</p>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: `"Date Invitation" <${process.env.SMTP_USER}>`,
      to: process.env.TO_EMAIL,
      subject,
      text,
      html
    });

    return sendJson(response, 200, { ok: true });
  } catch (error) {
    return sendJson(response, 502, {
      ok: false,
      error: "Gửi email thất bại. Kiểm tra lại SMTP_USER, SMTP_PASS và quyền Gmail App Password."
    });
  }
};
