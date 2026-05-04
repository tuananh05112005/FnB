import {
  FaArrowLeft,
  FaCheckCircle,
  FaCreditCard,
  FaLock,
  FaMoneyBillWave,
} from "react-icons/fa";

const PaymentMethod = ({
  paymentInfo,
  handlePaymentInfoChange,
  handlePrevStep,
  handleConfirmPayment,
  isSubmitting,
}) => (
  <section className="dashboard-panel">
    <div className="dashboard-panel-header">
      <h2 className="dashboard-panel-title">
        <span className="dashboard-panel-title-dot" />
        <FaLock />
        Phuong thuc thanh toan
      </h2>
    </div>
    <div className="dashboard-panel-body">
      <div className="dashboard-card-grid">
        <label className="dashboard-mini-card" style={{ cursor: "pointer" }}>
          <input
            type="radio"
            name="paymentMethod"
            value="cash"
            checked={paymentInfo.paymentMethod === "cash"}
            onChange={handlePaymentInfoChange}
            style={{ marginRight: 10 }}
          />
          <FaMoneyBillWave style={{ color: "#16a34a" }} />
          <h4>Thanh toan tien mat</h4>
          <p>Thanh toan khi nhan hang.</p>
        </label>

        <label className="dashboard-mini-card" style={{ cursor: "pointer" }}>
          <input
            type="radio"
            name="paymentMethod"
            value="banking"
            checked={paymentInfo.paymentMethod === "banking"}
            onChange={handlePaymentInfoChange}
            style={{ marginRight: 10 }}
          />
          <FaCreditCard style={{ color: "#2563eb" }} />
          <h4>Chuyen khoan ngan hang</h4>
          <p>Quet QR va xac nhan thanh toan.</p>
        </label>
      </div>

      <div className="dashboard-form-actions">
        <button
          type="button"
          className="dashboard-btn dashboard-btn-secondary"
          onClick={handlePrevStep}
        >
          <FaArrowLeft />
          Quay lai
        </button>
        <button
          type="button"
          className="dashboard-btn dashboard-btn-primary"
          onClick={handleConfirmPayment}
          disabled={isSubmitting}
        >
          {isSubmitting ? "Dang xu ly..." : <><FaCheckCircle /> Xac nhan thanh toan</>}
        </button>
      </div>
    </div>
  </section>
);

export default PaymentMethod;
