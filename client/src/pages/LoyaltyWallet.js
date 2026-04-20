import React, { useEffect, useState } from "react";
import axios from "axios";
import { FaTicketAlt, FaStar, FaBell, FaPaperPlane, FaSave, FaGift, FaInfinity } from "react-icons/fa";

const formatCurrency = (value) => {
  if (!value) return "0 ₫";
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", minimumFractionDigits: 0 }).format(value);
};

const LoyaltyWallet = () => {
  const [points, setPoints] = useState(0);
  const [vouchers, setVouchers] = useState([]);
  const [allVouchers, setAllVouchers] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [newVoucher, setNewVoucher] = useState({
    code: "", discount_type: "percent", discount_value: "",
    min_order: "", usage_limit: "", expired_at: null,
  });

  const user_id = localStorage.getItem("user_id");
  const role = localStorage.getItem("role");

  useEffect(() => {
    if (role === "admin") {
      axios.get("http://localhost:5000/api/users/all").then((r) => setUsers(r.data)).catch(console.error);
      axios.get("http://localhost:5000/api/vouchers").then((r) => setAllVouchers(r.data || [])).catch(console.error);
    } else if (user_id) {
      axios.get(`http://localhost:5000/api/loyalty/${user_id}`).then((r) => {
        setPoints(r.data.points);
        setVouchers(r.data.vouchers || []);
        setNotifications(r.data.notifications || []);
      }).catch(console.error);
    }
  }, [user_id, role]);

  const handleAssign = async (voucherId) => {
    try {
      await axios.post("http://localhost:5000/api/vouchers/assign", {
        voucher_id: voucherId,
        user_ids: selectedUsers.length > 0 ? selectedUsers : [],
      });
      alert("Gửi voucher thành công!");
    } catch (err) { console.error(err); }
  };

  const handleCreate = async () => {
    try {
      await axios.post("http://localhost:5000/api/vouchers", newVoucher);
      alert("Tạo voucher thành công!");
      setNewVoucher({ code: "", discount_type: "percent", discount_value: "", min_order: "", usage_limit: "", expired_at: null });
      const r = await axios.get("http://localhost:5000/api/vouchers");
      setAllVouchers(r.data || []);
    } catch (err) { console.error(err); }
  };

  const patch = (field, val) => setNewVoucher((prev) => ({ ...prev, [field]: val }));

  const discountBadge = (type) => type === "percent"
    ? { label: "Giảm %",    bg: "#eff6ff", color: "#2563eb" }
    : { label: "Giảm tiền", bg: "#f0fdf4", color: "#16a34a" };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800&display=swap');
        .lw { font-family:'Nunito',sans-serif; padding:72px 24px 28px; background:#f0f2f8; min-height:100vh; }
        .lw h1 { font-size:1.4rem; font-weight:800; color:#1a2036; margin:0 0 3px; }
        .lw-sub { font-size:0.8rem; color:#8899bb; margin:0 0 20px; }
        .lw-panel { background:#fff; border-radius:14px; box-shadow:0 2px 10px rgba(26,32,64,.07); overflow:hidden; margin-bottom:14px; }
        .lw-ph { display:flex; align-items:center; gap:8px; padding:14px 20px; border-bottom:1px solid #f0f2f8; font-size:.88rem; font-weight:700; color:#1a2036; }
        .lw-dot { width:8px; height:8px; border-radius:50%; background:#6d28d9; flex-shrink:0; }
        .lw-pb { padding:18px 20px; }
        .lw-table { width:100%; border-collapse:collapse; font-size:.84rem; }
        .lw-table thead tr { background:#f8f9ff; }
        .lw-table th { padding:10px 16px; font-size:.7rem; font-weight:700; color:#8899bb; text-transform:uppercase; letter-spacing:.5px; border:none; white-space:nowrap; }
        .lw-table tbody tr { border-bottom:1px solid #f0f2f8; transition:background .13s; }
        .lw-table tbody tr:last-child { border-bottom:none; }
        .lw-table tbody tr:hover { background:#f8f9ff; }
        .lw-table td { padding:12px 16px; border:none; vertical-align:middle; }
        .lw-code { background:#f5f3ff; color:#6d28d9; font-weight:800; font-size:.8rem; padding:3px 9px; border-radius:6px; border:1px dashed #c4b5fd; }
        .lw-badge { display:inline-flex; align-items:center; padding:3px 9px; border-radius:20px; font-size:.72rem; font-weight:700; }
        .lw-btn-send { height:28px; padding:0 12px; border-radius:7px; font-size:.76rem; font-weight:700; font-family:'Nunito',sans-serif; cursor:pointer; border:none; background:#f5f3ff; color:#6d28d9; transition:background .14s; }
        .lw-btn-send:hover { background:#ede9fe; }
        .lw-empty { padding:32px; text-align:center; color:#c4cde0; font-size:.84rem; font-weight:600; }
        .lw-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(155px,1fr)); gap:11px; }
        .lw-label { display:block; font-size:.7rem; font-weight:700; color:#8899bb; text-transform:uppercase; letter-spacing:.4px; margin-bottom:5px; }
        .lw-input, .lw-select { width:100%; height:36px; border:1.5px solid #e8ecf4; border-radius:8px; padding:0 11px; font-size:.86rem; font-family:'Nunito',sans-serif; color:#1a2036; background:#f8f9ff; outline:none; box-sizing:border-box; transition:border-color .17s; }
        .lw-input:focus, .lw-select:focus { border-color:#6d28d9; box-shadow:0 0 0 3px rgba(109,40,217,.1); background:#fff; }
        .lw-select-multi { width:100%; min-height:90px; border:1.5px solid #e8ecf4; border-radius:8px; padding:7px 11px; font-size:.86rem; font-family:'Nunito',sans-serif; color:#1a2036; background:#f8f9ff; outline:none; box-sizing:border-box; }
        .lw-select-multi:focus { border-color:#6d28d9; box-shadow:0 0 0 3px rgba(109,40,217,.1); }
        .lw-hint { font-size:.7rem; color:#b0bdd4; margin-top:5px; }
        .lw-btn-save { height:36px; padding:0 22px; border-radius:8px; border:none; background:linear-gradient(135deg,#6d28d9,#4c1d95); color:#fff; font-size:.84rem; font-weight:700; font-family:'Nunito',sans-serif; cursor:pointer; display:inline-flex; align-items:center; gap:6px; box-shadow:0 4px 12px rgba(109,40,217,.28); transition:opacity .14s; }
        .lw-btn-save:hover { opacity:.9; }
        .lw-points-box { background:#fefce8; border:1.5px solid #fde68a; border-radius:12px; padding:14px 20px; display:flex; align-items:center; gap:14px; margin-bottom:14px; }
        .lw-points-icon { width:42px; height:42px; border-radius:10px; background:#fef08a; display:flex; align-items:center; justify-content:center; color:#854d0e; flex-shrink:0; }
        .lw-points-val { font-size:1.4rem; font-weight:800; color:#854d0e; line-height:1; }
        .lw-points-lbl { font-size:.72rem; color:#a16207; font-weight:600; margin-top:2px; }
        .lw-notif { display:flex; justify-content:space-between; gap:12px; padding:12px 20px; border-bottom:1px solid #f0f2f8; }
        .lw-notif:last-child { border-bottom:none; }
        .lw-notif:hover { background:#f8f9ff; }
        .lw-notif-msg { font-size:.84rem; color:#1a2036; font-weight:600; }
        .lw-notif-time { font-size:.72rem; color:#b0bdd4; white-space:nowrap; flex-shrink:0; }
        @media(max-width:640px){ .lw{ padding:16px 14px; } .lw-grid{ grid-template-columns:1fr 1fr; } }
      `}</style>

      <div className="lw">
        <h1>{role === "admin" ? "Quản lý Voucher" : "Ví tích điểm"}</h1>
        <p className="lw-sub">{role === "admin" ? "Tạo và phân phát voucher tới người dùng" : "Điểm thưởng và voucher của bạn"}</p>

        {role === "admin" ? (
          <>
            {/* Danh sách voucher */}
            <div className="lw-panel">
              <div className="lw-ph"><span className="lw-dot" />Danh sách voucher</div>
              {allVouchers.length === 0 ? (
                <div className="lw-empty"><FaTicketAlt size={28} style={{ marginBottom:8, opacity:.25 }} /><br />Chưa có voucher nào</div>
              ) : (
                <div style={{ overflowX:"auto" }}>
                  <table className="lw-table">
                    <thead><tr>
                      <th>#</th><th>Mã</th><th>Loại</th><th>Giá trị</th>
                      <th>Đơn tối thiểu</th><th style={{textAlign:"center"}}>Số lần</th>
                      <th>Hạn dùng</th><th style={{textAlign:"center"}}>Gửi</th>
                    </tr></thead>
                    <tbody>
                      {allVouchers.map((v, i) => {
                        const b = discountBadge(v.discount_type);
                        return (
                          <tr key={v.id}>
                            <td style={{ color:"#c4cde0", fontWeight:700, fontSize:".76rem" }}>{String(i+1).padStart(2,"0")}</td>
                            <td><span className="lw-code">{v.code}</span></td>
                            <td><span className="lw-badge" style={{ background:b.bg, color:b.color }}>{b.label}</span></td>
                            <td style={{ fontWeight:700, color:"#1a2036" }}>{v.discount_type === "percent" ? `${v.discount_value}%` : formatCurrency(v.discount_value)}</td>
                            <td style={{ color:"#8899bb", fontSize:".8rem" }}>{formatCurrency(v.min_order)}</td>
                            <td style={{ textAlign:"center", fontWeight:700 }}>{v.usage_limit}</td>
                            <td style={{ fontSize:".76rem", color:"#8899bb", whiteSpace:"nowrap" }}>
                              {v.expired_at ? new Date(v.expired_at).toLocaleDateString("vi-VN") : <span style={{ display:"inline-flex", alignItems:"center", gap:4 }}><FaInfinity size={11} /> Không giới hạn</span>}
                            </td>
                            <td style={{ textAlign:"center" }}>
                              <button className="lw-btn-send" onClick={() => handleAssign(v.id)}><FaPaperPlane size={10} /> Gửi</button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Chọn người nhận */}
            <div className="lw-panel">
              <div className="lw-ph"><span className="lw-dot" />Người nhận voucher</div>
              <div className="lw-pb">
                <label className="lw-label">Chọn người dùng</label>
                <select multiple className="lw-select-multi" value={selectedUsers}
                  onChange={(e) => {
                    const vals = Array.from(e.target.selectedOptions, (o) => o.value);
                    setSelectedUsers(vals.includes("all") ? [] : vals);
                  }}>
                  <option value="all">— Gửi tất cả —</option>
                  {users.map((u) => <option key={u.id} value={u.id}>{u.name} ({u.email})</option>)}
                </select>
                <div className="lw-hint">Giữ Ctrl / Command để chọn nhiều người</div>
              </div>
            </div>

            {/* Tạo voucher */}
            <div className="lw-panel">
              <div className="lw-ph"><span className="lw-dot" />Tạo voucher mới</div>
              <div className="lw-pb">
                <div className="lw-grid">
                  <div><label className="lw-label">Mã voucher</label><input className="lw-input" placeholder="VD: SALE50" value={newVoucher.code} onChange={(e) => patch("code", e.target.value)} /></div>
                  <div><label className="lw-label">Loại giảm</label>
                    <select className="lw-select" value={newVoucher.discount_type} onChange={(e) => patch("discount_type", e.target.value)}>
                      <option value="percent">Giảm %</option>
                      <option value="amount">Giảm tiền</option>
                    </select>
                  </div>
                  <div><label className="lw-label">Giá trị</label><input className="lw-input" type="number" placeholder="VD: 20" value={newVoucher.discount_value} onChange={(e) => patch("discount_value", e.target.value)} /></div>
                  <div><label className="lw-label">Đơn tối thiểu</label><input className="lw-input" type="number" placeholder="VD: 200000" value={newVoucher.min_order} onChange={(e) => patch("min_order", e.target.value)} /></div>
                  <div><label className="lw-label">Số lần dùng</label><input className="lw-input" type="number" placeholder="VD: 10" value={newVoucher.usage_limit} onChange={(e) => patch("usage_limit", e.target.value)} /></div>
                  <div><label className="lw-label">Hạn sử dụng</label><input className="lw-input" type="date" value={newVoucher.expired_at ? newVoucher.expired_at.split("T")[0] : ""} onChange={(e) => patch("expired_at", e.target.value)} /></div>
                </div>
                <div style={{ display:"flex", justifyContent:"flex-end", marginTop:14 }}>
                  <button className="lw-btn-save" onClick={handleCreate}><FaSave size={12} /> Lưu voucher</button>
                </div>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Điểm tích lũy */}
            <div className="lw-points-box">
              <div className="lw-points-icon"><FaStar size={18} /></div>
              <div>
                <div className="lw-points-val">{points} điểm</div>
                <div className="lw-points-lbl">Tổng điểm tích lũy</div>
              </div>
            </div>

            {/* Voucher user */}
            <div className="lw-panel">
              <div className="lw-ph"><span className="lw-dot" />Voucher của bạn</div>
              {vouchers.length === 0 ? (
                <div className="lw-empty"><FaGift size={28} style={{ marginBottom:8, opacity:.25 }} /><br />Bạn chưa có voucher nào</div>
              ) : (
                <div style={{ overflowX:"auto" }}>
                  <table className="lw-table">
                    <thead><tr><th>#</th><th>Mã</th><th>Loại</th><th>Giá trị</th></tr></thead>
                    <tbody>
                      {vouchers.map((v, i) => {
                        const b = discountBadge(v.discount_type);
                        return (
                          <tr key={v.id}>
                            <td style={{ color:"#c4cde0", fontWeight:700, fontSize:".76rem" }}>{String(i+1).padStart(2,"0")}</td>
                            <td><span className="lw-code">{v.code}</span></td>
                            <td><span className="lw-badge" style={{ background:b.bg, color:b.color }}>{b.label}</span></td>
                            <td style={{ fontWeight:700, color:"#1a2036" }}>{v.discount_type === "percent" ? `${v.discount_value}%` : formatCurrency(v.discount_value)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Thông báo */}
            <div className="lw-panel">
              <div className="lw-ph"><span className="lw-dot" />Thông báo</div>
              {notifications.length === 0 ? (
                <div className="lw-empty"><FaBell size={28} style={{ marginBottom:8, opacity:.25 }} /><br />Không có thông báo nào</div>
              ) : (
                notifications.map((n) => (
                  <div key={n.id} className="lw-notif">
                    <div className="lw-notif-msg">{n.message}</div>
                    <div className="lw-notif-time">{new Date(n.created_at).toLocaleString("vi-VN")}</div>
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
};

export default LoyaltyWallet;