import { FaShoppingCart } from "react-icons/fa";

import ProductImage from "../common/ProductImage";

const formatCurrency = (amount) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(Number(amount) || 0);

const ProductInfo = ({ item }) => (
  <div className="payment-product-summary">
    <ProductImage
      src={item?.image}
      alt={item?.name || "San pham"}
      className="payment-product-image"
    />
    <div className="payment-product-copy">
      <div className="payment-section-kicker">
        <FaShoppingCart />
        Thong tin san pham
      </div>
      <h3 className="payment-product-title">{item?.name}</h3>
      <p className="payment-product-code">
        Ma san pham: {item?.product_id || item?.id}
      </p>
      <div className="payment-product-meta">
        <span>So luong: {item?.quantity}</span>
        <span>Don gia: {formatCurrency(item?.price)}</span>
        <strong>Tong: {formatCurrency(Number(item?.price) * Number(item?.quantity))}</strong>
      </div>
    </div>
  </div>
);

export default ProductInfo;
