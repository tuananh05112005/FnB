import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaHeart, FaRegHeart, FaCartPlus, FaStar,
  FaShoppingBag, FaTrash,
} from "react-icons/fa";

import ProductImage from "../components/common/ProductImage";
import { api } from "../lib/api";
import { getUserId } from "../lib/session";
import { addToCart } from "../services/cartService";
import "../styles/dashboard.css";
import "../styles/commerce.css";

const fmt = (n) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", minimumFractionDigits: 0 }).format(Number(n) || 0);

/* ── Skeleton card ─────────────────────────────────────────────── */
function SkeletonCard() {
  return (
    <div className="commerce-skeleton">
      <div className="commerce-skeleton-img">
        <div className="skeleton" style={{ width: "100%", height: "100%" }} />
      </div>
      <div className="commerce-skeleton-body">
        <div className="skeleton" style={{ height: 10, width: "45%" }} />
        <div className="skeleton" style={{ height: 16, width: "80%" }} />
        <div className="skeleton" style={{ height: 12, width: "60%" }} />
        <div className="skeleton" style={{ height: 14, width: "40%", marginTop: 8 }} />
      </div>
    </div>
  );
}

const FavoriteProducts = () => {
  const navigate = useNavigate();
  const userId = getUserId();

  const [products, setProducts] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState("");
  const [toast,    setToast]    = useState("");
  const [adding,   setAdding]   = useState(null); // product id being added

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(""), 2200); };

  useEffect(() => {
    if (!userId) { navigate("/login"); return; }
    api.get(`/api/favorites/${userId}`)
      .then((r) => setProducts(Array.isArray(r.data) ? r.data : []))
      .catch(() => setError("Không thể tải danh sách yêu thích lúc này."))
      .finally(() => setLoading(false));
  }, [navigate, userId]);

  const handleRemoveFavorite = async (productId, productName) => {
    try {
      await api.delete("/api/favorites", { data: { user_id: userId, product_id: productId } });
      setProducts((prev) => prev.filter((p) => p.id !== productId));
      showToast(`❌ Đã bỏ yêu thích "${productName}"`);
    } catch {
      setError("Không thể cập nhật danh sách yêu thích.");
    }
  };

  const handleAddToCart = async (product) => {
    try {
      setAdding(product.id);
      await addToCart(userId, product.id, 1, product.size || "M");
      showToast(`✅ Đã thêm "${product.name}" vào giỏ!`);
    } catch {
      setError("Không thể thêm sản phẩm vào giỏ hàng.");
    } finally {
      setAdding(null);
    }
  };

  /* ── Stat: total value of favorites ── */
  const totalValue = products.reduce((s, p) => s + Number(p.price || 0), 0);

  return (
    <div className="dashboard-page">
      {/* Toast */}
      {toast && (
        <div style={{
          position: "fixed", top: 80, right: 24, zIndex: 9999,
          background: "var(--color-surface)", border: "1px solid var(--color-border)",
          borderRadius: "var(--radius-md)", padding: "12px 20px",
          boxShadow: "var(--shadow-lg)", fontSize: "0.9rem", fontWeight: 600,
          color: "var(--color-text)", animation: "fadeInDown 0.3s ease",
        }}>
          {toast}
        </div>
      )}

      <div className="dashboard-shell">

        {/* ── Header ── */}
        <div className="dashboard-header animate-fadeInUp">
          <div className="dashboard-title-wrap">
            <div className="dashboard-icon" style={{ color: "var(--color-rose)" }}>
              <FaHeart />
            </div>
            <div>
              <h1 className="dashboard-title">Sản phẩm yêu thích</h1>
              <p className="dashboard-subtitle">Những món bạn đã lưu để quay lại nhanh hơn</p>
            </div>
          </div>
          <button className="dashboard-btn dashboard-btn-primary" style={{ borderRadius: "var(--radius-pill)" }} onClick={() => navigate("/products")}>
            <FaShoppingBag /> Khám phá thêm
          </button>
        </div>

        {/* ── Stats bar ── */}
        {!loading && products.length > 0 && (
          <div className="animate-fadeInUp animate-delay-1" style={{
            display: "flex", gap: "var(--space-4)", flexWrap: "wrap",
          }}>
            {[
              { icon: "❤️", label: "Đã lưu", value: `${products.length} sản phẩm` },
              { icon: "💰", label: "Tổng giá trị",  value: fmt(totalValue) },
              { icon: "⭐", label: "Đánh giá TB",   value: "4.2 / 5.0" },
            ].map((s) => (
              <div key={s.label} style={{
                flex: "1 1 160px", background: "var(--color-surface)",
                border: "1px solid var(--color-border-light)",
                borderRadius: "var(--radius-md)", padding: "var(--space-4) var(--space-5)",
                boxShadow: "var(--shadow-xs)", display: "flex", alignItems: "center", gap: "var(--space-3)",
              }}>
                <span style={{ fontSize: "1.6rem" }}>{s.icon}</span>
                <div>
                  <div style={{ fontSize: "0.68rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--color-text-faint)", marginBottom: 2 }}>{s.label}</div>
                  <div style={{ fontFamily: "var(--app-font-display)", fontWeight: 800, fontSize: "0.95rem", color: "var(--color-text)" }}>{s.value}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {error && (
          <div className="auth-alert auth-alert-danger animate-fadeIn">
            <span>⚠️</span> {error}
          </div>
        )}

        {/* ── Loading skeletons ── */}
        {loading && (
          <div className="commerce-grid">
            {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        )}

        {/* ── Empty state ── */}
        {!loading && products.length === 0 && (
          <section className="dashboard-panel">
            <div className="commerce-empty">
              <div style={{ fontSize: "3.5rem", marginBottom: "var(--space-4)" }}>💝</div>
              <h3>Danh sách yêu thích đang trống</h3>
              <p>Hãy khám phá sản phẩm và lưu những món bạn thích để quay lại nhanh hơn.</p>
              <button className="auth-submit-btn" style={{ width: "auto", padding: "0 32px", height: 48, borderRadius: "var(--radius-pill)" }}
                onClick={() => navigate("/products")}>
                <FaShoppingBag /> Khám phá ngay
              </button>
            </div>
          </section>
        )}

        {/* ── Product grid ── */}
        {!loading && products.length > 0 && (
          <div className="commerce-grid animate-fadeInUp animate-delay-2">
            {products.map((product) => {
              const available = product.is_available !== false && product.status !== "unavailable";
              return (
                <article key={product.id} className="commerce-card">
                  {/* Image */}
                  <div className="commerce-card-img-wrap"
                    onClick={() => navigate(`/products/${product.id}`)}
                    style={{ cursor: "pointer" }}>
                    <ProductImage
                      src={product.image}
                      alt={product.name}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />

                    {/* Status badge */}
                    <span className={`commerce-badge ${!available ? "commerce-badge-unavailable" : ""}`}>
                      {available ? "Đang bán" : "Hết món"}
                    </span>

                    {/* Remove favorite button */}
                    <button
                      type="button"
                      className="commerce-fav-btn active"
                      title="Bỏ yêu thích"
                      onClick={(e) => { e.stopPropagation(); handleRemoveFavorite(product.id, product.name); }}
                    >
                      <FaHeart />
                    </button>
                  </div>

                  {/* Body */}
                  <div className="commerce-card-body">
                    <div className="commerce-card-category">
                      {product.category || "Đồ uống"}
                    </div>

                    <h3 className="commerce-card-name" onClick={() => navigate(`/products/${product.id}`)} style={{ cursor: "pointer" }}>
                      {product.name}
                    </h3>

                    {/* Rating */}
                    <div className="commerce-rating">
                      <div className="commerce-rating-stars">
                        {[1,2,3,4,5].map((s) => (
                          <FaStar key={s} size={11} opacity={s <= 4 ? 1 : 0.25} />
                        ))}
                      </div>
                      <span className="commerce-rating-count">4.0</span>
                    </div>

                    {/* Description */}
                    {product.description && (
                      <p style={{ margin: 0, fontSize: "0.78rem", color: "var(--color-text-faint)", lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                        {product.description}
                      </p>
                    )}

                    {/* Size badge */}
                    {product.size && (
                      <span className="dashboard-badge dashboard-badge-neutral" style={{ fontSize: "0.68rem", alignSelf: "flex-start" }}>
                        Size {product.size}
                      </span>
                    )}

                    {/* Footer: price + buttons */}
                    <div className="commerce-card-footer">
                      <span style={{
                        fontFamily: "var(--app-font-display)", fontWeight: 800,
                        fontSize: "1rem", color: "var(--color-brand-dark)",
                      }}>
                        {fmt(product.price)}
                      </span>

                      <div style={{ display: "flex", gap: 6 }}>
                        {/* View detail */}
                        <button
                          type="button"
                          title="Xem chi tiết"
                          onClick={() => navigate(`/products/${product.id}`)}
                          style={{
                            width: 34, height: 34, borderRadius: "50%",
                            background: "var(--color-bg-alt)", border: "1.5px solid var(--color-border)",
                            color: "var(--color-text-muted)", cursor: "pointer", fontSize: 13,
                            display: "flex", alignItems: "center", justifyContent: "center",
                            transition: "all var(--transition-fast)",
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--color-brand)"; e.currentTarget.style.color = "var(--color-brand)"; }}
                          onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--color-border)"; e.currentTarget.style.color = "var(--color-text-muted)"; }}
                        >
                          👁
                        </button>

                        {/* Add to cart */}
                        <button
                          type="button"
                          className="commerce-add-btn"
                          title="Thêm vào giỏ"
                          disabled={!available || adding === product.id}
                          onClick={() => handleAddToCart(product)}
                        >
                          {adding === product.id ? "⏳" : <FaCartPlus size={14} />}
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {/* ── Bulk actions bar (bottom) ── */}
        {!loading && products.length > 0 && (
          <div className="animate-fadeInUp animate-delay-3" style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            padding: "var(--space-4) var(--space-5)",
            background: "var(--color-surface)", border: "1px solid var(--color-border-light)",
            borderRadius: "var(--radius-md)", boxShadow: "var(--shadow-xs)",
          }}>
            <span style={{ fontSize: "0.85rem", color: "var(--color-text-muted)", fontWeight: 600 }}>
              ❤️ {products.length} sản phẩm yêu thích
            </span>
            <div style={{ display: "flex", gap: "var(--space-3)" }}>
              <button className="dashboard-btn dashboard-btn-secondary" style={{ borderRadius: "var(--radius-pill)", fontSize: "0.8rem" }}
                onClick={() => navigate("/products")}>
                <FaShoppingBag size={13} /> Thêm sản phẩm
              </button>
              <button className="dashboard-btn dashboard-btn-danger" style={{ borderRadius: "var(--radius-pill)", fontSize: "0.8rem" }}
                onClick={async () => {
                  if (!window.confirm("Bạn muốn xóa toàn bộ danh sách yêu thích?")) return;
                  for (const p of products) {
                    await api.delete("/api/favorites", { data: { user_id: userId, product_id: p.id } }).catch(() => {});
                  }
                  setProducts([]);
                  showToast("🗑️ Đã xóa toàn bộ yêu thích");
                }}>
                <FaTrash size={13} /> Xóa tất cả
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default FavoriteProducts;
