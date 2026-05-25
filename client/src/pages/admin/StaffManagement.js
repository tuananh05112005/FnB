import React, { useEffect, useState } from "react";
import axios from "axios";
import { Dropdown } from "react-bootstrap";
import {
  FaTrash, FaEdit, FaPlus, FaLock, FaUnlock,
  FaSearch, FaUsers, FaUserShield, FaUserTie, FaEye, FaEyeSlash,
  FaArrowLeft,
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
    } catch {
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
      case "admin": return { icon: <FaUserShield />, color: "#ef4444", bg: "rgba(239,68,68,0.12)", label: "Admin" };
      case "staff": return { icon: <FaUserTie />,   color: "#d97706", bg: "rgba(217,119,6,0.12)",  label: "Nhân viên" };
      default:      return { icon: <FaUsers />,     color: "#3b82f6", bg: "rgba(59,130,246,0.12)", label: "Người dùng" };
    }
  };

  const getAvatarColor = (name) => {
    const colors = ["#b45309","#92400e","#d97706","#a16207","#78350f","#c2410c","#9a3412"];
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

  /* ─── colour tokens matching the TeaShop dark-warm system ─── */
  const T = {
    bg:        "#f5f0e8",   // main content background (warm cream)
    surface:   "#ffffff",   // card surface
    border:    "#e8dfd0",   // subtle warm border
    accent:    "#d97706",   // brand amber
    accentDk:  "#b45309",   // darker amber hover
    accentBg:  "rgba(217,119,6,0.08)",
    textPri:   "#1c1208",   // near-black warm
    textSec:   "#7a6a52",   // muted warm brown
    textMute:  "#b5a48e",   // very muted
    headBg:    "linear-gradient(135deg, #1c1208 0%, #2d1f08 100%)", // dark header gradient
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700;800&display=swap');

        .um-root {
          font-family: 'Be Vietnam Pro', sans-serif;
          padding: 88px 28px 40px;
          min-height: 100vh;
          background: ${T.bg};
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
        .um-title-wrap {
          display: flex;
          align-items: center;
          gap: 14px;
        }
        .um-icon-box {
          width: 48px; height: 48px;
          border-radius: 12px;
          background: ${T.accent};
          display: flex; align-items: center; justify-content: center;
          color: #fff;
          font-size: 1.2rem;
          box-shadow: 0 4px 14px rgba(217,119,6,0.35);
          flex-shrink: 0;
        }
        .um-page-title {
          font-size: 1.35rem;
          font-weight: 800;
          color: ${T.textPri};
          margin: 0;
          line-height: 1.2;
        }
        .um-page-sub {
          font-size: 0.78rem;
          color: ${T.textSec};
          font-weight: 500;
          margin-top: 2px;
        }
        .um-back-btn {
          display: flex;
          align-items: center;
          gap: 7px;
          background: ${T.surface};
          color: ${T.textSec};
          border: 1.5px solid ${T.border};
          border-radius: 9px;
          padding: 8px 16px;
          font-size: 0.83rem;
          font-weight: 600;
          font-family: inherit;
          cursor: pointer;
          transition: all 0.15s;
        }
        .um-back-btn:hover { border-color: ${T.accent}; color: ${T.accent}; }

        /* Add button */
        .um-add-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          background: ${T.accent};
          color: #fff;
          border: none;
          border-radius: 10px;
          padding: 10px 20px;
          font-size: 0.86rem;
          font-weight: 700;
          font-family: inherit;
          cursor: pointer;
          transition: background 0.18s, transform 0.18s, box-shadow 0.18s;
          box-shadow: 0 4px 14px rgba(217,119,6,0.35);
          white-space: nowrap;
        }
        .um-add-btn:hover {
          background: ${T.accentDk};
          transform: translateY(-1px);
          box-shadow: 0 6px 18px rgba(217,119,6,0.45);
        }

        /* ── Stat chips ── */
        .um-stats {
          display: flex;
          gap: 14px;
          margin-bottom: 20px;
          flex-wrap: wrap;
        }
        .um-stat-chip {
          background: ${T.surface};
          border-radius: 12px;
          padding: 14px 20px;
          display: flex;
          align-items: center;
          gap: 12px;
          border: 1.5px solid ${T.border};
          flex: 1;
          min-width: 140px;
          transition: border-color 0.15s, box-shadow 0.15s;
        }
        .um-stat-chip:hover {
          border-color: ${T.accent};
          box-shadow: 0 2px 12px rgba(217,119,6,0.12);
        }
        .um-stat-chip-icon {
          width: 40px; height: 40px;
          border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .um-stat-chip-val {
          font-size: 1.35rem;
          font-weight: 800;
          color: ${T.textPri};
          line-height: 1;
        }
        .um-stat-chip-lbl {
          font-size: 0.72rem;
          color: ${T.textMute};
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.4px;
          margin-top: 2px;
        }

        /* ── Search bar ── */
        .um-searchbar {
          background: ${T.surface};
          border-radius: 10px;
          padding: 12px 16px;
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 18px;
          border: 1.5px solid ${T.border};
          transition: border-color 0.18s;
        }
        .um-searchbar:focus-within { border-color: ${T.accent}; }
        .um-search-icon { color: ${T.textMute}; flex-shrink: 0; }
        .um-search-input {
          flex: 1;
          border: none;
          outline: none;
          font-size: 0.875rem;
          font-family: inherit;
          color: ${T.textPri};
          background: transparent;
        }
        .um-search-input::placeholder { color: ${T.textMute}; }
        .um-search-count {
          font-size: 0.78rem;
          color: ${T.textMute};
          font-weight: 600;
          white-space: nowrap;
          background: ${T.accentBg};
          color: ${T.accentDk};
          padding: 3px 10px;
          border-radius: 20px;
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
          background: ${T.surface};
          border-radius: 14px;
          border: 1.5px solid ${T.border};
          overflow: hidden;
        }
        .um-panel-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 14px 20px;
          border-bottom: 1.5px solid ${T.border};
          background: #faf7f2;
        }
        .um-panel-title {
          font-size: 0.875rem;
          font-weight: 700;
          color: ${T.textPri};
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .um-panel-title-dot {
          width: 8px; height: 8px;
          border-radius: 50%;
          background: ${T.accent};
        }

        /* Table */
        .um-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.86rem;
        }
        .um-table thead tr { background: #faf7f2; }
        .um-table thead th {
          padding: 10px 18px;
          font-size: 0.72rem;
          font-weight: 700;
          color: ${T.textMute};
          text-transform: uppercase;
          letter-spacing: 0.6px;
          border: none;
          white-space: nowrap;
          border-bottom: 1.5px solid ${T.border};
        }
        .um-table tbody tr {
          border-bottom: 1px solid ${T.border};
          transition: background 0.12s;
        }
        .um-table tbody tr:last-child { border-bottom: none; }
        .um-table tbody tr:hover { background: #faf7f2; }
        .um-table td {
          padding: 13px 18px;
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
        .um-user-name { font-weight: 700; color: ${T.textPri}; font-size: 0.875rem; }
        .um-user-email { font-size: 0.75rem; color: ${T.textSec}; margin-top: 1px; }

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
          font-family: inherit;
          transition: opacity 0.15s;
        }
        .um-role-badge:hover { opacity: 0.82; }

        /* Role dropdown */
        .um-role-menu {
          background: ${T.surface};
          border-radius: 10px;
          border: 1.5px solid ${T.border} !important;
          box-shadow: 0 8px 24px rgba(28,18,8,0.12);
          padding: 6px !important;
          min-width: 140px;
        }
        .um-role-item {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 7px 10px;
          border-radius: 7px;
          font-size: 0.82rem;
          font-weight: 600;
          color: ${T.textSec};
          cursor: pointer;
          transition: background 0.12s;
          border: none;
          background: none;
          width: 100%;
          font-family: inherit;
        }
        .um-role-item:hover { background: ${T.accentBg}; color: ${T.textPri}; }

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
        .um-status-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }

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
          font-family: inherit;
        }
        .um-action-btn:hover { transform: scale(1.08); }
        .um-btn-edit   { background: rgba(59,130,246,0.1);  color: #2563eb; }
        .um-btn-edit:hover   { background: rgba(59,130,246,0.2); }
        .um-btn-lock   { background: rgba(217,119,6,0.1);   color: ${T.accent}; }
        .um-btn-lock:hover   { background: rgba(217,119,6,0.2); }
        .um-btn-unlock { background: rgba(22,163,74,0.1);   color: #16a34a; }
        .um-btn-unlock:hover { background: rgba(22,163,74,0.2); }
        .um-btn-delete { background: rgba(239,68,68,0.1);   color: #ef4444; }
        .um-btn-delete:hover { background: rgba(239,68,68,0.2); }

        /* Loading */
        .um-loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 60px 20px;
          gap: 14px;
          color: ${T.textMute};
          font-size: 0.86rem;
          font-weight: 600;
        }
        .um-spinner {
          width: 36px; height: 36px;
          border: 3px solid ${T.border};
          border-top-color: ${T.accent};
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
          color: ${T.textMute};
          gap: 10px;
          font-size: 0.86rem;
          font-weight: 600;
        }

        /* Mobile cards */
        .um-mobile-card { padding: 16px 18px; border-bottom: 1px solid ${T.border}; }
        .um-mobile-card:last-child { border-bottom: none; }

        /* ── Modal ── */
        .um-modal-overlay {
          position: fixed; inset: 0;
          background: rgba(15,10,4,0.6);
          backdrop-filter: blur(3px);
          z-index: 1055;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }
        .um-modal {
          background: ${T.surface};
          border-radius: 16px;
          width: 100%;
          max-width: 520px;
          box-shadow: 0 20px 60px rgba(15,10,4,0.35);
          overflow: hidden;
          font-family: inherit;
        }
        .um-modal-header {
          background: ${T.headBg};
          padding: 20px 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .um-modal-title {
          font-size: 1rem;
          font-weight: 800;
          color: #fef3c7;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .um-modal-title svg { color: ${T.accent}; }
        .um-modal-close {
          width: 30px; height: 30px;
          border-radius: 8px;
          background: rgba(255,255,255,0.08);
          border: none;
          color: #c8bfb0;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer;
          font-size: 16px;
          transition: background 0.15s;
        }
        .um-modal-close:hover { background: rgba(255,255,255,0.16); color: #fff; }
        .um-modal-body { padding: 24px; }
        .um-modal-footer {
          padding: 16px 24px 20px;
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          border-top: 1.5px solid ${T.border};
          background: #faf7f2;
        }

        /* Form fields */
        .um-field { margin-bottom: 18px; }
        .um-label {
          display: flex;
          align-items: center;
          gap: 7px;
          font-size: 0.78rem;
          font-weight: 700;
          color: ${T.textSec};
          text-transform: uppercase;
          letter-spacing: 0.4px;
          margin-bottom: 7px;
        }
        .um-input {
          width: 100%;
          padding: 10px 14px;
          border: 1.5px solid ${T.border};
          border-radius: 9px;
          font-size: 0.875rem;
          font-family: inherit;
          color: ${T.textPri};
          background: #faf7f2;
          outline: none;
          transition: border-color 0.18s, box-shadow 0.18s;
        }
        .um-input:focus {
          border-color: ${T.accent};
          box-shadow: 0 0 0 3px rgba(217,119,6,0.12);
          background: #fff;
        }
        .um-input.is-invalid { border-color: #ef4444; }
        .um-input-error { font-size: 0.76rem; color: #ef4444; font-weight: 600; margin-top: 5px; }
        .um-input-row { display: flex; gap: 14px; }
        .um-input-row > * { flex: 1; }
        .um-pw-wrap { position: relative; }
        .um-pw-toggle {
          position: absolute;
          right: 12px; top: 50%;
          transform: translateY(-50%);
          background: none; border: none;
          color: ${T.textMute}; cursor: pointer; padding: 0;
          display: flex; font-family: inherit;
        }
        .um-input-hint { font-size: 0.75rem; color: ${T.textMute}; margin-top: 5px; font-weight: 500; }

        /* Modal buttons */
        .um-modal-cancel {
          padding: 9px 20px;
          border-radius: 9px;
          border: 1.5px solid ${T.border};
          background: #fff;
          color: ${T.textSec};
          font-size: 0.86rem;
          font-weight: 700;
          font-family: inherit;
          cursor: pointer;
          transition: background 0.15s, border-color 0.15s;
        }
        .um-modal-cancel:hover { background: ${T.bg}; border-color: ${T.textMute}; }
        .um-modal-save {
          padding: 9px 24px;
          border-radius: 9px;
          border: none;
          background: ${T.accent};
          color: #fff;
          font-size: 0.86rem;
          font-weight: 700;
          font-family: inherit;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 7px;
          box-shadow: 0 4px 14px rgba(217,119,6,0.3);
          transition: background 0.15s, transform 0.15s;
        }
        .um-modal-save:hover:not(:disabled) { background: ${T.accentDk}; transform: translateY(-1px); }
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
          <div className="um-title-wrap">
            <div className="um-icon-box"><FaUsers /></div>
            <div>
              <h1 className="um-page-title">Quản lý nhân viên</h1>
              <p className="um-page-sub">Quản lý tài khoản, phân quyền và trạng thái hoạt động</p>
            </div>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <button className="um-back-btn" onClick={() => navigate(-1)}>
              <FaArrowLeft size={12} /> Quay lại
            </button>
            <button className="um-add-btn" onClick={openCreateModal}>
              <FaPlus size={13} /> Thêm nhân viên
            </button>
          </div>
        </div>

        {/* Stat chips */}
        <div className="um-stats">
          {[
            { label: "Tổng người dùng", val: filteredUsers.filter(u => u.role === "user").length,  color: "#2563eb", bg: "rgba(59,130,246,0.1)",  icon: <FaUsers size={16} /> },
            { label: "Nhân viên",       val: filteredUsers.filter(u => u.role === "staff").length, color: "#d97706", bg: "rgba(217,119,6,0.1)",  icon: <FaUserTie size={16} /> },
            { label: "Đang hoạt động",  val: filteredUsers.filter(u => u.is_active).length,        color: "#16a34a", bg: "rgba(22,163,74,0.1)",  icon: <FaUnlock size={16} /> },
            { label: "Bị khóa",         val: filteredUsers.filter(u => !u.is_active).length,       color: "#ef4444", bg: "rgba(239,68,68,0.1)",  icon: <FaLock size={16} /> },
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
              Danh sách người dùng &amp; nhân viên
            </div>
          </div>

          {loading ? (
            <div className="um-loading"><div className="um-spinner" />Đang tải dữ liệu...</div>
          ) : displayedUsers.length === 0 ? (
            <div className="um-empty"><FaUsers size={40} />Không tìm thấy người dùng nào</div>
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
                          <td style={{ color: "#c4bfb5", fontWeight: 700, fontSize: "0.78rem" }}>
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
                              <Dropdown.Menu className="um-role-menu border-0 p-1">
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
                                ? { background: "rgba(22,163,74,0.1)", color: "#16a34a" }
                                : { background: "rgba(239,68,68,0.1)", color: "#ef4444" }
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
                                ? { background: "rgba(22,163,74,0.1)", color: "#16a34a" }
                                : { background: "rgba(239,68,68,0.1)", color: "#ef4444" }
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