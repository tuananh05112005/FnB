// ==============================================================
// TÊN FILE: PaymentMethod.js
// MÔ TẢ: Hợp phần lựa chọn phương thức thanh toán.
//        - Cung cấp 2 lựa chọn: Tiền mặt (Cash) và Chuyển khoản (Banking).
//        - Hiển thị các nút quay lại bước cũ hoặc xác nhận thanh toán/đặt hàng.
// ==============================================================

import {
  FaArrowLeft,
  FaCheckCircle,
  FaCreditCard,
  FaLock,
  FaMoneyBillWave,
} from "react-icons/fa";

// Component hiển thị các phương thức thanh toán
const PaymentMethod = ({
  paymentInfo,              // Đối tượng chứa thông tin thanh toán (paymentMethod)
  handlePaymentInfoChange,  // Hàm xử lý khi thay đổi phương thức thanh toán qua radio button
  handlePrevStep,           // Hàm quay lại bước nhập thông tin trước đó
  handleConfirmPayment,     // Hàm xử lý xác nhận đặt hàng và thanh toán
  isSubmitting,             // Trạng thái đang gửi yêu cầu lên server
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
