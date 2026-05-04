import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer,
} from "recharts";
import {
  FaBoxOpen, FaChartLine, FaChartPie, FaCheck,
  FaMoneyBillWave, FaShoppingBag, FaTimes, FaUsers,
  FaEye, FaClipboardList,
} from "react-icons/fa";

import { api } from "../lib/api";
import { getRole } from "../lib/session";
import "../styles/dashboard.css";
import "../styles/commerce.css";

// ── helpers ─────────────────────────────────────────────────────────────────
const fmt = (n) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", minimumFractionDigits: 0 }).format(Number(n) || 0);

const STATUS_MAP = {
  pending:   { label: "Đang xử lý", bg: "#fff7ed", color: "#f59e0b", cls: "dashboard-badge-warning" },
  completed: { label: "Đang giao",  bg: "#eff6ff", color: "#2563eb", cls: "dashboard-badge-info"    },
  received:  { label: "Đã giao",    bg: "#ecfdf3", color: "#16a34a", cls: "dashboard-badge-success"  },
  cancelled: { label: "Đã hủy",     bg: "#fef2f2", color: "#ef4444", cls: "dashboard-badge-danger"   },
};

const CHART_COLORS = ["#7c3aed", "#3b82f6", "#10b981", "#f59e0b", "#ef4444"];

