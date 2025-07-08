import { useEffect, useState } from "react";
import axios from "axios";
import { Badge, Spinner, Row, Col, Button, Card, Form } from "react-bootstrap";
import DatePicker, { registerLocale } from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import vi from "date-fns/locale/vi";
import { useNavigate } from "react-router-dom"; // Thêm vào nếu chưa có

// Đăng ký ngôn ngữ tiếng Việt cho datepicker
registerLocale("vi", vi);

const OrderList = () => {
  // State quản lý danh sách đơn hàng, loading, phân trang và lọc ngày
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage] = useState(10);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [startDateInput, setStartDateInput] = useState(null);
  const [endDateInput, setEndDateInput] = useState(null);
    const navigate = useNavigate(); // để chuyển hướng
  // const role = localStorage.getItem("role"); // lấy vai trò
  // const token = localStorage.getItem("token"); // lấy token

  // // Kiểm tra quyền truy cập
  // // Nếu không phải admin thì chuyển hướng
  // useEffect(() => {
  //   if (!token || role !== "admin") {
  //     alert("Bạn không có quyền truy cập trang này!");
  //     navigate("/login"); // hoặc navigate("/login");
  //   }
  // }, [role, navigate]);





  // Lấy dữ liệu đơn hàng từ API
  useEffect(() => {
    const fetchAllOrders = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/admin/payments");
        setOrders(res.data);
      } catch (err) {
        console.error("Lỗi khi lấy đơn hàng:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAllOrders();
  }, []);
//     if (role !== "admin") {
//   return null; // hoặc: return <p>Bạn không có quyền truy cập</p>;
// }


  // Xử lý xóa đơn hàng
  const handleDelete = async (id) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa đơn hàng này không?")) {
      try {
        await axios.delete(`http://localhost:5000/api/admin/payments/${id}`);
        setOrders((prev) => prev.filter((order) => order.id !== id));
      } catch (err) {
        console.error("Lỗi khi xóa:", err);
        alert("Xóa đơn hàng thất bại!");
      }
    }
  };

  // Format số tiền sang định dạng tiền tệ VND
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  // Lọc đơn hàng theo khoảng thời gian được chọn
  const filteredOrders = orders.filter((order) => {
    const orderDate = new Date(order.created_at);
    const fromValid =
      !startDate || orderDate >= new Date(startDate.setHours(0, 0, 0, 0));
    const toValid =
      !endDate || orderDate <= new Date(endDate.setHours(23, 59, 59, 999));
    return fromValid && toValid;
  });

  // Tính tổng số tiền từ các đơn đã lọc
  const totalAmount = filteredOrders.reduce(
    (sum, order) => sum + (parseFloat(order.amount) || 0),
    0
  );

  // Phân trang
  const totalPages = Math.ceil(filteredOrders.length / perPage);
  const displayedOrders = filteredOrders.slice(
    (currentPage - 1) * perPage,
    currentPage * perPage
  );

  // Render component
  return (
    <div className="container-fluid px-4 py-5" style={{ backgroundColor: "#f8f9fa", minHeight: "100vh" }}>
      {/* Tiêu đề trang */}
      <div className="text-center mb-5">
        <h1 className="display-4 fw-bold text-primary mb-2">
          <i className="fas fa-box me-3"></i>
          Quản lý đơn hàng
        </h1>
        <p className="text-muted fs-5">Theo dõi và quản lý tất cả đơn hàng của bạn</p>
      </div>

      {/* Bộ lọc ngày */}
      <Card className="shadow-lg border-0 mb-4" style={{ borderRadius: "15px" }}>
        <Card.Header
          className="bg-gradient text-white text-center py-3"
          style={{
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            borderRadius: "15px 15px 0 0",
          }}
        >
          <h5 className="mb-0 fw-bold"><i className="fas fa-filter me-2"></i>Bộ lọc đơn hàng</h5>
        </Card.Header>
        <Card.Body className="p-4">
          <Row className="align-items-end">
            {/* Ngày bắt đầu */}
            <Col md={3}>
              <Form.Label className="fw-semibold text-dark mb-2">
                <i className="fas fa-calendar-alt me-2 text-primary"></i>Từ ngày
              </Form.Label>
              <DatePicker
                selected={startDateInput}
                onChange={(date) => setStartDateInput(date)}
                placeholderText="Chọn ngày bắt đầu"
                className="form-control form-control-lg"
                locale="vi"
                dateFormat="dd/MM/yyyy"
              />
            </Col>

            {/* Ngày kết thúc */}
            <Col md={3}>
              <Form.Label className="fw-semibold text-dark mb-2">
                <i className="fas fa-calendar-alt me-2 text-primary"></i>Đến ngày
              </Form.Label>
              <DatePicker
                selected={endDateInput}
                onChange={(date) => setEndDateInput(date)}
                placeholderText="Chọn ngày kết thúc"
                className="form-control form-control-lg"
                locale="vi"
                dateFormat="dd/MM/yyyy"
              />
            </Col>

            {/* Nút áp dụng lọc */}
            <Col md={3}>
              <Button
                onClick={() => {
                  setStartDate(startDateInput);
                  setEndDate(endDateInput);
                  setCurrentPage(1);
                }}
                variant="primary"
                size="lg"
                className="w-100 fw-bold"
                style={{
                  borderRadius: "10px",
                  background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  border: "none",
                }}
              >
                <i className="fas fa-search me-2"></i>Áp dụng lọc
              </Button>
            </Col>

            {/* Nút xóa lọc */}
            <Col md={3}>
              <Button
                onClick={() => {
                  setStartDate(null);
                  setEndDate(null);
                  setStartDateInput(null);
                  setEndDateInput(null);
                  setCurrentPage(1);
                }}
                variant="outline-secondary"
                size="lg"
                className="w-100 fw-bold"
                style={{ borderRadius: "10px" }}
              >
                <i className="fas fa-times me-2"></i>Xóa lọc
              </Button>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Tổng quan đơn hàng và doanh thu */}
      <Row className="mb-4">
        <Col md={6}>
          <Card className="shadow-sm border-0 h-100"
            style={{ borderRadius: "15px", background: "linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)" }}
          >
            <Card.Body className="text-center text-white">
              <i className="fas fa-shopping-cart fa-3x mb-3"></i>
              <h3 className="fw-bold">{filteredOrders.length}</h3>
              <p className="mb-0 fs-5">Tổng số đơn hàng</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={6}>
          <Card className="shadow-sm border-0 h-100"
            style={{ borderRadius: "15px", background: "linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)" }}
          >
            <Card.Body className="text-center text-white">
              <i className="fas fa-dollar-sign fa-3x mb-3"></i>
              <h3 className="fw-bold">{formatCurrency(totalAmount)}</h3>
              <p className="mb-0 fs-5">Tổng doanh thu</p>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Bảng danh sách đơn hàng */}
      {loading ? (
        <Card className="shadow-lg border-0" style={{ borderRadius: "15px" }}>
          <Card.Body className="text-center py-5">
            <Spinner animation="border" variant="primary" style={{ width: "3rem", height: "3rem" }} />
            <h5 className="mt-4 text-muted">Đang tải dữ liệu...</h5>
          </Card.Body>
        </Card>
      ) : (
        <Card className="shadow-lg border-0" style={{ borderRadius: "15px" }}>
          <Card.Header className="bg-white border-0 py-3" style={{ borderRadius: "15px 15px 0 0" }}>
            <h5 className="mb-0 fw-bold text-dark">
              <i className="fas fa-list me-2 text-primary"></i>Danh sách đơn hàng
            </h5>
          </Card.Header>

          <Card.Body className="p-0">
            <div className="table-responsive">
              <table className="table table-hover mb-0 align-middle">
                <thead style={{ backgroundColor: "#f8f9fa" }}>
                  <tr className="text-center">
                    <th>#</th>
                    <th>Khách hàng</th>
                    <th>Người nhận</th>
                    <th>Địa chỉ</th>
                    <th>Hình thức</th>
                    <th>Số tiền</th>
                    <th>Ngày</th>
                    <th>Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {displayedOrders.map((order, index) => (
                    <tr key={order.id} className="text-center">
                      <td>{(currentPage - 1) * perPage + index + 1}</td>
                      <td className="text-start">
                        <div className="d-flex align-items-center">
                          <div className="bg-primary rounded-circle d-flex align-items-center justify-content-center me-3"
                            style={{ width: "40px", height: "40px" }}>
                            <i className="fas fa-user text-white"></i>
                          </div>
                          <span className="fw-semibold">{order.email}</span>
                        </div>
                      </td>
                      <td>{order.name}</td>
                      <td className="text-start">{order.address}</td>
                      <td>
                        <Badge
                          bg={
                            order.payment_method === "cash"
                              ? "warning"
                              : order.payment_method === "bank"
                              ? "success"
                              : "secondary"
                          }
                          className={`px-3 py-2 fs-6 ${
                            order.payment_method === "cash" ? "text-dark" : ""
                          }`}
                        >
                          {order.payment_method === "cash"
                            ? "Tiền mặt"
                            : order.payment_method === "bank"
                            ? "Chuyển khoản"
                            : order.payment_method}
                        </Badge>
                      </td>
                      <td className="text-end text-success fw-bold">
                        {formatCurrency(order.amount)}
                      </td>
                      <td>
                        {new Date(order.created_at).toLocaleString("vi-VN", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
                          hour12: false,
                        })}
                      </td>
                      <td>
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => handleDelete(order.id)}
                          className="fw-bold"
                          style={{ borderRadius: "8px" }}
                        >
                          <i className="fas fa-trash me-2"></i>Xóa
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card.Body>

          {/* Phân trang */}
          <Card.Footer className="bg-white border-0 py-4" style={{ borderRadius: "0 0 15px 15px" }}>
            <div className="d-flex justify-content-center align-items-center">
              <Button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => p - 1)}
                variant="outline-primary"
                className="me-3 fw-bold"
                style={{ borderRadius: "10px", minWidth: "120px" }}
              >
                <i className="fas fa-chevron-left me-2"></i>Trang trước
              </Button>

              <span className="badge bg-primary fs-6 px-4 py-2 mx-4" style={{ borderRadius: "10px" }}>
                Trang {currentPage} / {totalPages}
              </span>

              <Button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => p + 1)}
                variant="outline-primary"
                className="ms-3 fw-bold"
                style={{ borderRadius: "10px", minWidth: "120px" }}
              >
                Trang sau<i className="fas fa-chevron-right ms-2"></i>
              </Button>
            </div>
          </Card.Footer>
        </Card>
      )}
    </div>
  );
};

export default OrderList;