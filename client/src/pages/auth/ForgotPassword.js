import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaEnvelope, FaKey, FaLock, FaRedo, FaArrowLeft } from "react-icons/fa";

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

  const handleSendOTP = async () => {
    setError(""); setMessage(""); setLoading(true);
    try {
      await api.post("/api/send-otp", { email });
      setMessage("Mã OTP đã được gửi về email của bạn! Kiểm tra hộp thư đến.");
      setStep(2);
    } catch {
      setError("Không thể gửi OTP. Vui lòng kiểm tra lại email.");
    } finally { setLoading(false); }
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
    } catch {
      setError("Mã OTP không hợp lệ hoặc đã hết hạn.");
    } finally { setLoading(false); }
  };

  return (
    <div className="auth-shell">
      {/* ── Left decorative panel ── */}
      <div className="auth-panel-left">
        <div className="auth-bubble" style={{ width: 240, height: 240, top: -60, left: -60 }} />
        <div className="auth-bubble" style={{ width: 160, height: 160, bottom: -40, right: -30 }} />

        <div className="auth-left-logo">
          <div className="auth-left-logo-icon">☕</div>
          <span className="auth-left-logo-text">TeaShop</span>
        </div>

        <h1 className="auth-left-heading">
          Khôi phục<br /><span>tài khoản</span>
        </h1>
        <p className="auth-left-sub">
          Đừng lo nếu bạn quên mật khẩu — chúng tôi sẽ giúp bạn lấy lại tài khoản chỉ trong vài bước.
        </p>

        {/* Steps guide */}
        <div className="auth-left-perks">
          {STEPS.map((s) => (
            <div key={s.n} className="auth-left-perk" style={{
              opacity: step >= s.n ? 1 : 0.45,
              borderColor: step === s.n ? "rgba(200,134,10,0.5)" : "rgba(255,255,255,0.1)",
              background: step === s.n ? "rgba(200,134,10,0.12)" : "rgba(255,255,255,0.06)",
              transition: "all 0.3s ease",
            }}>
              <div style={{
                width: 32, height: 32, borderRadius: "50%", flexShrink: 0,
                background: step > s.n ? "var(--color-success)" : step === s.n ? "var(--color-brand)" : "rgba(255,255,255,0.15)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontWeight: 800, fontSize: "0.85rem", color: "white",
              }}>
                {step > s.n ? "✓" : s.n}
              </div>
              <div className="auth-left-perk-text">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Right form panel ── */}
      <div className="auth-panel-right">
        <div className="auth-form-wrap">
          {/* Mobile logo */}
          <div className="auth-mobile-logo">
            <div className="auth-mobile-logo-icon">☕</div>
            <span className="auth-mobile-logo-text">TeaShop</span>
          </div>

          {/* ── Step 3: Success ── */}
          {step === 3 ? (
            <div style={{ textAlign: "center", padding: "20px 0" }}>
              <div style={{ fontSize: "4rem", marginBottom: 16 }}>🎉</div>
              <div style={{
                width: 64, height: 64, borderRadius: "50%",
                background: "var(--color-success-light)", color: "var(--color-success)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "1.8rem", margin: "0 auto 20px",
                boxShadow: "0 0 0 10px rgba(61,170,114,0.1)",
              }}>✓</div>
              <h2 style={{ fontFamily: "var(--app-font-display)", fontSize: "1.6rem", fontWeight: 800, margin: "0 0 8px" }}>
                Đặt lại thành công!
              </h2>
              <p style={{ color: "var(--color-text-muted)", marginBottom: 24 }}>
                Mật khẩu đã được cập nhật. Đang chuyển đến trang đăng nhập...
              </p>
              <button className="auth-submit-btn" onClick={() => navigate("/login")}>
                Đăng nhập ngay
              </button>
            </div>

          ) : (
            <>
              <div className="auth-form-header">
                <div className="auth-form-tag">🔐 Khôi phục mật khẩu</div>
                <h2 className="auth-form-title">
                  {step === 1 ? "Nhập email của bạn" : "Xác nhận OTP"}
                </h2>
                <p className="auth-form-subtitle">
                  {step === 1
                    ? "Chúng tôi sẽ gửi mã OTP xác thực về email đăng ký."
                    : `Mã OTP đã gửi đến ${email}. Nhập mã và mật khẩu mới bên dưới.`}
                </p>
              </div>

              {error   && <div className="auth-alert auth-alert-danger"><span>⚠️</span> {error}</div>}
              {message && <div className="auth-alert auth-alert-success"><span>✅</span> {message}</div>}

              {/* ── Step 1: Email ── */}
              {step === 1 && (
                <>
                  <div className="auth-field">
                    <label htmlFor="forgot-email">Email đăng ký</label>
                    <div className="auth-input-wrap">
                      <FaEnvelope className="auth-input-icon" />
                      <input id="forgot-email" type="email" className="auth-input"
                        placeholder="your@email.com" value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleSendOTP()} />
                    </div>
                  </div>

                  <button type="button" className="auth-submit-btn" onClick={handleSendOTP} disabled={loading || !email}>
                    {loading ? "⏳ Đang gửi OTP..." : <><FaEnvelope /> Gửi mã OTP</>}
                  </button>
                </>
              )}

              {/* ── Step 2: OTP + new password ── */}
              {step === 2 && (
                <>
                  <div className="auth-field">
                    <label htmlFor="forgot-otp">Mã OTP (6 chữ số)</label>
                    <div className="auth-input-wrap">
                      <FaKey className="auth-input-icon" />
                      <input id="forgot-otp" className="auth-input"
                        placeholder="Nhập mã OTP" value={otp} maxLength={6}
                        onChange={(e) => setOtp(e.target.value)}
                        style={{ fontFamily: "monospace", fontSize: "1.2rem", letterSpacing: "0.2em" }} />
                    </div>
                  </div>

                  <div className="auth-field">
                    <label htmlFor="forgot-password">Mật khẩu mới</label>
                    <div className="auth-input-wrap">
                      <FaLock className="auth-input-icon" />
                      <input id="forgot-password" type="password" className="auth-input"
                        placeholder="Tối thiểu 6 ký tự" value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)} />
                    </div>
                  </div>

                  <div className="auth-field">
                    <label htmlFor="forgot-confirm">Xác nhận mật khẩu</label>
                    <div className="auth-input-wrap">
                      <FaLock className="auth-input-icon" />
                      <input id="forgot-confirm" type="password" className="auth-input"
                        placeholder="Nhập lại mật khẩu" value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)} />
                    </div>
                    {/* Match indicator */}
                    {confirmPassword && (
                      <div style={{ fontSize: "0.72rem", fontWeight: 700, marginTop: 4, color: confirmPassword === newPassword ? "var(--color-success)" : "var(--color-danger)" }}>
                        {confirmPassword === newPassword ? "✓ Mật khẩu khớp" : "✗ Mật khẩu không khớp"}
                      </div>
                    )}
                  </div>

                  <button type="button" className="auth-submit-btn" onClick={handleResetPassword}
                    disabled={loading || !otp || !newPassword || !confirmPassword}>
                    {loading ? "⏳ Đang xử lý..." : <><FaRedo /> Đặt lại mật khẩu</>}
                  </button>

                  <button type="button" onClick={() => { setStep(1); setMessage(""); setError(""); }}
                    style={{ background: "none", border: "none", color: "var(--color-text-muted)", cursor: "pointer", fontSize: "0.85rem", display: "flex", alignItems: "center", gap: 6, margin: "-8px auto 0" }}>
                    <FaArrowLeft size={12} /> Dùng email khác
                  </button>
                </>
              )}

              <p className="auth-footer-link" style={{ marginTop: 24 }}>
                <Link to="/login"><FaArrowLeft size={11} style={{ marginRight: 4 }} />Về trang đăng nhập</Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
