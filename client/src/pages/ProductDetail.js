import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FaArrowLeft, FaCartPlus, FaHeart, FaInfoCircle } from "react-icons/fa";

import { api } from "../lib/api";
import { getUserId } from "../lib/session";
import { addToCart } from "../services/cartService";
import { getProduct } from "../services/productService";
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
        console.error("Khong the tai chi tiet san pham:", fetchError);
        setError("Khong the tai chi tiet san pham.");
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
      await addToCart(userId, product.id, 1, product.size || "M");
      navigate("/carts");
    } catch (cartError) {
      console.error("Khong the them vao gio hang:", cartError);
      setError("Khong the them san pham vao gio hang.");
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
      console.error("Khong the cap nhat yeu thich:", favoriteError);
      setError("Khong the cap nhat trang thai yeu thich.");
    }
  };

  if (loading) {
    return (
      <div className="dashboard-page">
        <div className="dashboard-shell">
          <section className="dashboard-panel">
            <div className="dashboard-empty">Dang tai chi tiet san pham...</div>
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
            <div className="dashboard-empty">{error || "Khong tim thay san pham."}</div>
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
                Xem chi tiet san pham truoc khi dua vao gio hang.
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
              <img
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

              <p className="commerce-note">
                {product.description || "Chua co mo ta chi tiet cho san pham nay."}
              </p>

              <div className="commerce-actions">
                <button
                  type="button"
                  className="dashboard-btn dashboard-btn-primary"
                  onClick={handleAddToCart}
                >
                  <FaCartPlus />
                  Them vao gio hang
                </button>
                <button
                  type="button"
                  className={`dashboard-btn ${
                    isFavorite ? "dashboard-btn-danger" : "dashboard-btn-secondary"
                  }`}
                  onClick={toggleFavorite}
                >
                  <FaHeart />
                  {isFavorite ? "Da yeu thich" : "Luu yeu thich"}
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
