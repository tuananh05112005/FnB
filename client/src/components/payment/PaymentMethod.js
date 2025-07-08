import {
  FaCreditCard,
  FaMoneyBillWave,
  FaCheckCircle,
  FaArrowLeft,
  FaLock,
} from "react-icons/fa";

const PaymentMethod = ({
  paymentInfo,
  handlePaymentInfoChange,
  handlePrevStep,
  handleConfirmPayment,
  isSubmitting,
  qrUrl,
}) => {
  return (
    <div className="card border-0 shadow-sm">
      <div className="card-header bg-light py-3">
        <h5 className="mb-0">
          <FaLock className="me-2 text-success" />
          Phương thức thanh toán
        </h5>
      </div>
      <div className="card-body p-4">
        <div className="mb-4">
          <div className="form-check mb-3">
            <input
              className="form-check-input"
              type="radio"
              name="paymentMethod"
              id="cashPayment"
              value="cash"
              checked={paymentInfo.paymentMethod === "cash"}
              onChange={handlePaymentInfoChange}
            />
            <label
              className="form-check-label d-flex align-items-center"
              htmlFor="cashPayment"
            >
              <div className="bg-light p-2 rounded-circle me-3">
                <FaMoneyBillWave className="text-success" size={24} />
              </div>
              <div>
                <p className="mb-0 fw-bold">Thanh toán tiền mặt</p>
                <p className="text-muted small mb-0">
                  Thanh toán khi nhận hàng (COD)
                </p>
              </div>
            </label>
          </div>
          <div className="form-check">
            <input
              className="form-check-input"
              type="radio"
              name="paymentMethod"
              id="bankingPayment"
              value="banking"
              checked={paymentInfo.paymentMethod === "banking"}
              onChange={handlePaymentInfoChange}
            />
            <label
              className="form-check-label d-flex align-items-center"
              htmlFor="bankingPayment"
            >
              <div className="bg-light p-2 rounded-circle me-3">
                <FaCreditCard className="text-success" size={24} />
              </div>
              <div>
                <p className="mb-0 fw-bold">Chuyển khoản ngân hàng</p>
                <p className="text-muted small mb-0">
                  Thanh toán qua tài khoản ngân hàng
                </p>
              </div>
            </label>
          </div>
        </div>

        {/* Hiển thị QR nếu chọn banking và đã có URL */}
        {paymentInfo.paymentMethod === "banking" && qrUrl && (
          <div className="text-center mb-4">
            <img src={qrUrl} alt="VietQR Code" style={{ maxWidth: 300 }} />
            <p className="text-muted mt-2">Quét mã để chuyển khoản nhanh</p>
          </div>
        )}

        <div className="row mt-4">
          <div className="col-6">
            <button
              type="button"
              className="btn btn-outline-secondary w-100 py-3"
              onClick={handlePrevStep}
            >
              <FaArrowLeft className="me-2" />
              Quay lại
            </button>
          </div>
          <div className="col-6">
            <button
              type="button"
              className="btn btn-success w-100 py-3"
              onClick={handleConfirmPayment}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <span
                    className="spinner-border spinner-border-sm me-2"
                    role="status"
                  ></span>
                  Đang xử lý...
                </>
              ) : (
                <>
                  <FaCheckCircle className="me-2" />
                  Xác nhận thanh toán
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentMethod;
