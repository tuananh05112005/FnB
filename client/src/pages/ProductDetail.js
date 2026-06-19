// ==============================================================
// TÊN FILE: ProductDetail.js
// MÔ TẢ: Trang Chi tiết sản phẩm (ProductDetail) của hệ thống FnB.
//        Hiển thị đầy đủ thông tin về đồ uống/bánh ngọt (tên, mô tả, ảnh,
//        giá bán, kích thước, đánh giá trung bình).
//        Cho phép khách hàng tăng/giảm số lượng ly đặt hàng, thêm vào giỏ,
//        bấm yêu thích/bỏ yêu thích, và tích hợp ChatOverlay AI tư vấn trực tiếp về món ăn này.
// ==============================================================

import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  FaArrowLeft, FaCartPlus, FaHeart, FaRegHeart,
  FaStar, FaShieldAlt, FaTruck, FaLeaf, FaComments,
  FaFire, FaCheck, FaChevronLeft, FaChevronRight,
} from "react-icons/fa";

import ProductImage from "../components/common/ProductImage";
import ChatOverlay from "../components/chatbot/ChatOverlay";
import { api } from "../lib/api";
import { getUserId } from "../lib/session";
import { addToCart } from "../services/cartService";
import { getProduct, isProductAvailable, listProducts } from "../services/productService";
import { useNotifications } from "../components/common/NotificationContext";
import "../styles/dashboard.css";
import "../styles/commerce.css";
import "../styles/productDetail.css";

/* --------------------------------------------------------------
   PRODUCT DETAIL PAGE
   --------------------------------------------------------------
   Đây là trang chi tiết sản phẩm, bao gồm:
   - Fetch dữ liệu sản phẩm và danh sách yêu thích của người dùng.
   - Hiển thị hình ảnh sản phẩm, thông tin mô tả, giá và các
     tính năng (perks) của món.
   - Cho phép người dùng thay đổi số lượng, thêm vào giỏ, đánh dấu
     yêu thích.
   - Nút "Tư vấn ngay" mở ChatOverlay để AI tư vấn về sản phẩm.
   - Các thẻ thông tin phụ (nhiệt độ, thành phần, thời gian, đóng gói)
   được hiển thị dưới dạng grid.
   -------------------------------------------------------------- */

const fmt = (n) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(Number(n) || 0);

/* ── Skeleton ─────────────────────────────────────────────────── */
function DetailSkeleton() {
  return (
    <div className="pd-page">
      <div className="pd-hero-skeleton">
        <div className="skeleton" style={{ height: 480, borderRadius: "var(--radius-xl)" }} />
      </div>
      <div className="pd-info-skeleton">
        <div className="skeleton" style={{ height: 16, width: "35%" }} />
        <div className="skeleton" style={{ height: 36, width: "70%", marginTop: 8 }} />
        <div className="skeleton" style={{ height: 14, width: "50%", marginTop: 6 }} />
        <div className="skeleton" style={{ height: 48, width: "40%", marginTop: 16 }} />
        <div className="skeleton" style={{ height: 14, width: "90%", marginTop: 12 }} />
        <div className="skeleton" style={{ height: 14, width: "80%", marginTop: 6 }} />
        <div className="skeleton" style={{ height: 56, width: "100%", marginTop: 20, borderRadius: 32 }} />
      </div>
    </div>
  );
}

/* ── Star row ─────────────────────────────────────────────────── */
function StarRow({ rating = 4, count = 128 }) {
  return (
    <div className="pd-stars">
      {[1, 2, 3, 4, 5].map((s) => (
        <FaStar key={s} size={15} className={s <= rating ? "pd-star filled" : "pd-star empty"} />
      ))}
      <span className="pd-star-count">{rating}.0 · {count} đánh giá</span>
    </div>
  );
}

/* --------------------------------------------------------------
   COMPONENT: ProductDetail
   --------------------------------------------------------------
   - Dùng useParams để lấy `id` sản phẩm từ URL.
   - useNavigate để điều hướng (quay lại, login).
   - Các state quản lý: product, loading, error, quantity,
     isFavorite, showChat, addSuccess.
   - useEffect gọi API lấy chi tiết sản phẩm và danh sách yêu thích.
   -------------------------------------------------------------- */
