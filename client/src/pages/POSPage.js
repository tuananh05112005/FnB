// ==============================================================
// TÊN FILE: POSPage.js
// MÔ TẢ: Hệ thống Bán Hàng Tại Quầy (POS - Point of Sale) dành riêng cho Staff & Admin.
//        - Giao diện Fullscreen cảm ứng tốc độ cao 2 cột (Menu & Hóa đơn).
//        - Responsive 100% trên mọi thiết bị: Desktop, Tablet (iPad), Mobile.
//        - Tối ưu hóa tải ảnh siêu tốc (Cloudinary auto-format/resizing + lazy load).
//        - Nút gạt chế độ "⚡ Quản lý hết món": Bật/tắt trạng thái món (is_available) tức thì.
//        - Tích hợp Thanh toán chuẩn của app:
//          + Tiền mặt (Cash): Nhập tiền khách đưa, tính tiền thừa tự động, hoàn tất 1-chạm.
//          + VietQR SePay: Tạo mã QR động từ backend, tự động bắt webhook/socket & polling khi tiền vào.
//        - In hóa đơn nhiệt K80/K58 trực tiếp chuẩn nhà hàng/quán cafe.
// ==============================================================

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Coffee, Search, Power, Trash2, Plus, Minus, DollarSign,
  QrCode, Printer, LogOut, ArrowLeft, RefreshCw,
  AlertCircle, ShoppingBag, X, Check, Copy, ChevronRight
} from "lucide-react";
import { api } from "../lib/api";
import { getRole, getUserId, clearSession } from "../lib/session";
import { listProducts, updateProductAvailability } from "../services/productService";
import socket from "../lib/socket";
import "../styles/pos.css";

const fmt = (v) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", minimumFractionDigits: 0 }).format(v || 0);

// Tối ưu hóa hình ảnh tải nhanh (nếu là ảnh Cloudinary thì thêm biến đổi nén ảnh/WebP tự động)
const getOptimizedImg = (url, width = 320, height = 240) => {
  if (!url) return "";
  if (typeof url === "string" && url.includes("cloudinary.com") && url.includes("/upload/")) {
    if (!url.includes("/upload/c_")) {
      return url.replace("/upload/", `/upload/c_fill,w_${width},h_${height},f_auto,q_auto/`);
    }
  }
  return url;
};

// Âm thanh thông báo khi thanh toán thành công
const playSuccessSound = () => {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "sine";
    osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    osc.frequency.setValueAtTime(880, ctx.currentTime + 0.12); // A5
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
    osc.start();
    osc.stop(ctx.currentTime + 0.35);
  } catch (e) {
    // Trình duyệt có thể chặn autoplay âm thanh nếu chưa tương tác
  }
};

