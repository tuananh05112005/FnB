import { useEffect, useMemo, useState } from "react";
import {
  AreaChart, Area, BarChart, Bar, Cell,
  PieChart, Pie, RadialBarChart, RadialBar,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";
import {
  FaArrowDown, FaArrowUp, FaChartPie, FaCheckCircle,
  FaTimes, FaUsers, FaShoppingBag, FaLaptop, FaUserSecret
} from "react-icons/fa";

import { api } from "../../lib/api";
import socket from "../../lib/socket";
import "../../styles/dashboard.css";
import "../../styles/commerce.css";

// Thêm keyframe cho animations thời gian thực
const statsStyles = `
  @keyframes pulse-slow {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.4; transform: scale(1.15); }
  }
  .animate-pulse-slow {
    animation: pulse-slow 1.6s infinite ease-in-out;
  }
  @keyframes slide-in-up {
    from { transform: translateY(20px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }
`;

// ── helpers ──────────────────────────────────────────────────────────────────
const fmt = (n) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", minimumFractionDigits: 0 }).format(Number(n) || 0);

const fmtShort = (n) => {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "tr";
  if (n >= 1_000)     return (n / 1_000).toFixed(0) + "k";
  return String(n);
};

const pct = (a, b) => (b === 0 ? 0 : Math.round((a / b) * 100));

const STATUS_CFG = {
  pending:   { label: "Đang xử lý", color: "#f59e0b", bg: "#fff7ed", cls: "dashboard-badge-warning" },
  completed: { label: "Đang giao",  color: "#2563eb", bg: "#eff6ff", cls: "dashboard-badge-info"    },
  received:  { label: "Đã giao",    color: "#16a34a", bg: "#ecfdf3", cls: "dashboard-badge-success"  },
  cancelled: { label: "Đã hủy",     color: "#ef4444", bg: "#fef2f2", cls: "dashboard-badge-danger"   },
};

// Custom tooltip cho recharts
function CustomTooltip({ active, payload, label, currency }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "#fff", borderRadius: 12, padding: "10px 14px", boxShadow: "0 8px 24px rgba(15,23,42,0.12)", border: "1px solid #eef2ff", fontSize: 13 }}>
      <div style={{ color: "#8aa0c5", marginBottom: 4, fontWeight: 700 }}>{label}</div>
      {payload.map((p) => (
        <div key={p.name} style={{ color: p.color || "#0f172a", fontWeight: 700 }}>
          {currency ? fmt(p.value) : p.value}
        </div>
      ))}
    </div>
  );
}

// KPI trend pill
function TrendPill({ value, positive }) {
  const up = value >= 0;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 3,
      fontSize: "0.72rem", fontWeight: 700, padding: "2px 8px", borderRadius: 999,
      background: up ? "#ecfdf3" : "#fef2f2",
      color: up ? "#16a34a" : "#ef4444",
    }}>
      {up ? <FaArrowUp size={9} /> : <FaArrowDown size={9} />}
      {Math.abs(value)}%
    </span>
  );
}

