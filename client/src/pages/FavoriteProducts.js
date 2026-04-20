import React, { useEffect, useState } from "react";
import axios from "axios";
import { FaHeart, FaRegHeart, FaCartPlus, FaShoppingBag } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

const FavoriteProducts = () => {
  const [favoriteProducts, setFavoriteProducts] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const navigate = useNavigate();

  const user_id = localStorage.getItem("user_id");

  useEffect(() => {
    if (!user_id) {
      alert("Vui lòng đăng nhập để xem sản phẩm yêu thích");
      navigate("/login");
      return;
    }

    // Lấy danh sách sản phẩm đã yêu thích từ MySQL
    axios
      .get(`http://localhost:5000/api/favorites/${user_id}`)
      .then((res) => {
        setFavoriteProducts(res.data);
        setFavorites(res.data.map((item) => item.id));
      })
      .catch((err) => console.error("Lỗi khi lấy danh sách yêu thích:", err));
  }, [user_id]);

  // Định dạng tiền
  const formatCurrency = (amount) =>
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);

  // Thêm sản phẩm vào giỏ
  const handleAddToCart = async (product) => {
    try {
      await axios.post("http://localhost:5000/api/cart/add", {
        user_id,
        product_id: product.id,
        quantity: 1,
        size: product.size || "M",
      });
      alert(`Đã thêm ${product.name} vào giỏ hàng`);
    } catch (err) {
      console.error("Lỗi thêm vào giỏ:", err);
    }
  };

  // Bỏ yêu thích
  const toggleFavorite = async (productId) => {
    try {
      await axios.delete("http://localhost:5000/api/favorites", {
        data: { user_id, product_id: productId },
      });
      setFavoriteProducts((prev) =>
        prev.filter((product) => product.id !== productId)
      );
      setFavorites((prev) => prev.filter((id) => id !== productId));
    } catch (err) {
      console.error("Lỗi khi bỏ yêu thích:", err);
    }
  };

  return (
    <div className="min-vh-100" style={{ backgroundColor: "#f8fafc" }}>
      <div className="container py-5">
        {/* Header Section */}
        <div className="text-center mb-5">
          <div className="d-inline-flex align-items-center justify-content-center mb-3"
            style={{
              width: "80px",
              height: "80px",
              backgroundColor: "#e11d48",
              borderRadius: "50%",
              boxShadow: "0 8px 25px rgba(225, 29, 72, 0.25)",
            }}>
            <FaHeart className="text-white" style={{ fontSize: "2rem" }} />
          </div>
          <h1 className="mb-2" style={{ fontWeight: "700", fontSize: "2.5rem", color: "#1e293b" }}>
            Sản phẩm yêu thích
          </h1>
          <p className="mb-0" style={{ fontSize: "1.1rem", color: "#64748b" }}>
            Khám phá những sản phẩm bạn đã lưu lại
          </p>
        </div>

        {favoriteProducts.length === 0 ? (
          <div className="text-center py-5">
            <div className="card mx-auto" style={{
              maxWidth: "500px",
              borderRadius: "24px",
              border: "1px solid #e2e8f0",
              backgroundColor: "#ffffff",
              boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)"
            }}>
              <div className="card-body py-5">
                <FaShoppingBag className="mb-3" style={{ fontSize: "4rem", color: "#94a3b8" }} />
                <h3 className="mb-3" style={{ color: "#334155", fontWeight: "600" }}>Chưa có sản phẩm yêu thích</h3>
                <p className="mb-4" style={{ color: "#64748b" }}>
                  Hãy khám phá và thêm những sản phẩm bạn yêu thích vào danh sách này
                </p>
                <button
                  className="btn px-4 py-2"
                  style={{
                    borderRadius: "12px",
                    backgroundColor: "#3b82f6",
                    border: "none",
                    color: "white",
                    fontWeight: "500",
                    transition: "all 0.2s ease"
                  }}
                  onClick={() => navigate('/products')}
                  onMouseEnter={(e) => e.target.style.backgroundColor = "#2563eb"}
                  onMouseLeave={(e) => e.target.style.backgroundColor = "#3b82f6"}
                >
                  Khám phá ngay
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="row g-4">
            {favoriteProducts.map((product) => (
              <div key={product.id} className="col-lg-3 col-md-4 col-sm-6">
                <div className="card h-100 position-relative overflow-hidden"
                  style={{
                    borderRadius: "20px",
                    backgroundColor: "#ffffff",
                    border: "1px solid #e2e8f0",
                    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                    transition: "all 0.3s ease",
                    cursor: "pointer"
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-8px)";
                    e.currentTarget.style.boxShadow = "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "0 4px 6px -1px rgba(0, 0, 0, 0.1)";
                  }}>

                  {/* Product Image */}
                  <div className="position-relative overflow-hidden" style={{ borderRadius: "20px 20px 0 0" }}>
                    <img
                      src={product.image}
                      alt={product.name}
                      className="card-img-top w-100"
                      style={{
                        height: "250px",
                        objectFit: "cover",
                        transition: "transform 0.3s ease"
                      }}
                      onClick={() => navigate(`/products/${product.id}`)}
                      onMouseEnter={(e) => e.target.style.transform = "scale(1.05)"}
                      onMouseLeave={(e) => e.target.style.transform = "scale(1)"}
                    />

                    {/* Favorite Button */}
                    <button
                      className="btn position-absolute d-flex align-items-center justify-content-center"
                      style={{
                        top: "15px",
                        right: "15px",
                        width: "45px",
                        height: "45px",
                        borderRadius: "50%",
                        backgroundColor: "#ffffff",
                        border: "1px solid #e2e8f0",
                        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                        transition: "all 0.3s ease"
                      }}
                      onClick={() => toggleFavorite(product.id)}
                      onMouseEnter={(e) => {
                        e.target.style.transform = "scale(1.1)";
                        e.target.style.boxShadow = "0 10px 15px -3px rgba(0, 0, 0, 0.1)";
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.transform = "scale(1)";
                        e.target.style.boxShadow = "0 4px 6px -1px rgba(0, 0, 0, 0.1)";
                      }}
                    >
                      {favorites.includes(product.id) ? (
                        <FaHeart className="text-danger" style={{ fontSize: "1.2rem" }} />
                      ) : (
                        <FaRegHeart style={{ fontSize: "1.2rem", color: "#64748b" }} />
                      )}
                    </button>

                    {/* Clean overlay */}
                    <div className="position-absolute w-100 h-100 top-0 start-0"
                      style={{
                        background: "linear-gradient(180deg, transparent 70%, rgba(0,0,0,0.05) 100%)",
                        pointerEvents: "none"
                      }}></div>
                  </div>

                  {/* Card Body */}
                  <div className="card-body d-flex flex-column p-4">
                    <h5 className="card-title mb-2"
                      style={{
                        fontWeight: "600",
                        color: "#2d3748",
                        fontSize: "1.1rem",
                        lineHeight: "1.3"
                      }}>
                      {product.name}
                    </h5>

                    <p className="text-muted small flex-grow-1 mb-3"
                      style={{
                        lineHeight: "1.4",
                        fontSize: "0.9rem"
                      }}>
                      {product.description}
                    </p>

                    {/* Price and Add to Cart */}
                    <div className="d-flex justify-content-between align-items-center">
                      <span className="fw-bold"
                        style={{
                          color: "#059669",
                          fontSize: "1.2rem"
                        }}>
                        {formatCurrency(product.price)}
                      </span>

                      <button
                        className="btn btn-sm d-flex align-items-center px-3 py-2"
                        style={{
                          backgroundColor: "#3b82f6",
                          border: "none",
                          borderRadius: "12px",
                          color: "white",
                          fontWeight: "500",
                          fontSize: "0.9rem",
                          transition: "all 0.2s ease"
                        }}
                        onClick={() => handleAddToCart(product)}
                        onMouseEnter={(e) => {
                          e.target.style.transform = "translateY(-2px)";
                          e.target.style.backgroundColor = "#2563eb";
                          e.target.style.boxShadow = "0 10px 15px -3px rgba(59, 130, 246, 0.3)";
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.transform = "translateY(0)";
                          e.target.style.backgroundColor = "#3b82f6";
                          e.target.style.boxShadow = "none";
                        }}
                      >
                        <FaCartPlus className="me-2" style={{ fontSize: "0.9rem" }} />
                        Thêm giỏ
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FavoriteProducts;