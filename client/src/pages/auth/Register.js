import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaEnvelope, FaLock, FaUser, FaUserPlus } from "react-icons/fa";

import { register as registerUser } from "../../services/authService";
import "../../styles/dashboard.css";
import "../../styles/commerce.css";

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      await registerUser(formData);
      navigate("/login");
    } catch (registerError) {
      console.error("Khong the dang ky:", registerError);
      setError("Dang ky that bai. Vui long thu lai.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="dashboard-page commerce-auth-shell">
      <section className="dashboard-panel commerce-auth-card">
        <div className="dashboard-panel-body">
          <div className="dashboard-title-wrap" style={{ marginBottom: 24 }}>
            <div className="dashboard-icon">
              <FaUserPlus />
            </div>
            <div>
              <h1 className="dashboard-title" style={{ fontSize: "2rem" }}>
                Dang ky tai khoan
              </h1>
              <p className="dashboard-subtitle">Tao tai khoan moi de bat dau mua hang.</p>
            </div>
          </div>

          {error && <div className="commerce-alert commerce-alert-danger">{error}</div>}

          <form onSubmit={handleSubmit} style={{ marginTop: error ? 16 : 0 }}>
            <div className="dashboard-field">
              <label htmlFor="register-name">
                <FaUser style={{ marginRight: 8 }} />
                Ho ten
              </label>
              <input
                id="register-name"
                name="name"
                className="dashboard-input"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="dashboard-field" style={{ marginTop: 16 }}>
              <label htmlFor="register-email">
                <FaEnvelope style={{ marginRight: 8 }} />
                Email
              </label>
              <input
                id="register-email"
                name="email"
                type="email"
                className="dashboard-input"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>

            <div className="dashboard-field" style={{ marginTop: 16 }}>
              <label htmlFor="register-password">
                <FaLock style={{ marginRight: 8 }} />
                Mat khau
              </label>
              <input
                id="register-password"
                name="password"
                type="password"
                className="dashboard-input"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </div>

            <div className="dashboard-form-actions" style={{ justifyContent: "stretch", marginTop: 24 }}>
              <button
                type="submit"
                className="dashboard-btn dashboard-btn-primary"
                disabled={isSubmitting}
                style={{ width: "100%" }}
              >
                <FaUserPlus />
                {isSubmitting ? "Dang tao tai khoan..." : "Dang ky"}
              </button>
            </div>
          </form>

          <p className="dashboard-subtitle" style={{ marginTop: 18 }}>
            Da co tai khoan? <Link to="/login">Dang nhap ngay</Link>
          </p>
        </div>
      </section>
    </div>
  );
};

export default Register;
