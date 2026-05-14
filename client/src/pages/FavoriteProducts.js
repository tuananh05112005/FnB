import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaCartPlus, FaHeart, FaRegHeart } from "react-icons/fa";

import ProductImage from "../components/common/ProductImage";
import { api } from "../lib/api";
import { getUserId } from "../lib/session";
import { addToCart } from "../services/cartService";
import "../styles/dashboard.css";
import "../styles/commerce.css";

const formatCurrency = (amount) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(Number(amount) || 0);

const FavoriteProducts = () => {
  const navigate = useNavigate();
  const userId = getUserId();

  const [favoriteProducts, setFavoriteProducts] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!userId) {
      navigate("/login");
      return;
    }

    const fetchFavorites = async () => {
      try {
        const response = await api.get(`/api/favorites/${userId}`);
        setFavoriteProducts(response.data);
        setFavorites(response.data.map((item) => item.id));
      } catch (fetchError) {
        console.error("Không thể tải danh sách yêu thích:", fetchError);
        setError("Không thể tải danh sách yêu thích lúc này.");
      }
    };

    fetchFavorites();
  }, [navigate, userId]);

  const handleAddToCart = async (product) => {
    try {
      await addToCart(userId, product.id, 1, product.size || "M");
    } catch (cartError) {
      console.error("Không thể thêm vào giỏ:", cartError);
      setError("Không thể thêm sản phẩm vào giỏ hàng.");
    }
  };

  const toggleFavorite = async (productId) => {
    try {
      await api.delete("/api/favorites", {
        data: { user_id: userId, product_id: productId },
      });

      setFavoriteProducts((prev) => prev.filter((product) => product.id !== productId));
      setFavorites((prev) => prev.filter((id) => id !== productId));
    } catch (favoriteError) {
      console.error("Không thể bỏ yêu thích:", favoriteError);
      setError("Không thể cập nhật danh sách yêu thích.");
    }
  };

  return (
    <div className="dashboard-page">
      <div className="dashboard-shell">
        <div className="dashboard-header">
          <div className="dashboard-title-wrap">
            <div className="dashboard-icon">
              <FaHeart />
            </div>
            <div>
              <h1 className="dashboard-title">Sản phẩm yêu thích</h1>
              <p className="dashboard-subtitle">
                Gom lại những món bạn đã lưu để quay lại nhanh hơn.
              </p>
            </div>
          </div>

          <button
            type="button"
            className="dashboard-back-btn"
            onClick={() => navigate("/products")}
          >
            Khám phá thêm
          </button>
        </div>

        <div className="commerce-kpis" style={{ marginBottom: 18 }}>
          <div className="commerce-kpi">
            <span className="commerce-kpi-label">Tổng mục yêu thích</span>
            <p className="commerce-kpi-value">{favoriteProducts.length}</p>
          </div>
        </div>

        {error && <div className="commerce-alert commerce-alert-danger">{error}</div>}

        {favoriteProducts.length === 0 ? (
          <section className="dashboard-panel">
            <div className="dashboard-empty">
              <div className="commerce-empty-icon">
                <FaHeart />
              </div>
              <h3>Danh sách yêu thích đang trống</h3>
              <p>Hãy lưu lại những món bạn muốn quay lại sau.</p>
            </div>
          </section>
        ) : (
          <div className="commerce-products-grid">
            {favoriteProducts.map((product) => (
              <article
                key={product.id}
                className="dashboard-panel commerce-product-card"
              >
                <div className="commerce-product-media">
                  <ProductImage
                    src={product.image}
                    alt={product.name}
                    onClick={() => navigate(`/products/${product.id}`)}
                    role="presentation"
                  />
                  <button
                    type="button"
                    className={`commerce-product-favorite ${
                      favorites.includes(product.id) ? "active" : ""
                    }`}
                    onClick={() => toggleFavorite(product.id)}
                  >
                    {favorites.includes(product.id) ? <FaHeart /> : <FaRegHeart />}
                  </button>
                </div>

                <div className="commerce-product-body">
                  <div className="commerce-product-summary">
                    <div>
                    <h3 className="commerce-product-title">{product.name}</h3>
                    <span className="dashboard-code">{product.code || "SP"}</span>
                    </div>
                    <p className="commerce-product-description">
                      {product.description || "Chưa có mô tả cho sản phẩm này."}
                    </p>
                    <div className="commerce-inline-stats">
                      <span className="dashboard-badge dashboard-badge-info">
                        Size {product.size || "M"}
                      </span>
                      <span className="commerce-price">
                        {formatCurrency(product.price)}
                      </span>
                    </div>
                  </div>
                  <div className="commerce-actions">
                    <button
                      type="button"
                      className="dashboard-btn dashboard-btn-primary"
                      onClick={() => handleAddToCart(product)}
                    >
                      <FaCartPlus />
                      Thêm vào giỏ
                    </button>
                    <button
                      type="button"
                      className="dashboard-btn dashboard-btn-secondary"
                      onClick={() => navigate(`/products/${product.id}`)}
                    >
                      Xem chi tiết
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FavoriteProducts;
