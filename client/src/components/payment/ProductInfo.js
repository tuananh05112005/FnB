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
  const parseToppings = (toppings) => {
    if (!toppings) return [];
    if (Array.isArray(toppings)) return toppings;
    try {
      return JSON.parse(toppings);
    } catch {
      return toppings.split(",").map(t => ({ name: t.trim(), price: 0 }));
    }
  };

  if (items && items.length > 0) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
        {items.map((it) => {
          const toppingsList = parseToppings(it.toppings);
          const toppingsPrice = toppingsList.reduce((sum, t) => sum + Number(t.price || 0), 0);
          const unitPrice = Number(it.price) + toppingsPrice;

          return (
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
                  {(it.sugar || it.ice) && ` | ${it.sugar || ""} ${it.ice ? `| ${it.ice}` : ""}`}
                </p>
                {toppingsList.length > 0 && (
                  <p className="payment-product-code" style={{ marginTop: 2, fontSize: "0.78rem", color: "var(--color-text-muted)" }}>
                    Topping: {toppingsList.map(t => `${t.name} (+${formatCurrency(t.price)})`).join(", ")}
                  </p>
                )}
                <div className="payment-product-meta">
                  <span>Số lượng: {it.quantity}</span>
                  <span>Đơn giá: {formatCurrency(unitPrice)}</span>
                  <strong>Tổng: {formatCurrency(unitPrice * Number(it.quantity))}</strong>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  const toppingsList = parseToppings(item?.toppings);
  const toppingsPrice = toppingsList.reduce((sum, t) => sum + Number(t.price || 0), 0);
  const unitPrice = Number(item?.price || 0) + toppingsPrice;

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
          {(item?.sugar || item?.ice) && ` | ${item?.sugar || ""} ${item?.ice ? `| ${item?.ice}` : ""}`}
        </p>
        {toppingsList.length > 0 && (
          <p className="payment-product-code" style={{ marginTop: 2, fontSize: "0.78rem", color: "var(--color-text-muted)" }}>
            Topping: {toppingsList.map(t => `${t.name} (+${formatCurrency(t.price)})`).join(", ")}
          </p>
        )}
        <div className="payment-product-meta">
          <span>So luong: {item?.quantity}</span>
          <span>Don gia: {formatCurrency(unitPrice)}</span>
          <strong>Tong: {formatCurrency(unitPrice * Number(item?.quantity || 0))}</strong>
        </div>
      </div>
    </div>
  );
};

export default ProductInfo;
