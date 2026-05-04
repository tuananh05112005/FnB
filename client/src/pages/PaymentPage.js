import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button, Modal } from "react-bootstrap";
import { FaArrowLeft, FaCheckCircle, FaMapMarkedAlt, FaWallet } from "react-icons/fa";
import {
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  useMapEvents,
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

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require("leaflet/dist/images/marker-icon-2x.png"),
  iconUrl: require("leaflet/dist/images/marker-icon.png"),
  shadowUrl: require("leaflet/dist/images/marker-shadow.png"),
});

const DEFAULT_POSITION = [10.762622, 106.660172];

const PaymentPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { item } = location.state || {};
  const userId = getUserId();

  const [paymentInfo, setPaymentInfo] = useState({
    name: "",
    address: "",
    phone: "",
    paymentMethod: "cash",
  });
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showMapModal, setShowMapModal] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState(null);
  const [qrUrl, setQrUrl] = useState("");
  const [orderSaved, setOrderSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!item) {
      navigate("/carts");
    }
  }, [item, navigate]);

  const handlePaymentInfoChange = (event) => {
    const { name, value } = event.target;
    setPaymentInfo((prev) => ({ ...prev, [name]: value }));
  };

  const handleNextStep = () => {
    if (!paymentInfo.name || !paymentInfo.address || !paymentInfo.phone) {
      setError("Vui long nhap day du thong tin giao hang.");
      return;
    }

    if (paymentInfo.address.length < 10) {
      setError("Dia chi can chi tiet hon de giao hang chinh xac.");
      return;
    }

    setError("");
    setCurrentStep(2);
  };

  const basePayload = {
    user_id: userId || 1,
    product_id: item?.product_id || item?.id,
    name: paymentInfo.name,
    address: paymentInfo.address,
    phone: paymentInfo.phone,
    payment_method: paymentInfo.paymentMethod,
    amount: Number(item?.price || 0) * Number(item?.quantity || 0),
    status: "completed",
  };

  const handleConfirmPayment = async () => {
    setIsSubmitting(true);
    setError("");

    try {
      if (paymentInfo.paymentMethod === "banking") {
        const response = await api.post("/api/payments", {
          ...basePayload,
          generateQR: true,
        });
        setQrUrl(response.data.qrUrl);
        setCurrentStep(3);
      } else {
        await api.post("/api/payments", basePayload);
        setOrderSaved(true);
        setCurrentStep(4);
      }
    } catch (paymentError) {
      console.error("Khong the xu ly thanh toan:", paymentError);
      setError("Khong the xu ly thanh toan luc nay.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBankingConfirmed = async () => {
    if (!orderSaved) {
      try {
        await api.post("/api/payments", basePayload);
        setOrderSaved(true);
      } catch (confirmError) {
        console.error("Khong the ghi nhan thanh toan:", confirmError);
        setError("Khong the ghi nhan giao dich chuyen khoan.");
        return;
      }
    }

    setCurrentStep(4);
  };

  const handleFinish = () => {
    setPaymentInfo({
      name: "",
      address: "",
      phone: "",
      paymentMethod: "cash",
    });
    setCurrentStep(1);
    setQrUrl("");
    setOrderSaved(false);
    navigate("/products");
  };

  function MapClickHandler() {
    useMapEvents({
      click(event) {
        const { lat, lng } = event.latlng;
        setSelectedPosition([lat, lng]);

        fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
        )
          .then((response) => response.json())
          .then((data) => {
            const address =
              data.display_name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
            setPaymentInfo((prev) => ({ ...prev, address }));
          })
          .catch(() => {
            setPaymentInfo((prev) => ({
              ...prev,
              address: `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
            }));
          });
      },
    });

    return null;
  }

  if (!item) {
    return null;
  }

  return (
    <div className="dashboard-page">
      <div className="dashboard-shell" style={{ display: "grid", gap: 18 }}>
        <div className="dashboard-header">
          <div className="dashboard-title-wrap">
            <div className="dashboard-icon">
              <FaWallet />
            </div>
            <div>
              <h1 className="dashboard-title">Thanh toan don hang</h1>
              <p className="dashboard-subtitle">
                Hoan tat thong tin, chon cach thanh toan va xac nhan don.
              </p>
            </div>
          </div>

          <button
            type="button"
            className="dashboard-back-btn"
            onClick={() => navigate(-1)}
          >
            <FaArrowLeft />
            Quay lai
          </button>
        </div>

        <ProgressBar currentStep={currentStep} />

        {error && <div className="commerce-alert commerce-alert-danger">{error}</div>}

        {currentStep < 4 && <ProductInfo item={item} />}

        {currentStep === 1 && (
          <DeliveryForm
            paymentInfo={paymentInfo}
            handlePaymentInfoChange={handlePaymentInfoChange}
            handleOpenMap={() => setShowMapModal(true)}
            handleNextStep={handleNextStep}
          />
        )}

        {currentStep === 2 && (
          <PaymentMethod
            paymentInfo={paymentInfo}
            handlePaymentInfoChange={handlePaymentInfoChange}
            handlePrevStep={() => setCurrentStep(1)}
            handleConfirmPayment={handleConfirmPayment}
            isSubmitting={isSubmitting}
          />
        )}

        {currentStep === 3 && paymentInfo.paymentMethod === "banking" && (
          <section className="dashboard-panel">
            <div className="dashboard-panel-header">
              <h2 className="dashboard-panel-title">
                <span className="dashboard-panel-title-dot" />
                Quet ma QR
              </h2>
            </div>
            <div className="dashboard-panel-body" style={{ textAlign: "center" }}>
              {qrUrl ? (
                <>
                  <img
                    src={qrUrl}
                    alt="QR thanh toan"
                    style={{ maxWidth: 320, width: "100%", borderRadius: 24 }}
                  />
                  <p className="dashboard-subtitle" style={{ marginTop: 16 }}>
                    Sau khi chuyen khoan xong, bam xac nhan de hoan tat.
                  </p>
                  <div className="dashboard-form-actions" style={{ justifyContent: "center" }}>
                    <button
                      type="button"
                      className="dashboard-btn dashboard-btn-primary"
                      onClick={handleBankingConfirmed}
                    >
                      <FaCheckCircle />
                      Toi da thanh toan
                    </button>
                  </div>
                </>
              ) : (
                <div className="dashboard-empty">Dang tao ma QR...</div>
              )}
            </div>
          </section>
        )}

        {currentStep === 4 && (
          <section className="dashboard-panel">
            <div className="dashboard-empty">
              <div className="commerce-empty-icon">
                <FaCheckCircle />
              </div>
              <h3>Thanh toan thanh cong</h3>
              <p>Don hang cua ban da duoc ghi nhan va dang cho xu ly.</p>
              <div className="dashboard-form-actions" style={{ justifyContent: "center" }}>
                <button
                  type="button"
                  className="dashboard-btn dashboard-btn-primary"
                  onClick={handleFinish}
                >
                  Ve trang san pham
                </button>
              </div>
            </div>
          </section>
        )}
      </div>

      <Modal show={showMapModal} onHide={() => setShowMapModal(false)} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>
            <FaMapMarkedAlt style={{ marginRight: 8 }} />
            Chon dia chi tren ban do
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="commerce-map" style={{ height: 420 }}>
            <MapContainer center={DEFAULT_POSITION} zoom={13} style={{ height: "100%", width: "100%" }}>
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org">OpenStreetMap</a>'
              />
              {selectedPosition && (
                <Marker position={selectedPosition}>
                  <Popup>Vi tri giao hang</Popup>
                </Marker>
              )}
              <MapClickHandler />
            </MapContainer>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowMapModal(false)}>
            Dong
          </Button>
          <Button
            variant="primary"
            disabled={!paymentInfo.address}
            onClick={() => setShowMapModal(false)}
          >
            Xac nhan dia chi
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default PaymentPage;
