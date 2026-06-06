// ==============================================================
// TÊN FILE: Home.js
// MÔ TẢ: Trang chủ (Dashboard) của hệ thống FnB.
//        Trang có thiết kế giao diện động phân quyền:
//        - Đối với Khách hàng (User): Hiển thị banner chào mừng, các bộ sưu tập/nhóm sản phẩm
//          (Trà sữa, Cafe, Matcha, Nước ép, v.v.) và các liên kết thao tác nhanh.
//        - Đối với Quản lý/Nhân viên (Admin/Staff): Đóng vai trò là một Dashboard quản trị
//          hiển thị các biểu đồ doanh thu tuần qua (Recharts), tỷ lệ đơn hàng (Pie chart),
//          danh sách đơn đặt hàng gần đây, và các thẻ thống kê nhanh chỉ số KPI kinh doanh.
// ==============================================================

import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer,
} from "recharts";
import {
  FaBoxOpen, FaChartLine, FaChartPie,
  FaMoneyBillWave, FaShoppingBag, FaTimes, FaUsers,
  FaEye, FaClipboardList, FaHeart, FaCoffee, FaCheck,
} from "react-icons/fa";

import { api } from "../lib/api";
import { getRole } from "../lib/session";
import "../styles/dashboard.css";
import "../styles/commerce.css";
import "./Home.css";

/* ── Helpers ────────────────────────────────────────────────────── */
// Định dạng tiền tệ VNĐ (ví dụ: 120.000 ₫)
const fmt = (n) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", minimumFractionDigits: 0 }).format(Number(n) || 0);

// Ánh xạ trạng thái đơn hàng sang nhãn tiếng Việt và Class CSS tương ứng
const STATUS_MAP = {
  pending:   { label: "Đang xử lý", cls: "dashboard-badge-warning" },
  completed: { label: "Đang giao",  cls: "dashboard-badge-info"    },
  received:  { label: "Đã giao",    cls: "dashboard-badge-success"  },
  cancelled: { label: "Đã hủy",     cls: "dashboard-badge-danger"   },
};

const CHART_COLORS = ["#C8860A", "#5A8A5A", "#3B82F6", "#EF4444", "#E8778A"];

const CATEGORIES = [
  { label: "Tất cả",   emoji: "✨", path: "/products" },
  { label: "Trà sữa",  emoji: "🧋", path: "/products?category=Trà sữa" },
  { label: "Cafe",     emoji: "☕", path: "/products?category=Cafe" },
  { label: "Matcha",   emoji: "🍵", path: "/products?category=Matcha" },
  { label: "Nước ép",  emoji: "🍹", path: "/products?category=Nước ép" },
  { label: "Bánh ngọt",emoji: "🧁", path: "/products?category=Bánh ngọt" },
  { label: "Bánh kem", emoji: "🎂", path: "/products?category=Bánh kem" },
];

/* ── Order Modal ────────────────────────────────────────────────── */
/**
 * OrderModal Component: Hiển thị hộp thoại (modal) chi tiết của một đơn hàng.
 * Phục vụ cho tính năng xem nhanh đơn hàng vừa đặt tại Dashboard.
 */