// ── Main ─────────────────────────────────────────────────────────────────────
// Component chính trang thống kê chuyên sâu dành cho Admin
const AdminStatistics = () => {
  // Khai báo các State
  const [stats,   setStats]   = useState(null); // Tổng hợp số liệu hệ thống từ API (users, revenue, etc.)
  const [orders,  setOrders]  = useState([]); // Danh sách toàn bộ đơn hàng/giao dịch để phân tích xu hướng
  const [loading, setLoading] = useState(true); // Trạng thái tải dữ liệu
  const [activeTab, setActiveTab] = useState("analytics"); // "analytics" | "visitors"
  const [visitorLogs, setVisitorLogs] = useState([]);
  const [liveNotification, setLiveNotification] = useState(null);

  // Thêm thẻ style động cho animations
  useEffect(() => {
    const styleEl = document.createElement("style");
    styleEl.innerHTML = statsStyles;
    document.head.appendChild(styleEl);
    return () => {
      try {
        document.head.removeChild(styleEl);
      } catch (e) {}
    };
  }, []);

  // Lắng nghe Socket.io real-time báo có visitor mới
  useEffect(() => {
    const handleNewVisitor = (newLog) => {
      // Đẩy log mới lên đầu danh sách
      setVisitorLogs((prev) => [newLog, ...prev.slice(0, 99)]);
      setLiveNotification(newLog);
      
      const timer = setTimeout(() => {
        setLiveNotification((current) => current && current.ip_address === newLog.ip_address ? null : current);
      }, 4000);
      return () => clearTimeout(timer);
    };

    socket.on("newVisitor", handleNewVisitor);
    return () => {
      socket.off("newVisitor", handleNewVisitor);
    };
  }, []);

  // Tải danh sách 100 log truy cập gần nhất từ database
  useEffect(() => {
    if (activeTab !== "visitors") return;
    const fetchLogs = async () => {
      try {
        const res = await api.get("/api/stats/visitor-logs");
        if (res.data && res.data.success) {
          setVisitorLogs(res.data.data);
        }
      } catch (e) {
        console.error("Failed to fetch visitor logs:", e);
      }
    };
    fetchLogs();
  }, [activeTab]);

  const getPageLabel = (url) => {
    if (url === "/") return "Trang chủ 🏠";
    if (url === "/products") return "Thực đơn món ăn 🍵";
    if (url.startsWith("/products/")) return "Chi tiết sản phẩm 🍹";
    if (url === "/carts") return "Giỏ hàng 🛒";
    if (url === "/payment") return "Thanh toán 💳";
    if (url === "/history") return "Lịch sử mua hàng 📜";
    if (url === "/wallet") return "Ví ưu đãi & Điểm 🪙";
    if (url === "/admin/statistics") return "Dashboard Phân tích 📊";
    if (url === "/orders") return "Danh sách đơn hàng 📦";
    return url;
  };

  // Effect: Tải số liệu tổng quan và danh sách đơn hàng
  useEffect(() => {
    const load = async () => {
      try {
        const [statsRes, ordersRes] = await Promise.allSettled([
          api.get("/api/admin/statistics"),
          api.get("/api/admin/payments"),
        ]);
        if (statsRes.status  === "fulfilled") setStats(statsRes.value.data);
        if (ordersRes.status === "fulfilled") {
          const d = ordersRes.value.data;
          setOrders(Array.isArray(d) ? d : []);
        }
      } catch (e) {
        console.error("AdminStatistics load error:", e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // ── Tính toán các số liệu phục vụ biểu đồ (Derived analytics) ──────────────────

  // 1. Xu hướng doanh thu theo ngày (lấy 10 ngày gần nhất có doanh thu)
  const revenueTrend = useMemo(() => {
    const map = {};
    orders.forEach((o) => {
      const date = (o.created_at || o.order_date || "").split("T")[0];
      if (!date) return;
      map[date] = (map[date] || 0) + Number(o.amount || 0);
    });
    return Object.entries(map)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-10)
      .map(([date, amount]) => ({ date: date.slice(5), amount }));
  }, [orders]);

  // 2. Cơ cấu đơn hàng theo hình thức thanh toán (Tiền mặt vs Chuyển khoản)
  const paymentSplit = useMemo(() => {
    const cash    = orders.filter((o) => o.payment_method === "cash").length;
    const banking = orders.filter((o) => o.payment_method !== "cash").length;
    return [
      { name: "Tiền mặt", value: cash,    fill: "#7c3aed" },
      { name: "Chuyển khoản", value: banking, fill: "#3b82f6" },
    ];
  }, [orders]);

  // 3. Phân bổ trạng thái đơn hàng (để vẽ biểu đồ Radial)
  const statusDist = useMemo(() => {
    const counts = { received: 0, completed: 0, pending: 0, cancelled: 0 };
    orders.forEach((o) => { if (counts[o.status] !== undefined) counts[o.status]++; });
    const total = orders.length || 1;
    return Object.entries(counts).map(([status, count]) => ({
      name: STATUS_CFG[status]?.label || status,
      value: Math.round((count / total) * 100),
      count,
      fill: STATUS_CFG[status]?.color || "#8aa0c5",
    }));
  }, [orders]);

  const revenueByMethod = useMemo(() => {
    const cash    = orders.filter((o) => o.payment_method === "cash").reduce((s, o) => s + Number(o.amount || 0), 0);
    const banking = orders.filter((o) => o.payment_method !== "cash").reduce((s, o) => s + Number(o.amount || 0), 0);
    return [
      { name: "Tiền mặt",      amount: cash    },
      { name: "Chuyển khoản",  amount: banking },
    ];
  }, [orders]);

  // 5. Thẻ KPI đo lường các chỉ số cốt lõi (Tỷ lệ hoàn thành, hủy đơn, giá trị TB đơn, tổng khách)
  const completionRate = pct(
    orders.filter((o) => o.status === "received").length,
    orders.length
  );
  const cancellationRate = pct(
    orders.filter((o) => o.status === "cancelled").length,
    orders.length
  );
  const avgOrderValue = orders.length
    ? Math.round(orders.reduce((s, o) => s + Number(o.amount || 0), 0) / orders.length)
    : 0;

  const kpiCards = stats ? [
    {
      label: "Tỷ lệ hoàn thành",
      value: completionRate + "%",
      icon: <FaCheckCircle />,
      accent: "#10b981", bg: "#ecfdf3", color: "#10b981",
      sub: "Đơn đã giao / Tổng đơn",
      trend: completionRate > 70 ? 1 : -1,
    },
    {
      label: "Tỷ lệ hủy đơn",
      value: cancellationRate + "%",
      icon: <FaTimes />,
      accent: "#ef4444", bg: "#fef2f2", color: "#ef4444",
      sub: "Đơn bị hủy / Tổng đơn",
      trend: cancellationRate < 10 ? 1 : -1,
    },
    {
      label: "Giá trị TB / đơn",
      value: fmt(avgOrderValue),
      icon: <FaShoppingBag />,
      accent: "#7c3aed", bg: "#f5f3ff", color: "#7c3aed",
      sub: "Doanh thu ÷ số đơn",
      trend: 0,
    },
    {
      label: "Tổng khách hàng",
      value: stats.totalUsers,
      icon: <FaUsers />,
      accent: "#3b82f6", bg: "#eff6ff", color: "#3b82f6",
      sub: "Tài khoản đã đăng ký",
      trend: 0,
    },
  ] : [];

  if (loading) {
    return (
      <div className="dashboard-page">
        <div className="dashboard-shell" style={{ display: "grid", gap: 18 }}>
          <div className="dashboard-header">
            <div className="dashboard-title-wrap">
              <div className="dashboard-icon"><FaChartPie /></div>
              <div>
                <h1 className="dashboard-title">Phân tích chuyên sâu</h1>
                <p className="dashboard-subtitle">Đang tải dữ liệu...</p>
              </div>
            </div>
          </div>
          <div className="dashboard-stats-grid">
            {Array(4).fill(0).map((_, i) => (
              <div key={i} className="dashboard-stat" style={{ gap: 16 }}>
                <div style={{ width: 48, height: 48, borderRadius: 14, background: "#eef2ff" }} />
                <div style={{ flex: 1 }}>
                  <div style={{ height: 12, width: "55%", background: "#eef2ff", borderRadius: 6, marginBottom: 10 }} />
                  <div style={{ height: 22, width: "35%", background: "#e0e7ff", borderRadius: 6 }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <div className="dashboard-shell" style={{ display: "grid", gap: 20 }}>

        {/* ── Header ── */}
        <div className="dashboard-header">
          <div className="dashboard-title-wrap">
            <div className="dashboard-icon"><FaChartPie /></div>
            <div>
              <h1 className="dashboard-title">Phân tích chuyên sâu</h1>
              <p className="dashboard-subtitle">Tỷ lệ chuyển đổi, xu hướng doanh thu và phân tích hành vi đơn hàng</p>
            </div>
          </div>
          {/* Revenue hero badge */}
          {stats && (
            <div style={{
              background: "linear-gradient(135deg, var(--sidebar-bg) 0%, #3D2B14 100%)",
              border: "1.5px solid var(--color-brand)",
              boxShadow: "var(--shadow-brand)",
              borderRadius: 18, padding: "14px 22px", color: "var(--color-text-inverse)",
              display: "flex", flexDirection: "column", gap: 2, minWidth: 200,
            }}>
              <span style={{ fontSize: "0.72rem", color: "var(--color-brand-light)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>Tổng doanh thu</span>
              <span style={{ fontSize: "1.6rem", fontWeight: 900, letterSpacing: "-0.04em", color: "#fff" }}>{fmt(stats.totalRevenue)}</span>
              <span style={{ fontSize: "0.75rem", color: "rgba(255, 255, 255, 0.6)" }}>{orders.length} đơn hàng ghi nhận</span>
            </div>
          )}
        </div>

        {/* ── Tabs Navigation ── */}
        <div className="dashboard-toolbar-group" style={{ borderBottom: "1px solid var(--color-border-light)", paddingBottom: 10, gap: 16, display: "flex", flexWrap: "wrap" }}>
          <button 
            type="button" 
            className={`dashboard-chip ${activeTab === "analytics" ? "active" : ""}`}
            style={{ fontSize: "0.9rem", padding: "8px 18px", cursor: "pointer", borderRadius: 20, fontWeight: 700 }}
            onClick={() => setActiveTab("analytics")}
          >
            Phân tích số liệu 📊
          </button>
          <button 
            type="button" 
            className={`dashboard-chip ${activeTab === "visitors" ? "active" : ""}`}
            style={{ fontSize: "0.9rem", padding: "8px 18px", cursor: "pointer", borderRadius: 20, fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 8 }}
            onClick={() => setActiveTab("visitors")}
          >
            Nhật ký Truy cập Live
            <span style={{ width: 8, height: 8, borderRadius: 999, background: "#10b981", display: "inline-block" }} className="animate-pulse-slow" />
          </button>
        </div>

        {/* ── Tab content 1: Charts & Statistics ── */}
        {activeTab === "analytics" && (
          <>
            {/* ── KPI row ── */}
            <div className="dashboard-stats-grid">
              {kpiCards.map((s) => (
                <article key={s.label} className="dashboard-stat dashboard-stat-accent" style={{ "--stat-accent": s.accent }}>
                  <div className="dashboard-stat-icon" style={{ background: s.bg, color: s.color }}>{s.icon}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                      <p className="dashboard-stat-label">{s.label}</p>
                      {s.trend !== 0 && <TrendPill value={s.trend > 0 ? 12 : -8} />}
                    </div>
                    <p className="dashboard-stat-value" style={{ fontSize: "1.55rem" }}>{s.value}</p>
                    <p style={{ margin: "4px 0 0", fontSize: "0.72rem", color: "#8aa0c5" }}>{s.sub}</p>
                  </div>
                </article>
              ))}
            </div>

            {/* ── Charts row 1: Revenue trend + Status radial ── */}
            <div className="commerce-chart-grid">
              {/* Area chart — doanh thu theo ngày */}
              <section className="dashboard-panel">
                <div className="dashboard-panel-header">
                  <h2 className="dashboard-panel-title">
                    <span className="dashboard-panel-title-dot" />
                    Xu hướng doanh thu
                  </h2>
                  <span className="dashboard-count">{revenueTrend.length} ngày gần nhất</span>
                </div>
                <div className="dashboard-panel-body" style={{ height: 280 }}>
                  {revenueTrend.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={revenueTrend}>
                        <defs>
                          <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%"  stopColor="var(--color-brand)" stopOpacity={0.25} />
                            <stop offset="95%" stopColor="var(--color-brand)" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid stroke="var(--color-border-light)" vertical={false} strokeDasharray="3 3" />
                        <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "var(--color-text-faint)" }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "var(--color-text-faint)" }} tickFormatter={fmtShort} />
                        <Tooltip content={<CustomTooltip currency />} />
                        <Area type="monotone" dataKey="amount" stroke="var(--color-brand)" strokeWidth={2.5} fill="url(#revGrad)" dot={{ r: 4, fill: "var(--color-brand)", strokeWidth: 0 }} activeDot={{ r: 6 }} />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="dashboard-empty">Chưa có dữ liệu xu hướng</div>
                  )}
                </div>
              </section>

              {/* Radial bar — tỷ lệ trạng thái */}
              <section className="dashboard-panel">
                <div className="dashboard-panel-header">
                  <h2 className="dashboard-panel-title">
                    <span className="dashboard-panel-title-dot" style={{ background: "#f59e0b", boxShadow: "0 0 0 6px rgba(245,158,11,0.12)" }} />
                    Phân bổ trạng thái
                  </h2>
                </div>
                <div className="dashboard-panel-body" style={{ height: 280 }}>
                  {statusDist.some((d) => d.count > 0) ? (
                    <>
                      <ResponsiveContainer width="100%" height={200}>
                        <RadialBarChart innerRadius={28} outerRadius={90} data={statusDist} startAngle={90} endAngle={-270}>
                          <RadialBar dataKey="value" cornerRadius={6} background={{ fill: "var(--color-bg-alt)" }} />
                          <Tooltip formatter={(v, name) => [v + "%", name]} contentStyle={{ borderRadius: 12, border: "1px solid var(--color-border)", background: "var(--color-surface)", fontSize: 12, boxShadow: "var(--shadow-md)" }} />
                        </RadialBarChart>
                      </ResponsiveContainer>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 4 }}>
                        {statusDist.map((d) => (
                          <div key={d.name} style={{ display: "flex", alignItems: "center", gap: 7 }}>
                            <span style={{ width: 9, height: 9, borderRadius: 3, background: d.fill, flexShrink: 0 }} />
                            <span style={{ fontSize: "0.76rem", color: "var(--color-text-muted)", fontWeight: 600 }}>{d.name}</span>
                            <span style={{ marginLeft: "auto", fontSize: "0.76rem", fontWeight: 800, color: "var(--color-text)" }}>{d.count}</span>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="dashboard-empty">Chưa có đơn hàng</div>
                  )}
                </div>
              </section>
            </div>

            {/* ── Charts row 2: Payment split + Revenue by method ── */}
            <div className="commerce-chart-grid">
              {/* Donut — hình thức thanh toán */}
              <section className="dashboard-panel">
                <div className="dashboard-panel-header">
                  <h2 className="dashboard-panel-title">
                    <span className="dashboard-panel-title-dot" style={{ background: "#3b82f6", boxShadow: "0 0 0 6px rgba(59,130,246,0.12)" }} />
                    Hình thức thanh toán
                  </h2>
                </div>
                <div className="dashboard-panel-body" style={{ height: 280 }}>
                  {paymentSplit.some((d) => d.value > 0) ? (
                    <>
                      <ResponsiveContainer width="100%" height={200}>
                        <PieChart>
                          <Pie data={paymentSplit} innerRadius={65} outerRadius={85} paddingAngle={5} dataKey="value">
                            {paymentSplit.map((entry) => (
                              <Cell key={entry.name} fill={entry.fill} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(v, name) => [v + " đơn", name]} contentStyle={{ borderRadius: 12, border: "1px solid var(--color-border)", background: "var(--color-surface)", fontSize: 12, boxShadow: "var(--shadow-md)" }} />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="dashboard-toolbar-group" style={{ justifyContent: "center", flexWrap: "wrap", gap: 14 }}>
                        {paymentSplit.map((d) => (
                          <span key={d.name} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.8rem", fontWeight: 700, color: "var(--color-text-muted)" }}>
                            <span style={{ width: 10, height: 10, borderRadius: 999, background: d.fill }} />
                            {d.name}
                            <span style={{ color: "var(--color-text-faint)", fontWeight: 600 }}>({d.value})</span>
                          </span>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="dashboard-empty">Chưa có dữ liệu</div>
                  )}
                </div>
              </section>

              {/* Bar — doanh thu theo hình thức */}
              <section className="dashboard-panel">
                <div className="dashboard-panel-header">
                  <h2 className="dashboard-panel-title">
                    <span className="dashboard-panel-title-dot" style={{ background: "#10b981", boxShadow: "0 0 0 6px rgba(16,185,129,0.12)" }} />
                    Doanh thu theo phương thức
                  </h2>
                </div>
                <div className="dashboard-panel-body" style={{ height: 280 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={revenueByMethod} barSize={36} layout="vertical">
                      <CartesianGrid horizontal={false} stroke="var(--color-border-light)" strokeDasharray="3 3" />
                      <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "var(--color-text-faint)" }} tickFormatter={fmtShort} />
                      <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "var(--color-text)", fontWeight: 700 }} width={110} />
                      <Tooltip content={<CustomTooltip currency />} />
                      <Bar dataKey="amount" radius={[0, 6, 6, 0]}>
                        <Cell fill="var(--color-brand)" />
                        <Cell fill="var(--color-matcha)" />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </section>
            </div>

            {/* ── Summary metrics table ── */}
            {stats && (
              <section className="dashboard-panel">
                <div className="dashboard-panel-header">
                  <h2 className="dashboard-panel-title">
                    <span className="dashboard-panel-title-dot" style={{ background: "#f59e0b", boxShadow: "0 0 0 6px rgba(245,158,11,0.12)" }} />
                    Bảng tổng hợp chỉ số hệ thống
                  </h2>
                </div>
                <div className="dashboard-table-wrap">
                  <table className="dashboard-table">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Chỉ số</th>
                        <th>Giá trị</th>
                        <th>Tỷ trọng / Ghi chú</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { label: "Tổng doanh thu",       value: fmt(stats.totalRevenue),        note: "100% doanh thu hệ thống",             color: "#7c3aed" },
                        { label: "Tổng người dùng",       value: stats.totalUsers,               note: "Tài khoản đã đăng ký",               color: "#3b82f6" },
                        { label: "Sản phẩm đã bán",       value: stats.totalProductsSold,        note: "Tổng item trong đơn hoàn thành",     color: "#10b981" },
                        { label: "Đơn hàng hủy",          value: stats.totalCancelledOrders,     note: `Tỷ lệ hủy: ${cancellationRate}%`,   color: "#ef4444" },
                        { label: "Tỷ lệ hoàn thành",      value: completionRate + "%",           note: `${orders.filter(o=>o.status==="received").length} / ${orders.length} đơn`, color: "#16a34a" },
                        { label: "Giá trị TB / đơn",      value: fmt(avgOrderValue),             note: "Doanh thu ÷ tổng đơn hàng",         color: "#f59e0b" },
                      ].map((row, i) => (
                        <tr key={row.label}>
                          <td className="dashboard-index">{String(i + 1).padStart(2, "0")}</td>
                          <td>
                            <span style={{ width: 9, height: 9, borderRadius: 3, background: row.color, display: "inline-block", marginRight: 10, verticalAlign: "middle" }} />
                            {row.label}
                          </td>
                          <td className="dashboard-money-primary" style={{ color: row.color, fontWeight: 800 }}>{row.value}</td>
                          <td className="dashboard-muted" style={{ fontSize: "0.82rem" }}>{row.note}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}
          </>
        )}

        {/* ── Tab content 2: Visitor Live Logs ── */}
        {activeTab === "visitors" && (
          <section className="dashboard-panel">
            <div className="dashboard-panel-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
              <h2 className="dashboard-panel-title">
                <span className="dashboard-panel-title-dot" style={{ background: "#10b981", boxShadow: "0 0 0 6px rgba(16,185,129,0.12)" }} />
                Nhật ký truy cập thời gian thực (Live Logs)
              </h2>
              <span className="dashboard-count">{visitorLogs.length} truy cập mới nhất</span>
            </div>
            {visitorLogs.length === 0 ? (
              <div className="dashboard-empty">Chưa ghi nhận lượt truy cập nào.</div>
            ) : (
              <div className="dashboard-table-wrap">
                <table className="dashboard-table">
                  <thead>
                    <tr>
                      <th style={{ width: 180 }}>Thời gian</th>
                      <th>Khách hàng</th>
                      <th style={{ width: 140 }}>Địa chỉ IP</th>
                      <th style={{ width: 220 }}>Thiết bị / HĐH / Trình duyệt</th>
                      <th>Trang truy cập</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visitorLogs.map((log, idx) => (
                      <tr key={log.id || idx}>
                        <td style={{ fontSize: "0.82rem", color: "var(--color-text-muted)" }}>
                          {new Date(log.visited_at).toLocaleString("vi-VN")}
                        </td>
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <div style={{
                              width: 32, height: 32, borderRadius: 99,
                              background: log.user_id ? "var(--color-brand-pale)" : "var(--color-bg-alt)",
                              color: log.user_id ? "var(--color-brand-dark)" : "var(--color-text-muted)",
                              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, flexShrink: 0
                            }}>
                              {log.user_id ? <FaUsers /> : <FaUserSecret />}
                            </div>
                            <div>
                              <div style={{ fontWeight: 800, color: "var(--color-text)" }}>
                                {log.user_name || "Khách vãng lai"}
                              </div>
                              {log.user_email && (
                                <div style={{ fontSize: "0.72rem", color: "var(--color-text-faint)" }}>
                                  {log.user_email}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td style={{ fontWeight: 700, color: "var(--color-text)", fontSize: "0.88rem" }}>
                          <code>{log.ip_address}</code>
                        </td>
                        <td style={{ fontSize: "0.82rem" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <FaLaptop style={{ color: "var(--color-text-faint)" }} />
                            <span>{log.device_info}</span>
                          </div>
                        </td>
                        <td>
                          <span className="dashboard-badge dashboard-badge-neutral" style={{ fontSize: "0.76rem" }}>
                            {getPageLabel(log.page_url)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}

      </div>

      {/* Real-time Visitor Toast Notification */}
      {liveNotification && (
        <div className="animate-slide-in" style={{
          position: "fixed", bottom: 24, right: 24, zIndex: 1000,
          background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)",
          color: "white", padding: "16px 20px", borderRadius: 16,
          boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
          border: "1px solid rgba(255,255,255,0.1)",
          width: 320, display: "flex", gap: 14, alignItems: "flex-start",
        }}>
          <span style={{ fontSize: 24 }}>🖥️</span>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <strong style={{ fontSize: "0.85rem", color: "#fcd34d" }}>Truy cập mới!</strong>
              <span style={{ width: 6, height: 6, borderRadius: 99, background: "#10b981" }} className="animate-pulse-slow" />
            </div>
            <p style={{ margin: "0 0 4px", fontSize: "0.82rem", fontWeight: 700, color: "#f8fafc" }}>
              {liveNotification.user_name || "Khách vãng lai"}
            </p>
            <p style={{ margin: 0, fontSize: "0.75rem", color: "#94a3b8" }}>
              IP: {liveNotification.ip_address}
            </p>
            <p style={{ margin: "4px 0 0", fontSize: "0.75rem", color: "#cbd5e1" }}>
              Thiết bị: {liveNotification.device_info}
            </p>
            <p style={{ margin: "4px 0 0", fontSize: "0.72rem", color: "#94a3b8", fontStyle: "italic" }}>
              Xem: {getPageLabel(liveNotification.page_url)}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminStatistics;
