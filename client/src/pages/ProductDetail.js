import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FaArrowLeft, FaCartPlus, FaHeart, FaInfoCircle } from "react-icons/fa";

import ProductImage from "../components/common/ProductImage";
import { api } from "../lib/api";
import { getUserId } from "../lib/session";
import { addToCart } from "../services/cartService";
import { getProduct, isProductAvailable } from "../services/productService";
import "../styles/dashboard.css";
import "../styles/commerce.css";

const formatCurrency = (amount) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(Number(amount) || 0);

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const userId = getUserId();

  const [product, setProduct] = useState(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const [productData, favorites] = await Promise.all([
          getProduct(id),
          userId
            ? api.get(`/api/favorites/${userId}`).then((res) => res.data).catch(() => [])
            : Promise.resolve([]),
        ]);

        setProduct(productData);
        setIsFavorite(favorites.some((item) => String(item.id) === String(id)));
      } catch (fetchError) {
        console.error("Không thể tải chi tiết sản phẩm:", fetchError);
        setError("Không thể tải chi tiết sản phẩm.");
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
  }, [id, userId]);

  const handleAddToCart = async () => {
    if (!userId) {
      navigate("/login");
      return;
    }

    try {
      if (!isProductAvailable(product)) {
        setError("Món này hiện đang hết, vui lòng chọn món khác.");
        return;
      }

      await addToCart(userId, product.id, 1, product.size || "M");
      navigate("/carts");
    } catch (cartError) {
      console.error("Không thể thêm vào giỏ hàng:", cartError);
      setError("Không thể thêm sản phẩm vào giỏ hàng.");
    }
  };

  const toggleFavorite = async () => {
    if (!userId) {
      navigate("/login");
      return;
    }

    try {
      if (isFavorite) {
        await api.delete("/api/favorites", {
          data: { user_id: userId, product_id: product.id },
        });
        setIsFavorite(false);
      } else {
        await api.post("/api/favorites", {
          user_id: userId,
          product_id: product.id,
        });
        setIsFavorite(true);
      }
    } catch (favoriteError) {
      console.error("Không thể cập nhật yêu thích:", favoriteError);
      setError("Không thể cập nhật trạng thái yêu thích.");
    }
  };

  if (loading) {
    return (
      <div className="dashboard-page">
        <div className="dashboard-shell">
          <section className="dashboard-panel">
            <div className="dashboard-empty">Đang tải chi tiết sản phẩm...</div>
          </section>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="dashboard-page">
        <div className="dashboard-shell">
          <section className="dashboard-panel">
            <div className="dashboard-empty">{error || "Không tìm thấy sản phẩm."}</div>
          </section>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <div className="dashboard-shell">
        <div className="dashboard-header">
          <div className="dashboard-title-wrap">
            <div className="dashboard-icon">
              <FaInfoCircle />
            </div>
            <div>
              <h1 className="dashboard-title">{product.name}</h1>
              <p className="dashboard-subtitle">
                Xem chi tiết sản phẩm trước khi đưa vào giỏ hàng.
              </p>
            </div>
          </div>

          <button
            type="button"
            className="dashboard-back-btn"
            onClick={() => navigate(-1)}
          >
            <FaArrowLeft />
            Quay lai
          </button>
        </div>

        <section className="dashboard-panel">
          <div className="dashboard-panel-body commerce-detail">
            <div>
              <ProductImage
                src={product.image}
                alt={product.name}
                className="commerce-detail-image"
              />
            </div>

            <div className="commerce-detail-section">
              <div className="commerce-meta">
                <span className="dashboard-code">{product.code || "SP"}</span>
                <span className="dashboard-badge dashboard-badge-info">
                  Size {product.size || "M"}
                </span>
              </div>

              <div className="commerce-price" style={{ fontSize: "2rem" }}>
                {formatCurrency(product.price)}
              </div>

              <span
                className={`dashboard-badge ${
                  isProductAvailable(product) ? "dashboard-badge-success" : "dashboard-badge-danger"
                }`}
                style={{ alignSelf: "flex-start" }}
              >
                {isProductAvailable(product) ? "Đang bán" : "Hết món"}
              </span>

              <p className="commerce-note">
                {product.description || "Chưa có mô tả chi tiết cho sản phẩm này."}
              </p>

              <div className="commerce-actions">
                <button
                  type="button"
                  className="dashboard-btn dashboard-btn-primary"
                  disabled={!isProductAvailable(product)}
                  onClick={handleAddToCart}
                >
                  <FaCartPlus />
                  {isProductAvailable(product) ? "Thêm vào giỏ hàng" : "Hết món"}
                </button>
                <button
                  type="button"
                  className={`dashboard-btn ${
                    isFavorite ? "dashboard-btn-danger" : "dashboard-btn-secondary"
                  }`}
                  onClick={toggleFavorite}
                >
                  <FaHeart />
                  {isFavorite ? "Đã yêu thích" : "Lưu yêu thích"}
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default ProductDetail;
