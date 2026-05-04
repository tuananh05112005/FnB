import { useNavigate } from "react-router-dom";
import {
  FaBoxOpen,
  FaCartPlus,
  FaEdit,
  FaEye,
  FaHeart,
  FaList,
  FaPlus,
  FaRegHeart,
  FaSearch,
  FaThLarge,
  FaTrash,
} from "react-icons/fa";

import { getRole } from "../lib/session";
import { useProductCatalog } from "../hooks/useProductCatalog";
import "../styles/dashboard.css";
import "../styles/commerce.css";

const formatCurrency = (amount) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(Number(amount) || 0);

const Products = () => {
  const navigate = useNavigate();
  const role = getRole();
  const {
    category,
    products,
    favorites,
    cartItems,
    viewMode,
    setViewMode,
    searchTerm,
    setSearchTerm,
    sortOption,
    setSortOption,
    selectedSizes,
    setSelectedSizes,
    priceRange,
    setPriceRange,
    currentPage,
    setCurrentPage,
    itemsPerPage,
    setItemsPerPage,
    isLoading,
    error,
    uniqueSizes,
    filteredProducts,
    pagedProducts,
    totalPages,
    handleAddToCart,
    handleDelete,
    handleToggleFavorite,
  } = useProductCatalog();

  const isManager = role === "admin" || role === "staff";
  const favoriteCount = favorites.length;

  return (
    <div className="dashboard-page">
      <div className="dashboard-shell">
        <div className="dashboard-header">
          <div className="dashboard-title-wrap">
            <div className="dashboard-icon">
              <FaBoxOpen />
            </div>
            <div>
              <h1 className="dashboard-title">Danh sách sản phẩm</h1>
              <p className="dashboard-subtitle">
                Duyệt menu, tìm nhanh sản phẩm và quản lý đơn giản hơn.
              </p>
            </div>
          </div>

          <div className="dashboard-toolbar-group">
            {isManager && (
              <button
                type="button"
                className="dashboard-btn dashboard-btn-primary"
                onClick={() => navigate("/add-product")}
              >
                <FaPlus />
                Thêm sản phẩm
              </button>
            )}
            <button
              type="button"
              className="dashboard-btn dashboard-btn-secondary"
              onClick={() => navigate("/carts")}
            >
              <FaEye />
              Giỏ hàng ({cartItems.length})
            </button>
          </div>
        </div>

        <div className="dashboard-stats-grid" style={{ marginBottom: 20 }}>
          <article
            className="dashboard-stat dashboard-stat-accent"
            style={{ "--stat-accent": "#7c3aed" }}
          >
            <div
              className="dashboard-stat-icon"
              style={{ background: "#f5f3ff", color: "#7c3aed" }}
            >
              <FaBoxOpen />
            </div>
            <div>
              <p className="dashboard-stat-value">{products.length}</p>
              <p className="dashboard-stat-label">Tổng sản phẩm</p>
            </div>
          </article>

          <article
            className="dashboard-stat dashboard-stat-accent"
            style={{ "--stat-accent": "#3b82f6" }}
          >
            <div
              className="dashboard-stat-icon"
              style={{ background: "#eff6ff", color: "#3b82f6" }}
            >
              <FaSearch />
            </div>
            <div>
              <p className="dashboard-stat-value">{filteredProducts.length}</p>
              <p className="dashboard-stat-label">Đang hiển thị</p>
            </div>
          </article>

          <article
            className="dashboard-stat dashboard-stat-accent"
            style={{ "--stat-accent": "#ec4899" }}
          >
            <div
              className="dashboard-stat-icon"
              style={{ background: "#fdf2f8", color: "#ec4899" }}
            >
              {favoriteCount > 0 ? <FaHeart /> : <FaRegHeart />}
            </div>
            <div>
              <p className="dashboard-stat-value">{favoriteCount}</p>
              <p className="dashboard-stat-label">Mục yêu thích</p>
            </div>
          </article>

          <article
            className="dashboard-stat dashboard-stat-accent"
            style={{ "--stat-accent": "#16a34a" }}
          >
            <div
              className="dashboard-stat-icon"
              style={{ background: "#ecfdf3", color: "#16a34a" }}
            >
              <FaCartPlus />
            </div>
            <div>
              <p className="dashboard-stat-value">{cartItems.length}</p>
              <p className="dashboard-stat-label">Trong giỏ hàng</p>
            </div>
          </article>
        </div>

        <section className="dashboard-panel" style={{ marginBottom: 20 }}>
          <div className="dashboard-panel-body">
            <div className="commerce-filter-layout">
              <div className="commerce-search-main">
                <label htmlFor="product-search" className="commerce-filter-label">
                  Tìm kiếm
                </label>
                <div className="commerce-search-input-wrap">
                  <FaSearch className="commerce-search-icon" />
                  <input
                    id="product-search"
                    className="dashboard-input commerce-search-input"
                    value={searchTerm}
                    onChange={(event) => {
                      setSearchTerm(event.target.value);
                      setCurrentPage(1);
                    }}
                    placeholder="Tên, mã hoặc mô tả"
                  />
                </div>
              </div>

              <div className="commerce-filter-price">
                <div className="dashboard-field">
                  <label htmlFor="price-min">Giá từ</label>
                  <input
                    id="price-min"
                    className="dashboard-input"
                    type="number"
                    value={priceRange.min}
                    onChange={(event) =>
                      setPriceRange((prev) => ({
                        ...prev,
                        min: Number(event.target.value) || 0,
                      }))
                    }
                  />
                </div>
                <div className="dashboard-field">
                  <label htmlFor="price-max">Giá đến</label>
                  <input
                    id="price-max"
                    className="dashboard-input"
                    type="number"
                    value={priceRange.max}
                    onChange={(event) =>
                      setPriceRange((prev) => ({
                        ...prev,
                        max: Number(event.target.value) || 1000000,
                      }))
                    }
                  />
                </div>
              </div>

              <div className="commerce-filter-size">
                <label className="commerce-filter-label">Kích thước</label>
                <div className="dashboard-toolbar-group">
                  {uniqueSizes.length === 0 && (
                    <span className="dashboard-count">Chưa có dữ liệu size</span>
                  )}
                  {uniqueSizes.map((size) => (
                    <button
                      key={size}
                      type="button"
                      className={`dashboard-chip ${selectedSizes.includes(size) ? "active" : ""}`}
                      onClick={() => {
                        setCurrentPage(1);
                        setSelectedSizes((prev) =>
                          prev.includes(size)
                            ? prev.filter((item) => item !== size)
                            : [...prev, size]
                        );
                      }}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <div style={{ display: "grid", gap: 18 }}>
          <div className="dashboard-toolbar">
            <div className="dashboard-toolbar-group">
              <button
                type="button"
                className={`dashboard-chip ${viewMode === "grid" ? "active" : ""}`}
                onClick={() => setViewMode("grid")}
              >
                <FaThLarge />
                Lưới
              </button>
              <button
                type="button"
                className={`dashboard-chip ${viewMode === "list" ? "active" : ""}`}
                onClick={() => setViewMode("list")}
              >
                <FaList />
                Danh sách
              </button>
            </div>

            <div className="dashboard-toolbar-group">
              <select
                className="dashboard-select"
                value={sortOption}
                onChange={(event) => setSortOption(event.target.value)}
              >
                <option value="latest">Mới nhất</option>
                <option value="name-asc">Tên A-Z</option>
                <option value="price-asc">Giá tăng dần</option>
                <option value="price-desc">Giá giảm dần</option>
              </select>
              <select
                className="dashboard-select"
                value={itemsPerPage}
                onChange={(event) => {
                  setItemsPerPage(Number(event.target.value));
                  setCurrentPage(1);
                }}
              >
                <option value={8}>8 / trang</option>
                <option value={12}>12 / trang</option>
                <option value={24}>24 / trang</option>
              </select>
            </div>
          </div>

          {error && <div className="commerce-alert commerce-alert-danger">{error}</div>}

          {isLoading ? (
            <section className="dashboard-panel">
              <div className="dashboard-empty">Đang tải dữ liệu sản phẩm...</div>
            </section>
          ) : filteredProducts.length === 0 ? (
            <section className="dashboard-panel">
              <div className="dashboard-empty">
                <div className="commerce-empty-icon">
                  <FaBoxOpen />
                </div>
                <h3>Không tìm thấy sản phẩm phù hợp</h3>
                <p>Thử đổi từ khóa tìm kiếm hoặc bớt bộ lọc để xem thêm kết quả.</p>
              </div>
            </section>
          ) : viewMode === "grid" ? (
            <div className="commerce-products-grid">
              {pagedProducts.map((product) => (
                <article key={product.id} className="commerce-product-card">
                  {/* ── Image section ── */}
                  <div className="commerce-product-media" onClick={() => navigate(`/products/${product.id}`)}>
                    <img src={product.image} alt={product.name} />

                    {/* Price badge on image */}
                    <div style={{
                      position: "absolute", bottom: 10, left: 12, zIndex: 3,
                      background: "linear-gradient(135deg,#7c3aed,#4338ca)",
                      color: "#fff", borderRadius: 999, padding: "4px 12px",
                      fontSize: "0.82rem", fontWeight: 800, letterSpacing: "-0.02em",
                      boxShadow: "0 4px 12px rgba(109,40,217,0.4)",
                      opacity: 0, transition: "opacity 0.3s ease",
                    }} className="commerce-price-badge">
                      {formatCurrency(product.price)}
                    </div>

                    {/* Favourite button */}
                    {!isManager && (
                      <button
                        type="button"
                        className={`commerce-product-favorite ${favorites.includes(product.id) ? "active" : ""}`}
                        onClick={(e) => { e.stopPropagation(); handleToggleFavorite(navigate, product.id); }}
                      >
                        {favorites.includes(product.id) ? <FaHeart /> : <FaRegHeart />}
                      </button>
                    )}
                  </div>

                  {/* ── Body ── */}
                  <div className="commerce-product-body">
                    <div className="commerce-product-summary">
                      <div>
                        <h3 className="commerce-product-title">{product.name}</h3>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
                          <span style={{
                            fontSize: "0.72rem", fontWeight: 700, color: "#8b5cf6",
                            background: "#f5f3ff", padding: "2px 8px", borderRadius: 999,
                          }}>{product.code || "SP"}</span>
                          <span style={{
                            fontSize: "0.72rem", fontWeight: 700, color: "#0ea5e9",
                            background: "#f0f9ff", padding: "2px 8px", borderRadius: 999,
                          }}>Size {product.size || "M"}</span>
                        </div>
                      </div>
                      <p className="commerce-product-description">
                        {product.description || "Chưa có mô tả cho sản phẩm này."}
                      </p>
                    </div>

                    {/* Price + actions */}
                    <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: 12, display: "flex", flexDirection: "column", gap: 10 }}>
                      <span className="commerce-price">{formatCurrency(product.price)}</span>

                      <div className="commerce-actions" style={{ gap: 8 }}>
                        <button
                          type="button"
                          className="dashboard-btn dashboard-btn-secondary"
                          style={{ flex: 1, fontSize: "0.8rem", padding: "8px 10px", borderRadius: 10 }}
                          onClick={() => navigate(`/products/${product.id}`)}
                        >
                          <FaEye />
                          Chi tiết
                        </button>
                        {isManager ? (
                          <>
                            <button
                              type="button"
                              className="dashboard-btn dashboard-btn-primary"
                              style={{ flex: 1, fontSize: "0.8rem", padding: "8px 10px", borderRadius: 10 }}
                              onClick={() => navigate(`/edit-product/${product.id}`)}
                            >
                              <FaEdit />
                              Sửa
                            </button>
                            <button
                              type="button"
                              className="dashboard-btn dashboard-btn-danger"
                              style={{ fontSize: "0.8rem", padding: "8px 12px", borderRadius: 10 }}
                              onClick={() => handleDelete(product.id)}
                            >
                              <FaTrash />
                              Xóa
                            </button>
                          </>
                        ) : (
                          <button
                            type="button"
                            className="dashboard-btn dashboard-btn-primary"
                            style={{ flex: 1, fontSize: "0.8rem", padding: "8px 10px", borderRadius: 10 }}
                            onClick={() => handleAddToCart(navigate, product)}
                          >
                            <FaCartPlus />
                            Thêm vào giỏ
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="commerce-list">
              {pagedProducts.map((product) => (
                <article key={product.id} className="dashboard-panel commerce-list-item">
                  <img src={product.image} alt={product.name} className="commerce-list-thumb" />
                  <div className="commerce-list-body">
                    <div className="commerce-inline-stats">
                      <div>
                        <h3 className="commerce-product-title">{product.name}</h3>
                        <span className="dashboard-code">{product.code || "SP"}</span>
                      </div>
                      <span className="commerce-price">{formatCurrency(product.price)}</span>
                    </div>
                    <p className="commerce-product-description">
                      {product.description || "Chưa có mô tả cho sản phẩm này."}
                    </p>
                    <div className="commerce-meta">
                      <span className="dashboard-badge dashboard-badge-info">
                        Size {product.size || "M"}
                      </span>
                      {category && (
                        <span className="dashboard-badge dashboard-badge-neutral">{category}</span>
                      )}
                    </div>
                    <div className="commerce-actions commerce-actions-list">
                      <button
                        type="button"
                        className="dashboard-btn dashboard-btn-secondary"
                        onClick={() => navigate(`/products/${product.id}`)}
                      >
                        <FaEye />
                        Xem nhanh
                      </button>
                      {!isManager && (
                        <button
                          type="button"
                          className={`dashboard-btn ${
                            favorites.includes(product.id)
                              ? "dashboard-btn-danger"
                              : "dashboard-btn-secondary"
                          }`}
                          onClick={() => handleToggleFavorite(navigate, product.id)}
                        >
                          {favorites.includes(product.id) ? <FaHeart /> : <FaRegHeart />}
                          Yêu thích
                        </button>
                      )}
                      {isManager ? (
                        <>
                          <button
                            type="button"
                            className="dashboard-btn dashboard-btn-primary"
                            onClick={() => navigate(`/edit-product/${product.id}`)}
                          >
                            <FaEdit />
                            Sửa
                          </button>
                          <button
                            type="button"
                            className="dashboard-btn dashboard-btn-danger"
                            onClick={() => handleDelete(product.id)}
                          >
                            <FaTrash />
                            Xóa
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          className="dashboard-btn dashboard-btn-primary"
                          onClick={() => handleAddToCart(navigate, product)}
                        >
                          <FaCartPlus />
                          Thêm vào giỏ
                        </button>
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}

          <div className="dashboard-toolbar">
            <span className="dashboard-count">
              Trang {currentPage}/{totalPages}
            </span>
            <div className="dashboard-toolbar-group">
              <button
                type="button"
                className="dashboard-btn dashboard-btn-secondary"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              >
                Trước
              </button>
              <button
                type="button"
                className="dashboard-btn dashboard-btn-primary"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
              >
                Sau
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Products;
