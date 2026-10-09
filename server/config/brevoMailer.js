// ==============================================================
// TÊN FILE: brevoMailer.js
// MÔ TẢ: Dịch vụ gửi email xác thực OTP qua Brevo REST API (HTTPS Port 443).
//        - Người gửi (Sender) được cấu hình chuẩn email chính chủ: huynhnguyentuananh0511@gmail.com
//        - Có thể chuyển phát OTP tới BẤT KỲ địa chỉ email nào của khách hàng.
// ==============================================================

/**
 * Gửi email chứa mã OTP khôi phục mật khẩu qua Brevo API
 */
const sendOtpEmail = async ({ to, otp }) => {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) {
    throw new Error("Chưa cấu hình BREVO_API_KEY trong biến môi trường.");
  }

  // Sender email phải là email đã validate trên tài khoản Brevo của bạn
  const verifiedSenderEmail = process.env.BREVO_SENDER_EMAIL || "huynhnguyentuananh0511@gmail.com";

  const htmlContent = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; padding: 32px 24px; background: #FAF7F2; border-radius: 16px; max-width: 480px; margin: auto; border: 1px solid #EBE3D5;">
      <div style="text-align: center; margin-bottom: 24px;">
        <span style="font-size: 36px;">☕</span>
        <h2 style="color: #9D6208; margin: 8px 0 0; font-size: 22px;">PRDrink - Khôi Phục Mật Khẩu</h2>
      </div>
      <p style="color: #2D241E; font-size: 15px; line-height: 1.6; margin: 0 0 16px;">
        Xin chào quý khách,<br/>
        Hệ thống vừa nhận được yêu cầu lấy lại mật khẩu cho tài khoản liên kết với địa chỉ email này.
      </p>
      <div style="background: #1F1710; border-radius: 12px; padding: 20px; text-align: center; margin: 24px 0;">
        <span style="font-size: 12px; text-transform: uppercase; letter-spacing: 2px; color: #D4AF37; display: block; margin-bottom: 8px;">MÃ XÁC THỰC OTP</span>
        <span style="font-size: 34px; font-weight: 800; letter-spacing: 8px; color: #FFFDF9; font-family: monospace;">${otp}</span>
      </div>
      <p style="font-size: 13px; color: #786C60; line-height: 1.5; margin: 0 0 24px;">
        ⏱️ Mã này có hiệu lực trong vòng <strong>5 phút</strong>.<br/>
        🔒 Vì lý do an toàn, tuyệt đối không chia sẻ mã này cho bất kỳ ai khác.
      </p>
      <hr style="border: none; border-top: 1px solid #E8DFD1; margin: 24px 0;" />
      <p style="font-size: 12px; color: #A09485; text-align: center; margin: 0;">
        PRDrink Boutique Cafe & Bakery · Hệ thống quản lý F&B
      </p>
    </div>
  `;

  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "accept": "application/json",
      "api-key": apiKey,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      sender: { name: "PRDrink Tiệm Trà", email: verifiedSenderEmail },
      to: [{ email: to }],
      subject: `[PRDrink] ${otp} là mã xác thực khôi phục mật khẩu của bạn`,
      htmlContent,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    console.error("[Brevo] Lỗi phản hồi API:", data);
    throw new Error(data?.message || "Lỗi gửi email qua Brevo API");
  }

  console.log(`[Brevo] Đã gửi email OTP thành công tới ${to}, MessageID:`, data?.messageId);
  return data;
};

module.exports = {
  sendOtpEmail,
};