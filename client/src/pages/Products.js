// ==============================================================
// TÊN FILE: Products.js
// MÔ TẢ: Trang danh sách thực đơn (Products) của hệ thống FnB.
//        Cho phép khách hàng duyệt thực đơn, tìm kiếm sản phẩm theo tên/mô tả/mã,
//        lọc theo size, sắp xếp theo tên/giá/mới nhất, chuyển đổi chế độ xem (Lưới/Danh sách).
//        Tài khoản User có thể thêm sản phẩm vào giỏ hoặc thả tim sản phẩm yêu thích.
//        Tài khoản Admin/Staff có thể thêm, sửa, xóa sản phẩm trực tiếp tại danh sách này.
// ==============================================================

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaBoxOpen, FaCartPlus, FaEdit, FaEye,
  FaHeart, FaList, FaPlus, FaRegHeart,
  FaSearch, FaThLarge, FaTrash, FaStar,
} from "react-icons/fa";

import ProductImage from "../components/common/ProductImage";
import ProductCustomizationModal from "../components/common/ProductCustomizationModal";
import { useMenuSettings } from "../hooks/useMenuSettings";
import { getRole } from "../lib/session";
import { useProductCatalog } from "../hooks/useProductCatalog";
import { isProductAvailable } from "../services/productService";
import "../styles/dashboard.css";
import "../styles/commerce.css";

// Định dạng tiền tệ VNĐ (ví dụ: 25.000 ₫)
const formatCurrency = (amount) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(Number(amount) || 0);

/* ── Skeleton card ─────────────────────────────────────────────── */
/**
 * SkeletonProductCard Component: Khung xương tải giả lập cho thẻ sản phẩm.
 */
function SkeletonProductCard() {
  return (
    <div className="commerce-skeleton">
      <div className="commerce-skeleton-img">
        <div className="skeleton" />
      </div>
      <div className="commerce-skeleton-body">
        <div className="skeleton" style={{ height: 10, width: "45%" }} />
        <div className="skeleton" style={{ height: 16, width: "80%" }} />
        <div className="skeleton" style={{ height: 12, width: "60%" }} />
        <div className="skeleton" style={{ height: 34, width: "100%", marginTop: 8 }} />
      </div>
    </div>
  );
}

