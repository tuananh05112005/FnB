import { FaMapMarkerAlt, FaPhone, FaTruck, FaUser } from "react-icons/fa";

const DeliveryForm = ({
  paymentInfo,
  handlePaymentInfoChange,
  handleOpenMap,
  handleNextStep,
}) => (
  <section className="dashboard-panel">
    <div className="dashboard-panel-header">
      <h2 className="dashboard-panel-title">
        <span className="dashboard-panel-title-dot" />
        <FaTruck />
        Thong tin giao hang
      </h2>
    </div>
    <div className="dashboard-panel-body">
      <div className="dashboard-form-grid">
        <div className="dashboard-field">
          <label htmlFor="payment-name">
            <FaUser style={{ marginRight: 8 }} />
            Ten nguoi nhan
          </label>
          <input
            id="payment-name"
            name="name"
            className="dashboard-input"
            value={paymentInfo.name}
            onChange={handlePaymentInfoChange}
            placeholder="Nhap ten nguoi nhan"
          />
        </div>
        <div className="dashboard-field">
          <label htmlFor="payment-phone">
            <FaPhone style={{ marginRight: 8 }} />
            So dien thoai
          </label>
          <input
            id="payment-phone"
            name="phone"
            className="dashboard-input"
            value={paymentInfo.phone}
            onChange={handlePaymentInfoChange}
            placeholder="Nhap so dien thoai"
          />
        </div>
      </div>

      <div className="dashboard-field" style={{ marginTop: 16 }}>
        <label htmlFor="payment-address">
          <FaMapMarkerAlt style={{ marginRight: 8 }} />
          Dia chi nhan hang
        </label>
        <div className="dashboard-toolbar-group">
          <input
            id="payment-address"
            name="address"
            className="dashboard-input"
            value={paymentInfo.address}
            onChange={handlePaymentInfoChange}
            placeholder="Nhap dia chi giao hang"
          />
          <button
            type="button"
            className="dashboard-btn dashboard-btn-secondary"
            onClick={handleOpenMap}
          >
            Chon tren ban do
          </button>
        </div>
      </div>

      <div className="dashboard-form-actions">
        <button
          type="button"
          className="dashboard-btn dashboard-btn-primary"
          onClick={handleNextStep}
        >
          Tiep tuc
        </button>
      </div>
    </div>
  </section>
);

export default DeliveryForm;
