// [IMPORT giữ nguyên như bạn có]
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { FaArrowLeft } from "react-icons/fa";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Modal, Button } from "react-bootstrap";

import ProductInfo from "../components/payment/ProductInfo";
import DeliveryForm from "../components/payment/DeliveryForm";
import PaymentMethod from "../components/payment/PaymentMethod";
import ProgressBar from "../components/payment/ProgressBar";

// Cấu hình icon Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require("leaflet/dist/images/marker-icon-2x.png"),
  iconUrl: require("leaflet/dist/images/marker-icon.png"),
  shadowUrl: require("leaflet/dist/images/marker-shadow.png"),
});

const PaymentPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { item } = location.state || {};
  const user_id = localStorage.getItem("user_id");

  const [paymentInfo, setPaymentInfo] = useState({
    name: "",
    address: "",
    phone: "",
    paymentMethod: "cash",
  });
  const [orderSaved, setOrderSaved] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showMapModal, setShowMapModal] = useState(false);
  const [position] = useState([10.762622, 106.660172]);
  const [selectedPosition, setSelectedPosition] = useState(null);
  const [qrUrl, setQrUrl] = useState("");

  useEffect(() => {
    if (!item) navigate("/cart");
  }, [item, navigate]);

  const handlePaymentInfoChange = (e) => {
    const { name, value } = e.target;
    setPaymentInfo((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleOpenMap = () => setShowMapModal(true);
  const handleConfirmAddress = () => {
    if (paymentInfo.address) setShowMapModal(false);
    else alert("Vui lòng chọn vị trí trên bản đồ");
  };

  const updateAddressFromMap = (address) => {
    setPaymentInfo((prev) => ({
      ...prev,
      address,
    }));
  };

  function MapClickHandler({ setAddress }) {
    useMapEvents({
      click(e) {
        const { lat, lng } = e.latlng;
        setSelectedPosition([lat, lng]);

        fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`)
          .then((res) => res.json())
          .then((data) => {
            const address = data.display_name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
            setAddress(address);
          })
          .catch(() => {
            setAddress(`${lat.toFixed(4)}, ${lng.toFixed(4)}`);
          });
      },
    });
    return null;
  }

  const handleNextStep = () => {
    if (!paymentInfo.name || !paymentInfo.address || !paymentInfo.phone) {
      alert("Vui lòng điền đầy đủ thông tin");
      return;
    }
    if (paymentInfo.address.length < 10) {
      alert("Địa chỉ chưa đủ chi tiết");
      return;
    }
    setCurrentStep(2);
  };

  const handlePrevStep = () => setCurrentStep(1);

  const handleConfirmPayment = async () => {
    setIsSubmitting(true);
    try {
      const body = {
        user_id: user_id || 1,
        product_id: item.product_id,
        name: paymentInfo.name,
        address: paymentInfo.address,
        phone: paymentInfo.phone,
        payment_method: paymentInfo.paymentMethod,
        amount: item.price * item.quantity,
        status: "completed", // ✅ thêm dòng này
      };

      if (paymentInfo.paymentMethod === "banking") {
        const res = await axios.post("http://localhost:5000/api/payments", {
          ...body,
          generateQR: true,
        });
        setQrUrl(res.data.qrUrl);
        setCurrentStep(3);
      } else {
        const res = await axios.post("http://localhost:5000/api/payments", body);
        alert(`Đơn hàng đã được ghi nhận. Mã đơn: #${res.data.orderId}`);
        setOrderSaved(true);
        setCurrentStep(4);
      }
    } catch (err) {
      alert("Lỗi khi xử lý thanh toán");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBankingConfirmed = async () => {
    if (!orderSaved) {
      try {
        const res = await axios.post("http://localhost:5000/api/payments", {
          user_id: user_id || 1,
          product_id: item.product_id,
          name: paymentInfo.name,
          address: paymentInfo.address,
          phone: paymentInfo.phone,
          payment_method: paymentInfo.paymentMethod,
          amount: item.price * item.quantity,
          status: "completed",
        });
        alert(`Đã ghi nhận thanh toán. Mã đơn: #${res.data.orderId}`);
        setOrderSaved(true);
      } catch (e) {
        alert("Lỗi khi ghi nhận thanh toán.");
      }
    }
    setCurrentStep(4);
  };

  const handleFinish = () => {
    setQrUrl("");
    setPaymentInfo({
      name: "",
      address: "",
      phone: "",
      paymentMethod: "cash",
    });
    setOrderSaved(false);
    setCurrentStep(1);
    alert("Cảm ơn bạn đã thanh toán!");
    navigate("/products");
  };

  const renderSuccess = () => (
    <div className="card border p-4 text-center">
      <h2 className="text-xl font-bold mb-4 text-green-600">
        🎉 Thanh toán thành công!
      </h2>
      <p className="mb-4">
        Đơn hàng của bạn đã được ghi nhận. Cảm ơn bạn đã mua hàng!
      </p>
      <button
        className="bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded"
        onClick={handleFinish}
      >
        Hoàn tất
      </button>
    </div>
  );

  if (!item) {
    return <div className="text-center">Không có sản phẩm nào trong giỏ hàng.</div>;
  }

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-lg-10">
          <div className="d-flex align-items-center mb-4">
            <button
              className="btn btn-light rounded-circle me-3 shadow-sm"
              onClick={() => navigate(-1)}
            >
              <FaArrowLeft />
            </button>
            <h2 className="mb-0">Thanh toán</h2>
          </div>

          <ProgressBar currentStep={currentStep} />

          {currentStep < 3 && <ProductInfo item={item} />}

          {currentStep === 1 && (
            <DeliveryForm
              paymentInfo={paymentInfo}
              handleOpenMap={handleOpenMap}
              handleNextStep={handleNextStep}
              handlePaymentInfoChange={handlePaymentInfoChange}
            />
          )}

          {currentStep === 2 && (
            <PaymentMethod
              paymentInfo={paymentInfo}
              handleConfirmPayment={handleConfirmPayment}
              handlePrevStep={handlePrevStep}
              isSubmitting={isSubmitting}
              handlePaymentInfoChange={handlePaymentInfoChange}
              qrUrl={qrUrl}
            />
          )}

          {currentStep === 3 && paymentInfo.paymentMethod === "banking" && qrUrl && (
            <div className="text-center">
              <h4 className="mb-3">Quét mã QR để thanh toán</h4>
              <img src={qrUrl} alt="QR" style={{ maxWidth: 300 }} />
              <p className="text-muted mt-2">
                Sau khi chuyển khoản, nhấn nút bên dưới để hoàn tất
              </p>
              <button
                onClick={handleBankingConfirmed}
                className="btn btn-success mt-3"
              >
                Tôi đã thanh toán
              </button>
            </div>
          )}

          {currentStep === 4 && renderSuccess()}
        </div>
      </div>

      {/* Modal bản đồ */}
      <Modal
        show={showMapModal}
        onHide={() => setShowMapModal(false)}
        size="lg"
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Chọn địa chỉ trên bản đồ</Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ height: "400px" }}>
          <MapContainer center={position} zoom={13} style={{ height: "100%", width: "100%" }}>
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org">OpenStreetMap</a>'
            />
            {selectedPosition && (
              <Marker position={selectedPosition}>
                <Popup>Vị trí giao hàng</Popup>
              </Marker>
            )}
            <MapClickHandler setAddress={updateAddressFromMap} />
          </MapContainer>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowMapModal(false)}>Hủy</Button>
          <Button variant="primary" onClick={handleConfirmAddress} disabled={!paymentInfo.address}>
            Xác nhận địa chỉ
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default PaymentPage;
