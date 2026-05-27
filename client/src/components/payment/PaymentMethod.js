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
  <div className="payment-method-panel">
    <div className="payment-section-kicker">
      <FaLock />
      Phuong thuc thanh toan
    </div>

    <div className="payment-method-grid">
      <label className={`payment-method-option ${paymentInfo.paymentMethod === "cash" ? "active" : ""}`}>
        <input
          type="radio"
          name="paymentMethod"
          value="cash"
          checked={paymentInfo.paymentMethod === "cash"}
          onChange={handlePaymentInfoChange}
        />
        <span className="payment-method-icon payment-method-icon-cash">
          <FaMoneyBillWave />
        </span>
        <span>
          <strong>Thanh toan tien mat</strong>
          <small>Thanh toan khi nhan hang.</small>
        </span>
      </label>

      <label className={`payment-method-option ${paymentInfo.paymentMethod === "banking" ? "active" : ""}`}>
        <input
          type="radio"
          name="paymentMethod"
          value="banking"
          checked={paymentInfo.paymentMethod === "banking"}
          onChange={handlePaymentInfoChange}
        />
        <span className="payment-method-icon payment-method-icon-bank">
          <FaCreditCard />
        </span>
        <span>
          <strong>Chuyen khoan ngan hang</strong>
          <small>Quet QR, noi dung duoc dien san.</small>
        </span>
      </label>
    </div>

    <div className="payment-actions">
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
);

export default PaymentMethod;
