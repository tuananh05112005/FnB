import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaEnvelope, FaLock, FaUser, FaUserPlus } from "react-icons/fa";

import { register as registerUser } from "../../services/authService";
import "./auth.css";

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData]       = useState({ name: "", email: "", password: "" });
  const [error, setError]             = useState("");
  const [success, setSuccess]         = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); setIsSubmitting(true);
    try {
      await registerUser(formData);
      setSuccess("Đăng ký thành công! Đang chuyển hướng...");
      setTimeout(() => navigate("/login"), 1200);
    } catch (err) {
      console.error("Không thể đăng ký:", err);
      setError("Đăng ký thất bại. Email có thể đã được sử dụng.");
    } finally { setIsSubmitting(false); }
  };

  /* Password strength */
  const pw = formData.password;
  const strength = pw.length === 0 ? 0 : pw.length < 6 ? 1 : pw.length < 10 ? 2 : 3;
  const strengthLabel = ["", "Yếu", "Trung bình", "Mạnh"][strength];
  const strengthColor = ["", "var(--color-danger)", "var(--color-warning)", "var(--color-success)"][strength];

  return (
    <div className="auth-shell">
      {/* ── Left decorative panel ── */}
      <div className="auth-panel-left">
        <div className="auth-bubble" style={{ width: 280, height: 280, top: -70, right: -70 }} />
        <div className="auth-bubble" style={{ width: 180, height: 180, bottom: -50, left: -30 }} />

        <div className="auth-left-logo">
          <div className="auth-left-logo-icon">🧋</div>
          <span className="auth-left-logo-text">TeaShop</span>
        </div>

        <h1 className="auth-left-heading">
          Tham gia cộng đồng<br /><span>cafe & trà sữa</span>
        </h1>
        <p className="auth-left-sub">
          Tạo tài khoản miễn phí để đặt hàng, tích điểm và nhận ưu đãi độc quyền mỗi ngày.
        </p>

        <div className="auth-left-perks">
          {[
            { icon: "🎉", text: "Ưu đãi chào mừng",   sub: "Giảm 20% cho đơn hàng đầu tiên"       },
            { icon: "⭐", text: "Tích điểm mỗi đơn",  sub: "Đổi điểm lấy thức uống miễn phí"      },
            { icon: "💌", text: "Ưu đãi sinh nhật",   sub: "Combo bánh + nước dịp sinh nhật của bạn" },
          ].map((p) => (
            <div key={p.text} className="auth-left-perk">
              <span className="auth-left-perk-icon">{p.icon}</span>
              <div>
                <div className="auth-left-perk-text">{p.text}</div>
                <div className="auth-left-perk-sub">{p.sub}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Right form panel ── */}
      <div className="auth-panel-right">
        <div className="auth-form-wrap">
          {/* Mobile logo */}
          <div className="auth-mobile-logo">
            <div className="auth-mobile-logo-icon">🧋</div>
            <span className="auth-mobile-logo-text">TeaShop</span>
          </div>

          <div className="auth-form-header">
            <div className="auth-form-tag">✨ Tạo tài khoản mới</div>
            <h2 className="auth-form-title">Đăng ký</h2>
            <p className="auth-form-subtitle">Điền thông tin bên dưới để bắt đầu hành trình</p>
          </div>

          {error   && <div className="auth-alert auth-alert-danger"><span>⚠️</span> {error}</div>}
          {success && <div className="auth-alert auth-alert-success"><span>✅</span> {success}</div>}

          <form onSubmit={handleSubmit} noValidate>
            <div className="auth-field">
              <label htmlFor="register-name">Họ và tên</label>
              <div className="auth-input-wrap">
                <FaUser className="auth-input-icon" />
                <input id="register-name" name="name" type="text" className="auth-input"
                  placeholder="Nguyễn Văn A" value={formData.name}
                  onChange={handleChange} required />
              </div>
            </div>

            <div className="auth-field">
              <label htmlFor="register-email">Email</label>
              <div className="auth-input-wrap">
                <FaEnvelope className="auth-input-icon" />
                <input id="register-email" name="email" type="email" className="auth-input"
                  placeholder="your@email.com" value={formData.email}
                  onChange={handleChange} required />
              </div>
            </div>

            <div className="auth-field">
              <label htmlFor="register-password">Mật khẩu</label>
              <div className="auth-input-wrap">
                <FaLock className="auth-input-icon" />
                <input id="register-password" name="password" type="password" className="auth-input"
                  placeholder="Tối thiểu 6 ký tự" value={formData.password}
                  onChange={handleChange} required />
              </div>
              {/* Password strength bar */}
              {pw.length > 0 && (
                <div style={{ marginTop: 8 }}>
                  <div style={{ height: 4, borderRadius: 99, background: "var(--color-border)", overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${(strength / 3) * 100}%`, background: strengthColor, borderRadius: 99, transition: "width 0.3s ease, background 0.3s ease" }} />
                  </div>
                  <div style={{ fontSize: "0.72rem", fontWeight: 700, color: strengthColor, marginTop: 4, textAlign: "right" }}>{strengthLabel}</div>
                </div>
              )}
            </div>

            <button type="submit" className="auth-submit-btn" disabled={isSubmitting} style={{ marginTop: 8 }}>
              {isSubmitting ? "⏳ Đang tạo tài khoản..." : <><FaUserPlus /> Đăng ký miễn phí</>}
            </button>
          </form>

          <p className="auth-footer-link">
            Đã có tài khoản? <Link to="/login">Đăng nhập ngay</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
