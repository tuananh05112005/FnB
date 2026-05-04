import { FaShoppingCart } from "react-icons/fa";

const formatCurrency = (amount) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(Number(amount) || 0);

const ProductInfo = ({ item }) => (
  <section className="dashboard-panel">
    <div className="dashboard-panel-header">
      <h2 className="dashboard-panel-title">
        <span className="dashboard-panel-title-dot" />
        <FaShoppingCart />
        Thong tin san pham
      </h2>
    </div>
    <div className="dashboard-panel-body">
      <div className="dashboard-product" style={{ alignItems: "stretch" }}>
        <img
          src={item?.image || "https://via.placeholder.com/120"}
          alt={item?.name || "San pham"}
          className="dashboard-thumb"
          style={{ width: 96, height: 96 }}
        />
        <div style={{ flex: 1 }}>
          <h3 className="commerce-product-title">{item?.name}</h3>
          <p className="dashboard-subtitle" style={{ marginTop: 8 }}>
            Ma san pham: {item?.product_id || item?.id}
          </p>
          <div className="commerce-meta" style={{ marginTop: 12 }}>
            <span className="dashboard-badge dashboard-badge-neutral">
              So luong: {item?.quantity}
            </span>
            <span className="dashboard-badge dashboard-badge-info">
              Don gia: {formatCurrency(item?.price)}
            </span>
            <span className="dashboard-badge dashboard-badge-success">
              Tong: {formatCurrency(Number(item?.price) * Number(item?.quantity))}
            </span>
          </div>
        </div>
      </div>
    </div>
  </section>
);

export default ProductInfo;
