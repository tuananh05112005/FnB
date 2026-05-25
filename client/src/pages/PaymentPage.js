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
import ProgressBar from "../components/payment/ProgressBar";

import "../styles/dashboard.css";
import "../styles/commerce.css";

/* ── Leaflet icon fix ──────────────────────────────────────────── */
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require("leaflet/dist/images/marker-icon-2x.png"),
  iconUrl:       require("leaflet/dist/images/marker-icon.png"),
  shadowUrl:     require("leaflet/dist/images/marker-shadow.png"),
});

const DEFAULT_POSITION = [10.762622, 106.660172];

const fmt = (n) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(Number(n) || 0);

/* ── Map click handler ──────────────────────────────────────────── */
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
  const { item }  = location.state || {};
  const userId    = getUserId();

  const [paymentInfo, setPaymentInfo] = useState({ name: "", address: "", phone: "", paymentMethod: "cash" });
  const [currentStep,      setCurrentStep]      = useState(1);
  const [isSubmitting,     setIsSubmitting]      = useState(false);
  const [showMapModal,     setShowMapModal]      = useState(false);
  const [selectedPosition, setSelectedPosition]  = useState(null);
  const [qrUrl,            setQrUrl]             = useState("");
  const [paymentId,        setPaymentId]         = useState(null);
  const [paymentStatus,    setPaymentStatus]     = useState("");
  const [transactionCode,  setTransactionCode]   = useState("");
  const [transferContent,  setTransferContent]   = useState("");
  const [bankInfo,         setBankInfo]          = useState(null);
  const [error,            setError]             = useState("");

  /* Redirect if no product */
  useEffect(() => { if (!item) navigate("/carts"); }, [item, navigate]);

  /* Polling QR payment status */
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

  const handlePaymentInfoChange = (e) => {
    const { name, value } = e.target;
    setPaymentInfo((p) => ({ ...p, [name]: value }));
  };

  const handleNextStep = () => {
    if (!paymentInfo.name || !paymentInfo.address || !paymentInfo.phone) {
      setError("Vui lòng nhập đầy đủ thông tin giao hàng."); return;
    }
    if (paymentInfo.address.length < 10) {
      setError("Địa chỉ cần chi tiết hơn để giao hàng chính xác."); return;
    }
    setError(""); setCurrentStep(2);
  };

  const basePayload = {
    user_id: userId || 1,
    product_id: item?.product_id || item?.id,
    name: paymentInfo.name,
    address: paymentInfo.address,
    phone: paymentInfo.phone,
    payment_method: paymentInfo.paymentMethod,
    amount: Number(item?.price || 0) * Number(item?.quantity || 0),
  };

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
        setBankInfo({ bankCode: res.data.bankCode, bankAccount: res.data.bankAccount });
        setCurrentStep(3);
      } else {
        await api.post("/api/payments/create", basePayload);
        setCurrentStep(4);
      }
    } catch (e) {
      console.error(e); setError("Không thể xử lý thanh toán lúc này.");
    } finally { setIsSubmitting(false); }
  };

  const handleFinish = () => {
    setPaymentInfo({ name: "", address: "", phone: "", paymentMethod: "cash" });
    setCurrentStep(1); setQrUrl(""); setPaymentId(null);
    setPaymentStatus(""); setTransactionCode(""); setTransferContent(""); setBankInfo(null);
    navigate("/products");
  };

  if (!item) return null;

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
            <ProductInfo item={item} />
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
            <div className="dashboard-panel-body" style={{ textAlign: "center", padding: "var(--space-8)" }}>
              {qrUrl ? (
                <>
                  {/* QR card */}
                  <div style={{
                    display: "inline-block", background: "white", borderRadius: "var(--radius-xl)",
                    padding: "var(--space-5)", boxShadow: "var(--shadow-xl)",
                    border: "3px solid var(--color-brand-pale)",
                  }}>
                    <img src={qrUrl} alt="QR thanh toán" style={{ maxWidth: 280, width: "100%", borderRadius: "var(--radius-md)", display: "block" }} />
                  </div>

                  {/* Bank info */}
                  {bankInfo?.bankAccount && (
                    <div style={{ marginTop: "var(--space-5)", display: "inline-grid", gap: "var(--space-3)", background: "var(--color-bg-alt)", borderRadius: "var(--radius-md)", padding: "var(--space-5) var(--space-6)", textAlign: "left", minWidth: 280 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", gap: "var(--space-4)" }}>
                        <span style={{ fontSize: "0.78rem", color: "var(--color-text-faint)", fontWeight: 600 }}>Ngân hàng</span>
                        <span style={{ fontSize: "0.875rem", fontWeight: 800, color: "var(--color-text)" }}>{bankInfo.bankCode || "—"}</span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", gap: "var(--space-4)" }}>
                        <span style={{ fontSize: "0.78rem", color: "var(--color-text-faint)", fontWeight: 600 }}>Số TK</span>
                        <span style={{ fontSize: "0.875rem", fontWeight: 800, color: "var(--color-text)", fontFamily: "monospace" }}>{bankInfo.bankAccount}</span>
                      </div>
                      {transactionCode && (
                        <div style={{ display: "flex", justifyContent: "space-between", gap: "var(--space-4)" }}>
                          <span style={{ fontSize: "0.78rem", color: "var(--color-text-faint)", fontWeight: 600 }}>Nội dung</span>
                          <span style={{ fontSize: "0.875rem", fontWeight: 800, color: "var(--color-brand-dark)", fontFamily: "monospace" }}>{transferContent || transactionCode}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Polling indicator */}
                  <p style={{ marginTop: "var(--space-4)", fontSize: "0.85rem", color: "var(--color-text-muted)" }}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                      <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--color-warning)", display: "inline-block", animation: "pulse 1.5s infinite" }} />
                      Hệ thống đang chờ xác nhận giao dịch...
                    </span>
                  </p>
                </>
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
