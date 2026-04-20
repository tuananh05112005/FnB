import { FaUser, FaMapMarkerAlt, FaPhone, FaTruck } from "react-icons/fa";
const DeliveryForm = ({
  paymentInfo,
  handlePaymentInfoChange,
  handleOpenMap,
  handleNextStep}
) => {
  return (
    <div className="card border-0 shadow-sm">
      <div className="card-header bg-light py-3">
        <h5 className="mb-0">
          <FaTruck className="me-2 text-success" />
          Thông tin giao hàng
        </h5>
      </div>
      <div className="card-body p-4">
        <form>
          <div className="mb-4">
            <label htmlFor="name" className="form-label">
              <FaUser className="me-2 text-muted" />
              Tên người nhận
            </label>
            <input
              type="text"
              className="form-control form-control-lg border-0 bg-light"
              id="name"
              name="name"
              placeholder="Nhập tên người nhận"
              value={paymentInfo.name}
              onChange={handlePaymentInfoChange}
              required
            />
          </div>
          <div className="mb-4">
            <label htmlFor="address" className="form-label">
              <FaMapMarkerAlt className="me-2 text-muted" />
              Địa chỉ
            </label>
            <div className="input-group">
              <input
                type="text"
                className="form-control form-control-lg border-0 bg-light"
                id="address"
                name="address"
                placeholder="Nhập địa chỉ giao hàng"
                value={paymentInfo.address}
                onChange={handlePaymentInfoChange}
                required
              />
              <button
                className="btn btn-outline-secondary"
                type="button"
                onClick={handleOpenMap}
              >
                <FaMapMarkerAlt /> Chọn trên bản đồ
              </button>
            </div>
            <small className="text-muted">
              Hoặc click vào nút để chọn địa chỉ trên bản đồ
            </small>
          </div>
          <div className="mb-4">
            <label htmlFor="phone" className="form-label">
              <FaPhone className="me-2 text-muted" />
              Số điện thoại
            </label>
            <input
              type="text"
              className="form-control form-control-lg border-0 bg-light"
              id="phone"
              name="phone"
              placeholder="Nhập số điện thoại liên hệ"
              value={paymentInfo.phone}
              onChange={handlePaymentInfoChange}
              required
            />
          </div>
          <div className="d-grid">
            <button
              type="button"
              className="btn btn-success btn-lg py-3"
              onClick={handleNextStep}
            >
              Tiếp tục
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
export default DeliveryForm;
