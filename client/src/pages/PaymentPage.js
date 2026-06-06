// ==============================================================
// TÊN FILE: PaymentPage.js
// MÔ TẢ: Trang Thanh toán (PaymentPage) của hệ thống FnB.
//        Thực hiện quy trình thanh toán đa bước: Nhập thông tin giao hàng,
//        chọn vị trí giao hàng qua bản đồ tương tác (Leaflet/OpenStreetMap),
//        lựa chọn phương thức thanh toán (Tiền mặt/Chuyển khoản QR),
//        hiển thị mã QR ngân hàng động và tự động kiểm tra trạng thái thanh toán (polling).
//        Trang sử dụng LocalStorage để khôi phục phiên thanh toán dở dang khi tải lại trang.
// ==============================================================

import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  FaArrowLeft, FaCheckCircle,
  FaMapMarkedAlt, FaWallet, FaTimes,
} from "react-icons/fa";

import {
  MapContainer, Marker, Popup,
  TileLayer, useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import { api } from "../lib/api";
import { getUserId } from "../lib/session";

import DeliveryForm from "../components/payment/DeliveryForm";
import PaymentMethod from "../components/payment/PaymentMethod";
import ProductInfo from "../components/payment/ProductInfo";

import "../styles/dashboard.css";
import "../styles/commerce.css";

/* ── Leaflet icon fix ──────────────────────────────────────────── */
// Khắc phục lỗi hiển thị marker icon của Leaflet trong React khi dùng Webpack
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require("leaflet/dist/images/marker-icon-2x.png"),
  iconUrl:       require("leaflet/dist/images/marker-icon.png"),
  shadowUrl:     require("leaflet/dist/images/marker-shadow.png"),
});

// Tọa độ mặc định (Thành phố Hồ Chí Minh)
const DEFAULT_POSITION = [10.762622, 106.660172];
const PAYMENT_SESSION_PREFIX = "fnb_payment_session";

// Tạo key lưu session thanh toán theo userId
const getPaymentSessionKey = (userId) =>
  `${PAYMENT_SESSION_PREFIX}_${userId || "guest"}`;

// Đọc dữ liệu phiên thanh toán tạm thời từ LocalStorage
const loadPaymentSession = (userId) => {
  try {
    const raw = localStorage.getItem(getPaymentSessionKey(userId));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

// Ghi dữ liệu phiên thanh toán vào LocalStorage
const savePaymentSession = (userId, payload) => {
  localStorage.setItem(getPaymentSessionKey(userId), JSON.stringify(payload));
};

// Xóa dữ liệu phiên thanh toán khỏi LocalStorage (khi giao dịch hoàn tất)
const clearPaymentSession = (userId) => {
  localStorage.removeItem(getPaymentSessionKey(userId));
};

/* ── Map click handler ──────────────────────────────────────────── */
/**
 * MapClickHandler: Lắng nghe sự kiện click trên bản đồ.
 * Gọi API Nominatim OpenStreetMap để dịch tọa độ thành địa chỉ chi tiết (reverse geocoding).
 */
function MapClickHandler({ onSelect }) {
  useMapEvents({
    click({ latlng: { lat, lng } }) {
      onSelect([lat, lng]);
      fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`)
        .then((r) => r.json())
        .then((d) => onSelect([lat, lng], d.display_name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`))
        .catch(() => onSelect([lat, lng], `${lat.toFixed(4)}, ${lng.toFixed(4)}`));
    },
  });
  return null;
}

/* ── Map Modal (native, no Bootstrap) ──────────────────────────── */
/**
 * MapModal: Hiển thị bản đồ Leaflet trong một modal.
 * Giúp khách hàng chọn vị trí giao hàng trực quan trên bản đồ.
 */