const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const userId = getUserId();
  const { addNotification } = useNotifications();
  const [showChat, setShowChat] = useState(false);
  const [product, setProduct] = useState(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [addSuccess, setAddSuccess] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [recommendations, setRecommendations] = useState([]);
  const [quickAddSuccessId, setQuickAddSuccessId] = useState(null);

    /* --------------------------------------------------------------
   FETCH PRODUCT, FAVORITES & RECOMMENDATIONS
   --------------------------------------------------------------
   - Gọi song song `getProduct`, danh sách yêu thích và danh sách tất cả sản phẩm.
   - Lọc sản phẩm cùng danh mục và sản phẩm bán kèm (topping/bánh ngọt).
   - Bắt lỗi và cập nhật `error` nếu có vấn đề.
   - Cuối cùng đặt `loading` thành false.
   -------------------------------------------------------------- */
  useEffect(() => {
    window.scrollTo(0, 0);
    const fetchDetail = async () => {
      try {
        const [productData, favorites, allProducts] = await Promise.all([
          getProduct(id),
          userId
            ? api.get(`/api/favorites/${userId}`).then((r) => r.data).catch(() => [])
            : Promise.resolve([]),
          listProducts(),
        ]);
        setProduct(productData);
        setIsFavorite(favorites.some((item) => String(item.id) === String(id)));

        // Xử lý logic gợi ý sản phẩm thông minh
        if (productData && Array.isArray(allProducts)) {
          const currentCategory = productData.category || "";
          
          // 1. Sản phẩm cùng danh mục (loại trừ sản phẩm hiện tại)
          const sameCategoryItems = allProducts.filter(
            (p) => p.category === currentCategory && String(p.id) !== String(id) && isProductAvailable(p)
          );
          
          // 2. Gợi ý thêm bánh ngọt và topping nếu sản phẩm hiện tại là nước uống
          let crossItems = [];
          const isDrink = !["topping", "banh ngọt", "bánh ngọt", "cake", "bánh"].includes(currentCategory.toLowerCase());
          if (isDrink) {
            const toppings = allProducts.filter(
              (p) => p.category?.toLowerCase() === "topping" && isProductAvailable(p)
            );
            const cakes = allProducts.filter(
              (p) => ["banh ngọt", "bánh ngọt", "cake", "bánh"].includes(p.category?.toLowerCase()) && isProductAvailable(p)
            );
            // Lấy tối đa 3 topping và 3 bánh ngọt để đa dạng lựa chọn
            crossItems = [...toppings.slice(0, 3), ...cakes.slice(0, 3)];
          }

          const combined = [...sameCategoryItems.slice(0, 4), ...crossItems];
          // Loại bỏ các phần tử trùng lặp và loại trừ chính nó
          const uniqueRecs = combined.filter(
            (item, index, self) => self.findIndex((t) => t.id === item.id) === index && String(item.id) !== String(id)
          );
          
          setRecommendations(uniqueRecs);
        }
      } catch (e) {
        console.error(e);
        setError("Không thể tải chi tiết sản phẩm.");
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [id, userId]);

    /* --------------------------------------------------------------
   HANDLE ADD TO CART
   --------------------------------------------------------------
   - Kiểm tra đăng nhập, nếu chưa login chuyển đến /login.
   - Kiểm tra tồn kho bằng `isProductAvailable`.
   - Gọi service `addToCart` với userId, productId, quantity và size.
   - Khi thành công hiển thị trạng thái success trong 2.5s.
   - Bắt lỗi và hiển thị thông báo.
   -------------------------------------------------------------- */
  const handleAddToCart = async (e) => {
    if (!userId) { navigate("/login"); return; }
    try {
      if (!isProductAvailable(product)) { setError("Món này hiện đang hết."); return; }
      const activeOrderCode = localStorage.getItem("activeOrderCode");
      await addToCart(userId, product.id, quantity, product.size || "M", activeOrderCode);

      // Hiện thông báo toast
      addNotification(
        "new_order",
        "🛒 Giỏ hàng",
        `Đã thêm "${product.name}" vào giỏ hàng thành công!`
      );

      setAddSuccess(true);
      setTimeout(() => setAddSuccess(false), 2500);
    } catch (e) {
      console.error(e);
      setError("Không thể thêm sản phẩm vào giỏ hàng.");
    }
  };

  // Thêm nhanh sản phẩm gợi ý từ Carousel trực tiếp vào giỏ hàng
  const handleQuickAdd = async (item, e) => {
    e.stopPropagation();
    if (!userId) { navigate("/login"); return; }
    try {
      if (!isProductAvailable(item)) return;
      const activeOrderCode = localStorage.getItem("activeOrderCode");
      await addToCart(userId, item.id, 1, item.size || "M", activeOrderCode);

      addNotification(
        "new_order",
        "🛒 Giỏ hàng",
        `Đã thêm "${item.name}" vào giỏ hàng thành công!`
      );

      setQuickAddSuccessId(item.id);
      setTimeout(() => setQuickAddSuccessId(null), 1500);
    } catch (e) {
      console.error(e);
      addNotification("error", "⚠️ Lỗi", "Không thể thêm sản phẩm vào giỏ hàng.");
    }
  };

    /* --------------------------------------------------------------
   TOGGLE FAVORITE
   --------------------------------------------------------------
   - Kiểm tra đăng nhập, nếu chưa login chuyển đến /login.
   - Nếu đã yêu thích, gọi DELETE để bỏ; ngược lại POST để thêm.
   - Cập nhật trạng thái `isFavorite`.
   -------------------------------------------------------------- */
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
    }
  };

  if (loading) return <DetailSkeleton />;

  if (error || !product) {
    return (
      <div className="pd-page">
        <div className="pd-error">
          <div className="pd-error-icon">😕</div>
          <h3>{error || "Không tìm thấy sản phẩm."}</h3>
          <button className="pd-back-btn" onClick={() => navigate(-1)}>
            <FaArrowLeft /> Quay lại
          </button>
        </div>
      </div>
    );
  }

  const available = isProductAvailable(product);
  const totalPrice = Number(product.price) * quantity;

  return (
    <div className="pd-page">
      {/* ── Back button ── */}
              {/* --------------------------------------------------------------
          BACK BUTTON
          --------------------------------------------------------------
          Nút quay lại danh sách sản phẩm trước, sử dụng animate-fadeInUp để có
          hiệu ứng xuất hiện nhẹ.
        -------------------------------------------------------------- */}
        <button className="pd-back-btn animate-fadeInUp" onClick={() => navigate(-1)}>
        <FaArrowLeft /> Quay lại danh sách
      </button>

      {/* ── Main card ── */}
      <div className="pd-card animate-fadeInUp" style={{ animationDelay: "0.05s" }}>

        {/* ── LEFT: Image panel ── */}
                {/* --------------------------------------------------------------
          LEFT PANEL: IMAGE
          --------------------------------------------------------------
          - Hiển thị ảnh sản phẩm đầy đủ, không nền gradient.
          - Nếu sản phẩm hết, hiển thị ribbon "Hết món".
          - Nút yêu thích (heart) và badge "Hot" được overlay trên ảnh.
        -------------------------------------------------------------- */}
        <div className="pd-image-panel">
          {/* Unavailable ribbon */}
          {!available && <div className="pd-ribbon">Hết món</div>}

          {/* Product image */}
          <div className="pd-image-wrap">
            <ProductImage
              src={product.image}
              alt={product.name}
              className="pd-image"
            />
            {/* Decorative blobs */}
            <div className="pd-blob pd-blob-1" />
            <div className="pd-blob pd-blob-2" />
          </div>

          {/* Floating badges */}
          <div className="pd-floating-badges">
            {available && (
              <div className="pd-badge-hot">
                <FaFire size={11} /> Hot
              </div>
            )}
          </div>

          {/* Fav button */}
          <button
            type="button"
            className={`pd-fav-btn ${isFavorite ? "active" : ""}`}
            onClick={toggleFavorite}
            aria-label={isFavorite ? "Bỏ yêu thích" : "Thêm yêu thích"}
          >
            {isFavorite ? <FaHeart /> : <FaRegHeart />}
          </button>
        </div>

        {/* ── RIGHT: Info panel ── */}
                {/* --------------------------------------------------------------
          RIGHT PANEL: INFO
          --------------------------------------------------------------
          - Hiển thị danh mục, mã sản phẩm, trạng thái (còn bán/hết món).
          - Tên sản phẩm, đánh giá sao, giá, size.
          - Mô tả, các perks và các nút hành động (đặt số lượng, thêm giỏ, yêu thích).
          - Tổng tiền khi số lượng >1 và banner "Tư vấn ngay".
        -------------------------------------------------------------- */}
        <div className="pd-info-panel">

          {/* Category + status row */}
          <div className="pd-meta-row">
            <span className="pd-category">{product.category || "Đồ uống"}</span>
            <span className="pd-code">{product.code || "SP"}</span>
            <span className={`pd-status ${available ? "available" : "unavailable"}`}>
              <span className="pd-status-dot" />
              {available ? "Đang bán" : "Hết món"}
            </span>
          </div>

          {/* Name */}
          <h1 className="pd-name">{product.name}</h1>

          {/* Stars */}
          <StarRow rating={4} count={128} />

          {/* Price */}
          <div className="pd-price-wrap">
            <span className="pd-price">{fmt(product.price)}</span>
            {product.size && (
              <span className="pd-size-badge">Size {product.size}</span>
            )}
          </div>

          {/* Description */}
          {product.description && (
            <p className="pd-desc">{product.description}</p>
          )}

          {/* Perks */}
          <div className="pd-perks">
            {[
              { icon: <FaTruck />, text: "Giao trong 30 phút" },
              { icon: <FaLeaf />, text: "Nguyên liệu tươi" },
              { icon: <FaShieldAlt />, text: "Đảm bảo chất lượng" },
            ].map((p) => (
              <div key={p.text} className="pd-perk">
                <span className="pd-perk-icon">{p.icon}</span>
                {p.text}
              </div>
            ))}
          </div>

          {/* Divider */}
          <div className="pd-divider" />

          {/* Error */}
          {error && (
            <div className="pd-alert">
              <span>⚠️</span> {error}
            </div>
          )}

          {/* Quantity + actions */}
                    {/* --------------------------------------------------------------
            ACTIONS SECTION
            --------------------------------------------------------------
            - Stepper số lượng (‑ / +) với giới hạn tối thiểu 1.
            - Nút "Thêm vào giỏ" (hoạt hoá khi còn hàng).
            - Nút "Yêu thích" dạng text (icon heart).
            - Khi thêm thành công, nút chuyển màu xanh và hiển thị ký hiệu check.
          -------------------------------------------------------------- */}
          <div className="pd-actions">
            {/* Qty stepper */}
            <div className="pd-qty-stepper">
              <button
                type="button"
                className="pd-qty-btn"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                disabled={quantity <= 1}
              >−</button>
              <span className="pd-qty-value">{quantity}</span>
              <button
                type="button"
                className="pd-qty-btn"
                onClick={() => setQuantity((q) => q + 1)}
              >+</button>
            </div>

            {/* Add to cart */}
            <button
              type="button"
              className={`pd-cart-btn ${addSuccess ? "success" : ""}`}
              disabled={!available}
              onClick={handleAddToCart}
            >
              {addSuccess
                ? <><FaCheck /> Đã thêm vào giỏ!</>
                : <><FaCartPlus /> {available ? `Thêm ${quantity > 1 ? `(${quantity}) ` : ""}vào giỏ` : "Hết món"}</>}
            </button>

            {/* Fav button (text) */}
            <button
              type="button"
              className={`pd-fav-text-btn ${isFavorite ? "active" : ""}`}
              onClick={toggleFavorite}
            >
              {isFavorite ? <FaHeart /> : <FaRegHeart />}
            </button>
          </div>

          {/* Total summary (when qty > 1) */}
          {quantity > 1 && (
            <div className="pd-total">
              <span>Thành tiền ({quantity} ly)</span>
              <span className="pd-total-price">{fmt(totalPrice)}</span>
            </div>
          )}

          {/* Consult CTA */}
                    {/* --------------------------------------------------------------
            CONSULT BANNER
            --------------------------------------------------------------
            - Thông báo mời người dùng hỏi AI về món ăn.
            - Nút "Tư vấn ngay" mở ChatOverlay (setShowChat(true)).
          -------------------------------------------------------------- */}
          <div className="pd-consult-banner">
            <div className="pd-consult-left">
              <div className="pd-consult-emoji">🍵</div>
              <div>
                <div className="pd-consult-title">Bạn muốn biết thêm về món này?</div>
                <div className="pd-consult-sub">AI tư vấn hương vị, nguyên liệu, cách dùng...</div>
              </div>
            </div>
            <button
              type="button"
              className="pd-consult-btn"
              onClick={() => setShowChat(true)}
            >
              <FaComments /> Tư vấn ngay
            </button>
          </div>

        </div>
      </div>

      {/* ── Info cards ── */}
              {/* --------------------------------------------------------------
          INFO CARDS GRID
          --------------------------------------------------------------
          - Hiển thị các thông tin phụ: nhiệt độ, thành phần, thời gian, đóng gói.
          - Sắp xếp dạng grid, mỗi thẻ có icon, label và giá trị.
        -------------------------------------------------------------- */}
        <div className="pd-info-cards animate-fadeInUp" style={{ animationDelay: "0.12s" }}>
        <div className="pd-info-header">
          <h2 className="pd-info-title">💡 Thông tin thêm</h2>
        </div>
        <div className="pd-info-grid">
          {[
            { icon: "🌡️", label: "Nhiệt độ", val: "Phục vụ lạnh hoặc nóng theo yêu cầu" },
            { icon: "🥛", label: "Thành phần", val: "Sữa tươi, đường ăn kiêng, trà nguyên lá" },
            { icon: "⏱️", label: "Thời gian", val: "Chuẩn bị trong 5-7 phút" },
            { icon: "♻️", label: "Đóng gói", val: "Ly nhựa tái chế + ống hút giấy" },
          ].map(({ icon, label, val }) => (
            <div key={label} className="pd-info-card">
              <div className="pd-info-card-icon">{icon}</div>
              <div className="pd-info-card-label">{label}</div>
              <div className="pd-info-card-val">{val}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Recommendations carousel ── */}
      {recommendations.length > 0 && (
        <div className="recommendations-section animate-fadeInUp" style={{ animationDelay: "0.18s" }}>
          <div className="recommendations-header">
            <h2 className="recommendations-title">
              <span>💡 Có thể bạn sẽ thích</span>
            </h2>
            <div className="carousel-controls">
              <button 
                type="button" 
                className="carousel-arrow" 
                onClick={() => {
                  const carousel = document.getElementById("reco-carousel-list");
                  if (carousel) carousel.scrollLeft -= 220;
                }}
                aria-label="Xem sản phẩm trước"
              >
                <FaChevronLeft size={12} />
              </button>
              <button 
                type="button" 
                className="carousel-arrow" 
                onClick={() => {
                  const carousel = document.getElementById("reco-carousel-list");
                  if (carousel) carousel.scrollLeft += 220;
                }}
                aria-label="Xem sản phẩm tiếp theo"
              >
                <FaChevronRight size={12} />
              </button>
            </div>
          </div>
          
          <div className="recommendations-carousel-wrapper">
            <div id="reco-carousel-list" className="recommendations-carousel">
              {recommendations.map((item) => {
                const isQuickAddSuccess = quickAddSuccessId === item.id;
                return (
                  <div 
                    key={item.id} 
                    className="reco-card"
                    onClick={() => navigate(`/products/${item.id}`)}
                    style={{ cursor: "pointer" }}
                  >
                    <div className="reco-img-wrap">
                      <ProductImage 
                        src={item.image} 
                        alt={item.name} 
                        className="reco-img"
                      />
                      {item.category && (
                        <span className="reco-badge">{item.category}</span>
                      )}
                    </div>
                    <div className="reco-body">
                      <h4 className="reco-name" title={item.name}>{item.name}</h4>
                      <p className="reco-desc" title={item.description || ""}>
                        {item.description || "Hương vị thơm ngon, thanh mát đặc trưng."}
                      </p>
                      <div className="reco-footer">
                        <div className="reco-price-wrap">
                          <span className="reco-price">{fmt(item.price)}</span>
                          {item.size && (
                            <span className="reco-size">Size {item.size}</span>
                          )}
                        </div>
                        <button 
                          type="button" 
                          className={`reco-quick-add-btn ${isQuickAddSuccess ? "success" : ""}`}
                          onClick={(e) => handleQuickAdd(item, e)}
                          title="Thêm nhanh vào giỏ hàng"
                        >
                          {isQuickAddSuccess ? <FaCheck /> : <FaCartPlus />}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Chat overlay */}
              {/* --------------------------------------------------------------
          CHAT OVERLAY
          --------------------------------------------------------------
          - Khi `showChat` true, render component ChatOverlay.
          - Pass `product` để AI có ngữ cảnh và `onClose` để đóng.
        -------------------------------------------------------------- */}
        {showChat && <ChatOverlay onClose={() => setShowChat(false)} product={product} />}
    </div>
  );
};

export default ProductDetail;
