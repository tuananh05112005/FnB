import { useEffect, useState } from "react";
import { FaEnvelope, FaGoogle, FaLock, FaSignInAlt } from "react-icons/fa";
import { Link, useNavigate } from "react-router-dom";

import { auth, googleProvider, signInWithPopup } from "../../config/firebase";
import { api } from "../../lib/api";
import { clearSession, saveSession } from "../../lib/session";
import "./auth.css";

const PERKS = [
  { icon: "☕", text: "Đặt hàng dễ dàng", sub: "Chọn thức uống yêu thích chỉ vài giây" },
  { icon: "🎁", text: "Tích điểm thưởng",  sub: "Mỗi đơn hàng nhận thêm điểm ưu đãi"  },
  { icon: "🚀", text: "Giao hàng nhanh",   sub: "Nhận hàng trong vòng 30 phút"          },
];

const Login = () => {
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [error,    setError]    = useState("");
  const [loading,  setLoading]  = useState(false);
  const navigate = useNavigate();

  useEffect(() => { clearSession(); auth.signOut(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      const res = await api.post("/login", { email, password });
      saveSession({ userId: res.data.user_id, token: res.data.token, role: res.data.role, name: res.data.name });
      navigate("/");
    } catch {
      setError("Đăng nhập thất bại. Vui lòng kiểm tra lại email và mật khẩu.");
    } finally { setLoading(false); }
  };

  const handleGoogleLogin = async () => {
    setError(""); setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const idToken = await result.user.getIdToken();
      const res = await api.post("/login/google", { idToken });
      saveSession({ token: res.data.token, userId: res.data.user_id, role: res.data.role, name: res.data.name || result.user.displayName || "" });
      navigate("/");
    } catch (err) {
      console.error("Google login failed:", err);
      setError("Đăng nhập bằng Google thất bại.");
    } finally { setLoading(false); }
  };

  return (
    <div className="auth-shell">
      {/* ── Left decorative panel ── */}
      <div className="auth-panel-left">
        <div className="auth-bubble" style={{ width: 300, height: 300, top: -80, left: -80 }} />
        <div className="auth-bubble" style={{ width: 200, height: 200, bottom: -60, right: -40 }} />

        <div className="auth-left-logo">
          <div className="auth-left-logo-icon">☕</div>
          <span className="auth-left-logo-text">TeaShop</span>
        </div>

        <h1 className="auth-left-heading">
          Thức uống <span>ngon nhất</span><br />thành phố
        </h1>
        <p className="auth-left-sub">
          Đặt hàng trà sữa, cafe và bánh ngọt cao cấp ngay tại nhà. Nhanh chóng, tiện lợi.
        </p>

        <div className="auth-left-perks">
          {PERKS.map((p) => (
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
            <div className="auth-mobile-logo-icon">☕</div>
            <span className="auth-mobile-logo-text">TeaShop</span>
          </div>

          <div className="auth-form-header">
            <div className="auth-form-tag">👋 Chào mừng trở lại</div>
            <h2 className="auth-form-title">Đăng nhập</h2>
            <p className="auth-form-subtitle">Nhập thông tin để tiếp tục trải nghiệm</p>
          </div>

          {error && (
            <div className="auth-alert auth-alert-danger">
              <span>⚠️</span> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <div className="auth-field">
              <label htmlFor="login-email">Email</label>
              <div className="auth-input-wrap">
                <FaEnvelope className="auth-input-icon" />
                <input id="login-email" type="email" className="auth-input"
                  placeholder="your@email.com" value={email}
                  onChange={(e) => setEmail(e.target.value)} required />
              </div>
            </div>

            <div className="auth-field">
              <label htmlFor="login-password">Mật khẩu</label>
              <div className="auth-input-wrap">
                <FaLock className="auth-input-icon" />
                <input id="login-password" type="password" className="auth-input"
                  placeholder="••••••••" value={password}
                  onChange={(e) => setPassword(e.target.value)} required />
              </div>
            </div>

            <div className="auth-forgot-link">
              <Link to="/forgot-password">Quên mật khẩu?</Link>
            </div>

            <button type="submit" className="auth-submit-btn" disabled={loading}>
              {loading ? "⏳ Đang đăng nhập..." : <><FaSignInAlt /> Đăng nhập</>}
            </button>
          </form>

          <div className="auth-divider">hoặc</div>

          <button type="button" className="auth-google-btn" onClick={handleGoogleLogin} disabled={loading}>
            <FaGoogle color="#EA4335" size={18} />
            Tiếp tục với Google
          </button>

          <p className="auth-footer-link">
            Chưa có tài khoản? <Link to="/register">Đăng ký ngay</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