function OrderModal({ order, onClose }) {
  const st = STATUS_MAP[order.status] || STATUS_MAP.pending;
  return (
    <div className="home-modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="home-modal animate-scaleIn">
        <div className="home-modal-header">
          <div>
            <p className="home-modal-title">Chi tiết đơn hàng</p>
            <p className="home-modal-id">#{order.id}</p>
          </div>
          <button className="home-modal-close" onClick={onClose}>×</button>
        </div>

        <div className="home-modal-body">
          <div className="home-modal-grid">
            {[
              ["Sản phẩm",   order.product_name || order.name || "—"],
              ["Số lượng",   order.quantity ?? "—"],
              ["Trạng thái", <span key="s" className={`dashboard-badge ${st.cls}`}>{st.label}</span>],
              ["Tổng tiền",  fmt(order.total_price ?? order.price ?? 0)],
            ].map(([label, val]) => (
              <div key={label} className="home-modal-field">
                <div className="home-modal-field-label">{label}</div>
                <div className="home-modal-field-value">{val}</div>
              </div>
            ))}
          </div>
          {order.note && (
            <div className="home-modal-field" style={{ background: "var(--color-warning-light)", border: "1px solid rgba(245,158,11,0.2)" }}>
              <div className="home-modal-field-label">Ghi chú</div>
              <div className="home-modal-field-value" style={{ color: "var(--color-warning)" }}>{order.note}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Skeleton ───────────────────────────────────────────────────── */
/**
 * SkeletonStat Component: Hiển thị placeholder tải thông tin thống kê dạng khung xương.
 * Tăng trải nghiệm người dùng trong thời gian chờ gọi API stats.
 */
function SkeletonStat() {
  return (
    <div className="home-skeleton-stat">
      <div className="skeleton" style={{ width: 48, height: 48, borderRadius: "var(--radius-md)", flexShrink: 0 }} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
        <div className="skeleton" style={{ height: 10, width: "55%" }} />
        <div className="skeleton" style={{ height: 22, width: "40%" }} />
      </div>
    </div>
  );
}

/* ── Main Component ─────────────────────────────────────────────── */
const Home = () => {
  const navigate = useNavigate();
  const role = getRole();
  const isAdmin   = role === "admin";
  const isManager = role === "admin" || role === "staff";

  // --- Các Hook State lưu giữ thông tin của trang chủ ---
  // stats: Lưu trữ đối tượng KPI thống kê (doanh thu, số lượng user, sản phẩm đã bán, đơn hủy)
  const [stats,    setStats]    = useState(null);
  // orders: Danh sách toàn bộ đơn hàng có trên hệ thống để hiển thị đơn gần đây và tính toán vẽ biểu đồ
  const [orders,   setOrders]   = useState([]);
  // loading: Trạng thái đang tải dữ liệu từ API
  const [loading,  setLoading]  = useState(true);
  // selOrder: Đơn hàng cụ thể đang được chọn xem chi tiết trong modal
  const [selOrder, setSelOrder] = useState(null);

  // Tải dữ liệu từ Backend khi linh kiện được mount
  useEffect(() => {
    const load = async () => {
      try {
        const [statsRes, ordersRes] = await Promise.allSettled([
          isManager ? api.get("/api/admin/statistics") : Promise.resolve({ data: null }),
          isManager ? api.get("/api/admin/orders")     : Promise.resolve({ data: [] }),
        ]);
        if (statsRes.status  === "fulfilled") setStats(statsRes.value.data);
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

  // Cấu trúc danh sách các thẻ thống kê nhanh (KPI cards) từ dữ liệu API thống kê
  const statCards = useMemo(() => {
    if (!stats) return [];
    return [
      { label: "Tổng doanh thu",  value: fmt(stats.totalRevenue),       icon: <FaMoneyBillWave />, accent: "var(--color-brand)",    bg: "var(--color-brand-pale)",    color: "var(--color-brand-dark)" },
      { label: "Người dùng",      value: stats.totalUsers,              icon: <FaUsers />,         accent: "#3b82f6", bg: "var(--color-info-light)",    color: "#3b82f6" },
      { label: "Sản phẩm đã bán", value: stats.totalProductsSold,       icon: <FaShoppingBag />,   accent: "#10b981", bg: "var(--color-success-light)", color: "#10b981" },
      { label: "Đơn đã hủy",      value: stats.totalCancelledOrders,    icon: <FaTimes />,         accent: "#ef4444", bg: "var(--color-danger-light)",  color: "#ef4444" },
    ];
  }, [stats]);

  // Phân tích trạng thái đơn hàng để làm dữ liệu đầu vào cho biểu đồ tròn (Pie Chart)
  const orderStatusData = useMemo(() => {
    if (!orders.length) return [];
    const counts = { pending: 0, completed: 0, received: 0, cancelled: 0 };
    orders.forEach((o) => { if (counts[o.status] !== undefined) counts[o.status]++; });
    return Object.entries(counts).map(([status, count], i) => ({
      name: STATUS_MAP[status]?.label || status,
      value: count,
      color: CHART_COLORS[i],
    }));
  }, [orders]);

  // Chỉ lấy 6 đơn hàng mới nhất để hiện ở khu vực "Đơn gần đây"
  const recentOrders = useMemo(() => orders.slice(0, 6), [orders]);

  // Tổng hợp doanh thu theo từng ngày trong 7 ngày gần nhất để làm đầu vào cho biểu đồ cột (Bar Chart)
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
    { to: "/products",         label: "Sản phẩm",  icon: <FaBoxOpen />,       iconBg: "#f5f3ff", iconColor: "#7c3aed" },
    { to: "/carts",            label: "Giỏ hàng",  icon: <FaShoppingBag />,   iconBg: "#ecfdf3", iconColor: "#16a34a" },
    { to: "/wallet",           label: "Ví điểm",   icon: <FaMoneyBillWave />, iconBg: "var(--color-brand-pale)", iconColor: "var(--color-brand-dark)", primary: true },
    { to: "/favorite-products",label: "Yêu thích", icon: <FaHeart />,         iconBg: "var(--color-rose-light)", iconColor: "var(--color-rose)" },
    ...(isManager ? [
      { to: "/admin/statistics", label: "Thống kê", icon: <FaChartPie />,      iconBg: "#eff6ff", iconColor: "#3b82f6" },
      { to: "/orders",           label: "Đơn hàng", icon: <FaClipboardList />, iconBg: "#fff7ed", iconColor: "#f59e0b" },
    ] : []),
    ...(isAdmin ? [
      { to: "/admin/staffs",   label: "Nhân viên", icon: <FaUsers />,         iconBg: "#fce7f3", iconColor: "#db2777" },
    ] : []),
  ];

  const greeting = isAdmin ? "Admin Dashboard" : isManager ? "Staff Dashboard" : "Chào mừng trở lại! 👋";

  return (
    <div className="dashboard-page">
      <div className="dashboard-shell">

        {/* ── Hero ── */}
        <div className="home-hero animate-fadeInUp">
          <div className="home-hero-content">
            <p className="home-hero-greeting">☕ {greeting}</p>
            <h1 className="home-hero-title">
              {isManager ? (
                <>Quản lý <span>thông minh</span><br />tăng doanh thu</>
              ) : (
                <>Chọn thức uống<br /><span>yêu thích</span> của bạn</>
              )}
            </h1>
            <p className="home-hero-sub">
              {isManager
                ? "Theo dõi đơn hàng, doanh thu và quản lý sản phẩm ngay trên dashboard."
                : "Khám phá hàng trăm loại trà sữa, cafe và bánh ngọt cao cấp nhất thành phố."}
            </p>
            <div className="home-hero-actions">
              <button className="home-hero-btn-primary" onClick={() => navigate("/products")}>
                <FaCoffee /> Xem thực đơn
              </button>
              {isManager && (
                <button className="home-hero-btn-ghost" onClick={() => navigate("/orders")}>
                  <FaClipboardList /> Quản lý đơn
                </button>
              )}
            </div>
          </div>
          <div className="home-hero-emoji">☕</div>
        </div>

        {/* ── Category pills ── */}
        {!isManager && (
          <div className="home-categories animate-fadeIn animate-delay-1">
            {CATEGORIES.map((cat) => (
              <Link key={cat.label} to={cat.path} className="home-cat-pill">
                <span className="home-cat-emoji">{cat.emoji}</span>
                {cat.label}
              </Link>
            ))}
          </div>
        )}

        {/* ── Stat cards (manager only) ── */}
        {isManager && (
          <div className="dashboard-stats-grid animate-fadeInUp animate-delay-1">
            {loading
              ? Array(4).fill(0).map((_, i) => <SkeletonStat key={i} />)
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
                      <p className="dashboard-stat-value">{s.value}</p>
                    </div>
                  </article>
                ))}
          </div>
        )}

        {/* ── Charts row (manager only) ── */}
        {isManager && !loading && (
          <div className="commerce-chart-grid animate-fadeInUp animate-delay-2">
            <section className="dashboard-panel">
              <div className="dashboard-panel-header">
                <h2 className="dashboard-panel-title">📈 Doanh thu 7 ngày</h2>
              </div>
              <div className="dashboard-panel-body" style={{ height: 280 }}>
                {revenueData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={revenueData} barSize={28}>
                      <XAxis dataKey="date" axisLine={false} tickLine={false}
                        tick={{ fontSize: 11, fill: "var(--color-text-faint)" }} />
                      <YAxis axisLine={false} tickLine={false}
                        tick={{ fontSize: 10, fill: "var(--color-text-faint)" }}
                        tickFormatter={(v) => (v / 1000000).toFixed(1) + "tr"} />
                      <Tooltip
                        formatter={(v) => [fmt(v), "Doanh thu"]}
                        contentStyle={{ borderRadius: 12, border: "1px solid var(--color-border)", background: "var(--color-surface)", fontSize: 12 }} />
                      <Bar dataKey="amount" radius={[8, 8, 0, 0]}>
                        {revenueData.map((_, i) => (
                          <Cell key={i} fill={i === revenueData.length - 1 ? "var(--color-brand)" : "var(--color-brand-pale)"} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="dashboard-empty">Chưa có dữ liệu doanh thu</div>
                )}
              </div>
            </section>

            <section className="dashboard-panel">
              <div className="dashboard-panel-header">
                <h2 className="dashboard-panel-title">🍩 Tỷ lệ đơn hàng</h2>
              </div>
              <div className="dashboard-panel-body" style={{ height: 280 }}>
                {orderStatusData.some((d) => d.value > 0) ? (
                  <>
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie data={orderStatusData} innerRadius={55} outerRadius={85} paddingAngle={4} dataKey="value">
                          {orderStatusData.map((entry, i) => (
                            <Cell key={i} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(v, name) => [v + " đơn", name]}
                          contentStyle={{ borderRadius: 12, border: "1px solid var(--color-border)", background: "var(--color-surface)", fontSize: 12 }} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "center" }}>
                      {orderStatusData.map((d) => (
                        <span key={d.name} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.78rem", color: "var(--color-text-muted)" }}>
                          <span style={{ width: 8, height: 8, borderRadius: 999, background: d.color, display: "inline-block" }} />
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
        <div style={{ display: "grid", gridTemplateColumns: isManager ? "1fr 1fr" : "1fr", gap: "var(--space-5)" }}
             className="animate-fadeInUp animate-delay-3">

          {/* Recent orders */}
          {isManager && (
            <section className="dashboard-panel">
              <div className="dashboard-panel-header">
                <h2 className="dashboard-panel-title">🛒 Đơn gần đây</h2>
                <button className="dashboard-btn dashboard-btn-secondary" onClick={() => navigate("/orders")}
                  style={{ fontSize: "0.8rem", padding: "6px 14px" }}>
                  <FaEye /> Xem tất cả
                </button>
              </div>
              <div className="dashboard-table-wrap">
                {loading ? (
                  <div className="dashboard-empty">Đang tải...</div>
                ) : recentOrders.length === 0 ? (
                  <div className="dashboard-empty">Chưa có đơn hàng nào</div>
                ) : (
                  <table className="dashboard-table dashboard-table-compact">
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
                              <div style={{ fontWeight: 700, fontSize: "0.875rem" }}>
                                {order.product_name || order.name || "—"}
                              </div>
                              <div className="dashboard-code">SL: {order.quantity ?? 1}</div>
                            </td>
                            <td className="dashboard-money">{fmt(order.total_price ?? order.price ?? 0)}</td>
                            <td><span className={`dashboard-badge ${st.cls}`}>{st.label}</span></td>
                            <td>
                              <button className="dashboard-btn dashboard-btn-secondary"
                                style={{ padding: "4px 10px", fontSize: "0.78rem" }}
                                onClick={() => setSelOrder(order)}>
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
              <h2 className="dashboard-panel-title">⚡ Truy cập nhanh</h2>
            </div>
            <div className="dashboard-panel-body">
              <div className="home-quicklinks">
                {QUICK_LINKS.map((lnk) => (
                  <button
                    key={lnk.to}
                    type="button"
                    className={`home-quicklink-card ${lnk.primary ? "primary" : ""}`}
                    onClick={() => navigate(lnk.to)}
                  >
                    <div className="home-quicklink-icon"
                      style={!lnk.primary ? { background: lnk.iconBg, color: lnk.iconColor } : {}}>
                      {lnk.icon}
                    </div>
                    <span className="home-quicklink-label">{lnk.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* ── Modal ── */}
      {selOrder && <OrderModal order={selOrder} onClose={() => setSelOrder(null)} />}
    </div>
  );
};

export default Home;
