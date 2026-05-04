import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Modal } from "react-bootstrap";
import {
  FaArrowLeft,
  FaChartLine,
  FaCheck,
  FaCreditCard,
  FaShoppingCart,
  FaTimes,
  FaTruck,
} from "react-icons/fa";

import { api } from "../lib/api";
import { getRole, getToken, getUserId } from "../lib/session";
import {
  cancelCartItem,
  getCart,
  markCartItemReceived,
  updateCartItem,
} from "../services/cartService";
import "../styles/dashboard.css";
import "../styles/commerce.css";

const formatCurrency = (amount) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(Number(amount) || 0);

const Cart = () => {
  const navigate = useNavigate();
  const userId = getUserId();
  const token = getToken();
  const role = getRole();

  const [cartItems, setCartItems] = useState([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [sortField, setSortField] = useState("order_date");
  const [sortOrder, setSortOrder] = useState("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(8);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [cancellationReason, setCancellationReason] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!userId || !token) {
      navigate("/login");
    }
  }, [navigate, token, userId]);

  useEffect(() => {
    const fetchCartData = async () => {
      try {
        const [items, revenue] = await Promise.all([
          role === "admin"
            ? api.get("/api/admin/orders").then((res) => res.data)
            : getCart(userId),
          role === "admin"
            ? api.get("/api/admin/revenue").then((res) => res.data.total_revenue || 0)
            : Promise.resolve(0),
        ]);

        setCartItems(items);
        setTotalRevenue(revenue);
      } catch (fetchError) {
        console.error("Không thể tải giỏ hàng:", fetchError);
        setError("Không thể tải dữ liệu giỏ hàng lúc này.");
      }
    };

    if (userId && token) {
      fetchCartData();
    }
  }, [role, token, userId]);

  const sortedItems = useMemo(() => {
    const items = [...cartItems];
    items.sort((a, b) => {
      const left = a[sortField];
      const right = b[sortField];

      if (sortField === "order_date") {
        return sortOrder === "asc"
          ? new Date(left) - new Date(right)
          : new Date(right) - new Date(left);
      }

      if (typeof left === "number" || typeof right === "number") {
        return sortOrder === "asc" ? left - right : right - left;
      }

      return sortOrder === "asc"
        ? String(left).localeCompare(String(right))
        : String(right).localeCompare(String(left));
    });

    return items;
  }, [cartItems, sortField, sortOrder]);

  const pagedItems = sortedItems.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  const totalPages = Math.max(1, Math.ceil(sortedItems.length / itemsPerPage));

  const statusGroups = useMemo(() => {
    const counts = {
      pending: 0,
      completed: 0,
      received: 0,
      cancelled: 0,
    };

    cartItems.forEach((item) => {
      if (counts[item.status] !== undefined) {
        counts[item.status] += 1;
      }
    });

    return counts;
  }, [cartItems]);

  const refreshCart = async () => {
    try {
      const items =
        role === "admin"
          ? await api.get("/api/admin/orders").then((res) => res.data)
          : await getCart(userId);
      setCartItems(items);
    } catch (refreshError) {
      console.error("Không thể cập nhật giỏ hàng:", refreshError);
    }
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
      return;
    }

    setSortField(field);
    setSortOrder(field === "order_date" ? "desc" : "asc");
  };

  const handleQuantityChange = async (itemId, quantity) => {
    const nextQuantity = Number(quantity);

    if (!itemId || Number.isNaN(nextQuantity) || nextQuantity < 1) {
      return;
    }

    try {
      await updateCartItem(itemId, { quantity: nextQuantity });
      refreshCart();
    } catch (updateError) {
      console.error("Không thể cập nhật số lượng:", updateError);
      setError("Không thể cập nhật số lượng sản phẩm.");
    }
  };

  const handleCheckout = (item) => {
    navigate("/payment", { state: { item } });
  };

  const handleConfirmCancel = async () => {
    if (!selectedItem || !cancellationReason) {
      return;
    }

    try {
      await cancelCartItem(selectedItem.id);
      await refreshCart();
      setShowCancelModal(false);
      setSelectedItem(null);
      setCancellationReason("");
    } catch (cancelError) {
      console.error("Không thể hủy đơn:", cancelError);
      setError("Không thể hủy đơn hàng này.");
    }
  };

  const handleReceived = async (itemId) => {
    try {
      await markCartItemReceived(itemId);
      refreshCart();
    } catch (receiveError) {
      console.error("Không thể cập nhật đã nhận hàng:", receiveError);
      setError("Không thể cập nhật trạng thái nhận hàng.");
    }
  };

  const openCancelModal = (item) => {
    setSelectedItem(item);
    setShowCancelModal(true);
  };

  const getStatusBadge = (status) => {
    const map = {
      pending: ["dashboard-badge-warning", role === "admin" ? "Đang xử lý" : "Chưa thanh toán"],
      completed: ["dashboard-badge-info", role === "admin" ? "Đang giao" : "Đã thanh toán"],
      received: ["dashboard-badge-success", role === "admin" ? "Đã giao" : "Đã nhận hàng"],
      cancelled: ["dashboard-badge-danger", "Đã hủy"],
    };

    const [variant, label] = map[status] || ["dashboard-badge-neutral", "Không xác định"];

    return <span className={`dashboard-badge ${variant}`}>{label}</span>;
  };

  const renderActions = (item) => {
    if (role === "user") {
      if (item.status === "pending") {
        return (
          <button
            type="button"
            className="dashboard-btn dashboard-btn-primary"
            onClick={() => handleCheckout(item)}
          >
            <FaCreditCard />
            Thanh toán
          </button>
        );
      }

      if (item.status === "completed") {
        return (
          <>
            <button
              type="button"
              className="dashboard-btn dashboard-btn-success"
              onClick={() => handleReceived(item.id)}
            >
              <FaCheck />
              Đã nhận
            </button>
            <button
              type="button"
              className="dashboard-btn dashboard-btn-danger"
              onClick={() => openCancelModal(item)}
            >
              <FaTimes />
              Hủy đơn
            </button>
          </>
        );
      }
    }

    if (role === "admin" && !["cancelled", "received"].includes(item.status)) {
      return (
        <button
          type="button"
          className="dashboard-btn dashboard-btn-danger"
          onClick={() => openCancelModal(item)}
        >
          <FaTimes />
          Hủy đơn
        </button>
      );
    }

    return <span className="dashboard-count">Không có thao tác</span>;
  };

  return (
    <div className="dashboard-page">
      <div className="dashboard-shell">
        <div className="dashboard-header">
          <div className="dashboard-title-wrap">
            <div className="dashboard-icon">
              <FaShoppingCart />
            </div>
            <div>
              <h1 className="dashboard-title">
                {role === "admin" ? "Quản lý đơn hàng" : "Giỏ hàng của tôi"}
              </h1>
              <p className="dashboard-subtitle">
                {role === "admin"
                  ? "Theo dõi tình trạng đơn và tổng doanh thu trong một màn hình."
                  : "Kiểm tra đơn đang xử lý, thanh toán và xác nhận nhận hàng."}
              </p>
            </div>
          </div>

          <button
            type="button"
            className="dashboard-back-btn"
            onClick={() => navigate("/products")}
          >
            <FaArrowLeft />
            Quay lại sản phẩm
          </button>
        </div>

        {role === "admin" && (
          <section className="dashboard-panel dashboard-panel-dark" style={{ marginBottom: 18 }}>
            <div className="dashboard-panel-body">
              <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
                <div className="dashboard-stat-icon" style={{ background: "rgba(255,255,255,0.14)" }}>
                  <FaChartLine />
                </div>
                <div>
                  <span className="commerce-kpi-label" style={{ color: "rgba(255,255,255,0.7)" }}>
                    Tổng doanh thu
                  </span>
                  <h2 style={{ margin: "8px 0 0", fontSize: "2.2rem", fontWeight: 800 }}>
                    {formatCurrency(totalRevenue)}
                  </h2>
                </div>
              </div>
            </div>
          </section>
        )}

        <div className="dashboard-stats-grid" style={{ marginBottom: 18 }}>
          {[
            { icon: <FaShoppingCart />, label: "Tổng đơn", value: cartItems.length, bg: "#f3e8ff", color: "#7c3aed" },
            { icon: <FaCreditCard />, label: "Đang xử lý", value: statusGroups.pending, bg: "#fff7ed", color: "#f59e0b" },
            { icon: <FaTruck />, label: "Đang giao", value: statusGroups.completed, bg: "#eff6ff", color: "#2563eb" },
            { icon: <FaTimes />, label: "Đã hủy", value: statusGroups.cancelled, bg: "#fef2f2", color: "#ef4444" },
          ].map((item) => (
            <article key={item.label} className="dashboard-stat">
              <div
                className="dashboard-stat-icon"
                style={{ background: item.bg, color: item.color }}
              >
                {item.icon}
              </div>
              <div>
                <p className="dashboard-stat-value">{item.value}</p>
                <p className="dashboard-stat-label">{item.label}</p>
              </div>
            </article>
          ))}
        </div>

        {error && <div className="commerce-alert commerce-alert-danger">{error}</div>}

        <div className="dashboard-toolbar" style={{ marginBottom: 18 }}>
          <div className="dashboard-toolbar-group">
            <button
              type="button"
              className={`dashboard-chip ${sortField === "order_date" ? "active" : ""}`}
              onClick={() => handleSort("order_date")}
            >
              Ngày đặt {sortField === "order_date" ? `(${sortOrder})` : ""}
            </button>
            <button
              type="button"
              className={`dashboard-chip ${sortField === "price" ? "active" : ""}`}
              onClick={() => handleSort("price")}
            >
              Giá {sortField === "price" ? `(${sortOrder})` : ""}
            </button>
            <button
              type="button"
              className={`dashboard-chip ${sortField === "name" ? "active" : ""}`}
              onClick={() => handleSort("name")}
            >
              Tên {sortField === "name" ? `(${sortOrder})` : ""}
            </button>
          </div>
          <span className="dashboard-count">{sortedItems.length} đơn hàng</span>
        </div>

        <section className="dashboard-panel">
          <div className="dashboard-panel-header">
            <h2 className="dashboard-panel-title">
              <span className="dashboard-panel-title-dot" />
              Danh sách đơn hàng
            </h2>
          </div>

          {pagedItems.length === 0 ? (
            <div className="dashboard-empty">Chưa có đơn hàng nào trong danh sách.</div>
          ) : (
            <div className="dashboard-table-wrap">
              <table className="dashboard-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Sản phẩm</th>
                    <th>Giá</th>
                    <th>SL</th>
                    <th>Thành tiền</th>
                    <th>Ngày đặt</th>
                    <th>Trạng thái</th>
                    <th>Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {pagedItems.map((item, index) => (
                    <tr key={item.id}>
                      <td className="dashboard-index">
                        {String((currentPage - 1) * itemsPerPage + index + 1).padStart(2, "0")}
                      </td>
                      <td>
                        <div className="dashboard-product">
                          <img
                            src={item.image}
                            alt={item.name}
                            className="dashboard-thumb"
                          />
                          <div>
                            <div style={{ fontWeight: 800 }}>{item.name}</div>
                            <span className="dashboard-code">{item.code || "SP"}</span>
                          </div>
                        </div>
                      </td>
                      <td className="dashboard-money">{formatCurrency(item.price)}</td>
                      <td>
                        <input
                          className="dashboard-qty"
                          type="number"
                          min="1"
                          value={item.quantity}
                          disabled={["completed", "cancelled", "received"].includes(item.status)}
                          onChange={(event) =>
                            handleQuantityChange(item.id, event.target.value)
                          }
                        />
                      </td>
                      <td className="dashboard-money-primary">
                        {formatCurrency(Number(item.price) * Number(item.quantity))}
                      </td>
                      <td>{new Date(item.order_date).toLocaleDateString("vi-VN")}</td>
                      <td>{getStatusBadge(item.status)}</td>
                      <td>
                        <div className="dashboard-action-row">{renderActions(item)}</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <div className="dashboard-toolbar" style={{ marginTop: 18 }}>
          <span className="dashboard-count">
            Trang {currentPage}/{totalPages}
          </span>
          <div className="dashboard-toolbar-group">
            <button
              type="button"
              className="dashboard-btn dashboard-btn-secondary"
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              Trước
            </button>
            <button
              type="button"
              className="dashboard-btn dashboard-btn-primary"
              onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
            >
              Sau
            </button>
          </div>
        </div>
      </div>

      <Modal show={showCancelModal} onHide={() => setShowCancelModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Huy đơn hàng</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <label htmlFor="cancel-reason" className="dashboard-field" style={{ gap: 10 }}>
            <span>Lý do hủy</span>
            <select
              id="cancel-reason"
              className="dashboard-select"
              value={cancellationReason}
              onChange={(event) => setCancellationReason(event.target.value)}
            >
              <option value="">Chọn lý do</option>
              <option value="Không còn nhu cầu">Không còn nhu cầu</option>
              <option value="Đặt nhầm sản phẩm">Đặt nhầm sản phẩm</option>
              <option value="Giao hàng chậm">Giao hàng chậm</option>
              <option value="Lý do khác">Lý do khác</option>
            </select>
          </label>
        </Modal.Body>
        <Modal.Footer>
          <button
            type="button"
            className="dashboard-btn dashboard-btn-secondary"
            onClick={() => setShowCancelModal(false)}
          >
            Đóng
          </button>
          <button
            type="button"
            className="dashboard-btn dashboard-btn-danger"
            onClick={handleConfirmCancel}
          >
            Xác nhận hủy
          </button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default Cart;
