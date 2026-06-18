// ==============================================================
// TÊN FILE: PaymentPage.js
// MÔ TẢ: Trang Thanh toán (PaymentPage) của hệ thống FnB.
//        Thực hiện quy trình thanh toán đa bước: Nhập thông tin giao hàng,
//        chọn vị trí giao hàng qua bản đồ tương tác (Leaflet/OpenStreetMap),
//        lựa chọn phương thức thanh toán (Tiền mặt/Chuyển khoản QR),
//        hiển thị mã QR ngân hàng động và tự động kiểm tra trạng thái thanh toán (polling).
//        Trang sử dụng LocalStorage để khôi phục phiên thanh toán dở dang khi tải lại trang.
// ==============================================================

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useLocation, useNavigate } from "react-router-dom";
import {
  FaArrowLeft, FaCheckCircle,
  FaMapMarkedAlt, FaWallet, FaTimes,
} from "react-icons/fa";

import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

import { api } from "../lib/api";
import { getUserId } from "../lib/session";

import DeliveryForm from "../components/payment/DeliveryForm";
import PaymentMethod from "../components/payment/PaymentMethod";
import ProductInfo from "../components/payment/ProductInfo";

import "../styles/dashboard.css";
import "../styles/commerce.css";

// Thiết lập token Mapbox
mapboxgl.accessToken = process.env.REACT_APP_MAPBOX_ACCESS_TOKEN || "";

// Giới hạn địa lý của TP. Hồ Chí Minh [Tây Nam, Đông Bắc]
const HCMC_BOUNDS = [
  [106.35, 10.35], // [lng, lat]
  [107.05, 11.16]  // [lng, lat]
];

// Tọa độ mặc định (Thành phố Hồ Chí Minh) [lat, lng]
const DEFAULT_POSITION = [10.762622, 106.660172];
const PAYMENT_SESSION_PREFIX = "fnb_payment_session";

// Tạo key lưu session thanh toán theo userId
const getPaymentSessionKey = (userId) =>
  `${PAYMENT_SESSION_PREFIX}_${userId || "guest"}`;

const fmt = (v) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", minimumFractionDigits: 0 }).format(v || 0);

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

/* ── Map Modal (Mapbox GL JS) ──────────────────────────── */
/**
 * MapModal: Hiển thị bản đồ Mapbox trong một modal.
 * Khóa bản đồ trong khu vực TP.HCM và tích hợp geofencing để chỉ chấp nhận địa chỉ thuộc TP.HCM.
 */
