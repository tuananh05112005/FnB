import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { FaTimes, FaPlus, FaMinus, FaShoppingBag } from "react-icons/fa";
import { api } from "../../lib/api";
import "./ProductCustomizationModal.css";

const fmt = (v) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", minimumFractionDigits: 0 }).format(v || 0);

const ProductCustomizationModal = ({ product, onClose, onConfirm }) => {
  const availableSizes = product.size
    ? product.size.split(",").map((s) => s.trim().toUpperCase()).filter(Boolean)
    : [];

  const finalSizes = availableSizes.length > 0
    ? ["S", "M", ...(availableSizes.includes("L") ? ["L"] : [])]
    : [];

  const [quantity, setQuantity] = useState(product.initialQty || 1);
  const [sugar, setSugar] = useState("100% đường");
  const [ice, setIce] = useState("100% đá");
  const [size, setSize] = useState(
    finalSizes.includes("M")
      ? "M"
      : (finalSizes[0] || "M")
  );
  const [toppings, setToppings] = useState([]);
  const [selectedToppings, setSelectedToppings] = useState([]);
  const [accompaniments, setAccompaniments] = useState([]);
  const [selectedAccompaniments, setSelectedAccompaniments] = useState([]);
  const [loadingToppings, setLoadingToppings] = useState(true);
  const [loadingAcc, setLoadingAcc] = useState(true);

  // Tải danh sách toppings
  useEffect(() => {
    api.get("/api/products?category=topping")
      .then((res) => {
        setToppings(res.data || []);
      })
      .catch((err) => console.error("Lỗi tải topping:", err))
      .finally(() => setLoadingToppings(false));
  }, []);

  // Tải danh sách bánh đi kèm
  useEffect(() => {
    api.get("/api/products?category=bánh")
      .then((res) => {
        setAccompaniments(res.data || []);
      })
      .catch((err) => console.error("Lỗi tải bánh đi kèm:", err))
      .finally(() => setLoadingAcc(false));
  }, []);

  const handleToppingChange = (item, checked) => {
    if (checked) {
      setSelectedToppings((prev) => [...prev, { id: item.id, name: item.name, price: item.price }]);
    } else {
      setSelectedToppings((prev) => prev.filter((t) => t.id !== item.id));
    }
  };

  const handleAccompanimentChange = (item, checked) => {
    if (checked) {
      setSelectedAccompaniments((prev) => [...prev, { id: item.id, name: item.name, price: item.price }]);
    } else {
      setSelectedAccompaniments((prev) => prev.filter((a) => a.id !== item.id));
    }
  };

  const sizeIndex = finalSizes.indexOf(size);
  const sizePriceAdjustment = sizeIndex > 0 ? sizeIndex * 7000 : 0;

  const toppingPriceTotal = selectedToppings.reduce((sum, t) => sum + Number(t.price), 0);
  const unitPrice = Number(product.price) + toppingPriceTotal + sizePriceAdjustment;
  const totalPrice = unitPrice * quantity;

  const handleConfirmSubmit = () => {
    onConfirm({
      product,
      quantity,
      sugar,
      ice,
      size,
      toppings: selectedToppings,
      accompaniments: selectedAccompaniments
    });
  };

  return createPortal(
    <div className="custom-modal-overlay animate-fadeIn" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="custom-modal-container animate-scaleIn">
        {/* Drag handle pill for mobile bottom sheets */}
        <div className="bottom-sheet-handle" />
        {/* Header */}
        <div className="custom-modal-header">
          <h3>Tùy chỉnh thức uống</h3>
          <button type="button" className="close-btn" onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        {/* Content */}
        <div className="custom-modal-body">
          {/* Product Summary */}
          <div className="product-summary">
            <div className="product-sum-img">
              <img
                src={product.image}
                alt={product.name}
                onError={(e) => {
                  e.currentTarget.src = "https://via.placeholder.com/150?text=Drink";
                }}
              />
            </div>
            <div className="product-sum-info">
              <h4>{product.name}</h4>
              <p className="product-sum-price">{fmt(product.price)}</p>
              {product.description && <p className="product-sum-desc">{product.description}</p>}
            </div>
          </div>

          {/* Options */}
          <div className="custom-sections">
            {/* Chọn size */}
            {finalSizes.length > 0 && (
              <div className="custom-section">
                <h5 className="section-title">Chọn kích cỡ (Size)</h5>
                <div className="pills-grid">
                  {finalSizes.map((sz, idx) => {
                    const extraPrice = idx > 0 ? idx * 7000 : 0;
                    return (
                      <button
                        key={sz}
                        type="button"
                        className={`pill-btn ${size === sz ? "active" : ""}`}
                        onClick={() => setSize(sz)}
                      >
                        Size {sz} {extraPrice > 0 ? `(+${fmt(extraPrice)})` : ""}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Lượng đường */}
            <div className="custom-section">
              <h5 className="section-title">Chọn lượng đường</h5>
              <div className="pills-grid">
                {["100% đường", "70% đường", "50% đường", "30% đường", "0% đường (Không đường)"].map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    className={`pill-btn ${sugar === opt ? "active" : ""}`}
                    onClick={() => setSugar(opt)}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            {/* Lượng đá */}
            <div className="custom-section">
              <h5 className="section-title">Chọn lượng đá</h5>
              <div className="pills-grid">
                {["100% đá", "70% đá", "50% đá", "30% đá", "0% đá (Không đá)"].map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    className={`pill-btn ${ice === opt ? "active" : ""}`}
                    onClick={() => setIce(opt)}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            {/* Topping đi kèm */}
            <div className="custom-section">
              <h5 className="section-title">Thêm Topping</h5>
              {loadingToppings ? (
                <div className="loader-text">Đang tải topping...</div>
              ) : toppings.length === 0 ? (
                <div className="empty-text">Không có topping khả dụng.</div>
              ) : (
                <div className="checklist">
                  {toppings.map((item) => (
                    <label key={item.id} className="check-item">
                      <input
                        type="checkbox"
                        checked={selectedToppings.some((t) => t.id === item.id)}
                        onChange={(e) => handleToppingChange(item, e.target.checked)}
                      />
                      <span className="check-label">
                        <span className="item-name">{item.name}</span>
                        <span className="item-price">+{fmt(item.price)}</span>
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Bánh ăn kèm */}
            <div className="custom-section">
              <h5 className="section-title">Món ăn kèm (Bánh)</h5>
              {loadingAcc ? (
                <div className="loader-text">Đang tải món ăn kèm...</div>
              ) : accompaniments.length === 0 ? (
                <div className="empty-text">Không có món ăn kèm nào.</div>
              ) : (
                <div className="checklist">
                  {accompaniments.map((item) => (
                    <label key={item.id} className="check-item">
                      <input
                        type="checkbox"
                        checked={selectedAccompaniments.some((a) => a.id === item.id)}
                        onChange={(e) => handleAccompanimentChange(item, e.target.checked)}
                      />
                      <span className="check-label">
                        <span className="item-name">{item.name}</span>
                        <span className="item-price">+{fmt(item.price)}</span>
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="custom-modal-footer">
          <div className="qty-selector">
            <button
              type="button"
              className="qty-btn"
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              disabled={quantity <= 1}
            >
              <FaMinus />
            </button>
            <span className="qty-val">{quantity}</span>
            <button type="button" className="qty-btn" onClick={() => setQuantity(quantity + 1)}>
              <FaPlus />
            </button>
          </div>

          <button type="button" className="add-to-cart-submit" onClick={handleConfirmSubmit}>
            <FaShoppingBag />
            <span>Thêm vào giỏ · {fmt(totalPrice)}</span>
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ProductCustomizationModal;
