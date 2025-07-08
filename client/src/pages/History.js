import React, { useEffect, useState } from "react";
import axios from "axios";
import { Container, Card, Badge, Button, Table } from "react-bootstrap";
import {
  FaMoneyBill,
  FaCreditCard,
  FaShoppingBag,
  FaEye,
  FaCalendarAlt,
  FaTrash,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";

const History = () => {
  const [history, setHistory] = useState([]);
  const user_id = localStorage.getItem("user_id");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await axios.get(
          `http://localhost:5000/api/payments/history/${user_id}`
        );
        setHistory(res.data);
      } catch (err) {
        console.error("Lỗi khi lấy lịch sử:", err);
      }
    };

    if (user_id) fetchHistory();
  }, [user_id]);

  const handleDelete = async (payment_id) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa đơn hàng này?")) return;

    try {
      await axios.delete(`http://localhost:5000/api/payments/${payment_id}`);
      // Cập nhật danh sách lịch sử sau khi xóa
      setHistory((prev) =>
        prev.filter((item) => item.payment_id !== payment_id)
      );
    } catch (err) {
      console.error("Lỗi khi xóa thanh toán:", err);
      alert("Xóa thất bại, vui lòng thử lại.");
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  const handleViewDetail = (order) => {
    navigate("/order-detail", { state: { order } });
  };

  const getPaymentMethodInfo = (method) => {
    return method === "cash"
      ? { icon: FaMoneyBill, text: "Tiền mặt", color: "success" }
      : { icon: FaCreditCard, text: "Chuyển khoản", color: "primary" };
  };

  // ✅ Tính tổng tiền đảm bảo ép kiểu đúng
  const totalAmount = history.reduce(
    (sum, item) => sum + Number(item.amount || 0),
    0
  );

  return (
    <Container className="py-5">
      {/* Header */}
      <div className="mb-5">
        <div className="d-flex align-items-center mb-3">
          <div className="bg-primary rounded-3 p-3 me-3">
            <FaShoppingBag className="text-white" size={24} />
          </div>
          <div>
            <h2 className="mb-1 text-primary">Lịch sử mua hàng</h2>
            <p className="text-muted mb-0">Xem lại các đơn hàng đã mua</p>
          </div>
        </div>

        {history.length > 0 && (
          <div className="d-flex align-items-center">
            <Badge bg="info" className="me-2 px-3 py-2 rounded-pill">
              Tổng: {history.length} đơn hàng
            </Badge>
            <Badge bg="success" className="px-3 py-2 rounded-pill">
              Tổng tiền: {formatCurrency(totalAmount)}
            </Badge>
          </div>
        )}
      </div>

      {/* Content */}
      {history.length === 0 ? (
        <Card className="text-center py-5 border-0 shadow-sm">
          <Card.Body>
            <h4 className="text-muted">Chưa có đơn hàng nào</h4>
            <Button
              variant="primary"
              size="lg"
              className="rounded-pill px-4 mt-3"
              onClick={() => navigate("/products")}
            >
              Bắt đầu mua sắm
            </Button>
          </Card.Body>
        </Card>
      ) : (
        <Card className="shadow-sm border-0">
          <Card.Body className="p-0">
            <div className="table-responsive">
              <Table hover className="mb-0">
                <thead className="bg-light">
                  <tr>
                    <th>#</th>
                    <th>Hình ảnh</th>
                    <th>Tên SP</th>
                    <th>Phương thức</th>
                    <th>Số tiền</th>
                    <th>Ngày</th>
                    <th>Chi tiết</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((item, index) => {
                    const paymentInfo = getPaymentMethodInfo(
                      item.payment_method
                    );
                    const PaymentIcon = paymentInfo.icon;

                    return (
                      <tr key={item.payment_id}>
                        <td>{index + 1}</td>
                        <td>
                          <img
                            src={item.image || "https://via.placeholder.com/80"}
                            alt={item.product_name}
                            width="80"
                            className="rounded-3"
                          />
                        </td>
                        <td>{item.product_name}</td>
                        <td>
                          <Badge bg={paymentInfo.color}>
                            <PaymentIcon className="me-1" /> {paymentInfo.text}
                          </Badge>
                        </td>
                        <td className="text-success fw-bold">
                          {formatCurrency(item.amount)}
                        </td>
                        <td>
                          <FaCalendarAlt className="me-1 text-muted" />
                          {new Date(item.order_date).toLocaleDateString(
                            "vi-VN"
                          )}
                        </td>
                        <td>
                          <Button
                            variant="outline-primary"
                            size="sm"
                            onClick={() => handleViewDetail(item)}
                          >
                            <FaEye className="me-1" />
                            Xem
                          </Button>
                          <Button
                            variant="outline-danger"
                            size="sm"
                            onClick={() => handleDelete(item.payment_id)}
                          >
                            {" "}
                            <FaTrash className="me-1" />
                            Xóa
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </Table>
            </div>
          </Card.Body>
        </Card>
      )}
    </Container>
  );
};

export default History;