const Products = () => {
  const navigate = useNavigate();
  const role = getRole();
  const [customizingProduct, setCustomizingProduct] = useState(null);
  
  const needsCustomization = (product) => {
    if (!product || !product.category) return false;
    const cat = product.category.toLowerCase().trim();
    return cat !== "bánh" && cat !== "topping" && cat !== "bánh ngọt";
  };
  
  // Custom hook lấy tiêu đề, phụ đề, banner của cửa hàng
  const menuSettings = useMenuSettings();
  
  // Custom hook đồng bộ tất cả tham số tìm kiếm, lọc size, sắp xếp, phân trang, và các hành động (AddToCart, Delete, ToggleFavorite)
  const {
    category, products, favorites, cartItems,
    viewMode, setViewMode, searchTerm, setSearchTerm,
    sortOption, setSortOption, selectedSizes, setSelectedSizes,
    currentPage, setCurrentPage,
    itemsPerPage, setItemsPerPage, isLoading, error,
    uniqueSizes, filteredProducts, pagedProducts, totalPages,
    handleAddToCart, handleDelete, handleToggleFavorite,
  } = useProductCatalog();
  
  // Tự động cuộn lên đầu trang khi chuyển phân trang
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [currentPage]);

  const isManager = role === "admin" || role === "staff";
  const favoriteCount = favorites.length;

  return (
    <div className="dashboard-page">
      <div className="dashboard-shell">

        {/* ── Header ── */}
        <div className="dashboard-header animate-fadeInUp">
          <div className="dashboard-title-wrap">
            <div className="dashboard-icon"><FaBoxOpen /></div>
            <div>
              <h1 className="dashboard-title">{menuSettings.menuTitle}</h1>
              <p className="dashboard-subtitle">{menuSettings.menuSubtitle}</p>
            </div>
          </div>
          <div className="dashboard-toolbar-group">
            {isManager && (
              <button type="button" className="dashboard-btn dashboard-btn-primary"
                onClick={() => navigate("/add-product")}>
                <FaPlus /> Thêm sản phẩm
              </button>
            )}
            <button type="button" id="header-cart-btn" className="dashboard-btn dashboard-btn-secondary"
              onClick={() => navigate("/carts")}>
              <FaEye /> Giỏ hàng ({cartItems.length})
            </button>
          </div>
        </div>

        {/* ── Banner ── */}
        {menuSettings.bannerImage && (
          <div className="menu-display-banner animate-fadeIn"
            style={{ backgroundImage: `url(${menuSettings.bannerImage})`, height: 160, marginBottom: 0 }}>
            <div>
              <p>{menuSettings.storeName}</p>
              <h2>{menuSettings.menuTitle}</h2>
            </div>
          </div>
        )}

        {/* ── Stats ── */}
        {isManager && (
          <div className="dashboard-stats-grid animate-fadeInUp animate-delay-1">
            {[
              { label: "Tổng sản phẩm",  value: products.length,        icon: <FaBoxOpen />,   accent: "var(--color-brand)",    bg: "var(--color-brand-pale)",    color: "var(--color-brand-dark)" },
              { label: "Đang hiển thị",  value: filteredProducts.length, icon: <FaSearch />,    accent: "#3b82f6", bg: "var(--color-info-light)",    color: "#3b82f6" },
              { label: "Mục yêu thích",  value: favoriteCount,           icon: favoriteCount > 0 ? <FaHeart /> : <FaRegHeart />, accent: "#ec4899", bg: "var(--color-rose-light)", color: "var(--color-rose)" },
              { label: "Trong giỏ hàng", value: cartItems.length,        icon: <FaCartPlus />,  accent: "var(--color-matcha)", bg: "var(--color-matcha-light)", color: "var(--color-matcha)" },
            ].map((s) => (
              <article key={s.label} className="dashboard-stat dashboard-stat-accent" style={{ "--stat-accent": s.accent }}>
                <div className="dashboard-stat-icon" style={{ background: s.bg, color: s.color }}>{s.icon}</div>
                <div>
                  <p className="dashboard-stat-value">{s.value}</p>
                  <p className="dashboard-stat-label">{s.label}</p>
                </div>
              </article>
            ))}
          </div>
        )}

        {/* ── Filter bar ── */}
        <div className="commerce-filter-bar animate-fadeIn animate-delay-2">
          {/* Search */}
          <div className="commerce-search-wrap" style={{ flex: 1, minWidth: 200 }}>
            <FaSearch className="commerce-search-icon" size={14} />
            <input
              id="product-search"
              className="commerce-search-input"
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              placeholder="Tìm tên, mã hoặc mô tả..."
            />
          </div>

          {/* Size chips */}
          {uniqueSizes.length > 0 && (
            <div className="commerce-chips" style={{ gap: 10 }}>
              {uniqueSizes.map((size) => (
                <button key={size} type="button"
                  className={`commerce-chip ${selectedSizes.includes(size) ? "active" : ""}`}
                  style={{ minWidth: 42, justifyContent: "center" }}
                  onClick={() => { setCurrentPage(1); setSelectedSizes((prev) => prev.includes(size) ? prev.filter((i) => i !== size) : [...prev, size]); }}>
                  {size}
                </button>
              ))}
            </div>
          )}

          {/* Sort */}
          <select className="dashboard-select" style={{ width: "auto", minWidth: 140 }}
            value={sortOption} onChange={(e) => setSortOption(e.target.value)}>
            <option value="latest">Mới nhất</option>
            <option value="name-asc">Tên A-Z</option>
            <option value="price-asc">Giá tăng dần</option>
            <option value="price-desc">Giá giảm dần</option>
          </select>

          {/* View mode */}
          <div style={{ display: "flex", gap: 4 }}>
            <button type="button" className={`commerce-chip ${viewMode === "grid" ? "active" : ""}`}
              onClick={() => setViewMode("grid")} title="Lưới">
              <FaThLarge />
            </button>
            <button type="button" className={`commerce-chip ${viewMode === "list" ? "active" : ""}`}
              onClick={() => setViewMode("list")} title="Danh sách">
              <FaList />
            </button>
          </div>

          {/* Items per page */}
          <select className="dashboard-select" style={{ width: "auto", minWidth: 110 }}
            value={itemsPerPage}
            onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}>
            <option value={8}>8 / trang</option>
            <option value={12}>12 / trang</option>
            <option value={24}>24 / trang</option>
          </select>
        </div>

        {/* ── Category filter ── */}
        {category && (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: "0.78rem", color: "var(--color-text-muted)", fontWeight: 600 }}>Danh mục:</span>
            <span className="dashboard-badge dashboard-badge-brand">{category}</span>
          </div>
        )}

        {/* ── Error ── */}
        {error && <div className="commerce-alert commerce-alert-danger">{error}</div>}

        {/* ── Products ── */}
        {isLoading ? (
          <div className="commerce-grid">
            {Array(8).fill(0).map((_, i) => <SkeletonProductCard key={i} />)}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="commerce-empty">
            <div className="commerce-empty-icon">🧋</div>
            <h3>Không tìm thấy sản phẩm phù hợp</h3>
            <p>Thử đổi từ khóa tìm kiếm hoặc bớt bộ lọc để xem thêm kết quả.</p>
          </div>
        ) : viewMode === "grid" ? (
          /* ── GRID VIEW ── */
          <div className="commerce-grid animate-fadeInUp">
            {pagedProducts.map((product) => {
              const available = isProductAvailable(product);
              const isFav = favorites.includes(product.id);
              return (
                <article key={product.id} className="commerce-card">
                  {/* Image */}
                  <div className="commerce-card-img-wrap" onClick={() => navigate(`/products/${product.id}`)}>
                    <ProductImage src={product.image} alt={product.name} />
                    {!available && <span className="commerce-badge commerce-badge-unavailable">Hết món</span>}
                    {available && product.category && (
                      <span className="commerce-badge" style={{ fontSize: "0.68rem" }}>{product.category}</span>
                    )}
                    {/* Fav button (user only) */}
                    {!isManager && (
                      <button type="button"
                        className={`commerce-fav-btn ${isFav ? "active" : ""}`}
                        onClick={(e) => { e.stopPropagation(); handleToggleFavorite(navigate, product.id); }}>
                        {isFav ? <FaHeart /> : <FaRegHeart />}
                      </button>
                    )}
                  </div>

                  {/* Body */}
                  <div className="commerce-card-body">
                    <span className="commerce-card-category">{product.code || "SP"}</span>
                    <h3 className="commerce-card-name">{product.name}</h3>

                    {/* Rating (decorative) */}
                    <div className="commerce-rating">
                      <div className="commerce-rating-stars">
                        {[1,2,3,4,5].map(s => <FaStar key={s} size={10} opacity={s <= 4 ? 1 : 0.3} />)}
                      </div>
                      <span className="commerce-rating-count">(4.0)</span>
                    </div>

                    {/* Price + action */}
                    <div className="commerce-card-footer">
                      <span className="commerce-price">{formatCurrency(product.price)}</span>
                      {isManager ? (
                        <div style={{ display: "flex", gap: 4 }}>
                          <button type="button" className="dashboard-btn dashboard-btn-secondary"
                            style={{ padding: "6px 10px", fontSize: "0.78rem", borderRadius: "var(--radius-sm)" }}
                            onClick={() => navigate(`/edit-product/${product.id}`)}>
                            <FaEdit />
                          </button>
                          <button type="button" className="dashboard-btn dashboard-btn-danger"
                            style={{ padding: "6px 10px", fontSize: "0.78rem", borderRadius: "var(--radius-sm)" }}
                            onClick={() => handleDelete(product.id)}>
                            <FaTrash />
                          </button>
                        </div>
                      ) : (
                        <button type="button" className="commerce-add-btn"
                          disabled={!available}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (needsCustomization(product)) {
                              setCustomizingProduct(product);
                            } else {
                              handleAddToCart(navigate, product, e);
                            }
                          }}
                          title={available ? "Thêm vào giỏ" : "Hết món"}>
                          +
                        </button>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          /* ── LIST VIEW ── */
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }} className="animate-fadeInUp">
            {pagedProducts.map((product) => {
              const available = isProductAvailable(product);
              return (
                <div key={product.id} className="dashboard-panel" style={{ padding: 0, overflow: "hidden" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "var(--space-4)", padding: "var(--space-4)" }}>
                    <div style={{ width: 72, height: 72, borderRadius: "var(--radius-md)", overflow: "hidden", flexShrink: 0, background: "var(--color-bg-warm)" }}>
                      <ProductImage src={product.image} alt={product.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", marginBottom: 4, flexWrap: "wrap" }}>
                        <h3 style={{ margin: 0, fontSize: "0.95rem", fontWeight: 700, color: "var(--color-text)" }}>{product.name}</h3>
                        <span className="dashboard-badge dashboard-badge-neutral" style={{ fontSize: "0.68rem" }}>{product.code || "SP"}</span>
                        {!available && <span className="dashboard-badge dashboard-badge-danger" style={{ fontSize: "0.68rem" }}>Hết món</span>}
                      </div>
                      <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--color-text-muted)", display: "-webkit-box", WebkitLineClamp: 1, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                        {product.description || "Chưa có mô tả."}
                      </p>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", flexShrink: 0 }}>
                      <span className="commerce-price">{formatCurrency(product.price)}</span>
                      <div className="dashboard-action-row">
                        <button className="dashboard-btn dashboard-btn-secondary" style={{ padding: "7px 14px", fontSize: "0.8rem" }}
                          onClick={() => navigate(`/products/${product.id}`)}>
                          <FaEye /> Xem
                        </button>
                        {isManager ? (
                          <>
                            <button className="dashboard-btn dashboard-btn-primary" style={{ padding: "7px 14px", fontSize: "0.8rem" }}
                              onClick={() => navigate(`/edit-product/${product.id}`)}>
                              <FaEdit />
                            </button>
                            <button className="dashboard-btn dashboard-btn-danger" style={{ padding: "7px 14px", fontSize: "0.8rem" }}
                              onClick={() => handleDelete(product.id)}>
                              <FaTrash />
                            </button>
                          </>
                        ) : (
                          <button className="dashboard-btn dashboard-btn-primary" style={{ padding: "7px 14px", fontSize: "0.8rem" }}
                            disabled={!available}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (needsCustomization(product)) {
                                setCustomizingProduct(product);
                              } else {
                                handleAddToCart(navigate, product, e);
                              }
                            }}>
                            <FaCartPlus /> {available ? "Thêm" : "Hết"}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Pagination ── */}
        {totalPages > 1 && (
          <div className="dashboard-toolbar animate-fadeIn">
            <span style={{ fontSize: "0.85rem", color: "var(--color-text-muted)" }}>
              Trang <strong>{currentPage}</strong> / <strong>{totalPages}</strong>
              &nbsp;·&nbsp; {filteredProducts.length} sản phẩm
            </span>
            <div className="dashboard-toolbar-group">
              <button className="dashboard-btn dashboard-btn-secondary" disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}>← Trước</button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                const page = currentPage <= 3 ? i + 1 : currentPage - 2 + i;
                if (page < 1 || page > totalPages) return null;
                return (
                  <button key={page} className={`dashboard-chip ${page === currentPage ? "active" : ""}`}
                    onClick={() => setCurrentPage(page)}>
                    {page}
                  </button>
                );
              })}
              <button className="dashboard-btn dashboard-btn-primary" disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}>Sau →</button>
            </div>
          </div>
        )}
      </div>

      {customizingProduct && (
        <ProductCustomizationModal
          product={customizingProduct}
          onClose={() => setCustomizingProduct(null)}
          onConfirm={async (customData) => {
            setCustomizingProduct(null);
            // Thêm sản phẩm chính kèm tùy chọn vào giỏ hàng
            await handleAddToCart(
              navigate,
              customData.product,
              null,
              customData.quantity,
              customData.sugar,
              customData.ice,
              customData.toppings
            );
            // Thêm các món ăn kèm (bánh) khác vào giỏ hàng (nếu có)
            if (customData.accompaniments && customData.accompaniments.length > 0) {
              for (const acc of customData.accompaniments) {
                await handleAddToCart(navigate, acc, null, 1);
              }
            }
          }}
        />
      )}
    </div>
  );
};

export default Products;
