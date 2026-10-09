// ==============================================================
// TÊN FILE: resendMailer.js
// MÔ TẢ: Dịch vụ gửi email chuyên nghiệp qua Resend REST API (HTTPS Port 443).
//        - Không bị chặn bởi bất kỳ tường lửa Cloud nào (kể cả Render Free).
//        - Tốc độ chuyển phát email tức thì (1 - 2 giây vào hộp thư đến).
// ==============================================================

const { Resend } = require("resend");

const getResendClient = () => {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("[Resend] Chưa cấu hình RESEND_API_KEY trong biến môi trường.");
    return null;
  }
  return new Resend(apiKey);
};

/**
 * Gửi email chứa mã OTP khôi phục mật khẩu
 */
const sendOtpEmail = async ({ to, otp }) => {
  const resend = getResendClient();
  if (!resend) {
    throw new Error("Chưa cấu hình RESEND_API_KEY");
  }

  // Resend hỗ trợ gửi từ onboarding@resend.dev (cho mọi tài khoản mới tạo)
  // hoặc tên miền riêng đã verify trên Resend dashboard.
  const fromEmail = process.env.RESEND_FROM_EMAIL || "PRDrink <onboarding@resend.dev>";

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

  const { data, error } = await resend.emails.send({
    from: fromEmail,
    to: [to],
    subject: `[PRDrink] ${otp} là mã xác thực khôi phục mật khẩu của bạn`,
    html: htmlContent,
  });

  if (error) {
    console.error("[Resend] Lỗi từ máy chủ Resend API:", error);
    throw new Error(error.message || "Lỗi gửi email qua Resend");
  }

  console.log(`[Resend] Đã chuyển phát email thành công tới ${to}, ID:`, data?.id);
  return data;
};

module.exports = {
  sendOtpEmail,
};