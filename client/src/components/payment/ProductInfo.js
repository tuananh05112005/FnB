import { FaShoppingCart } from "react-icons/fa";
const formatCurrency = (amount) => {
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);
  };


 const ProductInfo = ({item}) => {
    return (
      <div className="card border-0 shadow-sm mb-4 overflow-hidden">
        <div className="card-header bg-light py-3">
          <h5 className="mb-0">
            <FaShoppingCart className="me-2 text-success" />
            Thông tin sản phẩm
          </h5>
        </div>
        <div className="card-body">
          {item && (
            <div className="row align-items-center">
              <div className="col-md-2 text-center mb-3 mb-md-0">
                <div className="bg-light p-3 rounded">
                  <img
                    src={item.image || "https://via.placeholder.com/100"}
                    alt={item.name}
                    className="img-fluid"
                    style={{ maxHeight: "80px", objectFit: "contain" }}
                  />
                </div>
              </div>
              <div className="col-md-6 mb-3 mb-md-0">
                <h5 className="fw-bold mb-1">{item.name}</h5>
                <p className="text-muted small mb-0">Mã sản phẩm: {item.product_id}</p>
                <div className="mt-2">
                  <span className="badge bg-light text-dark me-2">
                    Số lượng: {item.quantity}
                  </span>
                  <span className="badge bg-light text-dark">
                    Đơn giá: {formatCurrency(item.price)}
                  </span>
                </div>
              </div>
              <div className="col-md-4 text-md-end">
                <p className="text-muted mb-1">Tổng tiền:</p>
                <h4 className="text-success fw-bold">
                  {formatCurrency(item.price * item.quantity)}
                </h4>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

export default ProductInfo;