// ==============================================================
// TÊN FILE: ProductInfo.js
// MÔ TẢ: Hợp phần hiển thị thông tin tóm tắt sản phẩm trong quá trình thanh toán.
//        - Hiển thị ảnh, tên món, mã món, số lượng, đơn giá và tổng số tiền món đó.
// ==============================================================

import { FaShoppingCart } from "react-icons/fa";

import ProductImage from "../common/ProductImage";

// Hàm tiện ích định dạng tiền tệ sang VND
const formatCurrency = (amount) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(Number(amount) || 0);

// Component hiển thị tóm tắt sản phẩm thanh toán
const ProductInfo = ({ item, items }) => {
  if (items && items.length > 0) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
        {items.map((it) => (
          <div key={it.id} className="payment-product-summary" style={{ marginBottom: 0, paddingBottom: "var(--space-3)", borderBottom: "1px dashed var(--color-border-light)" }}>
            <ProductImage
              src={it.image}
              alt={it.name || "Sản phẩm"}
              className="payment-product-image"
            />
            <div className="payment-product-copy">
              <div className="payment-section-kicker">
                <FaShoppingCart />
                Món ăn/Thức uống
              </div>
              <h3 className="payment-product-title">{it.name}</h3>
              <p className="payment-product-code">
                Mã: {it.product_id || it.id} | Size: {it.size || "M"}
              </p>
              <div className="payment-product-meta">
                <span>Số lượng: {it.quantity}</span>
                <span>Đơn giá: {formatCurrency(it.price)}</span>
                <strong>Tổng: {formatCurrency(Number(it.price) * Number(it.quantity))}</strong>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
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
};

export default ProductInfo;
