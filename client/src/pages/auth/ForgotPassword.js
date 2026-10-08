import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaEnvelope, FaKey, FaLock, FaRedo, FaArrowLeft, FaCheckCircle, FaExclamationTriangle } from "react-icons/fa";

import { api } from "../../lib/api";
import "./auth.css";

const STEPS = [
  { n: 1, label: "Nhập email" },
  { n: 2, label: "Xác nhận OTP" },
  { n: 3, label: "Hoàn tất" },
];

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [step,            setStep]            = useState(1);
  const [email,           setEmail]           = useState("");
  const [otp,             setOtp]             = useState("");
  const [newPassword,     setNewPassword]     = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message,         setMessage]         = useState("");
  const [error,           setError]           = useState("");
  const [loading,         setLoading]         = useState(false);
  const [fallbackOtp,     setFallbackOtp]     = useState(null);

  const handleSendOTP = async () => {
    setError(""); setMessage(""); setLoading(true); setFallbackOtp(null);
    try {
      const res = await api.post("/api/send-otp", { email });
      setMessage(res.data?.message || "Mã OTP đã được gửi về email của bạn!");
      if (res.data?.otp) {
        setFallbackOtp(res.data.otp);
        setOtp(res.data.otp); // Tự động điền mã OTP luôn cho tiện
      }
      setStep(2);
    } catch (err) {
      const serverMsg = err.response?.data?.message || err.message;
      setError(serverMsg || "Không thể gửi OTP. Vui lòng kiểm tra lại email.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    setError(""); setMessage(""); setLoading(true);
    if (newPassword !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp."); setLoading(false); return;
    }
    if (newPassword.length < 6) {
      setError("Mật khẩu phải có ít nhất 6 ký tự."); setLoading(false); return;
    }
    try {
      await api.post("/api/reset-password", { email, otp_code: otp, new_password: newPassword });
      setStep(3);
      setTimeout(() => navigate("/login"), 2500);
    } catch (err) {
      const serverMsg = err.response?.data?.message || err.message;
      setError(serverMsg || "Mã OTP không hợp lệ hoặc đã hết hạn.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-shell">
      {/* ── Left decorative panel ── */}
      <div className="auth-panel-left">
        <div className="auth-bubble" style={{ width: 240, height: 240, top: -60, left: -60 }} />
        <div className="auth-bubble" style={{ width: 160, height: 160, bottom: -40, right: -30 }} />

        <div className="auth-left-logo">
          <div className="auth-logo-icon">☕</div>
          <span className="auth-logo-name">TeaShop</span>
        </div>

        <div className="auth-left-content">
          <h1 className="auth-left-title">
            Khôi phục<br />tài khoản
          </h1>
          <p className="auth-left-desc">
            Đừng lo nếu bạn quên mật khẩu — chúng tôi sẽ giúp bạn lấy lại tài khoản chỉ trong vài bước.
          </p>

          <div className="auth-steps-vertical">
            {STEPS.map((s) => (
              <div
                key={s.n}
                className={`auth-vstep ${step === s.n ? "active" : step > s.n ? "done" : ""}`}
              >
                <div className="auth-vstep-num">{s.n}</div>
                <div className="auth-vstep-label">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right form panel ── */}
      <div className="auth-panel-right">
        <div className="auth-form-wrap">

          {/* Step 1: Input email */}
          {step === 1 && (
            <>
              <div className="auth-form-header">
                <div className="auth-form-tag">🔒 Khôi phục mật khẩu</div>
                <h2 className="auth-form-title">Nhập email của bạn</h2>
                <p className="auth-form-subtitle">Chúng tôi sẽ gửi mã OTP xác thực về email đăng ký.</p>
              </div>

              {error   && <div className="auth-alert auth-alert-danger">{error}</div>}
              {message && <div className="auth-alert auth-alert-success">{message}</div>}

              <div className="auth-field">
                <label htmlFor="forgot-email">Email đăng ký</label>
                <div className="auth-input-wrap">
                  <FaEnvelope className="auth-input-icon" />
                  <input id="forgot-email" type="email"
                    className="auth-input"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSendOTP()} />
                </div>
              </div>

              <button type="button" className="auth-submit-btn" onClick={handleSendOTP} disabled={loading || !email}>
                {loading ? "⏳ Đang kết nối..." : <><FaEnvelope /> Gửi mã OTP</>}
              </button>
            </>
          )}

          {/* Step 2: OTP + new password */}
          {step === 2 && (
            <>
              <div className="auth-form-header">
                <div className="auth-form-tag">🔑 Xác thực OTP</div>
                <h2 className="auth-form-title">Nhập mã xác thực</h2>
                <p className="auth-form-subtitle">
                  Kiểm tra email <strong>{email}</strong> để lấy mã OTP gồm 6 chữ số.
                </p>
              </div>

              {fallbackOtp && (
                <div style={{ background: "#FEF3C7", border: "1.5px solid #F59E0B", borderRadius: 10, padding: "12px 16px", marginBottom: 16, color: "#92400E", fontSize: "0.88rem" }}>
                  <div style={{ fontWeight: 800, display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                    <FaCheckCircle color="#10B981" /> Mã OTP đã được tạo:
                  </div>
                  <div>Mã xác thực của bạn: <strong style={{ fontSize: "1.1rem", letterSpacing: 2, color: "#1E1B4B" }}>{fallbackOtp}</strong></div>
                  <div style={{ fontSize: "0.75rem", opacity: 0.8, marginTop: 4 }}>Hệ thống đã tự động điền mã vào ô bên dưới.</div>
                </div>
              )}

              {error   && <div className="auth-alert auth-alert-danger">{error}</div>}
              {message && <div className="auth-alert auth-alert-success">{message}</div>}

              <div className="auth-field">
                <label htmlFor="forgot-otp">Mã OTP (6 chữ số)</label>
                <div className="auth-input-wrap">
                  <FaKey className="auth-input-icon" />
                  <input id="forgot-otp" type="text"
                    className="auth-input"
                    placeholder="123456"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)} />
                </div>
              </div>

              <div className="auth-field">
                <label htmlFor="forgot-new-pwd">Mật khẩu mới</label>
                <div className="auth-input-wrap">
                  <FaLock className="auth-input-icon" />
                  <input id="forgot-new-pwd" type="password"
                    className="auth-input"
                    placeholder="Ít nhất 6 ký tự"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)} />
                </div>
              </div>

              <div className="auth-field">
                <label htmlFor="forgot-confirm-pwd">Xác nhận mật khẩu mới</label>
                <div className="auth-input-wrap">
                  <FaLock className="auth-input-icon" />
                  <input id="forgot-confirm-pwd" type="password"
                    className="auth-input"
                    placeholder="Nhập lại mật khẩu mới"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleResetPassword()} />
                </div>
              </div>

              <button type="button" className="auth-submit-btn" onClick={handleResetPassword} disabled={loading || !otp || !newPassword}>
                {loading ? "⏳ Đang đổi mật khẩu..." : <><FaRedo /> Đổi mật khẩu</>}
              </button>
            </>
          )}

          {/* Step 3: Success */}
          {step === 3 && (
            <div style={{ textAlign: "center", padding: "40px 0" }}>
              <div style={{ fontSize: "3.5rem", marginBottom: 16 }}>🎉</div>
              <h2 className="auth-form-title" style={{ color: "#16a34a" }}>Đổi mật khẩu thành công!</h2>
              <p className="auth-form-subtitle" style={{ marginTop: 8 }}>
                Mật khẩu của bạn đã được cập nhật thành công. Đang chuyển hướng về trang đăng nhập...
              </p>
            </div>
          )}

          <p className="auth-footer-link" style={{ marginTop: 24 }}>
            <Link to="/login" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
              <FaArrowLeft /> Về trang đăng nhập
            </Link>
          </p>

        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;