// ── Order Detail Modal ───────────────────────────────────────────────────────
function OrderModal({ order, onClose }) {
  const st = STATUS_MAP[order.status] || STATUS_MAP.pending;
  return (
    <div
      onClick={(e) => e.target === e.currentTarget && onClose()}
      style={{
        position: "fixed", inset: 0, background: "rgba(15,20,40,0.55)",
        backdropFilter: "blur(4px)", display: "flex", alignItems: "center",
        justifyContent: "center", zIndex: 9999, padding: "1rem",
      }}
    >
      <div style={{
        background: "#fff", borderRadius: 20, width: "100%", maxWidth: 480,
        boxShadow: "0 24px 64px rgba(15,23,42,0.22)", overflow: "hidden",
        animation: "um-spin 0s",
      }}>
        {/* Header */}
        <div style={{
          background: "linear-gradient(135deg,#1e2641,#2d3a6b)",
          padding: "20px 24px", display: "flex", alignItems: "center",
          justifyContent: "space-between",
        }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 800, color: "#f0f4ff" }}>
              Chi tiết đơn hàng
            </div>
            <div style={{ fontSize: 12, color: "#8899cc", marginTop: 2 }}>
              #{order.id}
            </div>
          </div>
          <button onClick={onClose} style={{
            background: "rgba(255,255,255,0.1)", border: "none", color: "#c8d4f0",
            borderRadius: 8, width: 32, height: 32, cursor: "pointer",
            fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center",
          }}>×</button>
        </div>

        <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 16, maxHeight: "70vh", overflowY: "auto" }}>
          {/* Info grid */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {[
              ["Tên sản phẩm", order.product_name || order.name || "—"],
              ["Số lượng",     order.quantity ?? "—"],
              ["Trạng thái",  <span key="s" className={`dashboard-badge ${st.cls}`} style={{ fontSize: "0.78rem" }}>{st.label}</span>],
              ["Tổng tiền",   fmt(order.total_price ?? order.price ?? 0)],
            ].map(([label, val]) => (
              <div key={label} style={{ background: "#f8f9ff", borderRadius: 10, padding: "10px 14px" }}>
                <div style={{ fontSize: 11, color: "#8aa0c5", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.04em", fontWeight: 700 }}>{label}</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#0f172a" }}>{val}</div>
              </div>
            ))}
          </div>

          {/* Note */}
          {order.note && (
            <div>
              <div style={{ fontSize: 11, color: "#8aa0c5", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.04em", fontWeight: 700 }}>Ghi chú</div>
              <div style={{ fontSize: 13, background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 10, padding: "10px 14px", color: "#92400e" }}>
                {order.note}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Loading skeleton ─────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="dashboard-stat" style={{ gap: 16 }}>
      <div style={{ width: 48, height: 48, borderRadius: 14, background: "#eef2ff" }} />
      <div style={{ flex: 1 }}>
        <div style={{ height: 12, width: "55%", background: "#eef2ff", borderRadius: 6, marginBottom: 10 }} />
        <div style={{ height: 22, width: "35%", background: "#e0e7ff", borderRadius: 6 }} />
      </div>
    </div>
  );
}

// ── Main ─────────────────────────────────────────────────────────────────────
const Home = () => {
  const navigate = useNavigate();
  const role = getRole();
  const isAdmin = role === "admin";
  const isManager = role === "admin" || role === "staff";

  const [stats, setStats]       = useState(null);
  const [orders, setOrders]     = useState([]);
  const [loading, setLoading]   = useState(true);
  const [selOrder, setSelOrder] = useState(null);

  // Fetch data
  useEffect(() => {
    const load = async () => {
      try {
        const [statsRes, ordersRes] = await Promise.allSettled([
          isManager ? api.get("/api/admin/statistics") : Promise.resolve({ data: null }),
          isManager ? api.get("/api/admin/orders")     : Promise.resolve({ data: [] }),
        ]);

        if (statsRes.status === "fulfilled") setStats(statsRes.value.data);
        if (ordersRes.status === "fulfilled") {
          const raw = ordersRes.value.data;
          setOrders(Array.isArray(raw) ? raw : []);
        }
      } catch (err) {
        console.error("Dashboard load error:", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [isManager]);

  // Stat cards
  const statCards = useMemo(() => {
    if (!stats) return [];
    return [
      { label: "Tổng doanh thu",    value: fmt(stats.totalRevenue),          icon: <FaMoneyBillWave />, accent: "#7c3aed", bg: "#f5f3ff", color: "#7c3aed" },
      { label: "Người dùng",        value: stats.totalUsers,                 icon: <FaUsers />,         accent: "#3b82f6", bg: "#eff6ff", color: "#3b82f6" },
      { label: "Sản phẩm đã bán",   value: stats.totalProductsSold,          icon: <FaShoppingBag />,   accent: "#10b981", bg: "#ecfdf3", color: "#10b981" },
      { label: "Đơn hàng hủy",      value: stats.totalCancelledOrders,       icon: <FaTimes />,         accent: "#ef4444", bg: "#fef2f2", color: "#ef4444" },
    ];
  }, [stats]);

  // Chart data — group orders by status
  const orderStatusData = useMemo(() => {
    if (!orders.length) return [];
    const counts = { pending: 0, completed: 0, received: 0, cancelled: 0 };
    orders.forEach((o) => { if (counts[o.status] !== undefined) counts[o.status]++; });
    return Object.entries(counts).map(([status, count]) => ({
      name: STATUS_MAP[status]?.label || status,
      value: count,
      color: STATUS_MAP[status]?.color || "#8aa0c5",
    }));
  }, [orders]);

  // Recent 6 orders
  const recentOrders = useMemo(() => orders.slice(0, 6), [orders]);

  // Revenue bar chart — group by date
  const revenueData = useMemo(() => {
    if (!orders.length) return [];
    const map = {};
    orders.forEach((o) => {
      const date = o.order_date?.split("T")[0] || o.created_at?.split("T")[0] || "—";
      map[date] = (map[date] || 0) + Number(o.total_price ?? o.price ?? 0);
    });
    return Object.entries(map)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-7)
      .map(([date, amount]) => ({ date: date.slice(5), amount }));
  }, [orders]);

  const QUICK_LINKS = [
    { to: "/products",         label: "Xem sản phẩm",     icon: <FaBoxOpen />,      primary: false },
    { to: "/carts",            label: "Giỏ hàng",          icon: <FaShoppingBag />,  primary: false },
    { to: "/wallet",           label: "Ví tích điểm",      icon: <FaMoneyBillWave />,primary: true  },
    ...(isAdmin ? [
      { to: "/admin/statistics", label: "Thống kê",        icon: <FaChartPie />,     primary: false },
      { to: "/orders",           label: "Quản lý đơn",     icon: <FaClipboardList />,primary: false },
      { to: "/admin/staffs",     label: "Nhân viên",       icon: <FaUsers />,        primary: false },
    ] : []),
  ];

  return (
    <div className="dashboard-page">
      <div className="dashboard-shell" style={{ display: "grid", gap: 20 }}>

        {/* ── Header ── */}
        <div className="dashboard-header">
          <div className="dashboard-title-wrap">
            <div className="dashboard-icon"><FaChartLine /></div>
            <div>
              <h1 className="dashboard-title">Tổng quan hệ thống</h1>
              <p className="dashboard-subtitle">
                {isManager ? "Xem hiệu suất kinh doanh và quản lý nhanh" : "Chào mừng đến với Tiệm trà happy"}
              </p>
            </div>
          </div>
          <div className="dashboard-toolbar-group">
            {QUICK_LINKS.slice(0, 2).map((lnk) => (
              <button
                key={lnk.to}
                type="button"
                className={`dashboard-btn ${lnk.primary ? "dashboard-btn-primary" : "dashboard-btn-secondary"}`}
                onClick={() => navigate(lnk.to)}
              >
                {lnk.icon}{lnk.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Stat cards (admin/staff only) ── */}
        {isManager && (
          <div className="dashboard-stats-grid">
            {loading
              ? Array(4).fill(0).map((_, i) => <SkeletonCard key={i} />)
              : statCards.map((s) => (
                  <article
                    key={s.label}
                    className="dashboard-stat dashboard-stat-accent"
                    style={{ "--stat-accent": s.accent }}
                  >
                    <div className="dashboard-stat-icon" style={{ background: s.bg, color: s.color }}>
                      {s.icon}
                    </div>
                    <div>
                      <p className="dashboard-stat-label">{s.label}</p>
                      <p className="dashboard-stat-value" style={{ fontSize: "1.6rem" }}>{s.value}</p>
                    </div>
                  </article>
                ))}
          </div>
        )}

        {/* ── Charts row (admin/staff only) ── */}
        {isManager && !loading && (
          <div className="commerce-chart-grid">
            {/* Revenue bar chart */}
            <section className="dashboard-panel">
              <div className="dashboard-panel-header">
                <h2 className="dashboard-panel-title">
                  <span className="dashboard-panel-title-dot" />
                  Doanh thu 7 ngày gần nhất
                </h2>
              </div>
              <div className="dashboard-panel-body" style={{ height: 280 }}>
                {revenueData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={revenueData} barSize={32}>
                      <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#8aa0c5" }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#8aa0c5" }}
                        tickFormatter={(v) => (v / 1000000).toFixed(1) + "tr"} />
                      <Tooltip formatter={(v) => [fmt(v), "Doanh thu"]} contentStyle={{ borderRadius: 10, border: "none", boxShadow: "0 8px 24px rgba(0,0,0,0.1)" }} />
                      <Bar dataKey="amount" radius={[8, 8, 0, 0]}>
                        {revenueData.map((_, i) => (
                          <Cell key={i} fill={i === revenueData.length - 1 ? "#7c3aed" : "#c4b5fd"} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="dashboard-empty">Chưa có dữ liệu doanh thu</div>
                )}
              </div>
            </section>

            {/* Order status donut */}
            <section className="dashboard-panel">
              <div className="dashboard-panel-header">
                <h2 className="dashboard-panel-title">
                  <span className="dashboard-panel-title-dot" style={{ background: "#f59e0b", boxShadow: "0 0 0 6px rgba(245,158,11,0.12)" }} />
                  Tỷ lệ trạng thái đơn
                </h2>
              </div>
              <div className="dashboard-panel-body" style={{ height: 280 }}>
                {orderStatusData.some((d) => d.value > 0) ? (
                  <>
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie data={orderStatusData} innerRadius={58} outerRadius={88} paddingAngle={4} dataKey="value">
                          {orderStatusData.map((entry, i) => (
                            <Cell key={i} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(v, name) => [v + " đơn", name]} contentStyle={{ borderRadius: 10, border: "none", boxShadow: "0 8px 24px rgba(0,0,0,0.1)" }} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="dashboard-toolbar-group" style={{ justifyContent: "center", flexWrap: "wrap", gap: 10 }}>
                      {orderStatusData.map((d) => (
                        <span key={d.name} className="dashboard-count" style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.8rem" }}>
                          <span style={{ width: 9, height: 9, borderRadius: 999, background: d.color, display: "inline-block" }} />
                          {d.name} ({d.value})
                        </span>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="dashboard-empty">Chưa có đơn hàng</div>
                )}
              </div>
            </section>
          </div>
        )}

        {/* ── Bottom row ── */}
        <div style={{ display: "grid", gridTemplateColumns: isManager ? "1fr 1fr" : "1fr", gap: 20 }}>

          {/* Recent orders table */}
          {isManager && (
            <section className="dashboard-panel">
              <div className="dashboard-panel-header">
                <h2 className="dashboard-panel-title">
                  <span className="dashboard-panel-title-dot" style={{ background: "#10b981", boxShadow: "0 0 0 6px rgba(16,185,129,0.12)" }} />
                  Đơn hàng gần đây
                </h2>
                <button type="button" className="dashboard-btn dashboard-btn-secondary" style={{ fontSize: "0.8rem", padding: "6px 14px" }} onClick={() => navigate("/orders")}>
                  <FaEye /> Xem tất cả
                </button>
              </div>
              <div className="dashboard-table-wrap">
                {loading ? (
                  <div className="dashboard-empty">Đang tải...</div>
                ) : recentOrders.length === 0 ? (
                  <div className="dashboard-empty">Chưa có đơn hàng nào</div>
                ) : (
                  <table className="dashboard-table">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Sản phẩm</th>
                        <th>Tiền</th>
                        <th>Trạng thái</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentOrders.map((order, i) => {
                        const st = STATUS_MAP[order.status] || STATUS_MAP.pending;
                        return (
                          <tr key={order.id}>
                            <td className="dashboard-index">{String(i + 1).padStart(2, "0")}</td>
                            <td>
                              <div style={{ fontWeight: 700, fontSize: "0.87rem", color: "#0f172a" }}>
                                {order.product_name || order.name || "—"}
                              </div>
                              <div style={{ fontSize: "0.74rem", color: "#8aa0c5" }}>SL: {order.quantity ?? 1}</div>
                            </td>
                            <td className="dashboard-money-primary">{fmt(order.total_price ?? order.price ?? 0)}</td>
                            <td>
                              <span className={`dashboard-badge ${st.cls}`} style={{ fontSize: "0.75rem" }}>
                                {st.label}
                              </span>
                            </td>
                            <td>
                              <button
                                type="button"
                                className="dashboard-btn dashboard-btn-ghost"
                                style={{ padding: "4px 8px", fontSize: "0.78rem" }}
                                onClick={() => setSelOrder(order)}
                              >
                                <FaEye />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </section>
          )}

          {/* Quick links */}
          <section className="dashboard-panel">
            <div className="dashboard-panel-header">
              <h2 className="dashboard-panel-title">
                <span className="dashboard-panel-title-dot" style={{ background: "#7c3aed" }} />
                Truy cập nhanh
              </h2>
            </div>
            <div className="dashboard-panel-body">
              <div className="dashboard-card-grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 12 }}>
                {QUICK_LINKS.map((lnk) => (
                  <button
                    key={lnk.to}
                    type="button"
                    onClick={() => navigate(lnk.to)}
                    className="dashboard-mini-card"
                    style={{
                      display: "flex", flexDirection: "column", alignItems: "center",
                      gap: 10, cursor: "pointer", border: "none", textAlign: "center",
                      transition: "transform 0.2s ease, box-shadow 0.2s ease",
                      background: lnk.primary ? "linear-gradient(135deg,#7c3aed,#4338ca)" : undefined,
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = "0 16px 36px rgba(15,23,42,0.12)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = ""; }}
                  >
                    <div style={{
                      width: 44, height: 44, borderRadius: 14, display: "flex",
                      alignItems: "center", justifyContent: "center", fontSize: "1.2rem",
                      background: lnk.primary ? "rgba(255,255,255,0.18)" : "#f5f3ff",
                      color: lnk.primary ? "#fff" : "#7c3aed",
                    }}>
                      {lnk.icon}
                    </div>
                    <span style={{ fontSize: "0.82rem", fontWeight: 700, color: lnk.primary ? "#fff" : "#334155" }}>
                      {lnk.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* ── Order Modal ── */}
      {selOrder && <OrderModal order={selOrder} onClose={() => setSelOrder(null)} />}
    </div>
  );
};

export default Home;
