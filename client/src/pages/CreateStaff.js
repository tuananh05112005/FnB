// ==============================================================
// TÊN FILE: CreateStaff.js
// MÔ TẢ: Trang Tạo Nhân viên (CreateStaff).
//        Cung cấp biểu mẫu cho Admin nhập thông tin tên, email, mật khẩu
//        để đăng ký tài khoản nhân viên mới vào hệ thống thông qua staffService.
// ==============================================================

/**
 * Trang Tạo Nhân viên (CreateStaff): giao diện tạo tài khoản nhân viên mới.
 * Bao gồm form nhập thông tin, gửi yêu cầu tới backend và điều hướng.
 */
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaArrowLeft, FaEnvelope, FaLock, FaUser, FaUserTie } from "react-icons/fa";

import { createStaff } from "../services/staffService";
import "../styles/dashboard.css";
import "../styles/commerce.css";

const CreateStaff = () => {
  const navigate = useNavigate();
  
  // --- Các Hook State quản lý biểu mẫu tạo tài khoản ---
  // formData: Lưu dữ liệu đầu vào của nhân viên mới (name, email, password)
  const [formData, setFormData] = useState({ name: "", email: "", password: "" });
  // message: Thông báo đăng ký thành công
  const [message, setMessage] = useState("");
  // error: Thông báo lỗi từ phía API hoặc mạng
  const [error, setError] = useState("");
  // isSubmitting: Trạng thái đang gửi yêu cầu lên API (để hiển thị spinner/disable nút bấm)
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Cập nhật state formData tương ứng với mỗi thay đổi của input trong form
  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Xử lý gửi biểu mẫu tạo tài khoản lên API Backend
  const handleCreate = async (event) => {
    event.preventDefault();
    setMessage("");
    setError("");
    setIsSubmitting(true);

    try {
      const response = await createStaff(formData);
      setMessage(response.message || "Da tao tai khoan nhan vien.");
      setFormData({ name: "", email: "", password: "" });
      setTimeout(() => navigate("/admin/staffs"), 1000);
    } catch (createError) {
      console.error("Khong the tao nhan vien:", createError);
      setError(createError.response?.data?.message || "Loi tao tai khoan nhan vien.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="dashboard-page">
      <div className="dashboard-shell">
        <div className="dashboard-header">
          <div className="dashboard-title-wrap">
            <div className="dashboard-icon">
              <FaUserTie />
            </div>
            <div>
              <h1 className="dashboard-title">Tao tai khoan nhan vien</h1>
              <p className="dashboard-subtitle">
                Them nhan vien moi vao he thong bang mot form gon gang.
              </p>
            </div>
          </div>

          <button
            type="button"
            className="dashboard-back-btn"
            onClick={() => navigate("/admin/staffs")}
          >
            <FaArrowLeft />
            Quay lai
          </button>
        </div>

        <section className="dashboard-panel commerce-form-card">
          <div className="dashboard-panel-body">
            {message && <div className="commerce-alert commerce-alert-success">{message}</div>}
            {error && (
              <div className="commerce-alert commerce-alert-danger" style={{ marginTop: 12 }}>
                {error}
              </div>
            )}

            <form onSubmit={handleCreate}>
              <div className="dashboard-form-grid">
                <div className="dashboard-field">
                  <label htmlFor="staff-name">
                    <FaUser style={{ marginRight: 8 }} />
                    Ten nhan vien
                  </label>
                  <input
                    id="staff-name"
                    name="name"
                    className="dashboard-input"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="dashboard-field">
                  <label htmlFor="staff-email">
                    <FaEnvelope style={{ marginRight: 8 }} />
                    Email
                  </label>
                  <input
                    id="staff-email"
                    name="email"
                    type="email"
                    className="dashboard-input"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="dashboard-field" style={{ marginTop: 16 }}>
                <label htmlFor="staff-password">
                  <FaLock style={{ marginRight: 8 }} />
                  Mat khau
                </label>
                <input
                  id="staff-password"
                  name="password"
                  type="password"
                  className="dashboard-input"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="dashboard-form-actions">
                <button
                  type="button"
                  className="dashboard-btn dashboard-btn-secondary"
                  onClick={() => navigate("/admin/staffs")}
                >
                  Huy
                </button>
                <button
                  type="submit"
                  className="dashboard-btn dashboard-btn-primary"
                  disabled={isSubmitting}
                >
                  <FaUserTie />
                  {isSubmitting ? "Dang tao..." : "Tao nhan vien"}
                </button>
              </div>
            </form>
          </div>
        </section>
      </div>
    </div>
  );
};

export default CreateStaff;
