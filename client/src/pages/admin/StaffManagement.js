import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Table, Button, Container, Modal, Form, Alert,
  Dropdown, Card, Badge, Spinner, Row, Col, InputGroup,
} from "react-bootstrap";
import {
  FaTrash, FaEdit, FaPlus, FaLock, FaUnlock,
  FaSearch, FaUsers, FaUserShield, FaUserTie, FaEye, FaEyeSlash,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";

const UserManagement = () => {
  const [userList, setUserList] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({ name: "", email: "", password: "" });
  const [formErrors, setFormErrors] = useState({ name: "", email: "", password: "" });

  const fetchUsers = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/users/all");
      setUserList(res.data);
      setFilteredUsers(res.data);
    } catch (err) {
      setError("Lỗi khi tải danh sách người dùng.");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (term) => {
    setSearchTerm(term);
    if (!term) {
      setFilteredUsers(userList);
    } else {
      const filtered = userList.filter(user =>
        user.name.toLowerCase().includes(term.toLowerCase()) ||
        user.email.toLowerCase().includes(term.toLowerCase()) ||
        user.role.toLowerCase().includes(term.toLowerCase())
      );
      setFilteredUsers(filtered);
    }
  };

  const getRoleInfo = (role) => {
    switch (role) {
      case "admin": return { icon: <FaUserShield />, color: "#ef4444", bg: "#fef2f2", label: "Admin" };
      case "staff": return { icon: <FaUserTie />, color: "#f59e0b", bg: "#fefce8", label: "Staff" };
      default:      return { icon: <FaUsers />,    color: "#3b82f6", bg: "#eff6ff", label: "User"  };
    }
  };

  const getAvatarColor = (name) => {
    const colors = ["#6d28d9","#2563eb","#0891b2","#16a34a","#d97706","#db2777","#9333ea"];
    const idx = name ? name.charCodeAt(0) % colors.length : 0;
    return colors[idx];
  };

  useEffect(() => { fetchUsers(); }, []);
  useEffect(() => { handleSearch(searchTerm); }, [userList]);

  const handleDelete = async (id) => {
    if (!window.confirm("Bạn có chắc muốn xóa người này?")) return;
    try {
      await axios.delete(`http://localhost:5000/api/users/${id}`);
      fetchUsers();
    } catch { setError("Không thể xóa người dùng."); }
  };

  const resetForm = () => {
    setFormData({ name: "", email: "", password: "" });
    setFormErrors({ name: "", email: "", password: "" });
    setEditingUser(null);
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.name.trim()) errors.name = "Tên không được để trống";
    if (!formData.email.trim()) errors.email = "Email không được để trống";
    else if (!/\S+@\S+\.\S+/.test(formData.email)) errors.email = "Email không hợp lệ";
    if (!editingUser && !formData.password.trim()) errors.password = "Mật khẩu không được để trống khi tạo mới";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    setFormSubmitting(true);
    setError("");
    try {
      if (editingUser) {
        const updateData = { name: formData.name, email: formData.email };
        if (formData.password.trim()) updateData.password = formData.password;
        await axios.put(`http://localhost:5000/api/users/${editingUser.id}`, updateData);
      } else {
        await axios.post("http://localhost:5000/api/admin/create-staff", {
          name: formData.name, email: formData.email, password: formData.password,
        });
      }
      setShowModal(false);
      resetForm();
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.message || "Lỗi khi lưu thông tin.");
    } finally {
      setFormSubmitting(false);
    }
  };

  const openEditModal = (user) => {
    setEditingUser(user);
    setFormData({ name: user.name, email: user.email, password: "" });
    setFormErrors({ name: "", email: "", password: "" });
    setShowModal(true);
  };

  const openCreateModal = () => navigate("/admin/create-staff");
  const handleCloseModal = () => { setShowModal(false); resetForm(); };

  const handleChangeRole = async (id, newRole) => {
    try {
      await axios.put(`http://localhost:5000/api/users/${id}/role`, { role: newRole });
      fetchUsers();
    } catch { setError("Lỗi khi cập nhật vai trò."); }
  };

  const toggleUserStatus = async (id, newStatus) => {
    try {
      await axios.put(`http://localhost:5000/api/users/${id}/status`, { is_active: newStatus });
      fetchUsers();
    } catch { setError("Không thể thay đổi trạng thái hoạt động."); }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (formErrors[field]) setFormErrors(prev => ({ ...prev, [field]: "" }));
  };

  const displayedUsers = filteredUsers.filter(u => u.role !== "admin");

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700;800&display=swap');

        .um-root {
          font-family: 'Nunito', sans-serif;
          padding: 72px 24px 28px;
          min-height: 100vh;
          background: #f0f2f8;
        }

        /* ── Page Header ── */
        .um-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 24px;
          flex-wrap: wrap;
          gap: 12px;
        }
        .um-header-left h1 {
          font-size: 1.45rem;
          font-weight: 800;
          color: #1a2036;
          margin: 0 0 3px;
          letter-spacing: -0.3px;
        }
        .um-header-left p {
          font-size: 0.8rem;
          color: #8899bb;
          margin: 0;
        }

        /* Add button */
        .um-add-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          background: linear-gradient(135deg, #6d28d9, #4c1d95);
          color: #fff;
          border: none;
          border-radius: 10px;
          padding: 10px 20px;
          font-size: 0.86rem;
          font-weight: 700;
          font-family: 'Nunito', sans-serif;
          cursor: pointer;
          transition: opacity 0.18s, transform 0.18s;
          box-shadow: 0 4px 14px rgba(109,40,217,0.35);
          white-space: nowrap;
        }
        .um-add-btn:hover { opacity: 0.9; transform: translateY(-1px); }

        /* ── Stat chips ── */
        .um-stats {
          display: flex;
          gap: 14px;
          margin-bottom: 20px;
          flex-wrap: wrap;
        }
        .um-stat-chip {
          background: #fff;
          border-radius: 12px;
          padding: 14px 20px;
          display: flex;
          align-items: center;
          gap: 12px;
          box-shadow: 0 2px 10px rgba(26,32,64,0.07);
          flex: 1;
          min-width: 140px;
        }
        .um-stat-chip-icon {
          width: 40px; height: 40px;
          border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .um-stat-chip-val {
          font-size: 1.3rem;
          font-weight: 800;
          color: #1a2036;
          line-height: 1;
        }
        .um-stat-chip-lbl {
          font-size: 0.72rem;
          color: #8899bb;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.4px;
          margin-top: 2px;
        }

        /* ── Search bar ── */
        .um-searchbar {
          background: #fff;
          border-radius: 12px;
          padding: 14px 18px;
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 18px;
          box-shadow: 0 2px 10px rgba(26,32,64,0.07);
        }
        .um-search-icon { color: #8899bb; flex-shrink: 0; }
        .um-search-input {
          flex: 1;
          border: none;
          outline: none;
          font-size: 0.875rem;
          font-family: 'Nunito', sans-serif;
          color: #1a2036;
          background: transparent;
        }
        .um-search-input::placeholder { color: #b0bdd4; }
        .um-search-count {
          font-size: 0.78rem;
          color: #8899bb;
          font-weight: 600;
          white-space: nowrap;
        }

        /* ── Error alert ── */
        .um-alert {
          background: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 10px;
          padding: 12px 16px;
          color: #b91c1c;
          font-size: 0.84rem;
          font-weight: 600;
          margin-bottom: 16px;
        }

        /* ── Table panel ── */
        .um-panel {
          background: #fff;
          border-radius: 14px;
          box-shadow: 0 2px 12px rgba(26,32,64,0.07);
          overflow: hidden;
        }
        .um-panel-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 22px;
          border-bottom: 1px solid #f0f2f8;
        }
        .um-panel-title {
          font-size: 0.9rem;
          font-weight: 700;
          color: #1a2036;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .um-panel-title-dot {
          width: 8px; height: 8px;
          border-radius: 50%;
          background: #6d28d9;
        }

        /* Table */
        .um-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.86rem;
        }
        .um-table thead tr {
          background: #f8f9ff;
        }
        .um-table thead th {
          padding: 11px 18px;
          font-size: 0.72rem;
          font-weight: 700;
          color: #8899bb;
          text-transform: uppercase;
          letter-spacing: 0.6px;
          border: none;
          white-space: nowrap;
        }
        .um-table tbody tr {
          border-bottom: 1px solid #f0f2f8;
          transition: background 0.14s;
        }
        .um-table tbody tr:last-child { border-bottom: none; }
        .um-table tbody tr:hover { background: #f8f9ff; }
        .um-table td {
          padding: 14px 18px;
          border: none;
          vertical-align: middle;
        }

        /* Avatar */
        .um-avatar {
          width: 38px; height: 38px;
          border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          color: #fff;
          font-size: 0.9rem;
          font-weight: 800;
          flex-shrink: 0;
        }
        .um-user-name {
          font-weight: 700;
          color: #1a2036;
          font-size: 0.875rem;
        }
        .um-user-email {
          font-size: 0.75rem;
          color: #8899bb;
          margin-top: 1px;
        }

        /* Role badge */
        .um-role-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 10px;
          border-radius: 20px;
          font-size: 0.75rem;
          font-weight: 700;
          cursor: pointer;
          border: none;
          font-family: 'Nunito', sans-serif;
          transition: opacity 0.15s;
        }
        .um-role-badge:hover { opacity: 0.85; }

        /* Role dropdown */
        .um-role-menu {
          background: #fff;
          border-radius: 10px;
          border: 1px solid #e8ecf4;
          box-shadow: 0 8px 24px rgba(26,32,64,0.12);
          padding: 6px;
          min-width: 130px;
        }
        .um-role-item {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 7px 10px;
          border-radius: 7px;
          font-size: 0.82rem;
          font-weight: 600;
          color: #4a5568;
          cursor: pointer;
          transition: background 0.13s;
          border: none;
          background: none;
          width: 100%;
          font-family: 'Nunito', sans-serif;
        }
        .um-role-item:hover { background: #f0f2f8; color: #1a2036; }

        /* Status badge */
        .um-status-badge {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 4px 10px;
          border-radius: 20px;
          font-size: 0.75rem;
          font-weight: 700;
        }
        .um-status-dot {
          width: 6px; height: 6px;
          border-radius: 50%;
          flex-shrink: 0;
        }

        /* Action buttons */
        .um-action-btn {
          width: 32px; height: 32px;
          border-radius: 8px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border: none;
          cursor: pointer;
          transition: background 0.15s, transform 0.15s;
          font-size: 13px;
          font-family: 'Nunito', sans-serif;
        }
        .um-action-btn:hover { transform: scale(1.08); }
        .um-btn-edit   { background: #eff6ff; color: #2563eb; }
        .um-btn-edit:hover   { background: #dbeafe; }
        .um-btn-lock   { background: #fefce8; color: #d97706; }
        .um-btn-lock:hover   { background: #fef9c3; }
        .um-btn-unlock { background: #f0fdf4; color: #16a34a; }
        .um-btn-unlock:hover { background: #dcfce7; }
        .um-btn-delete { background: #fef2f2; color: #ef4444; }
        .um-btn-delete:hover { background: #fecaca; }

        /* Loading */
        .um-loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 60px 20px;
          gap: 14px;
          color: #8899bb;
          font-size: 0.86rem;
          font-weight: 600;
        }
        .um-spinner {
          width: 36px; height: 36px;
          border: 3px solid #e8ecf4;
          border-top-color: #6d28d9;
          border-radius: 50%;
          animation: um-spin 0.8s linear infinite;
        }
        @keyframes um-spin { to { transform: rotate(360deg); } }

        /* Empty state */
        .um-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 60px 20px;
          color: #b0bdd4;
          gap: 10px;
          font-size: 0.86rem;
          font-weight: 600;
        }

        /* Mobile cards */
        .um-mobile-card {
          padding: 16px 18px;
          border-bottom: 1px solid #f0f2f8;
        }
        .um-mobile-card:last-child { border-bottom: none; }

        /* ── Modal ── */
        .um-modal-overlay {
          position: fixed; inset: 0;
          background: rgba(15,20,40,0.55);
          backdrop-filter: blur(3px);
          z-index: 1055;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }
        .um-modal {
          background: #fff;
          border-radius: 16px;
          width: 100%;
          max-width: 520px;
          box-shadow: 0 20px 60px rgba(15,20,40,0.3);
          overflow: hidden;
          font-family: 'Nunito', sans-serif;
        }
        .um-modal-header {
          background: linear-gradient(135deg, #1e2641, #2d3a6b);
          padding: 20px 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .um-modal-title {
          font-size: 1rem;
          font-weight: 800;
          color: #f0f4ff;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .um-modal-close {
          width: 30px; height: 30px;
          border-radius: 8px;
          background: rgba(255,255,255,0.1);
          border: none;
          color: #c8d4f0;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer;
          font-size: 16px;
          transition: background 0.15s;
        }
        .um-modal-close:hover { background: rgba(255,255,255,0.2); color: #fff; }
        .um-modal-body { padding: 24px; }
        .um-modal-footer {
          padding: 16px 24px 20px;
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          border-top: 1px solid #f0f2f8;
        }

        /* Form fields */
        .um-field { margin-bottom: 18px; }
        .um-label {
          display: flex;
          align-items: center;
          gap: 7px;
          font-size: 0.8rem;
          font-weight: 700;
          color: #4a5568;
          text-transform: uppercase;
          letter-spacing: 0.4px;
          margin-bottom: 7px;
        }
        .um-input {
          width: 100%;
          padding: 10px 14px;
          border: 1.5px solid #e8ecf4;
          border-radius: 9px;
          font-size: 0.875rem;
          font-family: 'Nunito', sans-serif;
          color: #1a2036;
          background: #f8f9ff;
          outline: none;
          transition: border-color 0.18s, box-shadow 0.18s;
        }
        .um-input:focus {
          border-color: #6d28d9;
          box-shadow: 0 0 0 3px rgba(109,40,217,0.1);
          background: #fff;
        }
        .um-input.is-invalid { border-color: #ef4444; }
        .um-input-error {
          font-size: 0.76rem;
          color: #ef4444;
          font-weight: 600;
          margin-top: 5px;
        }
        .um-input-row { display: flex; gap: 14px; }
        .um-input-row > * { flex: 1; }
        .um-pw-wrap { position: relative; }
        .um-pw-toggle {
          position: absolute;
          right: 12px; top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          color: #8899bb;
          cursor: pointer;
          padding: 0;
          display: flex;
          font-family: 'Nunito', sans-serif;
        }
        .um-input-hint {
          font-size: 0.75rem;
          color: #8899bb;
          margin-top: 5px;
          font-weight: 500;
        }

        /* Modal buttons */
        .um-modal-cancel {
          padding: 9px 20px;
          border-radius: 9px;
          border: 1.5px solid #e8ecf4;
          background: #fff;
          color: #4a5568;
          font-size: 0.86rem;
          font-weight: 700;
          font-family: 'Nunito', sans-serif;
          cursor: pointer;
          transition: background 0.15s;
        }
        .um-modal-cancel:hover { background: #f0f2f8; }
        .um-modal-save {
          padding: 9px 24px;
          border-radius: 9px;
          border: none;
          background: linear-gradient(135deg, #6d28d9, #4c1d95);
          color: #fff;
          font-size: 0.86rem;
          font-weight: 700;
          font-family: 'Nunito', sans-serif;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 7px;
          box-shadow: 0 4px 14px rgba(109,40,217,0.3);
          transition: opacity 0.15s, transform 0.15s;
        }
        .um-modal-save:hover:not(:disabled) { opacity: 0.9; transform: translateY(-1px); }
        .um-modal-save:disabled { opacity: 0.6; cursor: not-allowed; }
        .um-save-spinner {
          width: 14px; height: 14px;
          border: 2px solid rgba(255,255,255,0.4);
          border-top-color: #fff;
          border-radius: 50%;
          animation: um-spin 0.7s linear infinite;
        }

        @media (max-width: 640px) {
          .um-root { padding: 16px 14px; }
          .um-input-row { flex-direction: column; gap: 0; }
          .um-stats { gap: 10px; }
        }
      `}</style>

      <div className="um-root">

        {/* Header */}
        <div className="um-header">
          <div className="um-header-left">
            <h1>Quản lý người dùng</h1>
            <p>Quản lý tài khoản, phân quyền và trạng thái hoạt động</p>
          </div>
          <button className="um-add-btn" onClick={openCreateModal}>
            <FaPlus size={13} />
            Thêm nhân viên
          </button>
        </div>

        {/* Stat chips */}
        <div className="um-stats">
          {[
            { label: "Tổng người dùng", val: filteredUsers.filter(u => u.role === "user").length, color: "#3b82f6", bg: "#eff6ff", icon: <FaUsers size={16} /> },
            { label: "Nhân viên", val: filteredUsers.filter(u => u.role === "staff").length, color: "#f59e0b", bg: "#fefce8", icon: <FaUserTie size={16} /> },
            { label: "Đang hoạt động", val: filteredUsers.filter(u => u.is_active).length, color: "#16a34a", bg: "#f0fdf4", icon: <FaUnlock size={16} /> },
            { label: "Bị khóa", val: filteredUsers.filter(u => !u.is_active).length, color: "#ef4444", bg: "#fef2f2", icon: <FaLock size={16} /> },
          ].map((s, i) => (
            <div key={i} className="um-stat-chip">
              <div className="um-stat-chip-icon" style={{ background: s.bg, color: s.color }}>{s.icon}</div>
              <div>
                <div className="um-stat-chip-val">{s.val}</div>
                <div className="um-stat-chip-lbl">{s.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Search */}
        <div className="um-searchbar">
          <FaSearch className="um-search-icon" size={14} />
          <input
            className="um-search-input"
            placeholder="Tìm kiếm theo tên, email hoặc vai trò..."
            value={searchTerm}
            onChange={e => handleSearch(e.target.value)}
          />
          <span className="um-search-count">{displayedUsers.length} kết quả</span>
        </div>

        {/* Error */}
        {error && <div className="um-alert">{error}</div>}

        {/* Table panel */}
        <div className="um-panel">
          <div className="um-panel-head">
            <div className="um-panel-title">
              <span className="um-panel-title-dot" />
              Danh sách người dùng & nhân viên
            </div>
          </div>

          {loading ? (
            <div className="um-loading">
              <div className="um-spinner" />
              Đang tải dữ liệu...
            </div>
          ) : displayedUsers.length === 0 ? (
            <div className="um-empty">
              <FaUsers size={40} />
              Không tìm thấy người dùng nào
            </div>
          ) : (
            <>
              {/* Desktop table */}
              <div style={{ overflowX: "auto", display: window.innerWidth < 768 ? "none" : "block" }}>
                <table className="um-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Người dùng</th>
                      <th>Vai trò</th>
                      <th style={{ textAlign: "center" }}>Trạng thái</th>
                      <th style={{ textAlign: "center" }}>Hành động</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayedUsers.map((user, idx) => {
                      const roleInfo = getRoleInfo(user.role);
                      return (
                        <tr key={user.id}>
                          <td style={{ color: "#c4cde0", fontWeight: 700, fontSize: "0.78rem" }}>
                            {String(idx + 1).padStart(2, "0")}
                          </td>
                          <td>
                            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                              <div className="um-avatar" style={{ background: getAvatarColor(user.name) }}>
                                {user.name.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <div className="um-user-name">{user.name}</div>
                                <div className="um-user-email">{user.email}</div>
                              </div>
                            </div>
                          </td>
                          <td>
                            <Dropdown>
                              <Dropdown.Toggle as="button" className="um-role-badge" style={{ background: roleInfo.bg, color: roleInfo.color }}>
                                <span style={{ fontSize: 12 }}>{roleInfo.icon}</span>
                                {roleInfo.label}
                              </Dropdown.Toggle>
                              <Dropdown.Menu className="um-role-menu border-0 shadow p-1">
                                {["user","staff","admin"].map(r => {
                                  const ri = getRoleInfo(r);
                                  return (
                                    <button key={r} className="um-role-item" onClick={() => handleChangeRole(user.id, r)}>
                                      <span style={{ color: ri.color, fontSize: 12 }}>{ri.icon}</span>
                                      {ri.label}
                                    </button>
                                  );
                                })}
                              </Dropdown.Menu>
                            </Dropdown>
                          </td>
                          <td style={{ textAlign: "center" }}>
                            <span className="um-status-badge" style={
                              user.is_active
                                ? { background: "#f0fdf4", color: "#16a34a" }
                                : { background: "#fef2f2", color: "#ef4444" }
                            }>
                              <span className="um-status-dot" style={{ background: user.is_active ? "#16a34a" : "#ef4444" }} />
                              {user.is_active ? "Hoạt động" : "Đã khóa"}
                            </span>
                          </td>
                          <td>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                              <button className="um-action-btn um-btn-edit" onClick={() => openEditModal(user)} title="Chỉnh sửa">
                                <FaEdit size={12} />
                              </button>
                              <button
                                className={`um-action-btn ${user.is_active ? "um-btn-lock" : "um-btn-unlock"}`}
                                onClick={() => toggleUserStatus(user.id, !user.is_active)}
                                title={user.is_active ? "Khóa" : "Mở khóa"}
                              >
                                {user.is_active ? <FaLock size={12} /> : <FaUnlock size={12} />}
                              </button>
                              <button className="um-action-btn um-btn-delete" onClick={() => handleDelete(user.id)} title="Xóa">
                                <FaTrash size={12} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <div style={{ display: window.innerWidth >= 768 ? "none" : "block" }}>
                {displayedUsers.map(user => {
                  const roleInfo = getRoleInfo(user.role);
                  return (
                    <div key={user.id} className="um-mobile-card">
                      <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                        <div className="um-avatar" style={{ background: getAvatarColor(user.name) }}>
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div className="um-user-name">{user.name}</div>
                          <div className="um-user-email">{user.email}</div>
                          <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap", alignItems: "center" }}>
                            <span className="um-role-badge" style={{ background: roleInfo.bg, color: roleInfo.color }}>
                              <span style={{ fontSize: 11 }}>{roleInfo.icon}</span> {roleInfo.label}
                            </span>
                            <span className="um-status-badge" style={
                              user.is_active
                                ? { background: "#f0fdf4", color: "#16a34a" }
                                : { background: "#fef2f2", color: "#ef4444" }
                            }>
                              <span className="um-status-dot" style={{ background: user.is_active ? "#16a34a" : "#ef4444" }} />
                              {user.is_active ? "Hoạt động" : "Đã khóa"}
                            </span>
                          </div>
                          <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
                            <button className="um-action-btn um-btn-edit" onClick={() => openEditModal(user)}><FaEdit size={12} /></button>
                            <button className={`um-action-btn ${user.is_active ? "um-btn-lock" : "um-btn-unlock"}`} onClick={() => toggleUserStatus(user.id, !user.is_active)}>
                              {user.is_active ? <FaLock size={12} /> : <FaUnlock size={12} />}
                            </button>
                            <button className="um-action-btn um-btn-delete" onClick={() => handleDelete(user.id)}><FaTrash size={12} /></button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="um-modal-overlay" onClick={e => e.target === e.currentTarget && handleCloseModal()}>
          <div className="um-modal">
            <div className="um-modal-header">
              <div className="um-modal-title">
                {editingUser ? <><FaEdit size={15} /> Chỉnh sửa người dùng</> : <><FaPlus size={15} /> Tạo nhân viên mới</>}
              </div>
              <button className="um-modal-close" onClick={handleCloseModal}>✕</button>
            </div>

            <div className="um-modal-body">
              {error && <div className="um-alert" style={{ marginBottom: 16 }}>{error}</div>}

              <div className="um-input-row">
                <div className="um-field">
                  <div className="um-label"><FaUsers size={11} /> Tên đầy đủ *</div>
                  <input
                    className={`um-input ${formErrors.name ? "is-invalid" : ""}`}
                    placeholder="Nhập tên đầy đủ"
                    value={formData.name}
                    onChange={e => handleInputChange("name", e.target.value)}
                  />
                  {formErrors.name && <div className="um-input-error">{formErrors.name}</div>}
                </div>
                <div className="um-field">
                  <div className="um-label">Email *</div>
                  <input
                    className={`um-input ${formErrors.email ? "is-invalid" : ""}`}
                    type="email"
                    placeholder="example@email.com"
                    value={formData.email}
                    onChange={e => handleInputChange("email", e.target.value)}
                  />
                  {formErrors.email && <div className="um-input-error">{formErrors.email}</div>}
                </div>
              </div>

              <div className="um-field">
                <div className="um-label"><FaLock size={11} /> {editingUser ? "Mật khẩu mới (tùy chọn)" : "Mật khẩu *"}</div>
                <div className="um-pw-wrap">
                  <input
                    className={`um-input ${formErrors.password ? "is-invalid" : ""}`}
                    type={showPassword ? "text" : "password"}
                    placeholder={editingUser ? "Để trống nếu không đổi" : "Nhập mật khẩu"}
                    value={formData.password}
                    onChange={e => handleInputChange("password", e.target.value)}
                    style={{ paddingRight: 40 }}
                  />
                  <button className="um-pw-toggle" onClick={() => setShowPassword(!showPassword)} type="button">
                    {showPassword ? <FaEyeSlash size={14} /> : <FaEye size={14} />}
                  </button>
                </div>
                {formErrors.password && <div className="um-input-error">{formErrors.password}</div>}
                {editingUser && <div className="um-input-hint">Chỉ nhập nếu bạn muốn thay đổi mật khẩu</div>}
              </div>
            </div>

            <div className="um-modal-footer">
              <button className="um-modal-cancel" onClick={handleCloseModal}>Hủy bỏ</button>
              <button className="um-modal-save" onClick={handleSave} disabled={formSubmitting}>
                {formSubmitting ? <><div className="um-save-spinner" /> Đang lưu...</> : "Lưu thay đổi"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default UserManagement;