function MapModal({ show, address, selectedPosition, onPositionSelect, onConfirm, onClose }) {
  if (!show) return null;
  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)",
      backdropFilter: "blur(8px)", zIndex: 9999, display: "flex",
      alignItems: "center", justifyContent: "center", padding: "var(--space-4)",
      animation: "fadeIn 0.2s ease",
    }} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={{
        background: "var(--color-surface)", borderRadius: "var(--radius-xl)",
        width: "100%", maxWidth: 680, overflow: "hidden",
        boxShadow: "var(--shadow-xl)", animation: "scaleIn 0.3s ease",
        display: "flex", flexDirection: "column", maxHeight: "90vh",
      }}>
        {/* Header */}
        <div style={{
          background: "var(--color-surface)",
          borderBottom: "2px solid var(--color-border)",
          padding: "var(--space-4) var(--space-6)",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", color: "var(--color-brand-dark)" }}>
            <FaMapMarkedAlt />
            <span style={{ fontWeight: 700, fontSize: "1rem", color: "var(--color-text)" }}>Chọn địa chỉ trên bản đồ</span>
          </div>
          <button onClick={onClose} style={{
            background: "var(--color-bg-alt)", border: "1.5px solid var(--color-border)", color: "var(--color-text-muted)",
            borderRadius: "var(--radius-sm)", width: 32, height: 32, cursor: "pointer",
            fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center",

          }}><FaTimes /></button>
        </div>

        {/* Map */}
        <div style={{ flex: 1, minHeight: 380 }}>
          <MapContainer center={DEFAULT_POSITION} zoom={13} style={{ height: "100%", minHeight: 380, width: "100%" }}>
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org">OpenStreetMap</a>'
            />
            {selectedPosition && (
              <Marker position={selectedPosition}>
                <Popup>Vị trí giao hàng</Popup>
              </Marker>
            )}
            <MapClickHandler onSelect={(pos, addr) => onPositionSelect(pos, addr)} />
          </MapContainer>
        </div>

        {/* Address preview */}
        {address && (
          <div style={{ padding: "var(--space-3) var(--space-5)", background: "var(--color-bg-alt)", borderTop: "1px solid var(--color-border)", fontSize: "0.82rem", color: "var(--color-text-muted)" }}>
            📍 {address}
          </div>
        )}

        {/* Footer */}
        <div style={{ padding: "var(--space-4) var(--space-6)", display: "flex", gap: "var(--space-3)", justifyContent: "flex-end", borderTop: "1px solid var(--color-border)" }}>
          <button className="dashboard-btn dashboard-btn-secondary" onClick={onClose}>Đóng</button>
          <button className="auth-submit-btn" style={{ width: "auto", padding: "0 28px", height: 44, borderRadius: "var(--radius-pill)" }}
            disabled={!address} onClick={onConfirm}>
            <FaCheckCircle /> Xác nhận địa chỉ
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Steps config ───────────────────────────────────────────────── */
const STEPS = [
  { n: 1, label: "Thông tin giao hàng" },
  { n: 2, label: "Phương thức thanh toán" },
  { n: 3, label: "Xác nhận & QR" },
  { n: 4, label: "Hoàn tất" },
];

/* ══════════════════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════════════════ */
const PaymentPage = () => {
  const location = useLocation();
  const navigate  = useNavigate();
  const userId    = getUserId();

  // Khôi phục session đã lưu từ localStorage (nếu có) để tránh mất thông tin khi reload
  const [savedSession] = useState(() => loadPaymentSession(userId));
  const [checkoutItem, setCheckoutItem] = useState(() => location.state?.item || savedSession?.item || null);
  const [checkoutItems, setCheckoutItems] = useState(() => location.state?.items || savedSession?.items || []);
  const [isCart, setIsCart] = useState(() => location.state?.isCart || savedSession?.isCart || false);
  const [orderCode, setOrderCode] = useState(() => location.state?.orderCode || savedSession?.orderCode || null);
  const item = checkoutItem;

  // Các State quản lý thông tin thanh toán, tiến trình và dữ liệu trả về từ API QR Code
  const [paymentInfo, setPaymentInfo] = useState(() => savedSession?.paymentInfo || { name: "", address: "", phone: "", paymentMethod: "cash" });
  const [currentStep,      setCurrentStep]      = useState(() => savedSession?.currentStep || 1);
  const [isSubmitting,     setIsSubmitting]      = useState(false);
  const [showMapModal,     setShowMapModal]      = useState(false);
  const [selectedPosition, setSelectedPosition]  = useState(null);
  const [qrUrl,            setQrUrl]             = useState(() => savedSession?.qrUrl || "");
  const [paymentId,        setPaymentId]         = useState(() => savedSession?.paymentId || null);
  const [paymentStatus,    setPaymentStatus]     = useState(() => savedSession?.paymentStatus || "");
  const [transactionCode,  setTransactionCode]   = useState(() => savedSession?.transactionCode || "");
  const [transferContent,  setTransferContent]   = useState(() => savedSession?.transferContent || "");
  const [bankInfo,         setBankInfo]          = useState(() => savedSession?.bankInfo || null);
  const [error,            setError]             =             useState("");
  const [sessionClosed,    setSessionClosed]     = useState(false);

  // Cập nhật món hàng thanh toán từ state chuyển hướng của react-router-dom
  useEffect(() => {
    if (location.state?.item) {
      setCheckoutItem(location.state.item);
      setCheckoutItems([]);
      setIsCart(false);
      setOrderCode(null);
    } else if (location.state?.items) {
      setCheckoutItems(location.state.items);
      setCheckoutItem(null);
      setIsCart(true);
      setOrderCode(location.state.orderCode || null);
    }
  }, [location.state]);

  // Điều hướng về trang Giỏ hàng nếu không có món hàng nào để thanh toán
  useEffect(() => {
    if (!item && !checkoutItems.length && !sessionClosed) navigate("/carts");
  }, [item, checkoutItems, navigate, sessionClosed]);

  // Tự động lưu thông tin phiên thanh toán vào localStorage để lưu vết khi F5 trang
  useEffect(() => {
    if ((!item && !checkoutItems.length) || sessionClosed) return;

    savePaymentSession(userId, {
      item,
      items: checkoutItems,
      isCart,
      orderCode,
      paymentInfo,
      currentStep,
      qrUrl,
      paymentId,
      paymentStatus,
      transactionCode,
      transferContent,
      bankInfo,
    });
  }, [
    userId,
    item,
    checkoutItems,
    isCart,
    orderCode,
    paymentInfo,
    currentStep,
    qrUrl,
    paymentId,
    paymentStatus,
    transactionCode,
    transferContent,
    bankInfo,
    sessionClosed,
  ]);

  // Thiết lập vòng lặp kiểm tra (polling) trạng thái thanh toán chuyển khoản QR sau mỗi 3 giây
  useEffect(() => {
    if (!paymentId) return;
    const interval = setInterval(async () => {
      try {
        const res = await api.get(`/api/payments/status/${paymentId}`);
        const status = res.data.payment_status;
        setPaymentStatus(status);
        if (status === "paid") { setCurrentStep(4); clearInterval(interval); }
      } catch (e) { console.error(e); }
    }, 3000);
    return () => clearInterval(interval);
  }, [paymentId]);

  // Xử lý thay đổi dữ liệu trên form thông tin giao hàng
  const handlePaymentInfoChange = (e) => {
    const { name, value } = e.target;
    setPaymentInfo((p) => ({ ...p, [name]: value }));
  };

  // Xác nhận thông tin giao hàng hợp lệ để chuyển qua bước 2 (Phương thức thanh toán)
  const handleNextStep = () => {
    if (!paymentInfo.name || !paymentInfo.address || !paymentInfo.phone) {
      setError("Vui lòng nhập đầy đủ thông tin giao hàng."); return;
    }
    if (paymentInfo.address.length < 10) {
      setError("Địa chỉ cần chi tiết hơn để giao hàng chính xác."); return;
    }
    setError(""); setCurrentStep(2);
  };

  // Tính tổng tiền cần thanh toán
  const totalAmount = isCart
    ? checkoutItems.reduce((sum, it) => sum + Number(it.price) * Number(it.quantity), 0)
    : Number(item?.price || 0) * Number(item?.quantity || 0);

  const firstProductId = isCart
    ? (checkoutItems[0]?.product_id || checkoutItems[0]?.id)
    : (item?.product_id || item?.id);

  // Cấu trúc dữ liệu gửi lên Backend để khởi tạo thanh toán
  const basePayload = {
    user_id: userId || 1,
    product_id: firstProductId,
    name: paymentInfo.name,
    address: paymentInfo.address,
    phone: paymentInfo.phone,
    payment_method: paymentInfo.paymentMethod,
    amount: totalAmount,
    is_cart: isCart, // Tells backend to complete entire cart
    order_code: orderCode, // Send orderCode to server
  };

  // Xử lý xác nhận thanh toán (nếu là chuyển khoản ngân hàng thì gọi sinh QR code động, ngược lại hoàn tất ngay)
  const handleConfirmPayment = async () => {
    setIsSubmitting(true); setError("");
    try {
      if (paymentInfo.paymentMethod === "banking") {
        const res = await api.post("/api/payments/create", { ...basePayload, generateQR: true });
        setQrUrl(res.data.qrUrl);
        setPaymentId(res.data.paymentId);
        setPaymentStatus(res.data.payment_status);
        setTransactionCode(res.data.transactionCode || "");
        setTransferContent(res.data.transferContent || res.data.transactionCode || "");
        setBankInfo({
          bankCode: res.data.bankCode,
          bankName: res.data.bankName || "VietinBank",
          bankAccount: res.data.bankAccount,
        });
        setCurrentStep(3);
      } else {
        await api.post("/api/payments/create", basePayload);
        setCurrentStep(4);
      }
    } catch (e) {
      console.error(e); setError("Không thể xử lý thanh toán lúc này.");
    } finally { setIsSubmitting(false); }
  };

  // Hoàn thành đơn hàng, dọn dẹp các state, xóa localStorage session và điều hướng về trang sản phẩm
  const handleFinish = () => {
    setSessionClosed(true);
    clearPaymentSession(userId);
    setCheckoutItem(null);
    setCheckoutItems([]);
    setIsCart(false);
    setOrderCode(null);
    setPaymentInfo({ name: "", address: "", phone: "", paymentMethod: "cash" });
    setCurrentStep(1); setQrUrl(""); setPaymentId(null);
    setPaymentStatus(""); setTransactionCode(""); setTransferContent(""); setBankInfo(null);
    
    const active = localStorage.getItem("activeOrderCode");
    if (active === orderCode) {
      localStorage.removeItem("activeOrderCode");
    }
    
    navigate("/products");
  };

  if (!item && !checkoutItems.length) return null;

  return (
    <div className="dashboard-page">
      <div className="dashboard-shell">

        {/* ── Header ── */}
        <div className="dashboard-header animate-fadeInUp">
          <div className="dashboard-title-wrap">
            <div className="dashboard-icon"><FaWallet /></div>
            <div>
              <h1 className="dashboard-title">Thanh toán đơn hàng</h1>
              <p className="dashboard-subtitle">Hoàn tất thông tin, chọn cách thanh toán và xác nhận đơn.</p>
            </div>
          </div>
          <button className="dashboard-back-btn" onClick={() => navigate(-1)}>
            <FaArrowLeft /> Quay lại
          </button>
        </div>

        {/* ── Step progress ── */}
        <div className="dashboard-panel animate-fadeIn" style={{ padding: "var(--space-5) var(--space-6)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 0 }}>
            {STEPS.map((step, idx) => {
              const done    = currentStep > step.n;
              const active  = currentStep === step.n;
              const pending = currentStep < step.n;
              return (
                <div key={step.n} style={{ display: "flex", alignItems: "center", flex: 1 }}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, flex: "none" }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: "50%",
                      background: done ? "var(--color-success)" : active ? "var(--color-brand)" : "var(--color-border)",
                      color: "white", display: "flex", alignItems: "center", justifyContent: "center",
                      fontWeight: 800, fontSize: "0.85rem",
                      boxShadow: active ? "var(--shadow-brand)" : "none",
                      transition: "all var(--transition-base)",
                    }}>
                      {done ? "✓" : step.n}
                    </div>
                    <span style={{ fontSize: "0.7rem", fontWeight: 600, color: active ? "var(--color-brand-dark)" : pending ? "var(--color-text-faint)" : "var(--color-success)", textAlign: "center", whiteSpace: "nowrap" }}>
                      {step.label}
                    </span>
                  </div>
                  {idx < STEPS.length - 1 && (
                    <div style={{ flex: 1, height: 2, background: done ? "var(--color-success)" : "var(--color-border)", margin: "0 8px", marginBottom: 28, transition: "background 0.5s ease" }} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ProgressBar component (existing) */}
        {/* <ProgressBar currentStep={currentStep} /> */}

        {/* ── Error ── */}
        {error && <div className="auth-alert auth-alert-danger animate-fadeIn"><span>⚠️</span> {error}</div>}

        {/* ── Product summary (steps 1-3) ── */}
        {currentStep < 4 && (
          <div className="dashboard-panel animate-fadeIn">
            <div className="dashboard-panel-header">
              <h2 className="dashboard-panel-title">🛒 Sản phẩm</h2>
            </div>
            <ProductInfo item={item} items={checkoutItems} />
          </div>
        )}

        {/* ── Step 1: Delivery form ── */}
        {currentStep === 1 && (
          <div className="dashboard-panel animate-fadeInUp">
            <div className="dashboard-panel-header">
              <h2 className="dashboard-panel-title">📍 Thông tin giao hàng</h2>
            </div>
            <div className="dashboard-panel-body">
              <DeliveryForm
                paymentInfo={paymentInfo}
                handlePaymentInfoChange={handlePaymentInfoChange}
                handleOpenMap={() => setShowMapModal(true)}
                handleNextStep={handleNextStep}
              />
            </div>
          </div>
        )}

        {/* ── Step 2: Payment method ── */}
        {currentStep === 2 && (
          <div className="dashboard-panel animate-fadeInUp">
            <div className="dashboard-panel-header">
              <h2 className="dashboard-panel-title">💳 Phương thức thanh toán</h2>
            </div>
            <div className="dashboard-panel-body">
              <PaymentMethod
                paymentInfo={paymentInfo}
                handlePaymentInfoChange={handlePaymentInfoChange}
                handlePrevStep={() => setCurrentStep(1)}
                handleConfirmPayment={handleConfirmPayment}
                isSubmitting={isSubmitting}
              />
            </div>
          </div>
        )}

        {/* ── Step 3: QR code ── */}
        {currentStep === 3 && paymentInfo.paymentMethod === "banking" && (
          <div className="dashboard-panel animate-fadeInUp">
            <div className="dashboard-panel-header">
              <h2 className="dashboard-panel-title">📲 Quét mã QR thanh toán</h2>
              <span className={`dashboard-badge ${paymentStatus === "paid" ? "dashboard-badge-success" : "dashboard-badge-warning"}`}>
                {paymentStatus === "paid" ? "Đã thanh toán" : "Đang chờ..."}
              </span>
            </div>
            <div className="dashboard-panel-body">
              {qrUrl ? (
                <div className="payment-qr-layout">
                  {/* QR card */}
                  <div className="payment-qr-card">
                    <img src={qrUrl} alt="QR thanh toán" style={{ maxWidth: 280, width: "100%", borderRadius: "var(--radius-md)", display: "block" }} />
                  </div>

                  {/* Bank info */}
                  {bankInfo?.bankAccount && (
                    <div className="payment-transfer-card">
                      <div className="payment-transfer-row">
                        <span style={{ fontSize: "0.78rem", color: "var(--color-text-faint)", fontWeight: 600 }}>Ngân hàng</span>
                        <span style={{ fontSize: "0.875rem", fontWeight: 800, color: "var(--color-text)" }}>{bankInfo.bankName || "VietinBank"}</span>
                      </div>
                      <div className="payment-transfer-row">
                        <span style={{ fontSize: "0.78rem", color: "var(--color-text-faint)", fontWeight: 600 }}>Số TK</span>
                        <span style={{ fontSize: "0.875rem", fontWeight: 800, color: "var(--color-text)", fontFamily: "monospace" }}>{bankInfo.bankAccount}</span>
                      </div>
                      {transactionCode && (
                        <div className="payment-transfer-content">
                          <span style={{ fontSize: "0.78rem", color: "var(--color-text-faint)", fontWeight: 600 }}>Nội dung</span>
                          <strong>{transferContent || transactionCode}</strong>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Polling indicator */}
                  <p className="payment-waiting-note">
                    <span>
                      <span className="payment-waiting-dot" />
                      Hệ thống đang chờ xác nhận giao dịch...
                    </span>
                  </p>
                </div>
              ) : (
                <div className="dashboard-empty">
                  <div style={{ fontSize: "2rem", marginBottom: 12, animation: "pulse 1s infinite" }}>⏳</div>
                  Đang tạo mã QR...
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Step 4: Success ── */}
        {currentStep === 4 && (
          <div className="dashboard-panel animate-scaleIn">
            <div className="dashboard-empty" style={{ padding: "var(--space-12)" }}>
              <div style={{ fontSize: "4rem", marginBottom: "var(--space-4)", animation: "scaleIn 0.5s ease" }}>🎉</div>
              <div style={{
                width: 72, height: 72, borderRadius: "50%",
                background: "var(--color-success-light)", color: "var(--color-success)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "2rem", margin: "0 auto var(--space-5)",
                boxShadow: "0 0 0 12px rgba(61,170,114,0.1)",
              }}>
                <FaCheckCircle />
              </div>
              <h3 style={{ fontFamily: "var(--app-font-display)", fontSize: "1.6rem", fontWeight: 800, color: "var(--color-text)", margin: "0 0 var(--space-2)" }}>
                Thanh toán thành công!
              </h3>
              <p style={{ color: "var(--color-text-muted)", margin: "0 0 var(--space-6)" }}>
                Đơn hàng của bạn đã được ghi nhận và đang được xử lý. Chúng tôi sẽ giao hàng sớm nhất!
              </p>
              <div style={{ display: "flex", gap: "var(--space-3)", justifyContent: "center", flexWrap: "wrap" }}>
                <button className="auth-submit-btn" style={{ width: "auto", padding: "0 32px", height: 48, borderRadius: "var(--radius-pill)" }} onClick={handleFinish}>
                  🛍️ Tiếp tục mua sắm
                </button>
                <button className="dashboard-btn dashboard-btn-secondary" style={{ borderRadius: "var(--radius-pill)", height: 48, padding: "0 24px" }} onClick={() => navigate("/carts")}>
                  Xem đơn hàng
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Map Modal ── */}
      <MapModal
        show={showMapModal}
        address={paymentInfo.address}
        selectedPosition={selectedPosition}
        onPositionSelect={(pos, addr) => {
          setSelectedPosition(pos);
          if (addr) setPaymentInfo((p) => ({ ...p, address: addr }));
        }}
        onConfirm={() => setShowMapModal(false)}
        onClose={() => setShowMapModal(false)}
      />
    </div>
  );
};

export default PaymentPage;
