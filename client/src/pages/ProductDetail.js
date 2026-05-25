import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  FaArrowLeft, FaCartPlus, FaHeart, FaRegHeart,
  FaStar, FaShieldAlt, FaTruck, FaLeaf,
} from "react-icons/fa";

import ProductImage from "../components/common/ProductImage";
import { api } from "../lib/api";
import { getUserId } from "../lib/session";
import { addToCart } from "../services/cartService";
import { getProduct, isProductAvailable } from "../services/productService";
import "../styles/dashboard.css";
import "../styles/commerce.css";

const fmt = (n) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(Number(n) || 0);

/* ── Skeleton ─────────────────────────────────────────────────── */
function DetailSkeleton() {
  return (
    <div className="dashboard-page">
      <div className="dashboard-shell">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-8)", padding: "var(--space-6)" }}>
          <div className="skeleton" style={{ borderRadius: "var(--radius-xl)", aspectRatio: "1/1" }} />
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)", paddingTop: "var(--space-4)" }}>
            <div className="skeleton" style={{ height: 12, width: "40%" }} />
            <div className="skeleton" style={{ height: 28, width: "75%" }} />
            <div className="skeleton" style={{ height: 12, width: "55%" }} />
            <div className="skeleton" style={{ height: 40, width: "35%", marginTop: 8 }} />
            <div className="skeleton" style={{ height: 12, width: "90%" }} />
            <div className="skeleton" style={{ height: 12, width: "80%" }} />
            <div className="skeleton" style={{ height: 12, width: "70%" }} />
            <div className="skeleton" style={{ height: 50, width: "100%", marginTop: 16 }} />
          </div>
        </div>
      </div>
    </div>
  );
}

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const userId = getUserId();

  const [product,    setProduct]    = useState(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [error,      setError]      = useState("");
  const [loading,    setLoading]    = useState(true);
  const [addSuccess, setAddSuccess] = useState(false);
  const [quantity,   setQuantity]   = useState(1);

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const [productData, favorites] = await Promise.all([
          getProduct(id),
          userId
            ? api.get(`/api/favorites/${userId}`).then((r) => r.data).catch(() => [])
            : Promise.resolve([]),
        ]);
        setProduct(productData);
        setIsFavorite(favorites.some((item) => String(item.id) === String(id)));
      } catch (e) {
        console.error(e);
        setError("Không thể tải chi tiết sản phẩm.");
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [id, userId]);

  const handleAddToCart = async () => {
    if (!userId) { navigate("/login"); return; }
    try {
      if (!isProductAvailable(product)) { setError("Món này hiện đang hết."); return; }
      await addToCart(userId, product.id, quantity, product.size || "M");
      setAddSuccess(true);
      setTimeout(() => setAddSuccess(false), 2000);
    } catch (e) {
      console.error(e);
      setError("Không thể thêm sản phẩm vào giỏ hàng.");
    }
  };

  const toggleFavorite = async () => {
    if (!userId) { navigate("/login"); return; }
    try {
      if (isFavorite) {
        await api.delete("/api/favorites", { data: { user_id: userId, product_id: product.id } });
      } else {
        await api.post("/api/favorites", { user_id: userId, product_id: product.id });
      }
      setIsFavorite(!isFavorite);
    } catch (e) {
      console.error(e);
      setError("Không thể cập nhật yêu thích.");
    }
  };

  if (loading) return <DetailSkeleton />;

  if (error || !product) {
    return (
      <div className="dashboard-page">
        <div className="dashboard-shell">
          <div className="commerce-empty">
            <div className="commerce-empty-icon">😕</div>
            <h3>{error || "Không tìm thấy sản phẩm."}</h3>
            <button className="dashboard-btn dashboard-btn-primary" onClick={() => navigate(-1)}>
              <FaArrowLeft /> Quay lại
            </button>
          </div>
        </div>
      </div>
    );
  }

  const available = isProductAvailable(product);

  return (
    <div className="dashboard-page">
      <div className="dashboard-shell">

        {/* ── Breadcrumb back ── */}
        <div className="animate-fadeInUp">
          <button className="dashboard-back-btn" onClick={() => navigate(-1)}>
            <FaArrowLeft /> Quay lại danh sách
          </button>
        </div>

        {/* ── Main card ── */}
        <div className="dashboard-panel animate-fadeInUp animate-delay-1" style={{ overflow: "hidden", padding: 0 }}>
          <div style={{ display: "grid", gridTemplateColumns: "minmax(280px,45%) 1fr" }}>

            {/* ── Image side ── */}
            <div style={{
              background: "var(--color-bg-warm)",
              position: "relative",
              minHeight: 360,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "var(--space-8)",
            }}>
              {/* Decorative circle */}
              <div style={{ position: "absolute", width: 260, height: 260, borderRadius: "50%", background: "var(--color-brand-pale)", opacity: 0.5 }} />

              <div style={{ position: "relative", width: "100%", maxWidth: 280, aspectRatio: "1/1", borderRadius: "var(--radius-xl)", overflow: "hidden", boxShadow: "var(--shadow-xl)" }}>
                <ProductImage
                  src={product.image}
                  alt={product.name}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              </div>

              {/* Unavailable ribbon */}
              {!available && (
                <div style={{
                  position: "absolute", top: 20, left: 0,
                  background: "var(--color-danger)", color: "white",
                  fontWeight: 800, fontSize: "0.78rem", padding: "6px 20px",
                  borderRadius: "0 var(--radius-sm) var(--radius-sm) 0",
                  letterSpacing: "0.05em", textTransform: "uppercase",
                }}>Hết món</div>
              )}

              {/* Fav button */}
              <button
                type="button"
                onClick={toggleFavorite}
                style={{
                  position: "absolute", top: 16, right: 16,
                  width: 44, height: 44, borderRadius: "50%",
                  background: isFavorite ? "var(--color-rose)" : "var(--color-surface)",
                  color: isFavorite ? "white" : "var(--color-rose)",
                  border: `2px solid ${isFavorite ? "var(--color-rose)" : "var(--color-border)"}`,
                  cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 18, boxShadow: "var(--shadow-md)",
                  transition: "all var(--transition-base)",
                }}>
                {isFavorite ? <FaHeart /> : <FaRegHeart />}
              </button>
            </div>

            {/* ── Info side ── */}
            <div style={{ padding: "var(--space-8)", display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
              {/* Category & code */}
              <div style={{ display: "flex", gap: "var(--space-2)", flexWrap: "wrap" }}>
                <span className="commerce-card-category">{product.category || "Đồ uống"}</span>
                <span className="dashboard-badge dashboard-badge-neutral" style={{ fontSize: "0.7rem" }}>{product.code || "SP"}</span>
                <span className={`dashboard-badge ${available ? "dashboard-badge-success" : "dashboard-badge-danger"}`} style={{ fontSize: "0.7rem" }}>
                  {available ? "● Đang bán" : "● Hết món"}
                </span>
              </div>

              {/* Name */}
              <h1 style={{ margin: 0, fontFamily: "var(--app-font-display)", fontSize: "1.8rem", fontWeight: 800, color: "var(--color-text)", letterSpacing: "-0.04em", lineHeight: 1.2 }}>
                {product.name}
              </h1>

              {/* Rating */}
              <div className="commerce-rating">
                <div className="commerce-rating-stars">
                  {[1,2,3,4,5].map(s => <FaStar key={s} size={14} opacity={s <= 4 ? 1 : 0.3} />)}
                </div>
                <span className="commerce-rating-count">4.0 · 128 đánh giá</span>
              </div>

              {/* Price */}
              <div style={{ margin: "4px 0" }}>
                <span style={{
                  fontFamily: "var(--app-font-display)", fontSize: "2.2rem", fontWeight: 900,
                  color: "var(--color-brand-dark)", letterSpacing: "-0.04em",
                }}>
                  {fmt(product.price)}
                </span>
              </div>

              {/* Size badge */}
              {product.size && (
                <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
                  <span style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--color-text-muted)" }}>Kích thước:</span>
                  <span className="dashboard-badge dashboard-badge-info" style={{ fontSize: "0.78rem" }}>Size {product.size}</span>
                </div>
              )}

              {/* Description */}
              {product.description && (
                <p style={{ margin: 0, fontSize: "0.9rem", lineHeight: 1.7, color: "var(--color-text-muted)", borderLeft: "3px solid var(--color-brand)", paddingLeft: "var(--space-4)" }}>
                  {product.description}
                </p>
              )}

              {/* Perks */}
              <div style={{ display: "flex", gap: "var(--space-4)", flexWrap: "wrap", padding: "var(--space-4) 0", borderTop: "1px solid var(--color-border-light)", borderBottom: "1px solid var(--color-border-light)" }}>
                {[
                  { icon: <FaTruck />,    text: "Giao trong 30 phút" },
                  { icon: <FaLeaf />,     text: "Nguyên liệu tươi"   },
                  { icon: <FaShieldAlt />,text: "Đảm bảo chất lượng" },
                ].map((p) => (
                  <div key={p.text} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.78rem", color: "var(--color-text-muted)", fontWeight: 600 }}>
                    <span style={{ color: "var(--color-brand)" }}>{p.icon}</span>
                    {p.text}
                  </div>
                ))}
              </div>

              {/* Quantity + Add to cart */}
              {error && <div className="auth-alert auth-alert-danger"><span>⚠️</span> {error}</div>}

              <div style={{ display: "flex", gap: "var(--space-3)", alignItems: "center", flexWrap: "wrap" }}>
                {/* Qty */}
                <div style={{ display: "flex", alignItems: "center", gap: 0, border: "1.5px solid var(--color-border)", borderRadius: "var(--radius-pill)", overflow: "hidden" }}>
                  <button type="button" onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    style={{ width: 38, height: 44, background: "none", border: "none", cursor: "pointer", fontSize: 18, color: "var(--color-text-muted)", transition: "background var(--transition-fast)" }}
                    onMouseEnter={(e) => e.currentTarget.style.background = "var(--color-bg-alt)"}
                    onMouseLeave={(e) => e.currentTarget.style.background = ""}>−</button>
                  <span style={{ width: 36, textAlign: "center", fontWeight: 800, fontSize: "1rem", color: "var(--color-text)" }}>{quantity}</span>
                  <button type="button" onClick={() => setQuantity((q) => q + 1)}
                    style={{ width: 38, height: 44, background: "none", border: "none", cursor: "pointer", fontSize: 18, color: "var(--color-text-muted)", transition: "background var(--transition-fast)" }}
                    onMouseEnter={(e) => e.currentTarget.style.background = "var(--color-bg-alt)"}
                    onMouseLeave={(e) => e.currentTarget.style.background = ""}>+</button>
                </div>

                {/* Add to cart */}
                <button type="button" className="auth-submit-btn"
                  style={{ flex: 1, minWidth: 180, height: 48, borderRadius: "var(--radius-pill)" }}
                  disabled={!available}
                  onClick={handleAddToCart}>
                  {addSuccess
                    ? <span style={{ display: "flex", alignItems: "center", gap: 8 }}>✅ Đã thêm vào giỏ!</span>
                    : <><FaCartPlus /> {available ? `Thêm ${quantity > 1 ? `(${quantity}) ` : ""}vào giỏ` : "Hết món"}</>}
                </button>

                {/* Fav toggle (text) */}
                <button type="button"
                  className={`dashboard-btn ${isFavorite ? "dashboard-btn-danger" : "dashboard-btn-secondary"}`}
                  style={{ borderRadius: "var(--radius-pill)", height: 48 }}
                  onClick={toggleFavorite}>
                  {isFavorite ? <FaHeart /> : <FaRegHeart />}
                </button>
              </div>

              {/* Total */}
              {quantity > 1 && (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "var(--space-3) var(--space-4)", background: "var(--color-brand-pale)", borderRadius: "var(--radius-md)", fontSize: "0.875rem" }}>
                  <span style={{ color: "var(--color-text-muted)", fontWeight: 600 }}>Thành tiền ({quantity} ly):</span>
                  <span style={{ fontWeight: 900, color: "var(--color-brand-dark)", fontSize: "1.1rem" }}>{fmt(Number(product.price) * quantity)}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Related / suggestion section ── */}
        <div className="dashboard-panel animate-fadeInUp animate-delay-2" style={{ padding: "var(--space-5) var(--space-6)" }}>
          <div className="dashboard-panel-header" style={{ padding: 0, marginBottom: "var(--space-3)" }}>
            <h2 className="dashboard-panel-title">💡 Thông tin thêm</h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "var(--space-4)" }}>
            {[
              ["🌡️", "Nhiệt độ", "Phục vụ lạnh hoặc nóng theo yêu cầu"],
              ["🥛", "Thành phần", "Sữa tươi, đường ăn kiêng, trà nguyên lá"],
              ["⏱️", "Thời gian",  "Chuẩn bị trong 5-7 phút"],
              ["♻️", "Đóng gói",   "Ly nhựa tái chế + ống hút giấy"],
            ].map(([icon, label, val]) => (
              <div key={label} style={{ background: "var(--color-bg-alt)", borderRadius: "var(--radius-md)", padding: "var(--space-4)", display: "flex", flexDirection: "column", gap: 6 }}>
                <div style={{ fontSize: "1.4rem" }}>{icon}</div>
                <div style={{ fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--color-text-faint)" }}>{label}</div>
                <div style={{ fontSize: "0.82rem", color: "var(--color-text-muted)", lineHeight: 1.5 }}>{val}</div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

export default ProductDetail;
