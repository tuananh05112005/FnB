import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaEnvelope, FaKey, FaLock, FaRedo } from "react-icons/fa";

import { api } from "../../lib/api";
import "../../styles/dashboard.css";
import "../../styles/commerce.css";

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSendOTP = async () => {
    setError("");
    setMessage("");

    try {
      await api.post("/api/send-otp", { email });
      setMessage("OTP da duoc gui ve email.");
      setStep(2);
    } catch (sendError) {
      console.error("Khong the gui OTP:", sendError);
      setError("Khong the gui OTP. Vui long thu lai.");
    }
  };

  const handleResetPassword = async () => {
    setError("");
    setMessage("");

    if (newPassword !== confirmPassword) {
      setError("Mat khau xac nhan khong khop.");
      return;
    }

    try {
      await api.post("/api/reset-password", {
        email,
        otp_code: otp,
        new_password: newPassword,
      });
      setMessage("Dat lai mat khau thanh cong. Dang chuyen ve trang dang nhap...");
      setTimeout(() => navigate("/login"), 1500);
    } catch (resetError) {
      console.error("Khong the dat lai mat khau:", resetError);
      setError("OTP khong hop le hoac da het han.");
    }
  };

  return (
    <div className="dashboard-page commerce-auth-shell">
      <section className="dashboard-panel commerce-auth-card">
        <div className="dashboard-panel-body">
          <div className="dashboard-title-wrap" style={{ marginBottom: 24 }}>
            <div className="dashboard-icon">
              <FaRedo />
            </div>
            <div>
              <h1 className="dashboard-title" style={{ fontSize: "2rem" }}>
                Quen mat khau
              </h1>
              <p className="dashboard-subtitle">
                Lay lai mat khau bang OTP gui qua email.
              </p>
            </div>
          </div>

          {error && <div className="commerce-alert commerce-alert-danger">{error}</div>}
          {message && (
            <div className="commerce-alert commerce-alert-success" style={{ marginTop: 12 }}>
              {message}
            </div>
          )}

          {step === 1 ? (
            <div style={{ marginTop: error || message ? 16 : 0 }}>
              <div className="dashboard-field">
                <label htmlFor="forgot-email">
                  <FaEnvelope style={{ marginRight: 8 }} />
                  Email da dang ky
                </label>
                <input
                  id="forgot-email"
                  type="email"
                  className="dashboard-input"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="Nhap email"
                />
              </div>
              <div className="dashboard-form-actions" style={{ justifyContent: "stretch", marginTop: 24 }}>
                <button
                  type="button"
                  className="dashboard-btn dashboard-btn-primary"
                  style={{ width: "100%" }}
                  onClick={handleSendOTP}
                >
                  Gui OTP
                </button>
              </div>
            </div>
          ) : (
            <div style={{ marginTop: error || message ? 16 : 0 }}>
              <div className="dashboard-field">
                <label htmlFor="forgot-otp">
                  <FaKey style={{ marginRight: 8 }} />
                  Ma OTP
                </label>
                <input
                  id="forgot-otp"
                  className="dashboard-input"
                  value={otp}
                  onChange={(event) => setOtp(event.target.value)}
                  placeholder="Nhap ma OTP"
                />
              </div>

              <div className="dashboard-field" style={{ marginTop: 16 }}>
                <label htmlFor="forgot-password">
                  <FaLock style={{ marginRight: 8 }} />
                  Mat khau moi
                </label>
                <input
                  id="forgot-password"
                  type="password"
                  className="dashboard-input"
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                />
              </div>

              <div className="dashboard-field" style={{ marginTop: 16 }}>
                <label htmlFor="forgot-confirm-password">
                  <FaLock style={{ marginRight: 8 }} />
                  Xac nhan mat khau
                </label>
                <input
                  id="forgot-confirm-password"
                  type="password"
                  className="dashboard-input"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                />
              </div>

              <div className="dashboard-form-actions" style={{ justifyContent: "stretch", marginTop: 24 }}>
                <button
                  type="button"
                  className="dashboard-btn dashboard-btn-secondary"
                  onClick={() => setStep(1)}
                >
                  Quay lai
                </button>
                <button
                  type="button"
                  className="dashboard-btn dashboard-btn-primary"
                  onClick={handleResetPassword}
                >
                  Dat lai mat khau
                </button>
              </div>
            </div>
          )}

          <p className="dashboard-subtitle" style={{ marginTop: 18 }}>
            <Link to="/login">Ve trang dang nhap</Link>
          </p>
        </div>
      </section>
    </div>
  );
};

export default ForgotPassword;