function MapModal({ show, address, selectedPosition, onPositionSelect, onConfirm, onClose }) {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  // Đồng bộ ô tìm kiếm khi địa chỉ bên ngoài thay đổi
  useEffect(() => {
    if (show) {
      setSearchQuery(address || "");
      setSuggestions([]);
      setErrorMessage("");
    }
  }, [show, address]);

  useEffect(() => {
    if (!show || !mapContainerRef.current) return;

    // Reset thông báo lỗi khi mở bản đồ
    setErrorMessage("");

    // Kinh độ và vĩ độ mặc định của TP.HCM (Quận 1)
    const defaultCenter = selectedPosition 
      ? [selectedPosition[1], selectedPosition[0]] 
      : [DEFAULT_POSITION[1], DEFAULT_POSITION[0]];

    // Khởi tạo bản đồ Mapbox
    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: defaultCenter,
      zoom: 13,
      pitch: 45, // Góc nghiêng 3D
      maxBounds: HCMC_BOUNDS, // Khóa trong địa phận TP.HCM
    });

    mapRef.current = map;

    // Nút điều hướng (zoom, xoay)
    map.addControl(new mapboxgl.NavigationControl(), "top-right");

    // Nếu đã có tọa độ từ trước, vẽ Marker
    if (selectedPosition) {
      const marker = new mapboxgl.Marker({ color: "#d97706" })
        .setLngLat(defaultCenter)
        .addTo(map);
      markerRef.current = marker;
    }

    // Sự kiện click ghim điểm
    map.on("click", (e) => {
      const { lng, lat } = e.lngLat;
      setErrorMessage("");
      setSuggestions([]);

      // Cập nhật hoặc tạo mới Marker
      if (markerRef.current) {
        markerRef.current.setLngLat([lng, lat]);
      } else {
        const marker = new mapboxgl.Marker({ color: "#d97706" })
          .setLngLat([lng, lat])
          .addTo(map);
        markerRef.current = marker;
      }

      // Reverse Geocoding dịch tọa độ thành địa chỉ
      fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`)
        .then((r) => r.json())
        .then((d) => {
          const formattedAddress = d.display_name || "";
          
          // Kiểm tra xem vị trí có thuộc TP.HCM hay không
          const isHCMC = formattedAddress.toLowerCase().includes("hồ chí minh") || 
                         formattedAddress.toLowerCase().includes("hcmc");
                         
          if (!isHCMC) {
            setErrorMessage("Rất tiếc! Cửa hàng chỉ hỗ trợ giao hàng trong khu vực TP. Hồ Chí Minh.");
            onPositionSelect([lat, lng], ""); // Xóa địa chỉ ở form để chặn lưu
            return;
          }

          onPositionSelect([lat, lng], formattedAddress);
          setSearchQuery(formattedAddress);
        })
        .catch(() => {
          onPositionSelect([lat, lng], `${lat.toFixed(6)}, ${lng.toFixed(6)}`);
        });
    });

    // Dọn dẹp bản đồ khi unmount
    return () => {
      map.remove();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show]);

  const handleSearchAddress = () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    setErrorMessage("");
    setSuggestions([]);

    // Tìm kiếm trong VN và giới hạn trong khu vực HCMC Bounds bằng Nominatim
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&viewbox=106.35,10.35,107.05,11.16&bounded=1&limit=5&accept-language=vi`;

    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        if (data && data.length > 0) {
          setSuggestions(data);
        } else {
          setSuggestions([]);
          setErrorMessage("Không tìm thấy địa chỉ có số nhà này trong khu vực TP. Hồ Chí Minh.");
        }
      })
      .catch((err) => {
        console.error("Nominatim search error:", err);
        setErrorMessage("Lỗi kết nối khi tìm kiếm địa chỉ.");
      })
      .finally(() => {
        setIsSearching(false);
      });
  };

  const handleSelectSuggestion = (item) => {
    const lat = parseFloat(item.lat);
    const lng = parseFloat(item.lon);
    setSuggestions([]);
    setSearchQuery(item.display_name || "");
    setErrorMessage("");

    if (mapRef.current) {
      mapRef.current.flyTo({
        center: [lng, lat],
        zoom: 16,
        essential: true
      });
    }

    if (markerRef.current) {
      markerRef.current.setLngLat([lng, lat]);
    } else {
      const marker = new mapboxgl.Marker({ color: "#d97706" })
        .setLngLat([lng, lat])
        .addTo(mapRef.current);
      markerRef.current = marker;
    }

    onPositionSelect([lat, lng], item.display_name || "");
  };

  if (!show) return null;

  return createPortal(
    <div className="custom-modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="custom-modal-container" style={{ maxWidth: 680, maxHeight: "95dvh", display: "flex", flexDirection: "column" }}>
        {/* Header */}
        <div className="custom-modal-header">
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", color: "var(--color-brand-dark)" }}>
            <FaMapMarkedAlt />
            <h3 style={{ fontSize: "1.05rem" }}>Chọn địa chỉ trên bản đồ (TP.HCM)</h3>
          </div>
          <button className="custom-modal-close-btn" onClick={onClose}><FaTimes /></button>
        </div>

        {/* Ô Tìm Kiếm Địa Chỉ */}
        <div style={{ padding: "var(--space-3) var(--space-5)", borderBottom: "1px solid var(--color-border-light)", background: "var(--color-bg)", position: "relative" }}>
          <div style={{ display: "flex", gap: "8px" }}>
            <input 
              type="text" 
              className="dashboard-input" 
              placeholder="Nhập tên đường, phường, quận tại TP.HCM..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (suggestions.length > 0) setSuggestions([]);
              }}
              onKeyDown={(e) => e.key === "Enter" && handleSearchAddress()}
              style={{ flex: 1, height: "40px" }}
            />
            <button 
              type="button" 
              className="dashboard-btn dashboard-btn-primary" 
              onClick={handleSearchAddress}
              style={{ width: "auto", height: "40px", padding: "0 16px", borderRadius: "var(--radius-pill)" }}
              disabled={isSearching}
            >
              {isSearching ? "Đang tìm..." : "Tìm kiếm"}
            </button>
          </div>

          {/* Danh sách kết quả gợi ý địa chỉ */}
          {suggestions.length > 0 && (
            <ul style={{ 
              position: "absolute", 
              top: "52px", 
              left: "var(--space-5)", 
              right: "var(--space-5)", 
              zIndex: 9999, 
              background: "var(--color-bg)", 
              border: "1px solid var(--color-border)", 
              borderRadius: "var(--radius-lg)", 
              listStyle: "none", 
              padding: "0", 
              margin: "0", 
              maxHeight: "180px", 
              overflowY: "auto", 
              boxShadow: "var(--shadow-lg)" 
            }}>
              {suggestions.map((item, index) => (
                <li 
                  key={item.place_id || index} 
                  onClick={() => handleSelectSuggestion(item)}
                  style={{ 
                    padding: "10px 14px", 
                    cursor: "pointer", 
                    borderBottom: "1px solid var(--color-border-light)", 
                    fontSize: "0.82rem",
                    color: "var(--color-text)",
                    textAlign: "left",
                    transition: "background 0.2s"
                  }}
                  onMouseEnter={(e) => e.target.style.background = "var(--color-bg-alt)"}
                  onMouseLeave={(e) => e.target.style.background = "transparent"}
                >
                  📍 {item.display_name}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Map Container */}
        <div style={{ flex: 1, minHeight: "320px", position: "relative" }}>
          <div ref={mapContainerRef} style={{ height: "100%", minHeight: "320px", width: "100%" }} />
        </div>

        {/* Alert / Address preview */}
        {errorMessage ? (
          <div style={{ padding: "var(--space-3) var(--space-5)", background: "#fef2f2", borderTop: "1px solid #fee2e2", fontSize: "0.82rem", color: "#dc2626", fontWeight: "bold" }}>
            ⚠️ {errorMessage}
          </div>
        ) : address ? (
          <div style={{ padding: "var(--space-3) var(--space-5)", background: "var(--color-bg-alt)", borderTop: "1px solid var(--color-border)", fontSize: "0.82rem", color: "var(--color-text-muted)" }}>
            📍 {address}
          </div>
        ) : null}

        {/* Footer */}
        <div className="custom-modal-footer">
          <button className="dashboard-btn dashboard-btn-secondary" onClick={onClose}>Đóng</button>
          <button 
            className="auth-submit-btn" 
            style={{ width: "auto", padding: "0 28px", height: 44, borderRadius: "var(--radius-pill)" }}
            disabled={!address || !!errorMessage} 
            onClick={onConfirm}
          >
            <FaCheckCircle /> Xác nhận địa chỉ
          </button>
        </div>
      </div>
    </div>,
    document.body
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
  const [paymentInfo, setPaymentInfo] = useState(() => savedSession?.paymentInfo || {
    name: localStorage.getItem("default_delivery_name") || "",
    address: localStorage.getItem("default_delivery_address") || "",
    phone: localStorage.getItem("default_delivery_phone") || "",
    paymentMethod: "cash"
  });
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

  const [selectedVoucher, setSelectedVoucher] = useState(null);
  const [userVouchers, setUserVouchers] = useState([]);
  const [showVoucherModal, setShowVoucherModal] = useState(false);

  useEffect(() => {
    if (userId) {
      api.get(`/api/loyalty/${userId}`)
        .then((res) => {
          const now = new Date();
          const validVouchers = (res.data.vouchers || []).filter(v => 
            v.is_used !== 1 && (!v.expired_at || new Date(v.expired_at) > now)
          );
          setUserVouchers(validVouchers);
        })
        .catch(console.error);
    }
  }, [userId]);

  useEffect(() => {
    if (selectedVoucher && selectedVoucher.applicable_payment_method !== "all" && selectedVoucher.applicable_payment_method !== paymentInfo.paymentMethod) {
      setSelectedVoucher(null);
    }
  }, [paymentInfo.paymentMethod, selectedVoucher]);

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

  // Tính tổng tiền cần thanh toán ban đầu (trước giảm giá)
  const subtotal = isCart
    ? checkoutItems.reduce((sum, it) => sum + Number(it.price) * Number(it.quantity), 0)
    : Number(item?.price || 0) * Number(item?.quantity || 0);

  // Tính số tiền được giảm từ voucher
  let discountAmount = 0;
  if (selectedVoucher) {
    if (selectedVoucher.discount_type === "percent") {
      discountAmount = (subtotal * Number(selectedVoucher.discount_value)) / 100;
    } else {
      discountAmount = Number(selectedVoucher.discount_value);
    }
    if (discountAmount > subtotal) {
      discountAmount = subtotal;
    }
  }

  const totalAmount = subtotal - discountAmount;

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
    voucher_id: selectedVoucher ? selectedVoucher.id : null, // Gửi voucher_id lên backend để đánh dấu đã dùng
    user_voucher_id: selectedVoucher ? selectedVoucher.user_voucher_id : null,
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
    setSelectedVoucher(null);
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
            <div className="dashboard-panel-body" style={{ borderTop: "1px solid var(--color-border-light)", paddingTop: "var(--space-4)", display: "flex", flexDirection: "column", gap: 8, alignItems: "flex-end" }}>
              <div style={{ display: "flex", gap: "var(--space-8)", fontSize: "0.88rem", color: "var(--color-text-muted)" }}>
                <span>Tạm tính:</span>
                <span style={{ fontWeight: 600 }}>{fmt(subtotal)}</span>
              </div>
              {selectedVoucher && (
                <div style={{ display: "flex", gap: "var(--space-8)", fontSize: "0.88rem", color: "var(--color-danger)" }}>
                  <span>Giảm giá (Voucher {selectedVoucher.code}):</span>
                  <span style={{ fontWeight: 600 }}>-{fmt(discountAmount)}</span>
                </div>
              )}
              <div style={{ display: "flex", gap: "var(--space-8)", fontSize: "1.1rem", color: "var(--color-text)", fontWeight: 800 }}>
                <span>Tổng tiền:</span>
                <span style={{ color: "var(--color-brand-dark)" }}>{fmt(totalAmount)}</span>
              </div>
            </div>
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
          <>
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

                {/* Voucher Section */}
                <div style={{
                  marginTop: "var(--space-6)", padding: "var(--space-5)",
                  background: "var(--color-brand-pale)", borderRadius: "var(--radius-lg)",
                  border: "1px dashed var(--color-brand)",
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ fontSize: "1.3rem" }}>🎫</span>
                      <div>
                        <div style={{ fontWeight: 800, color: "var(--color-brand-dark)", fontSize: "0.95rem" }}>Voucher khuyến mãi</div>
                        <div style={{ fontSize: "0.78rem", color: "var(--color-text-muted)" }}>
                          {selectedVoucher 
                            ? `Đã chọn mã: ${selectedVoucher.code} (Giảm -${selectedVoucher.discount_type === "percent" ? `${parseFloat(selectedVoucher.discount_value)}%` : fmt(selectedVoucher.discount_value)})` 
                            : "Áp dụng mã giảm giá để nhận ưu đãi đơn hàng."}
                        </div>
                      </div>
                    </div>
                    {selectedVoucher ? (
                      <button className="dashboard-btn dashboard-btn-secondary" style={{ padding: "6px 12px", fontSize: "0.78rem" }} onClick={() => setSelectedVoucher(null)}>
                        Hủy áp dụng
                      </button>
                    ) : (
                      <button className="dashboard-btn dashboard-btn-primary" style={{ padding: "6px 16px", fontSize: "0.78rem" }} onClick={() => setShowVoucherModal(true)}>
                        Chọn Voucher
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Voucher Selection Modal */}
            {showVoucherModal && createPortal(
              <div className="custom-modal-overlay" onClick={() => setShowVoucherModal(false)}>
                <div className="custom-modal-container" style={{ maxWidth: 460 }} onClick={(e) => e.stopPropagation()}>
                  <div className="custom-modal-header">
                    <h3>Chọn Voucher Khuyến Mãi</h3>
                    <button className="custom-modal-close-btn" onClick={() => setShowVoucherModal(false)}>✕</button>
                  </div>

                  <div className="custom-modal-body" style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
                    {userVouchers.length === 0 ? (
                      <div style={{ textAlign: "center", padding: "var(--space-8) 0", color: "var(--color-text-muted)" }}>
                        <span style={{ fontSize: "2rem" }}>🎁</span>
                        <p style={{ marginTop: 8, fontSize: "0.85rem" }}>Bạn chưa sở hữu voucher nào.</p>
                      </div>
                    ) : (
                      userVouchers.map((v) => {
                        const isExpired = new Date(v.expired_at) < new Date();
                        const isMinOrderUnmet = subtotal < Number(v.min_order);
                        const isMethodUnmet = v.applicable_payment_method !== "all" && v.applicable_payment_method !== paymentInfo.paymentMethod;
                        const isDisabled = isExpired || isMinOrderUnmet || isMethodUnmet;

                        let errMsg = "";
                        if (isExpired) errMsg = "Voucher đã hết hạn dùng";
                        else if (isMinOrderUnmet) errMsg = `Chưa đủ đơn tối thiểu ${fmt(v.min_order)} (thiếu ${fmt(Number(v.min_order) - subtotal)})`;
                        else if (isMethodUnmet) {
                          const reqMethod = v.applicable_payment_method === "banking" ? "Chuyển khoản (banking)" : "Tiền mặt (cash)";
                          errMsg = `Chỉ áp dụng cho thanh toán: ${reqMethod}`;
                        }

                        const isSelected = selectedVoucher?.user_voucher_id === v.user_voucher_id;

                        return (
                          <div key={v.user_voucher_id || v.id}
                            onClick={() => {
                              if (!isDisabled) {
                                  setSelectedVoucher(v);
                                  setShowVoucherModal(false);
                                }
                              }}
                              style={{
                                border: isDisabled ? "1px solid var(--color-border)" : (isSelected ? "2px solid var(--color-brand)" : "1.5px solid var(--color-border)"),
                                borderRadius: "12px", padding: 0,
                                background: isDisabled ? "var(--color-bg-alt)" : "var(--color-surface)",
                                opacity: isDisabled ? 0.65 : 1,
                                cursor: isDisabled ? "not-allowed" : "pointer",
                                display: "flex",
                                minHeight: "72px",
                                position: "relative",
                                overflow: "hidden",
                                transition: "all 0.15s ease",
                              }}
                            >
                              {/* Left part: Ticket accent */}
                              <div style={{
                                width: "60px",
                                background: isDisabled ? "var(--color-text-faint)" : "linear-gradient(135deg, var(--color-brand) 0%, var(--color-brand-dark) 100%)",
                                color: "white",
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                justifyContent: "center",
                                textAlign: "center",
                                padding: "4px",
                                flexShrink: 0,
                                position: "relative",
                                borderRight: isDisabled ? "1px dashed var(--color-border)" : "1px dashed rgba(255,255,255,0.3)",
                              }}>
                                <span style={{ fontSize: "0.85rem", marginBottom: 2 }}>🎫</span>
                                <span style={{ fontSize: "0.76rem", fontWeight: 900, fontFamily: "var(--app-font-display)" }}>
                                  {v.discount_type === "percent" ? `${parseFloat(v.discount_value)}%` : (v.discount_value >= 1000 && v.discount_value % 1000 === 0 ? `${v.discount_value / 1000}k` : fmt(v.discount_value).replace(/\s*₫/g, "đ"))}
                                </span>

                                {/* Inner curved notches */}
                                <div style={{ position: "absolute", right: -5, top: -5, width: 10, height: 10, borderRadius: "50%", background: "var(--color-bg)" }} />
                                <div style={{ position: "absolute", right: -5, bottom: -5, width: 10, height: 10, borderRadius: "50%", background: "var(--color-bg)" }} />
                              </div>

                              {/* Right part: Coupon Info */}
                              <div style={{
                                flex: 1,
                                padding: "8px 12px",
                                display: "flex",
                                flexDirection: "column",
                                justifyContent: "center",
                                gap: 4,
                                minWidth: 0,
                              }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                                  <span style={{ fontFamily: "var(--app-font-display)", fontSize: "0.82rem", fontWeight: 800, color: isDisabled ? "var(--color-text-muted)" : "var(--color-brand-dark)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                    {v.code}
                                  </span>
                                  {!isDisabled && (
                                    <div style={{
                                      width: 16, height: 16, borderRadius: "50%",
                                      border: isSelected ? "5px solid var(--color-brand)" : "1.5px solid var(--color-border)",
                                      background: "white", flexShrink: 0, transition: "all 0.15s",
                                    }} />
                                  )}
                                </div>
                                <div style={{ fontSize: "0.68rem", color: "var(--color-text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                  Đơn từ: <strong>{v.min_order >= 1000 && v.min_order % 1000 === 0 ? `${v.min_order / 1000}k` : fmt(v.min_order).replace(/\s*₫/g, "đ")}</strong>
                                  {" | "}
                                  HSD: {new Date(v.expired_at).toLocaleDateString("vi-VN")}
                                </div>
                                {isDisabled && (
                                  <div style={{ fontSize: "0.68rem", color: "var(--color-danger)", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                    ⚠️ {errMsg}
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>,
                document.body
              )}
          </>
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
