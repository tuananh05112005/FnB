import React, { useEffect, useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import {
  FaEdit,
  FaTrash,
  FaPlus,
  FaCartPlus,
  FaEye,
  FaHeart,
  FaRegHeart,
  FaStar,
  FaTh,
  FaList,
} from "react-icons/fa";
import axios from "axios";

import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import styles from "./ProductStyle.js";


// import ChatBox from "./ChatBox";

const ProductGrid = () => {
  const [products, setProducts] = useState([]);
  const [cartItems, setCartItems] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [sortField, setSortField] = useState(null);
  const [sortOrder, setSortOrder] = useState("asc");
  const [searchTerm, setSearchTerm] = useState("");
  const [searchParams, setSearchParams] = useSearchParams();
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);
  const [viewMode, setViewMode] = useState("grid"); // grid hoặc list
  const [priceRange, setPriceRange] = useState({ min: 0, max: 10000000 });
  const [selectedSizes, setSelectedSizes] = useState([]);
  
const category = searchParams.get("category");

  const role = localStorage.getItem("role");
  const navigate = useNavigate();



  // Lấy giỏ hàng từ API
  const fetchCartItems = async () => {
    const user_id = localStorage.getItem("user_id");

    if (!user_id) {
      alert("Vui lòng đăng nhập để xem giỏ hàng");
      navigate("/login");
      return;
    }

    try {
      const response = await axios.get(
        `http://localhost:5000/api/cart/${user_id}`
      );
      setCartItems(response.data);
    } catch (error) {
      console.error("Lỗi khi lấy giỏ hàng:", error);
      alert("Có lỗi xảy ra khi lấy giỏ hàng. Vui lòng thử lại.");
    }
  };
  

  // Khôi phục cartItems và favorites từ localStorage
  useEffect(() => {
    const savedCartItems = JSON.parse(localStorage.getItem("cartItems")) || [];
    const savedFavorites = JSON.parse(localStorage.getItem("favorites")) || [];
    setCartItems(savedCartItems);
    setFavorites(savedFavorites);
  }, []);

  // Lưu cartItems và favorites vào localStorage
  useEffect(() => {
    localStorage.setItem("cartItems", JSON.stringify(cartItems));
  }, [cartItems]);

  useEffect(() => {
    localStorage.setItem("favorites", JSON.stringify(favorites));
  }, [favorites]);

  // Cập nhật URL khi thay đổi trang hoặc limit
useEffect(() => {
  const params = new URLSearchParams(searchParams); // <-- giữ lại tất cả query hiện có
  params.set("page", currentPage);
  params.set("limit", itemsPerPage);
  setSearchParams(params);
}, [currentPage, itemsPerPage]);


  // Lấy giá trị page và limit từ URL
  useEffect(() => {
    const page = parseInt(searchParams.get("page")) || 1;
    const limit = parseInt(searchParams.get("limit")) || 12;
    setCurrentPage(page);
    setItemsPerPage(limit);
  }, [searchParams]);

  // // Lấy dữ liệu từ API
  // useEffect(() => {
  //   const fetchProducts = async () => {
  //     try {
  //       const response = await axios.get("http://localhost:5000/api/products");
  //       setProducts(response.data);
  //     } catch (error) {
  //       console.error("Lỗi khi lấy dữ liệu sản phẩm:", error);
  //     }
  //   };

  //   fetchProducts();
  // }, []);

useEffect(() => {
  const fetchProducts = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/products", {
        params: category ? { category } : {},
      });
    console.log("CATEGORY PARAM:", category);

      
      setProducts(res.data);
    } catch (error) {
      console.error("Lỗi khi lấy sản phẩm theo danh mục:", error);
    }
  };

  fetchProducts();
}, [category]);


  // Xử lý mở trang chỉnh sửa sản phẩm
  const handleEditClick = (productId) => {
    navigate(`/edit-product/${productId}`);
  };

  // Xử lý xóa sản phẩm
  const handleDeleteProduct = async (productId) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa sản phẩm này không?")) {
      try {
        await axios.delete(`http://localhost:5000/api/products/${productId}`);
        setProducts(products.filter((product) => product.id !== productId));
      } catch (error) {
        console.error("Lỗi khi xóa sản phẩm:", error);
        alert("Không thể xóa sản phẩm vì có dữ liệu liên quan.");
      }
    }
  };

  // Xử lý thêm/xóa yêu thích
  const handleToggleFavorite = (productId) => {
    const newFavorites = favorites.includes(productId)
      ? favorites.filter((id) => id !== productId)
      : [...favorites, productId];
    setFavorites(newFavorites);
  };

  // Xử lý thêm sản phẩm vào giỏ hàng
  const handleAddToCart = async (product) => {
    const user_id = localStorage.getItem("user_id");
    const token = localStorage.getItem("token");
    if (!user_id || !token) {
      // Nếu chưa đăng nhập, hiển thị thông báo và không thực hiện thêm vào giỏ hàng
      alert("Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng");
      return;
    }

    try {
      const response = await axios.post("http://localhost:5000/api/cart/add", {
        user_id: user_id,
        product_id: product.id,
        quantity: 1,
        size: product.size || "M",
      });
      alert(`Đã thêm sản phẩm ${product.name} vào giỏ hàng`);
      fetchCartItems();
    } catch (error) {
      console.error("Lỗi khi thêm sản phẩm vào giỏ hàng:", error);
    }
  };

  // Xử lý chuyển trang sang giỏ hàng
  const handleViewCart = () => {
    const savedCartItems = JSON.parse(localStorage.getItem("cartItems")) || [];
    navigate("/carts", { state: { cartItems: savedCartItems } });
  };

  // Xử lý sắp xếp
  const handleSort = (field) => {
    const order = sortField === field && sortOrder === "asc" ? "desc" : "asc";
    setSortField(field);
    setSortOrder(order);

    const sortedProducts = [...products].sort((a, b) => {
      if (a[field] < b[field]) return order === "asc" ? -1 : 1;
      if (a[field] > b[field]) return order === "asc" ? 1 : -1;
      return 0;
    });

    setProducts(sortedProducts);
  };

  // Xử lý tìm kiếm và lọc
  const filteredProducts = products.filter((product) => {
    const name = product.name?.toLowerCase() || "";
    const code = product.code?.toLowerCase() || "";
    const description = product.description?.toLowerCase() || "";
    const searchTermLower = searchTerm.toLowerCase();

    const matchesSearch =
      name.includes(searchTermLower) ||
      code.includes(searchTermLower) ||
      description.includes(searchTermLower);

    const matchesPrice =
      product.price >= priceRange.min && product.price <= priceRange.max;

    const matchesSize =
      selectedSizes.length === 0 || selectedSizes.includes(product.size);

    return matchesSearch && matchesPrice && matchesSize;
  });

  // Xử lý phân trang
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredProducts.slice(
    indexOfFirstItem,
    indexOfLastItem
  );
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  const handleLimitChange = (limit) => {
    setItemsPerPage(limit);
    setCurrentPage(1);
  };

  // Lấy danh sách size duy nhất
  const uniqueSizes = [...new Set(products.map((p) => p.size).filter(Boolean))];

  const handleSizeFilter = (size) => {
    const newSelectedSizes = selectedSizes.includes(size)
      ? selectedSizes.filter((s) => s !== size)
      : [...selectedSizes, size];
    setSelectedSizes(newSelectedSizes);
  };

  return (
    <div
      className="container-fluid mt-3 p-2 p-md-4"
      style={{
        background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)",
        minHeight: "100vh",
      }}
    >
      {/* Header */}
      <div className="text-center mb-5">
        <h1
          className="display-4 text-dark mb-3"
          style={{ fontWeight: "700", letterSpacing: "-1px" }}
        >
          Coffe & Tea
        </h1>
        <p className="lead text-muted">"Vị ngon không chờ đợi – Đặt là ship!</p>
      </div>

      {/* Thanh điều khiển */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="card" style={styles.filterCard}>
            <div className="row align-items-center">
              {/* Nút thêm sản phẩm và xem giỏ hàng */}
              <div className="col-md-4 mb-3 mb-md-0">
                <div className="d-flex gap-2">
                  {role === "staff" && (
                    <button
                      className="btn btn-success rounded-pill"
                      onClick={() => navigate("/add-product")}
                    >
                      <FaPlus className="me-2" />
                      Thêm sản phẩm
                    </button>
                  )}
                  <button
                    className="btn btn-primary rounded-pill"
                    onClick={handleViewCart}
                  >
                    <FaEye className="me-2" />
                    Giỏ hàng ({cartItems.length})
                  </button>
                </div>
              </div>

              {/* Thanh tìm kiếm */}
              <div className="col-md-5 mb-3 mb-md-0">
                <div className="position-relative">
                  <input
                    type="text"
                    className="form-control"
                    style={styles.searchBox}
                    placeholder="🔍 Tìm kiếm sản phẩm..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              {/* Chuyển đổi view */}
              <div className="col-md-3">
                <div className="d-flex gap-2 justify-content-end">
                  <button
                    className={`btn ${
                      viewMode === "grid"
                        ? "btn-primary"
                        : "btn-outline-primary"
                    } rounded-pill`}
                    onClick={() => setViewMode("grid")}
                  >
                    <FaTh />
                  </button>
                  <button
                    className={`btn ${
                      viewMode === "list"
                        ? "btn-primary"
                        : "btn-outline-primary"
                    } rounded-pill`}
                    onClick={() => setViewMode("list")}
                  >
                    <FaList />
                  </button>
                </div>
              </div>
            </div>

            {/* Bộ lọc */}
            <div className="row mt-3">
              <div className="col-md-6">
                <label className="form-label fw-bold">Lọc theo giá:</label>
                <div className="d-flex gap-2 align-items-center">
                  <input
                    type="number"
                    className="form-control form-control-sm"
                    placeholder="Giá từ"
                    value={priceRange.min}
                    onChange={(e) =>
                      setPriceRange((prev) => ({
                        ...prev,
                        min: parseInt(e.target.value) || 0,
                      }))
                    }
                  />
                  <span>đến</span>
                  <input
                    type="number"
                    className="form-control form-control-sm"
                    placeholder="Giá đến"
                    value={priceRange.max}
                    onChange={(e) =>
                      setPriceRange((prev) => ({
                        ...prev,
                        max: parseInt(e.target.value) || 10000000,
                      }))
                    }
                  />
                </div>
              </div>
              <div className="col-md-6">
                <label className="form-label fw-bold">Lọc theo size:</label>
                <div className="d-flex gap-2 flex-wrap">
                  {uniqueSizes.map((size) => (
                    <button
                      key={size}
                      className={`btn btn-sm rounded-pill ${
                        selectedSizes.includes(size)
                          ? "btn-success"
                          : "btn-outline-success"
                      }`}
                      onClick={() => handleSizeFilter(size)}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sắp xếp */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="d-flex gap-2 align-items-center">
            <span className="fw-bold">Sắp xếp theo:</span>
            <button
              className={`btn btn-sm rounded-pill ${
                sortField === "name" ? "btn-primary" : "btn-outline-primary"
              }`}
              onClick={() => handleSort("name")}
            >
              Tên{" "}
              {sortField === "name" ? (sortOrder === "asc" ? "↑" : "↓") : ""}
            </button>
            <button
              className={`btn btn-sm rounded-pill ${
                sortField === "price" ? "btn-primary" : "btn-outline-primary"
              }`}
              onClick={() => handleSort("price")}
            >
              Giá{" "}
              {sortField === "price" ? (sortOrder === "asc" ? "↑" : "↓") : ""}
            </button>
          </div>
        </div>
      </div>

      {/* Hiển thị sản phẩm */}
      {viewMode === "grid" ? (
        // Grid View
        <div className="row">
          {currentItems.map((product) => (
            <div key={product.id} className="col-lg-3 col-md-4 col-sm-6 mb-4">
              <div
                className="card h-100"
                style={styles.productCard}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-5px)";
                  e.currentTarget.style.boxShadow =
                    "0 8px 30px rgba(0,0,0,0.15)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow =
                    "0 2px 20px rgba(0,0,0,0.1)";
                }}
              >
                <div className="position-relative ">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="card-img-top"
                    style={styles.productImage}
                    onClick={() => navigate(`/products/${product.id}`)}
                    role="button"
                  />

                  {/* Nút yêu thích */}
                  <button
                    className="btn"
                    style={styles.favoriteBtn}
                    onClick={() => handleToggleFavorite(product.id)}
                  >
                    {favorites.includes(product.id) ? (
                      <FaHeart className="text-danger" />
                    ) : (
                      <FaRegHeart className="text-muted" />
                    )}
                  </button>

                  {/* Badge mã sản phẩm */}
                  <div className="position-absolute top-0 start-0 m-2">
                    <span className="badge bg-success rounded-pill">
                      {product.code}
                    </span>
                  </div>
                </div>

                <div className="card-body d-flex flex-column">
                  <h5 className="card-title text-truncate" title={product.name}>
                    {product.name}
                  </h5>

                  <p className="card-text text-muted small flex-grow-1">
                    {product.description}
                  </p>

                  <div className="mb-2">
                    <small className="text-muted">Kích thước: </small>
                    <span className="badge bg-light text-dark">
                      {product.size}
                    </span>
                  </div>

                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <div style={styles.priceTag}>
                      {formatCurrency(product.price)}
                    </div>
                    <div className="d-flex align-items-center">
                      <FaStar className="text-warning me-1" />
                      <small>4.5</small>
                    </div>
                  </div>

                  {role === "staff" ? (
                    <div className="d-flex gap-2">
                      <button
                        className="btn btn-outline-primary btn-sm flex-fill"
                        onClick={() => handleEditClick(product.id)}
                      >
                        <FaEdit className="me-1" />
                        Sửa
                      </button>
                      <button
                        className="btn btn-outline-danger btn-sm flex-fill"
                        onClick={() => handleDeleteProduct(product.id)}
                      >
                        <FaTrash className="me-1" />
                        Xóa
                      </button>
                    </div>
                  ) : (
                    <button
                      className="btn btn-primary w-100 rounded-pill"
                      style={styles.addToCartBtn}
                      onClick={() => handleAddToCart(product)}
                    >
                      <FaCartPlus className="me-2" />
                      Thêm vào giỏ
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        // List View
        <div className="row">
          {currentItems.map((product) => (
            <div key={product.id} className="col-12 mb-3">
              <div className="card" style={styles.productCard}>
                <div className="row g-0">
                  <div className="col-md-3">
                    <div className="position-relative">
                      <img
                        src={product.image}
                        alt={product.name}
                        className="img-fluid h-100 w-100"
                        style={{
                          objectFit: "cover",
                          borderTopLeftRadius: "15px",
                          borderBottomLeftRadius: "15px",
                        }}
                      />
                      <button
                        className="btn position-absolute"
                        style={{
                          ...styles.favoriteBtn,
                          top: "10px",
                          right: "10px",
                        }}
                        onClick={() => handleToggleFavorite(product.id)}
                      >
                        {favorites.includes(product.id) ? (
                          <FaHeart className="text-danger" />
                        ) : (
                          <FaRegHeart className="text-muted" />
                        )}
                      </button>
                    </div>
                  </div>
                  <div className="col-md-9">
                    <div className="card-body h-100 d-flex flex-column">
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <h4 className="card-title mb-0">{product.name}</h4>
                        <span className="badge bg-success rounded-pill">
                          {product.code}
                        </span>
                      </div>

                      <p className="card-text text-muted mb-2">
                        {product.description}
                      </p>

                      <div className="d-flex align-items-center mb-2">
                        <small className="text-muted me-2">Kích thước:</small>
                        <span className="badge bg-light text-dark">
                          {product.size}
                        </span>
                        <div className="ms-auto d-flex align-items-center">
                          <FaStar className="text-warning me-1" />
                          <small>4.5</small>
                        </div>
                      </div>

                      <div className="mt-auto d-flex justify-content-between align-items-center">
                        <div style={styles.priceTag}>
                          {formatCurrency(product.price)}
                        </div>

                        {role === "staff" ? (
                          <div className="d-flex gap-2">
                            <button
                              className="btn btn-outline-primary"
                              onClick={() => handleEditClick(product.id)}
                            >
                              <FaEdit className="me-1" />
                              Sửa
                            </button>
                            <button
                              className="btn btn-outline-danger"
                              onClick={() => handleDeleteProduct(product.id)}
                            >
                              <FaTrash className="me-1" />
                              Xóa
                            </button>
                          </div>
                        ) : (
                          <button
                            className="btn btn-primary rounded-pill px-4"
                            style={styles.addToCartBtn}
                            onClick={() => handleAddToCart(product)}
                          >
                            <FaCartPlus className="me-2" />
                            Thêm vào giỏ
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Phân trang */}
      <div className="row mt-5">
        <div className="col-12">
          <div className="d-flex justify-content-between align-items-center">
            {/* Phần limit */}
            <div className="d-flex gap-2 align-items-center">
              <span>Hiển thị:</span>
              <select
                className="form-select"
                value={itemsPerPage}
                onChange={(e) => handleLimitChange(parseInt(e.target.value))}
                style={{ width: "80px" }}
              >
                <option value={8}>8</option>
                <option value={12}>12</option>
                <option value={24}>24</option>
                <option value={48}>48</option>
              </select>
              <span>sản phẩm</span>
            </div>

            {/* Phần phân trang */}
            <nav>
              <ul className="pagination mb-0">
                <li
                  className={`page-item ${currentPage === 1 ? "disabled" : ""}`}
                >
                  <button
                    className="page-link rounded-pill me-2"
                    onClick={() =>
                      setCurrentPage((prev) => Math.max(prev - 1, 1))
                    }
                    disabled={currentPage === 1}
                  >
                    Trước
                  </button>
                </li>

                {[...Array(Math.min(5, totalPages))].map((_, index) => {
                  const pageNumber = Math.max(1, currentPage - 2) + index;
                  if (pageNumber <= totalPages) {
                    return (
                      <li
                        key={pageNumber}
                        className={`page-item ${
                          currentPage === pageNumber ? "active" : ""
                        }`}
                      >
                        <button
                          className="page-link rounded-pill mx-1"
                          onClick={() => setCurrentPage(pageNumber)}
                        >
                          {pageNumber}
                        </button>
                      </li>
                    );
                  }
                  return null;
                })}

                <li
                  className={`page-item ${
                    currentPage === totalPages ? "disabled" : ""
                  }`}
                >
                  <button
                    className="page-link rounded-pill ms-2"
                    onClick={() =>
                      setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                    }
                    disabled={currentPage === totalPages}
                  >
                    Sau
                  </button>
                </li>
              </ul>
            </nav>

            {/* Thông tin trang */}
            <div className="text-muted">
              Trang {currentPage} / {totalPages} (Tổng:{" "}
              {filteredProducts.length} sản phẩm)
            </div>
          </div>
        </div>
      </div>

      {/* ChatBox */}
      {/* <ChatBox /> */}
    </div>
  );
};

export default ProductGrid;
