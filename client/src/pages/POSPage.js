// ==============================================================
// TÊN FILE: POSPage.js
// MÔ TẢ: Hệ thống Bán Hàng Tại Quầy (POS - Point of Sale) dành riêng cho Staff & Admin.
//        - Giao diện Fullscreen cảm ứng tốc độ cao 2 cột (Menu & Hóa đơn).
//        - Nút gạt chế độ "⚡ Quản lý hết món": Bật/tắt trạng thái món (is_available) tức thì khi hết hàng.
//        - Order nhanh 1-chạm (chọn size, chọn topping).
//        - Thanh toán Tiền mặt (tự động tính tiền thừa) & Quét VietQR SePay tại quầy.
//        - In hóa đơn nhiệt K80/K58 trực tiếp từ trình duyệt.
// ==============================================================

import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Coffee, Search, Power, Trash2, Plus, Minus, DollarSign,
  QrCode, Printer, CheckCircle, LogOut, ArrowLeft, RefreshCw, AlertCircle
} from "lucide-react";
import { api } from "../lib/api";
import { getRole, getUserId, clearSession } from "../lib/session";
import { listProducts, updateProductAvailability } from "../services/productService";
import socket from "../lib/socket";
import "../styles/pos.css";

const fmt = (v) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", minimumFractionDigits: 0 }).format(v || 0);

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

  // Popup thanh toán
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("cash"); // cash | banking
  const [cashGiven, setCashGiven] = useState("");
  const [payingOrder, setPayingOrder] = useState(null);
  const [submitting, setSubmitting] = useState(false);
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

    // Lắng nghe socket khi có người khác thay đổi trạng thái món
    const handleStatusUpdate = () => fetchMenu();
    socket.on("productAvailabilityChanged", handleStatusUpdate);
    return () => socket.off("productAvailabilityChanged", handleStatusUpdate);
  }, []);

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
      const matchSearch = !search || p.name?.toLowerCase().includes(search.toLowerCase()) || String(p.id).includes(search);
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
      return [...prev, { product, qty: 1, size: product.size || "M", sugar: "100%", ice: "100%", toppings: [] }];
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

  // 6. Xử lý mở thanh toán
  const handleOpenCheckout = (method) => {
    if (!cart.length) return;
    setPaymentMethod(method);
    setCashGiven(String(totalAmount));
    setShowPaymentModal(true);
  };

  // 7. Hoàn tất thanh toán
  const handleCompleteOrder = async () => {
    setSubmitting(true);
    try {
      const orderCode = "POS" + Date.now().toString().slice(-6);

      // Thêm từng món vào cart backend
      for (const item of cart) {
        await api.post("/api/cart/add", {
          user_id: userId || 1,
          product_id: item.product.id,
          quantity: item.qty,
          size: item.size,
          order_code: orderCode,
          sugar: item.sugar,
          ice: item.ice,
          toppings: JSON.stringify(item.toppings || []),
        });
      }

      // Tạo thanh toán
      const payRes = await api.post("/api/payments", {
        user_id: userId || 1,
        order_code: orderCode,
        amount: totalAmount,
        payment_method: paymentMethod,
        name: serviceType === "takeaway" ? "Khách mang về" : `Khách tại ${tableNumber}`,
        address: "Tại quầy POS",
        phone: "0000000000",
        order_source: "pos",
        payment_status: paymentMethod === "cash" ? "paid" : "pending",
      });

      const billData = {
        orderCode,
        items: [...cart],
        totalAmount,
        paymentMethod,
        cashGiven: Number(cashGiven) || totalAmount,
        changeDue: Math.max(0, (Number(cashGiven) || totalAmount) - totalAmount),
        serviceType,
        tableNumber,
        createdAt: new Date().toLocaleString("vi-VN"),
      };

      setPaymentSuccessData(billData);
      setCart([]);
    } catch (err) {
      alert("Lỗi xử lý đơn hàng: " + (err.response?.data?.message || err.message));
    } finally {
      setSubmitting(false);
    }
  };

  // 8. In hóa đơn nhiệt
  const handlePrint = () => {
    window.print();
  };

  const handleLogout = () => {
    clearSession();
    navigate("/login");
  };

  return (
    <div className="pos-container">
      {/* ── CỘT TRÁI (65%): MENU VÀ BẬT/TẮT MÓN ── */}
      <div className="pos-menu-area">
        {/* Topbar */}
        <div className="pos-topbar">
          <div className="pos-brand">
            <div className="pos-brand-logo">PR</div>
            <div>
              <h1 className="pos-brand-title">PRDRINK POS</h1>
              <p className="pos-brand-sub">Hệ thống bán hàng tại quầy</p>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {/* Nút bật/tắt quản lý hết món */}
            <button
              type="button"
              className={`pos-mode-btn ${isStockMode ? "stock-active" : "normal"}`}
              onClick={() => setIsStockMode((v) => !v)}
              title="Bật chế độ đánh dấu món hết hàng"
            >
              <Power size={15} />
              {isStockMode ? "ĐANG Ở CHẾ ĐỘ TẮT MÓN" : "⚡ Quản lý hết món"}
            </button>

            {role === "admin" && (
              <button
                type="button"
                className="pos-mode-btn normal"
                onClick={() => navigate("/orders")}
              >
                <ArrowLeft size={14} /> Về Admin
              </button>
            )}

            <div className="pos-user-badge">
              <span>👤 {role === "admin" ? "Quản lý" : "Nhân viên (Staff)"}</span>
              <button type="button" className="pos-logout-btn" onClick={handleLogout} title="Đăng xuất">
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
          {filteredProducts.map((p) => {
            const isSoldOut = p.is_available === 0;
            return (
              <div
                key={p.id}
                className={`pos-card ${isSoldOut ? "sold-out" : ""}`}
                onClick={() => addToCart(p)}
              >
                <div className="pos-card-img-wrap">
                  {p.image ? (
                    <img src={p.image} alt={p.name} className="pos-card-img" />
                  ) : (
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "#666" }}>
                      <Coffee size={32} />
                    </div>
                  )}
                  {isSoldOut && <div className="pos-soldout-tag">HẾT MÓN</div>}
                </div>

                <div className="pos-card-body">
                  <h3 className="pos-card-name">{p.name}</h3>
                  <div className="pos-card-price">{fmt(p.price)}</div>
                </div>

                {/* Nếu đang ở chế độ Quản lý hết món */}
                {isStockMode && (
                  <div className="pos-toggle-overlay">
                    <span style={{ fontSize: "0.75rem", fontWeight: 700, color: isSoldOut ? "#EF4444" : "#10B981" }}>
                      {isSoldOut ? "Đang tạm tắt" : "Đang mở bán"}
                    </span>
                    <button
                      type="button"
                      className={`pos-toggle-btn ${isSoldOut ? "btn-enable" : "btn-disable"}`}
                      onClick={(e) => toggleAvailability(e, p)}
                    >
                      <Power size={14} /> {isSoldOut ? "Bật mở lại" : "Tắt hết món"}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── CỘT PHẢI (35%): HÓA ĐƠN & THANH TOÁN ── */}
      <div className="pos-bill-area">
        <div className="pos-bill-header">
          <h2 className="pos-bill-title">Hóa đơn hiện tại</h2>
          {cart.length > 0 && (
            <button
              type="button"
              style={{ background: "transparent", border: "none", color: "#EF4444", cursor: "pointer", fontSize: "0.8rem", display: "flex", alignItems: "center", gap: 4 }}
              onClick={() => setCart([])}
            >
              <Trash2 size={13} /> Xóa tất cả
            </button>
          )}
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
          <div style={{ padding: "8px 20px", display: "flex", gap: 8, alignItems: "center", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            <span style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.6)" }}>Số bàn:</span>
            <select
              style={{ background: "#251C14", color: "#F5C842", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 6, padding: "4px 10px", fontSize: "0.85rem", fontWeight: 700 }}
              value={tableNumber}
              onChange={(e) => setTableNumber(e.target.value)}
            >
              <option value="Bàn 01">Bàn 01</option>
              <option value="Bàn 02">Bàn 02</option>
              <option value="Bàn 03">Bàn 03</option>
              <option value="Bàn 04">Bàn 04</option>
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
              <span style={{ fontSize: "0.75rem" }}>Chạm vào món ăn bên trái để thêm</span>
            </div>
          ) : (
            cart.map((item) => (
              <div key={item.product.id} className="pos-order-item">
                <div className="pos-item-header">
                  <div>
                    <h4 className="pos-item-name">{item.product.name}</h4>
                    <p className="pos-item-meta">Size: {item.size}</p>
                  </div>
                  <button
                    type="button"
                    style={{ background: "transparent", border: "none", color: "#888", cursor: "pointer" }}
                    onClick={() => updateQty(item.product.id, -item.qty)}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>

                <div className="pos-item-footer">
                  <div className="pos-qty-control">
                    <button type="button" className="pos-qty-btn" onClick={() => updateQty(item.product.id, -1)}>
                      <Minus size={12} />
                    </button>
                    <span className="pos-qty-num">{item.qty}</span>
                    <button type="button" className="pos-qty-btn" onClick={() => updateQty(item.product.id, 1)}>
                      <Plus size={12} />
                    </button>
                  </div>
                  <div className="pos-item-price">{fmt(Number(item.product.price) * item.qty)}</div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Tổng tiền & Cụm nút thanh toán */}
        <div className="pos-bill-summary">
          <div className="pos-sum-row">
            <span>Số lượng món:</span>
            <span>{cart.reduce((s, i) => s + i.qty, 0)} ly/phần</span>
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
            disabled={!cart.length}
            onClick={() => handleOpenCheckout("cash")}
          >
            <DollarSign size={18} /> Tiền Mặt
          </button>
          <button
            type="button"
            className="pos-pay-btn pos-pay-qr"
            disabled={!cart.length}
            onClick={() => handleOpenCheckout("banking")}
          >
            <QrCode size={18} /> VietQR SePay
          </button>
        </div>
      </div>

      {/* ── MODAL THANH TOÁN TIỀN MẶT / SEPAY ── */}
      {showPaymentModal && !paymentSuccessData && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999 }}>
          <div style={{ background: "#201711", border: "1px solid rgba(245,200,66,0.3)", borderRadius: 16, padding: 24, width: 440, maxWidth: "90vw" }}>
            <h3 style={{ margin: "0 0 16px", color: "#F5C842", fontSize: "1.2rem" }}>
              Thanh toán: {paymentMethod === "cash" ? "Tiền mặt tại quầy" : "Chuyển khoản VietQR SePay"}
            </h3>

            <div style={{ background: "#140E0A", padding: 14, borderRadius: 10, marginBottom: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span>Tổng cần thu:</span>
                <strong style={{ fontSize: "1.1rem", color: "#F5C842" }}>{fmt(totalAmount)}</strong>
              </div>

              {paymentMethod === "cash" && (
                <>
                  <div style={{ marginTop: 12 }}>
                    <label style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.7)", display: "block", marginBottom: 4 }}>
                      Khách đưa (VNĐ):
                    </label>
                    <input
                      type="number"
                      style={{ width: "100%", height: 42, background: "#251C14", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 8, color: "white", padding: "0 12px", fontSize: "1.1rem", fontWeight: 800 }}
                      value={cashGiven}
                      onChange={(e) => setCashGiven(e.target.value)}
                    />
                  </div>

                  {/* Nút bấm nhanh mệnh giá tiền */}
                  <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                    {[totalAmount, 50000, 100000, 200000, 500000].map((val) => (
                      <button
                        key={val}
                        type="button"
                        style={{ flex: 1, padding: "6px 0", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 6, color: "white", fontSize: "0.72rem", cursor: "pointer" }}
                        onClick={() => setCashGiven(String(val))}
                      >
                        {val >= 1000 ? `${val / 1000}k` : val}
                      </button>
                    ))}
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: 14, paddingTop: 10, borderTop: "1px dashed rgba(255,255,255,0.15)" }}>
                    <span>Tiền thừa trả khách:</span>
                    <strong style={{ color: Number(cashGiven) >= totalAmount ? "#10B981" : "#EF4444", fontSize: "1.1rem" }}>
                      {fmt(Math.max(0, (Number(cashGiven) || 0) - totalAmount))}
                    </strong>
                  </div>
                </>
              )}

              {paymentMethod === "banking" && (
                <div style={{ textAlign: "center", padding: "16px 0" }}>
                  <img
                    src={`https://qr.sepay.vn/img?acc=102874136936&bank=VietinBank&amount=${totalAmount}&des=POS${Date.now().toString().slice(-6)}`}
                    alt="VietQR"
                    style={{ width: 180, height: 180, borderRadius: 10, background: "white", padding: 6 }}
                  />
                  <p style={{ margin: "10px 0 0", fontSize: "0.8rem", color: "rgba(255,255,255,0.7)" }}>
                    Đưa mã QR cho khách quét chuyển khoản
                  </p>
                </div>
              )}
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <button
                type="button"
                style={{ flex: 1, padding: 12, background: "rgba(255,255,255,0.1)", border: "none", borderRadius: 8, color: "white", cursor: "pointer", fontWeight: 700 }}
                onClick={() => setShowPaymentModal(false)}
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                style={{ flex: 1, padding: 12, background: "#10B981", border: "none", borderRadius: 8, color: "white", cursor: "pointer", fontWeight: 800 }}
                disabled={submitting || (paymentMethod === "cash" && Number(cashGiven) < totalAmount)}
                onClick={handleCompleteOrder}
              >
                {submitting ? "Đang xử lý..." : "Xác nhận & Thu tiền"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL IN HÓA ĐƠN KHI HOÀN TẤT ── */}
      {paymentSuccessData && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999 }}>
          <div style={{ background: "white", color: "#111", borderRadius: 12, padding: 24, width: 360, maxWidth: "90vw", fontFamily: "monospace" }}>
            <div style={{ textAlign: "center", borderBottom: "1px dashed #aaa", paddingBottom: 10, marginBottom: 12 }}>
              <h2 style={{ margin: "0 0 4px", fontSize: "1.3rem", fontWeight: 900 }}>PRDRINK CAFE</h2>
              <p style={{ margin: 0, fontSize: "0.75rem", color: "#555" }}>HÓA ĐƠN THANH TOÁN (BILL)</p>
              <p style={{ margin: "4px 0 0", fontSize: "0.75rem" }}>Mã: {paymentSuccessData.orderCode} · {paymentSuccessData.createdAt}</p>
              <p style={{ margin: "2px 0 0", fontSize: "0.75rem", fontWeight: 700 }}>
                {paymentSuccessData.serviceType === "takeaway" ? "[ MANG VỀ ]" : `[ ${paymentSuccessData.tableNumber} ]`}
              </p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 12, borderBottom: "1px dashed #aaa", paddingBottom: 10 }}>
              {paymentSuccessData.items.map((i, idx) => (
                <div key={idx} style={{ display: "flex", justifyContent: "space-between", fontSize: "0.82rem" }}>
                  <span>{i.qty}x {i.product.name}</span>
                  <strong>{fmt(Number(i.product.price) * i.qty)}</strong>
                </div>
              ))}
            </div>

            <div style={{ fontSize: "0.85rem", display: "flex", flexDirection: "column", gap: 4, marginBottom: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Tổng tiền:</span>
                <strong style={{ fontSize: "1.05rem" }}>{fmt(paymentSuccessData.totalAmount)}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Phương thức:</span>
                <span>{paymentSuccessData.paymentMethod === "cash" ? "Tiền mặt" : "VietQR Banking"}</span>
              </div>
              {paymentSuccessData.paymentMethod === "cash" && (
                <>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>Khách đưa:</span>
                    <span>{fmt(paymentSuccessData.cashGiven)}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>Tiền thừa:</span>
                    <strong>{fmt(paymentSuccessData.changeDue)}</strong>
                  </div>
                </>
              )}
            </div>

            <div style={{ textAlign: "center", fontSize: "0.75rem", color: "#666", marginBottom: 16 }}>
              Cảm ơn quý khách & Hẹn gặp lại!
            </div>

            <div style={{ display: "flex", gap: 8 }}>
              <button
                type="button"
                style={{ flex: 1, padding: 10, background: "#2563EB", color: "white", border: "none", borderRadius: 6, cursor: "pointer", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
                onClick={handlePrint}
              >
                <Printer size={16} /> In Bill
              </button>
              <button
                type="button"
                style={{ flex: 1, padding: 10, background: "#10B981", color: "white", border: "none", borderRadius: 6, cursor: "pointer", fontWeight: 700 }}
                onClick={() => {
                  setPaymentSuccessData(null);
                  setShowPaymentModal(false);
                }}
              >
                Đơn Mới
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}