export default function POSPage() {
  const navigate = useNavigate();
  const userId = getUserId();
  const role = getRole();

  // Dữ liệu sản phẩm & danh mục
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCat, setSelectedCat] = useState("all");
  const [search, setSearch] = useState("");

  // Chế độ: false = Bán hàng thông thường, true = Quản lý hết món (ON/OFF)
  const [isStockMode, setIsStockMode] = useState(false);

  // Giỏ hàng POS
  const [cart, setCart] = useState([]);
  const [serviceType, setServiceType] = useState("takeaway"); // takeaway | dine_in
  const [tableNumber, setTableNumber] = useState("Bàn 01");

  // Drawer giỏ hàng cho Mobile
  const [isMobileCartOpen, setIsMobileCartOpen] = useState(false);

  // Popup thanh toán
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("cash"); // cash | banking
  const [cashGiven, setCashGiven] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [paymentError, setPaymentError] = useState("");
  const [copied, setCopied] = useState(false);

  // Dữ liệu phiên chuyển khoản SePay đang active
  const [activeBanking, setActiveBanking] = useState(null);

  // Dữ liệu hóa đơn in sau khi hoàn tất
  const [paymentSuccessData, setPaymentSuccessData] = useState(null);

  // 1. Tải danh sách món ăn
  const fetchMenu = async () => {
    try {
      const data = await listProducts();
      setProducts(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("Lỗi tải menu POS:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMenu();

    // Xác thực role với Socket.io để nhận sự kiện managers
    if (socket && socket.connected) {
      socket.emit("authenticate", { userId, role });
    }

    // Lắng nghe socket khi có người khác thay đổi trạng thái món
    const handleStatusUpdate = () => fetchMenu();
    socket.on("productAvailabilityChanged", handleStatusUpdate);

    return () => {
      socket.off("productAvailabilityChanged", handleStatusUpdate);
    };
  }, [userId, role]);

  // 2. Danh mục sản phẩm động
  const categories = useMemo(() => {
    const set = new Set();
    products.forEach((p) => {
      if (p.category) set.add(p.category.trim());
    });
    return ["all", ...Array.from(set)];
  }, [products]);

  // 3. Lọc sản phẩm
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchCat = selectedCat === "all" || p.category?.toLowerCase() === selectedCat.toLowerCase();
      const matchSearch =
        !search ||
        p.name?.toLowerCase().includes(search.toLowerCase()) ||
        String(p.id).includes(search);
      return matchCat && matchSearch;
    });
  }, [products, selectedCat, search]);

  // 4. Thao tác bật/tắt món (Quản lý hết hàng)
  const toggleAvailability = async (e, product) => {
    e.stopPropagation();
    try {
      const newStatus = product.is_available === 1 ? 0 : 1;
      await updateProductAvailability(product, newStatus);

      setProducts((prev) =>
        prev.map((p) => (p.id === product.id ? { ...p, is_available: newStatus } : p))
      );

      // Bắn socket cho toàn hệ thống
      if (socket) {
        socket.emit("productAvailabilityChanged", { id: product.id, is_available: newStatus });
      }
    } catch (err) {
      alert("Lỗi cập nhật trạng thái món: " + err.message);
    }
  };

  // 5. Thêm món vào hóa đơn POS
  const addToCart = (product) => {
    if (isStockMode) return;
    if (product.is_available === 0) {
      alert("Món này đang tạm hết hàng!");
      return;
    }

    setCart((prev) => {
      const exist = prev.find((item) => item.product.id === product.id);
      if (exist) {
        return prev.map((item) =>
          item.product.id === product.id ? { ...item, qty: item.qty + 1 } : item
        );
      }
      return [
        ...prev,
        {
          product,
          qty: 1,
          size: product.size || "M",
          sugar: "100%",
          ice: "100%",
          toppings: [],
        },
      ];
    });
  };

  const updateQty = (productId, delta) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.product.id === productId) {
            const newQty = item.qty + delta;
            return newQty > 0 ? { ...item, qty: newQty } : null;
          }
          return item;
        })
        .filter(Boolean)
    );
  };

  const totalAmount = useMemo(() => {
    return cart.reduce((sum, item) => sum + Number(item.product.price || 0) * item.qty, 0);
  }, [cart]);

  const totalQuantity = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.qty, 0);
  }, [cart]);

  // Copy nội dung chuyển khoản
  const handleCopy = (text) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // 6. Xử lý mở thanh toán
  const handleOpenCheckout = async (method) => {
    if (!cart.length) return;
    setPaymentError("");
    setPaymentMethod(method);

    if (method === "cash") {
      setCashGiven(String(totalAmount));
      setActiveBanking(null);
      setShowPaymentModal(true);
    } else if (method === "banking") {
      // Khởi tạo thanh toán VietQR SePay qua backend API
      setSubmitting(true);
      try {
        const orderCode = "DH" + Date.now();

        const currentUserId = parseInt(userId, 10) || 1;
        const firstProductId = cart[0]?.product?.id || cart[0]?.id || 1;

        // 1. Lưu từng món vào bảng giỏ hàng
        for (const item of cart) {
          await api.post("/api/cart/add", {
            user_id: currentUserId,
            product_id: item.product?.id || item.id,
            quantity: item.qty,
            size: item.size || "M",
            order_code: orderCode,
            sugar: item.sugar || "100%",
            ice: item.ice || "100%",
            toppings: JSON.stringify(item.toppings || []),
          });
        }

        // 2. Khởi tạo thanh toán banking SePay sinh QR code
        const payRes = await api.post("/api/payments/create", {
          user_id: currentUserId,
          product_id: firstProductId,
          name: serviceType === "takeaway" ? "Khách mang về (POS)" : `Khách tại ${tableNumber} (POS)`,
          address: "Tại quầy POS",
          phone: "0000000000",
          payment_method: "banking",
          amount: totalAmount,
          order_source: "pos",
          is_cart: true,
          order_code: orderCode,
          generateQR: true,
        });

        const data = payRes.data;
        setActiveBanking({
          paymentId: data.paymentId,
          qrUrl: data.qrUrl,
          transactionCode: data.transactionCode || orderCode,
          transferContent: data.transferContent || `SEVQR ${orderCode}`,
          bankName: data.bankName || "VietinBank",
          bankAccount: data.bankAccount || "101879499413",
          bankCode: data.bankCode || "ICB",
          amount: totalAmount,
          orderCode,
          items: [...cart],
          serviceType,
          tableNumber,
          createdAt: new Date().toLocaleString("vi-VN"),
        });

        setShowPaymentModal(true);
      } catch (err) {
        console.error("Lỗi tạo VietQR SePay:", err);
        setPaymentError(err.response?.data?.message || "Không thể tạo mã VietQR lúc này.");
      } finally {
        setSubmitting(false);
      }
    }
  };

  // 7. Hoàn tất thanh toán thành công (chuyển sang màn in bill)
  const handlePaymentSuccess = useCallback(
    (billInfo) => {
      playSuccessSound();
      setPaymentSuccessData(billInfo);
      setCart([]);
      setActiveBanking(null);
      setShowPaymentModal(false);
      setIsMobileCartOpen(false);
    },
    []
  );

  // 8. Xác nhận thanh toán TIỀN MẶT
  const handleConfirmCashPayment = async () => {
    if (submitting) return;
    setSubmitting(true);
    setPaymentError("");

    try {
      const orderCode = "DH" + Date.now();

      const currentUserId = parseInt(userId, 10) || 1;
      const firstProductId = cart[0]?.product?.id || cart[0]?.id || 1;

      // Lưu món vào giỏ hàng backend
      for (const item of cart) {
        await api.post("/api/cart/add", {
          user_id: currentUserId,
          product_id: item.product?.id || item.id,
          quantity: item.qty,
          size: item.size || "M",
          order_code: orderCode,
          sugar: item.sugar || "100%",
          ice: item.ice || "100%",
          toppings: JSON.stringify(item.toppings || []),
        });
      }

      // Tạo thanh toán tiền mặt với status 'paid'
      await api.post("/api/payments/create", {
        user_id: currentUserId,
        product_id: firstProductId,
        name: serviceType === "takeaway" ? "Khách mang về (POS)" : `Khách tại ${tableNumber} (POS)`,
        address: "Tại quầy POS",
        phone: "0000000000",
        payment_method: "cash",
        amount: totalAmount,
        order_source: "pos",
        is_cart: true,
        order_code: orderCode,
      });

      const billData = {
        orderCode,
        items: [...cart],
        totalAmount,
        paymentMethod: "cash",
        cashGiven: Number(cashGiven) || totalAmount,
        changeDue: Math.max(0, (Number(cashGiven) || totalAmount) - totalAmount),
        serviceType,
        tableNumber,
        createdAt: new Date().toLocaleString("vi-VN"),
      };

      handlePaymentSuccess(billData);
    } catch (err) {
      console.error("Lỗi thanh toán tiền mặt:", err);
      setPaymentError(err.response?.data?.message || "Lỗi xử lý đơn hàng: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // 9. Lắng nghe trạng thái thanh toán SePay (Cả Socket.io lẫn Polling dự phòng)
  useEffect(() => {
    if (!activeBanking?.paymentId) return;

    const paymentId = activeBanking.paymentId;

    // A. Lắng nghe Socket.io real-time
    const handleOrderPaid = (data) => {
      if (Number(data.id) === Number(paymentId)) {
        handlePaymentSuccess({
          orderCode: activeBanking.orderCode,
          items: activeBanking.items,
          totalAmount: activeBanking.amount,
          paymentMethod: "banking",
          serviceType: activeBanking.serviceType,
          tableNumber: activeBanking.tableNumber,
          createdAt: activeBanking.createdAt,
          transactionCode: activeBanking.transactionCode,
        });
      }
    };

    socket.on("orderPaid", handleOrderPaid);
    socket.on("orderPaidCustomer", handleOrderPaid);

    // B. Polling tự động mỗi 2.5 giây dự phòng
    const timer = setInterval(async () => {
      try {
        const res = await api.get(`/api/payments/status/${paymentId}`);
        if (res.data?.payment_status === "paid") {
          clearInterval(timer);
          handlePaymentSuccess({
            orderCode: activeBanking.orderCode,
            items: activeBanking.items,
            totalAmount: activeBanking.amount,
            paymentMethod: "banking",
            serviceType: activeBanking.serviceType,
            tableNumber: activeBanking.tableNumber,
            createdAt: activeBanking.createdAt,
            transactionCode: activeBanking.transactionCode,
          });
        }
      } catch (e) {
        // Polling error silently handled
      }
    }, 2500);

    return () => {
      clearInterval(timer);
      socket.off("orderPaid", handleOrderPaid);
      socket.off("orderPaidCustomer", handleOrderPaid);
    };
  }, [activeBanking, handlePaymentSuccess]);

  // 10. Hủy phiên SePay để đổi sang phương thức khác
  const handleCancelBanking = async () => {
    if (!activeBanking?.paymentId) {
      setShowPaymentModal(false);
      return;
    }
    try {
      await api.post(`/api/payments/${activeBanking.paymentId}/cancel`, { user_id: userId || 1 });
    } catch (e) {
      // Nếu đã trả tiền thì không hủy
    } finally {
      setActiveBanking(null);
      setShowPaymentModal(false);
    }
  };

  // 11. In hóa đơn nhiệt
  const handlePrint = () => {
    window.print();
  };

  const handleLogout = () => {
    clearSession();
    navigate("/login");
  };

  return (
    <div className="pos-container">
      {/* ── CỘT TRÁI: MENU VÀ BẬT/TẮT MÓN ── */}
      <div className="pos-menu-area">
        {/* Topbar */}
        <div className="pos-topbar">
          <div className="pos-brand">
            <div className="pos-brand-logo">PR</div>
            <div className="pos-brand-text">
              <h1 className="pos-brand-title">PRDRINK POS</h1>
              <p className="pos-brand-sub">Bán hàng & Quản lý quầy</p>
            </div>
          </div>

          <div className="pos-topbar-actions">
            {/* Nút bật/tắt quản lý hết món */}
            <button
              type="button"
              className={`pos-mode-btn ${isStockMode ? "stock-active" : "normal"}`}
              onClick={() => setIsStockMode((v) => !v)}
              title="Bật chế độ đánh dấu món hết hàng"
            >
              <Power size={15} />
              <span className="pos-btn-text">
                {isStockMode ? "CHẾ ĐỘ TẮT MÓN" : "⚡ Quản lý hết món"}
              </span>
            </button>

            {role === "admin" && (
              <button
                type="button"
                className="pos-mode-btn normal pos-admin-btn"
                onClick={() => navigate("/orders")}
                title="Quay lại Admin Dashboard"
              >
                <ArrowLeft size={14} />
                <span className="pos-btn-text">Admin</span>
              </button>
            )}

            <div className="pos-user-badge">
              <span className="pos-user-role">
                👤 {role === "admin" ? "Quản lý" : "Nhân viên"}
              </span>
              <button
                type="button"
                className="pos-logout-btn"
                onClick={handleLogout}
                title="Đăng xuất"
              >
                <LogOut size={15} />
              </button>
            </div>
          </div>
        </div>

        {/* Search & Filter */}
        <div className="pos-filter-bar">
          <div className="pos-search-box">
            <Search size={16} className="pos-search-icon" />
            <input
              className="pos-search-input"
              placeholder="Tìm nhanh tên hoặc mã món..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button
                type="button"
                className="pos-search-clear"
                onClick={() => setSearch("")}
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Danh mục */}
        <div className="pos-categories-tabs">
          {categories.map((c) => (
            <button
              key={c}
              type="button"
              className={`pos-cat-tab ${selectedCat === c ? "active" : ""}`}
              onClick={() => setSelectedCat(c)}
            >
              {c === "all" ? "Tất cả món" : c}
            </button>
          ))}
        </div>

        {/* Lưới sản phẩm */}
        <div className="pos-product-grid">
          {loading ? (
            <div className="pos-loading-state">
              <RefreshCw size={28} className="pos-spinner" />
              <span>Đang tải thực đơn...</span>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="pos-empty-products">
              <Coffee size={36} />
              <span>Không tìm thấy món ăn phù hợp</span>
            </div>
          ) : (
            filteredProducts.map((p) => {
              const isSoldOut = p.is_available === 0;
              const optimizedUrl = getOptimizedImg(p.image, 320, 240);

              return (
                <div
                  key={p.id}
                  className={`pos-card ${isSoldOut ? "sold-out" : ""}`}
                  onClick={() => addToCart(p)}
                >
                  <div className="pos-card-img-wrap">
                    {optimizedUrl ? (
                      <img
                        src={optimizedUrl}
                        alt={p.name}
                        className="pos-card-img"
                        loading="lazy"
                        decoding="async"
                        onError={(e) => {
                          e.target.style.display = "none";
                          if (e.target.nextElementSibling) {
                            e.target.nextElementSibling.style.display = "flex";
                          }
                        }}
                      />
                    ) : null}

                    {/* Fallback icon nếu không có ảnh hoặc ảnh lỗi */}
                    <div
                      className="pos-card-img-placeholder"
                      style={{ display: optimizedUrl ? "none" : "flex" }}
                    >
                      <Coffee size={28} />
                    </div>

                    {isSoldOut && <div className="pos-soldout-tag">HẾT MÓN</div>}
                  </div>

                  <div className="pos-card-body">
                    <h3 className="pos-card-name" title={p.name}>
                      {p.name}
                    </h3>
                    <div className="pos-card-price">{fmt(p.price)}</div>
                  </div>

                  {/* Nút bật/tắt nếu đang ở chế độ Quản lý hết món */}
                  {isStockMode && (
                    <div className="pos-toggle-overlay">
                      <span
                        style={{
                          fontSize: "0.75rem",
                          fontWeight: 700,
                          color: isSoldOut ? "#EF4444" : "#10B981",
                        }}
                      >
                        {isSoldOut ? "Đang tạm tắt" : "Đang mở bán"}
                      </span>
                      <button
                        type="button"
                        className={`pos-toggle-btn ${isSoldOut ? "btn-enable" : "btn-disable"}`}
                        onClick={(e) => toggleAvailability(e, p)}
                      >
                        <Power size={13} /> {isSoldOut ? "Bật mở lại" : "Tắt hết món"}
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ── CỘT PHẢI: HÓA ĐƠN & THANH TOÁN (Hỗ trợ Drawer trên Mobile) ── */}
      <div className={`pos-bill-area ${isMobileCartOpen ? "pos-bill-mobile-open" : ""}`}>
        <div className="pos-bill-header">
          <div className="pos-bill-title-wrap">
            <h2 className="pos-bill-title">Hóa đơn hiện tại</h2>
            <span className="pos-bill-badge">{totalQuantity} ly</span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {cart.length > 0 && (
              <button
                type="button"
                className="pos-bill-clear-btn"
                onClick={() => setCart([])}
                title="Xóa toàn bộ hóa đơn"
              >
                <Trash2 size={14} /> Xóa hết
              </button>
            )}

            {/* Nút đóng bill trên Mobile */}
            <button
              type="button"
              className="pos-bill-close-mobile"
              onClick={() => setIsMobileCartOpen(false)}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Phân loại: Mang về / Dùng tại bàn */}
        <div className="pos-service-types">
          <button
            type="button"
            className={`pos-type-btn ${serviceType === "takeaway" ? "active" : ""}`}
            onClick={() => setServiceType("takeaway")}
          >
            🥡 Mang về
          </button>
          <button
            type="button"
            className={`pos-type-btn ${serviceType === "dine_in" ? "active" : ""}`}
            onClick={() => setServiceType("dine_in")}
          >
            🍽️ Dùng tại bàn
          </button>
        </div>

        {serviceType === "dine_in" && (
          <div className="pos-table-select-row">
            <span style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.6)" }}>Số bàn:</span>
            <select
              className="pos-table-select"
              value={tableNumber}
              onChange={(e) => setTableNumber(e.target.value)}
            >
              <option value="Bàn 01">Bàn 01</option>
              <option value="Bàn 02">Bàn 02</option>
              <option value="Bàn 03">Bàn 03</option>
              <option value="Bàn 04">Bàn 04</option>
              <option value="Bàn 05">Bàn 05</option>
              <option value="Bàn VIP">Bàn VIP</option>
            </select>
          </div>
        )}

        {/* Danh sách món đang chọn */}
        <div className="pos-order-items">
          {cart.length === 0 ? (
            <div className="pos-empty-cart">
              <Coffee size={40} />
              <span>Chưa có món nào trong hóa đơn</span>
              <span style={{ fontSize: "0.75rem", opacity: 0.7 }}>
                Chạm vào món ăn ở menu để thêm
              </span>
            </div>
          ) : (
            cart.map((item) => (
              <div key={item.product.id} className="pos-order-item">
                <div className="pos-item-header">
                  <div>
                    <h4 className="pos-item-name">{item.product.name}</h4>
                    <p className="pos-item-meta">
                      Size: {item.size} · Đơn giá: {fmt(item.product.price)}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="pos-item-del-btn"
                    onClick={() => updateQty(item.product.id, -item.qty)}
                    title="Xóa món này"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>

                <div className="pos-item-footer">
                  <div className="pos-qty-control">
                    <button
                      type="button"
                      className="pos-qty-btn"
                      onClick={() => updateQty(item.product.id, -1)}
                    >
                      <Minus size={13} />
                    </button>
                    <span className="pos-qty-num">{item.qty}</span>
                    <button
                      type="button"
                      className="pos-qty-btn"
                      onClick={() => updateQty(item.product.id, 1)}
                    >
                      <Plus size={13} />
                    </button>
                  </div>
                  <div className="pos-item-price">
                    {fmt(Number(item.product.price) * item.qty)}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Tổng tiền & Cụm nút thanh toán */}
        <div className="pos-bill-summary">
          <div className="pos-sum-row">
            <span>Số lượng món:</span>
            <strong>{totalQuantity} ly/phần</strong>
          </div>
          <div className="pos-sum-total">
            <span>TỔNG TIỀN:</span>
            <span>{fmt(totalAmount)}</span>
          </div>
        </div>

        <div className="pos-checkout-actions">
          <button
            type="button"
            className="pos-pay-btn pos-pay-cash"
            disabled={!cart.length || submitting}
            onClick={() => handleOpenCheckout("cash")}
          >
            <DollarSign size={18} /> Tiền Mặt
          </button>
          <button
            type="button"
            className="pos-pay-btn pos-pay-qr"
            disabled={!cart.length || submitting}
            onClick={() => handleOpenCheckout("banking")}
          >
            <QrCode size={18} /> VietQR SePay
          </button>
        </div>
      </div>

      {/* ── FLOATING CART BAR CHO MOBILE KHI CÓ MÓN ── */}
      {cart.length > 0 && !isMobileCartOpen && (
        <div
          className="pos-mobile-cart-bar"
          onClick={() => setIsMobileCartOpen(true)}
        >
          <div className="pos-mobile-cart-info">
            <div className="pos-mobile-cart-badge">
              <ShoppingBag size={18} />
              <span>{totalQuantity}</span>
            </div>
            <div>
              <div style={{ fontSize: "0.75rem", opacity: 0.8 }}>Hóa đơn hiện tại</div>
              <strong style={{ fontSize: "1.05rem", color: "#F5C842" }}>
                {fmt(totalAmount)}
              </strong>
            </div>
          </div>
          <button type="button" className="pos-mobile-cart-action">
            Xem hóa đơn <ChevronRight size={16} />
          </button>
        </div>
      )}

      {/* ── MODAL 1: THANH TOÁN TIỀN MẶT (CASH) ── */}
      {showPaymentModal && paymentMethod === "cash" && !paymentSuccessData && (
        <div className="pos-modal-overlay">
          <div className="pos-modal-box">
            <div className="pos-modal-header">
              <h3 className="pos-modal-title">💵 Thu tiền mặt tại quầy</h3>
              <button
                type="button"
                className="pos-modal-close"
                onClick={() => setShowPaymentModal(false)}
              >
                <X size={18} />
              </button>
            </div>

            {paymentError && (
              <div className="pos-modal-error">
                <AlertCircle size={15} /> {paymentError}
              </div>
            )}

            <div className="pos-cash-details">
              <div className="pos-cash-row">
                <span style={{ color: "rgba(255,255,255,0.7)" }}>Tổng tiền cần thu:</span>
                <strong style={{ fontSize: "1.25rem", color: "#F5C842" }}>
                  {fmt(totalAmount)}
                </strong>
              </div>

              <div style={{ marginTop: 14 }}>
                <label className="pos-cash-label">Khách đưa (VNĐ):</label>
                <input
                  type="number"
                  className="pos-cash-input"
                  placeholder="Nhập số tiền..."
                  value={cashGiven}
                  onChange={(e) => setCashGiven(e.target.value)}
                  autoFocus
                />
              </div>

              {/* Nút bấm nhanh mệnh giá tiền */}
              <div className="pos-quick-money-grid">
                {[totalAmount, 50000, 100000, 200000, 500000].map((val) => (
                  <button
                    key={val}
                    type="button"
                    className="pos-quick-money-btn"
                    onClick={() => setCashGiven(String(val))}
                  >
                    {val === totalAmount ? "Đủ tiền" : val >= 1000 ? `${val / 1000}k` : val}
                  </button>
                ))}
              </div>

              <div className="pos-change-row">
                <span>Tiền thừa trả khách:</span>
                <strong
                  style={{
                    color: Number(cashGiven) >= totalAmount ? "#10B981" : "#EF4444",
                    fontSize: "1.2rem",
                  }}
                >
                  {fmt(Math.max(0, (Number(cashGiven) || 0) - totalAmount))}
                </strong>
              </div>
            </div>

            <div className="pos-modal-actions">
              <button
                type="button"
                className="pos-modal-btn btn-cancel"
                onClick={() => setShowPaymentModal(false)}
                disabled={submitting}
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                className="pos-modal-btn btn-confirm"
                disabled={submitting || Number(cashGiven) < totalAmount}
                onClick={handleConfirmCashPayment}
              >
                {submitting ? "Đang xử lý..." : "Xác nhận & Hoàn tất"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL 2: THANH TOÁN VIETQR SEPAY ĐỘNG TẠI QUẦY ── */}
      {showPaymentModal && paymentMethod === "banking" && !paymentSuccessData && (
        <div className="pos-modal-overlay">
          <div className="pos-modal-box pos-qr-box">
            <div className="pos-modal-header">
              <h3 className="pos-modal-title">📲 Quét mã VietQR SePay</h3>
              <button
                type="button"
                className="pos-modal-close"
                onClick={handleCancelBanking}
              >
                <X size={18} />
              </button>
            </div>

            {paymentError ? (
              <div className="pos-modal-error">
                <AlertCircle size={15} /> {paymentError}
              </div>
            ) : null}

            {activeBanking?.qrUrl ? (
              <div className="pos-qr-content">
                {/* Khung quét QR sắc nét */}
                <div className="pos-qr-img-frame">
                  <img
                    src={activeBanking.qrUrl}
                    alt="VietQR SePay"
                    className="pos-qr-img"
                  />
                  <div className="pos-qr-scan-line" />
                </div>

                {/* Thông tin chuyển khoản */}
                <div className="pos-qr-info-box">
                  <div className="pos-qr-info-row">
                    <span>Số tiền:</span>
                    <strong style={{ color: "#F5C842", fontSize: "1.1rem" }}>
                      {fmt(activeBanking.amount)}
                    </strong>
                  </div>
                  <div className="pos-qr-info-row">
                    <span>Ngân hàng:</span>
                    <strong>{activeBanking.bankName} ({activeBanking.bankCode})</strong>
                  </div>
                  <div className="pos-qr-info-row">
                    <span>Số tài khoản:</span>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <strong style={{ fontFamily: "monospace" }}>
                        {activeBanking.bankAccount}
                      </strong>
                      <button
                        type="button"
                        className="pos-copy-btn"
                        onClick={() => handleCopy(activeBanking.bankAccount)}
                        title="Sao chép số TK"
                      >
                        {copied ? <Check size={12} /> : <Copy size={12} />}
                      </button>
                    </div>
                  </div>
                  <div className="pos-qr-info-row">
                    <span>Nội dung CK:</span>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <strong style={{ fontFamily: "monospace", color: "#10B981" }}>
                        {activeBanking.transferContent}
                      </strong>
                      <button
                        type="button"
                        className="pos-copy-btn"
                        onClick={() => handleCopy(activeBanking.transferContent)}
                        title="Sao chép nội dung"
                      >
                        {copied ? <Check size={12} /> : <Copy size={12} />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Radar chỉ báo đang lắng nghe SePay */}
                <div className="pos-radar-status">
                  <div className="pos-radar-dot" />
                  <span>Hệ thống đang tự động nhận diện thanh toán từ ngân hàng...</span>
                </div>
              </div>
            ) : (
              <div style={{ textAlign: "center", padding: "40px 0" }}>
                <RefreshCw size={32} className="pos-spinner" />
                <p style={{ marginTop: 12, fontSize: "0.9rem", color: "rgba(255,255,255,0.7)" }}>
                  Đang khởi tạo mã VietQR SePay...
                </p>
              </div>
            )}

            <div className="pos-modal-actions" style={{ marginTop: 16 }}>
              <button
                type="button"
                className="pos-modal-btn btn-cancel"
                onClick={handleCancelBanking}
              >
                Hủy / Đổi sang Tiền mặt
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL 3: IN HÓA ĐƠN KHI HOÀN TẤT (CHUẨN BILL NHIỆT K80/K58) ── */}
      {paymentSuccessData && (
        <div className="pos-modal-overlay">
          <div className="pos-receipt-wrapper">
            {/* Vùng in hóa đơn - có class receipt-printable */}
            <div className="pos-receipt-card receipt-printable">
              <div className="pos-receipt-header">
                <h2 className="pos-receipt-brand">PRDRINK CAFE & TEA</h2>
                <p className="pos-receipt-subtitle">HÓA ĐƠN BÁN LẺ (BILL)</p>
                <div className="pos-receipt-meta">
                  <div>Mã đơn: <strong>{paymentSuccessData.orderCode}</strong></div>
                  <div>Thời gian: {paymentSuccessData.createdAt}</div>
                  <div style={{ fontWeight: 800, marginTop: 2 }}>
                    {paymentSuccessData.serviceType === "takeaway"
                      ? "[ MANG VỀ ]"
                      : `[ ${paymentSuccessData.tableNumber} ]`}
                  </div>
                </div>
              </div>

              <div className="pos-receipt-items">
                {paymentSuccessData.items.map((i, idx) => (
                  <div key={idx} className="pos-receipt-item-row">
                    <div style={{ flex: 1 }}>
                      <div>{i.product.name}</div>
                      <div style={{ fontSize: "0.75rem", color: "#666" }}>
                        {i.qty} x {fmt(i.product.price)} (Size {i.size})
                      </div>
                    </div>
                    <strong>{fmt(Number(i.product.price) * i.qty)}</strong>
                  </div>
                ))}
              </div>

              <div className="pos-receipt-summary">
                <div className="pos-receipt-sum-row">
                  <span>Tổng tiền:</span>
                  <strong style={{ fontSize: "1.1rem" }}>
                    {fmt(paymentSuccessData.totalAmount)}
                  </strong>
                </div>
                <div className="pos-receipt-sum-row">
                  <span>Phương thức:</span>
                  <strong>
                    {paymentSuccessData.paymentMethod === "cash"
                      ? "Tiền mặt tại quầy"
                      : "VietQR SePay (CK)"}
                  </strong>
                </div>

                {paymentSuccessData.paymentMethod === "cash" && (
                  <>
                    <div className="pos-receipt-sum-row">
                      <span>Tiền khách đưa:</span>
                      <span>{fmt(paymentSuccessData.cashGiven)}</span>
                    </div>
                    <div className="pos-receipt-sum-row">
                      <span>Tiền thừa trả khách:</span>
                      <strong>{fmt(paymentSuccessData.changeDue)}</strong>
                    </div>
                  </>
                )}
              </div>

              <div className="pos-receipt-footer">
                <p>Cảm ơn quý khách & Hẹn gặp lại!</p>
                <p style={{ fontSize: "0.7rem", color: "#888", marginTop: 2 }}>
                  Wifi: PRDrink_Guest · Pass: 88888888
                </p>
              </div>
            </div>

            {/* Các nút bấm điều khiển (Ẩn đi khi in) */}
            <div className="pos-receipt-actions no-print">
              <button
                type="button"
                className="pos-receipt-btn btn-print"
                onClick={handlePrint}
              >
                <Printer size={16} /> In Bill
              </button>
              <button
                type="button"
                className="pos-receipt-btn btn-new"
                onClick={() => {
                  setPaymentSuccessData(null);
                  setShowPaymentModal(false);
                }}
              >
                Tạo Đơn Mới
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}