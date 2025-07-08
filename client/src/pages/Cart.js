import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaTimes, FaCreditCard, FaArrowLeft, FaCheck, FaChartLine, FaShoppingCart, FaSort, FaSortUp, FaSortDown } from "react-icons/fa";
import axios from "axios";
import { Modal, Button, Form } from "react-bootstrap";

const Cart = () => {
  const [cartItems, setCartItems] = useState([]);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [cancellationReason, setCancellationReason] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [allOrders, setAllOrders] = useState([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [sortOrder, setSortOrder] = useState("asc");
  const [sortField, setSortField] = useState("id");

  const navigate = useNavigate();
  const user_id = localStorage.getItem("user_id");
  const role = localStorage.getItem("role");
  const token = localStorage.getItem("token");

  // Lấy giỏ hàng từ API
  const fetchCartItems = async () => {
    try {
      let url = `http://localhost:5000/api/cart/${user_id}`;
      if (role === "admin") {
        url = `http://localhost:5000/api/admin/orders`;
      }
      const response = await axios.get(url);
      console.log("Phản hồi từ server:", response.data);
      setCartItems(response.data);
    } catch (error) {
      console.error("Lỗi khi lấy giỏ hàng:", error);
    }
  };

  // Tính tổng doanh thu
  const fetchTotalRevenue = async () => {
    try {
      const response = await axios.get("http://localhost:5000/api/admin/revenue");
      setTotalRevenue(response.data.total_revenue || 0);
    } catch (error) {
      console.error("Lỗi khi lấy tổng doanh thu:", error);
    }
  };

  useEffect(() => {
    if (user_id && token) {
      fetchCartItems();
      if (role === "admin") {
        fetchTotalRevenue();
      }
    } else {
      alert("Vui lòng đăng nhập để xem giỏ hàng");
      navigate("/login");
    }
  }, [user_id, navigate, role, token]);

  // Cập nhật số lượng sản phẩm
  const handleQuantityChange = async (id, newQuantity) => {
    if (!id || isNaN(newQuantity) || newQuantity < 1) {
      console.error("Giá trị không hợp lệ:", { id, newQuantity });
      return;
    }

    try {
      const response = await axios.put(`http://localhost:5000/api/cart/update/${id}`, {
        quantity: newQuantity,
      });

      console.log("Phản hồi từ server:", response.data);
      fetchCartItems();
    } catch (error) {
      console.error("Lỗi khi cập nhật số lượng:", error);
    }
  };

  // Điều hướng đến trang thanh toán
  const handleCheckoutItem = (item) => {
    navigate("/payment", { state: { item } });
  };

  // Mở modal hủy đơn
  const openCancelModal = (item) => {
    setSelectedItem(item);
    setShowCancelModal(true);
  };

  // Đóng modal hủy đơn
  const closeCancelModal = () => {
    setShowCancelModal(false);
    setSelectedItem(null);
    setCancellationReason("");
  };

  // Xác nhận hủy đơn
  const handleConfirmCancel = async () => {
    if (!cancellationReason) {
      alert("Vui lòng chọn lý do hủy");
      return;
    }

    try {
      await axios.put(`http://localhost:5000/api/cart/cancel/${selectedItem.id}`, {
        cancellation_reason: cancellationReason,
        status: "cancelled",
      });
      fetchCartItems();
      alert("Đơn hàng đã được hủy thành công");
      closeCancelModal();
    } catch (error) {
      console.error("Lỗi khi hủy đơn hàng:", error);
    }
  };

  const handleReceivedItem = async (item) => {
    try {
      await axios.put(`http://localhost:5000/api/cart/received/${item.id}`, {
        status: "received",
      });
      fetchCartItems();
      alert("Đơn hàng đã được cập nhật thành đã nhận hàng");
    } catch (error) {
      console.error("Lỗi khi cập nhật trạng thái đơn hàng:", error);
    }
  };

  // Quay về trang sản phẩm
  const handleBackToProducts = () => {
    navigate("/products");
  };

  // Tính toán dữ liệu hiển thị trên trang hiện tại
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = cartItems.slice(indexOfFirstItem, indexOfLastItem);

  // Tính toán tổng số trang
  const totalPages = Math.ceil(cartItems.length / itemsPerPage);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);
  };
  
  // Xử lý sắp xếp
  const handleSort = (field) => {
    const order = sortField === field && sortOrder === "asc" ? "desc" : "asc";
    setSortField(field);
    setSortOrder(order);

    const sortedCartItems = [...cartItems].sort((a, b) => {
      if (a[field] < b[field]) return order === "asc" ? -1 : 1;
      if (a[field] > b[field]) return order === "asc" ? 1 : -1;
      return 0;
    });

    setCartItems(sortedCartItems);
  };

  const getSortIcon = (field) => {
    if (sortField !== field) return <FaSort className="ms-1 text-muted" />;
    return sortOrder === "asc" ? <FaSortUp className="ms-1 text-primary" /> : <FaSortDown className="ms-1 text-primary" />;
  };

  return (
    <div className="min-vh-100" style={{ backgroundColor: "#f8f9fa" }}>
      <div className="container py-4">
        {/* Header Section */}
        <div className="text-center mb-5">
          <div className="d-inline-flex align-items-center justify-content-center mb-3" 
               style={{ 
                 width: "80px", 
                 height: "80px", 
                 background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                 borderRadius: "50%"
               }}>
            <FaShoppingCart className="text-white" size={35} />
          </div>
          <h1 className="display-4 fw-bold text-dark mb-2">
            {role === "admin" ? "Quản lý đơn hàng" : "Giỏ hàng của tôi"}
          </h1>
          <p className="text-muted fs-5">
            {role === "admin" ? "Theo dõi và quản lý tất cả đơn hàng" : "Quản lý các sản phẩm đã đặt"}
          </p>
        </div>

        {/* Revenue Card for Admin */}
        {role === "admin" && (
          <div className="row mb-4">
            <div className="col-md-6 mx-auto">
              <div className="card shadow-lg border-0" style={{ 
                borderRadius: "20px",
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
              }}>
                <div className="card-body text-center text-white py-4">
                  <FaChartLine size={40} className="mb-3" />
                  <h3 className="fw-bold mb-2">Tổng doanh thu</h3>
                  <h2 className="display-5 fw-bold">{formatCurrency(totalRevenue)}</h2>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Back Button */}
        <div className="mb-4">
          <button
            className="btn btn-outline-primary btn-lg px-4 py-2 shadow-sm"
            onClick={handleBackToProducts}
            style={{ borderRadius: "25px" }}
          >
            <FaArrowLeft className="me-2" />
            <span className="d-none d-sm-inline">Quay về trang sản phẩm</span>
            <span className="d-sm-none">Quay lại</span>
          </button>
        </div>

        {/* Stats Card */}
        <div className="row mb-4">
          <div className="col-md-4 mx-auto">
            <div className="card shadow-sm border-0" style={{ borderRadius: "15px" }}>
              <div className="card-body text-center">
                <h5 className="text-muted mb-2">Tổng số đơn hàng</h5>
                <h3 className="fw-bold text-primary">{cartItems.length}</h3>
              </div>
            </div>
          </div>
        </div>

        {/* Desktop Table */}
        <div className="d-none d-lg-block">
          <div className="card shadow-lg border-0" style={{ borderRadius: "20px" }}>
            <div className="card-header bg-white border-0 py-4" style={{ borderRadius: "20px 20px 0 0" }}>
              <h5 className="mb-0 fw-bold text-dark">
                <FaShoppingCart className="me-2 text-primary" />
                Danh sách đơn hàng
              </h5>
            </div>
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table table-hover mb-0 align-middle">
                  <thead style={{ backgroundColor: "#f8f9fa" }}>
                    <tr>
                      <th className="text-center py-3 fw-bold">STT</th>
                
                      <th className="text-center py-3 fw-bold">Hình ảnh</th>
                      <th className="text-center py-3 fw-bold">Mã SP</th>
                      <th className="text-center py-3 fw-bold">Tên sản phẩm</th>
                      <th className="text-center py-3 fw-bold">Giá</th>
                      <th className="text-center py-3 fw-bold">SL</th>
                      <th className="text-center py-3 fw-bold">Thành tiền</th>
                      <th className="text-center py-3 fw-bold">Size</th>
                      <th 
                        className="text-center py-3 fw-bold" 
                        onClick={() => handleSort("order_date")}
                        style={{ cursor: "pointer" }}
                      >
                        Ngày đặt {getSortIcon("order_date")}
                      </th>
                      <th className="text-center py-3 fw-bold">Trạng thái</th>
                      <th className="text-center py-3 fw-bold">Hành động</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentItems.map((item, index) => (
                      <tr key={item.id} style={{ borderBottom: "1px solid #eef2f7" }}>
                        <td className="text-center py-3 fw-semibold">{indexOfFirstItem + index + 1}</td>
  

                        <td className="text-center py-3">
                          <div className="d-flex justify-content-center">
                            <img
                              src={item.image}
                              alt={item.name}
                              className="rounded-3 shadow-sm"
                              style={{ width: "80px", height: "80px", objectFit: "cover" }}
                            />
                          </div>
                        </td>
                        <td className="text-center py-3">
                          <span className="badge bg-primary px-3 py-2 fs-6">{item.code}</span>
                        </td>
                        <td className="text-center py-3 fw-semibold">{item.name}</td>
                        <td className="text-center py-3 fw-bold text-success">{formatCurrency(item.price)}</td>
                        <td className="text-center py-3">
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) =>
                              handleQuantityChange(item.id, parseInt(e.target.value))
                            }
                            className="form-control form-control-sm mx-auto text-center fw-bold"
                            disabled={
                              item.status === "completed" ||
                              item.status === "cancelled" ||
                              item.status === "received"
                            }
                            style={{ width: "70px", borderRadius: "10px" }}
                          />
                        </td>
                        <td className="text-center py-3 fw-bold text-primary">
                          {formatCurrency(item.price * item.quantity)}
                        </td>
                        <td className="text-center py-3">
                          <span className="badge bg-info px-3 py-2">{item.size}</span>
                        </td>
                        <td className="text-center py-3">
                          {new Date(item.order_date).toLocaleDateString('vi-VN')}
                        </td>
                        <td className="text-center py-3">
                          {getStatusBadge(item.status, role)}
                        </td>
                        <td className="text-center py-3">
                          {getActionButtons(item, role)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Cards */}
        <div className="d-lg-none">
          {currentItems.map((item, index) => (
            <div key={item.id} className="card mb-4 shadow-lg border-0" style={{ borderRadius: "20px" }}>
              <div className="card-header bg-gradient-primary text-white d-flex justify-content-between align-items-center py-3"
                   style={{ 
                     background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                     borderRadius: "20px 20px 0 0"
                   }}>
                <span className="badge bg-white text-primary px-3 py-2 fw-bold">
                  #{indexOfFirstItem + index + 1}
                </span>
                <span className="fw-bold">{item.code}</span>
                {getStatusBadge(item.status, role)}
              </div>
              <div className="row g-0">
                <div className="col-4 p-3">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="img-fluid rounded-3 shadow-sm h-100 object-fit-cover"
                    style={{ minHeight: "120px" }}
                  />
                </div>
                <div className="col-8">
                  <div className="card-body p-3">

                    <h5 className="card-title fw-bold mb-3">{item.name}</h5>
                    
                    <div className="row mb-3">
                      <div className="col-6">
                        <div className="mb-2">
                          <small className="text-muted">Giá:</small>
                          <div className="fw-bold text-success">{formatCurrency(item.price)}</div>
                        </div>
                        <div className="mb-2">
                          <small className="text-muted">Kích thước:</small>
                          <div><span className="badge bg-info">{item.size}</span></div>
                        </div>
                      </div>
                      <div className="col-6">
                        <div className="mb-2">
                          <small className="text-muted">Số lượng:</small>
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) =>
                              handleQuantityChange(item.id, parseInt(e.target.value))
                            }
                            className="form-control form-control-sm text-center fw-bold mt-1"
                            disabled={
                              item.status === "completed" ||
                              item.status === "cancelled" ||
                              item.status === "received"
                            }
                            style={{ borderRadius: "8px" }}
                          />
                        </div>
                        <div className="mb-2">
                          <small className="text-muted">Thành tiền:</small>
                          <div className="fw-bold text-primary">{formatCurrency(item.price * item.quantity)}</div>
                        </div>
                      </div>
                    </div>

                    <div className="mb-3">
                      <small className="text-muted">Ngày đặt:</small>
                      <div>{new Date(item.order_date).toLocaleDateString('vi-VN')}</div>
                    </div>

                    <div className="d-grid gap-2">
                      {getActionButtonsMobile(item, role)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination */}
        <div className="d-flex justify-content-center mt-5">
          <div className="card shadow-sm border-0" style={{ borderRadius: "15px" }}>
            <div className="card-body p-3">
              <div className="d-flex align-items-center">
                <button
                  className="btn btn-outline-primary me-3"
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  style={{ borderRadius: "10px", minWidth: "100px" }}
                >
                  <span className="d-none d-sm-inline">Trang trước</span>
                  <span className="d-sm-none">←</span>
                </button>
                
                <div className="mx-3">
                  <span className="badge bg-primary fs-6 px-4 py-2" style={{ borderRadius: "10px" }}>
                    {currentPage} / {totalPages}
                  </span>
                </div>
                
                <button
                  className="btn btn-outline-primary ms-3"
                  onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  style={{ borderRadius: "10px", minWidth: "100px" }}
                >
                  <span className="d-none d-sm-inline">Trang sau</span>
                  <span className="d-sm-none">→</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Cancel Modal */}
        <Modal show={showCancelModal} onHide={closeCancelModal} fullscreen="sm-down" centered>
          <Modal.Header closeButton className="border-0">
            <Modal.Title className="fw-bold">
              <FaTimes className="me-2 text-danger" />
              Hủy đơn hàng
            </Modal.Title>
          </Modal.Header>
          <Modal.Body className="p-4">
            <Form>
              <Form.Group className="mb-3">
                <Form.Label className="fw-semibold mb-3">Vui lòng chọn lý do hủy:</Form.Label>
                <Form.Control
                  as="select"
                  value={cancellationReason}
                  onChange={(e) => setCancellationReason(e.target.value)}
                  className="form-control-lg"
                  style={{ borderRadius: "10px" }}
                >
                  <option value="">-- Chọn lý do hủy --</option>
                  <option value="Không còn nhu cầu">Không còn nhu cầu</option>
                  <option value="Đặt nhầm sản phẩm">Đặt nhầm sản phẩm</option>
                  <option value="Giao hàng chậm">Giao hàng chậm</option>
                  <option value="Lý do khác">Lý do khác</option>
                </Form.Control>
              </Form.Group>
            </Form>
          </Modal.Body>
          <Modal.Footer className="border-0 p-4">
            <Button 
              variant="outline-secondary" 
              onClick={closeCancelModal}
              className="px-4 py-2"
              style={{ borderRadius: "10px" }}
            >
              Đóng
            </Button>
            <Button 
              variant="danger" 
              onClick={handleConfirmCancel}
              className="px-4 py-2"
              style={{ borderRadius: "10px" }}
            >
              <FaTimes className="me-2" />
              Xác nhận hủy
            </Button>
          </Modal.Footer>
        </Modal>
      </div>
    </div>
  );

  // Helper functions for status badges and action buttons
  function getStatusBadge(status, role) {
    const baseStyle = "badge px-3 py-2 fs-6";
    
    if (role === "user") {
      switch (status) {
        case "pending":
          return <span className={`${baseStyle} bg-warning`}>Chưa thanh toán</span>;
        case "completed":
          return <span className={`${baseStyle} bg-primary`}>Đã thanh toán</span>;
        case "received":
          return <span className={`${baseStyle} bg-success`}>Đã nhận hàng</span>;
        case "cancelled":
          return <span className={`${baseStyle} bg-danger`}>Đã hủy</span>;
        default:
          return <span className={`${baseStyle} bg-secondary`}>Không xác định</span>;
      }
    } else {
      switch (status) {
        case "pending":
          return <span className={`${baseStyle} bg-warning`}>Đang xử lý</span>;
        case "completed":
          return <span className={`${baseStyle} bg-primary`}>Đang giao</span>;
        case "received":
          return <span className={`${baseStyle} bg-success`}>Đã giao</span>;
        case "cancelled":
          return <span className={`${baseStyle} bg-danger`}>Đơn bị hủy</span>;
        default:
          return <span className={`${baseStyle} bg-secondary`}>Không xác định</span>;
      }
    }
  }

  function getActionButtons(item, role) {
    if (role === "user") {
      if (item.status === "completed" && item.status !== "received") {
        return (
          <div className="d-flex gap-2 justify-content-center">
            <button
              className="btn btn-outline-danger btn-sm px-3"
              onClick={() => openCancelModal(item)}
              style={{ borderRadius: "8px" }}
            >
              <FaTimes className="me-1" /> Hủy
            </button>
            <button
              className="btn btn-outline-success btn-sm px-3"
              onClick={() => handleReceivedItem(item)}
              style={{ borderRadius: "8px" }}
            >
              <FaCheck className="me-1" /> Đã nhận
            </button>
          </div>
        );
      } else if (item.status === "pending") {
        return (
          <button
            className="btn btn-success btn-sm px-3"
            onClick={() => handleCheckoutItem(item)}
            style={{ borderRadius: "8px" }}
          >
            <FaCreditCard className="me-1" /> Thanh toán
          </button>
        );
      }
    } else {
      if (item.status !== "cancelled" && item.status !== "received") {
        return (
          <button
            className="btn btn-outline-danger btn-sm px-3"
            onClick={() => openCancelModal(item)}
            style={{ borderRadius: "8px" }}
          >
            <FaTimes className="me-1" /> Hủy đơn
          </button>
        );
      }
    }
    return <span className="text-muted">--</span>;
  }

  function getActionButtonsMobile(item, role) {
    if (role === "user") {
      if (item.status === "completed" && item.status !== "received") {
        return (
          <>
            <button
              className="btn btn-outline-danger"
              onClick={() => openCancelModal(item)}
              style={{ borderRadius: "10px" }}
            >
              <FaTimes className="me-2" /> Hủy đơn
            </button>
            <button
              className="btn btn-outline-success"
              onClick={() => handleReceivedItem(item)}
              style={{ borderRadius: "10px" }}
            >
              <FaCheck className="me-2" /> Đã nhận hàng
            </button>
          </>
        );
      } else if (item.status === "pending") {
        return (
          <button
            className="btn btn-success"
            onClick={() => handleCheckoutItem(item)}
            style={{ borderRadius: "10px" }}
          >
            <FaCreditCard className="me-2" /> Thanh toán
          </button>
        );
      }
    } else {
      if (item.status !== "cancelled" && item.status !== "delivered") {
        return (
          <button
            className="btn btn-outline-danger"
            onClick={() => openCancelModal(item)}
            style={{ borderRadius: "10px" }}
          >
            <FaTimes className="me-2" /> Hủy đơn
          </button>
        );
      }
    }
    return null;
  }
};

export default Cart;