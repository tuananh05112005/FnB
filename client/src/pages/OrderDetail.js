// src/pages/OrderDetail.jsx
import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button, Card, Badge, Row, Col } from "react-bootstrap";
import { FaArrowLeft, FaBox, FaCalendarAlt, FaCreditCard, FaTag, FaRulerCombined } from "react-icons/fa";

const OrderDetail = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const order = location.state?.order;

  const formatCurrency = (value) => {
    return value
      ? new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(value)
      : "N/A";
  };


  if (!order) {
    return (
      <div className="container py-5">
        <div className="text-center">
          <div className="mb-4">
            <FaBox size={64} className="text-muted mb-3" />
            <h4 className="text-muted">Không có thông tin đơn hàng</h4>
            <p className="text-muted">Vui lòng quay lại và thử lại.</p>
          </div>
          <Button variant="primary" onClick={() => navigate(-1)}>
            <FaArrowLeft className="me-2" /> Quay lại
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-4">
      {/* Header */}
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div className="d-flex align-items-center">
          <Button 
            variant="outline-secondary" 
            className="me-3 rounded-pill" 
            onClick={() => navigate(-1)}
          >
            <FaArrowLeft className="me-2" /> Quay lại
          </Button>
          <div>
            <h3 className="mb-1 text-primary">Chi tiết đơn hàng</h3>
            <small className="text-muted">#{order.payment_id}</small>
          </div>
        </div>
        {order.status && (
          <Badge 
            bg={(order.status)} 
            className="fs-6 px-3 py-2 rounded-pill"
          >
            {order.status}
          </Badge>
        )}
      </div>

      {/* Main Content */}
      <Row className="g-4">
        {/* Product Image */}
        <Col lg={5}>
          <Card className="h-100 border-0 shadow-sm">
            <Card.Body className="p-4">
              <div className="text-center">
                <div className="position-relative d-inline-block">
                  <img
                    src={order.image}
                    alt={order.product_name}
                    className="img-fluid rounded-3 shadow-sm"
                    style={{ 
                      maxHeight: "300px", 
                      objectFit: "cover",
                      width: "100%",
                      maxWidth: "300px"
                    }}
                  />
                </div>
                <h5 className="mt-3 mb-0 text-dark">{order.product_name}</h5>
          
              </div>
            </Card.Body>
          </Card>
        </Col>

        {/* Order Information */}
        <Col lg={7}>
          <Card className="h-100 border-0 shadow-sm">
            <Card.Body className="p-4">
              <h5 className="mb-4 text-dark">
                <FaBox className="me-2 text-primary" />
                Thông tin đơn hàng
              </h5>
              
              <Row className="g-3">
                <Col md={6}>
                  <div className="p-3 bg-light rounded-3">
                    <div className="d-flex align-items-center mb-2">
                      <FaTag className="text-primary me-2" />
                      <strong className="text-dark">Mã đơn hàng</strong>
                    </div>
                    <p className="mb-0 text-muted">{order.payment_id}</p>
                  </div>
                </Col>
                
                <Col md={6}>
                  <div className="p-3 bg-light rounded-3">
                    <div className="d-flex align-items-center mb-2">
                      <FaRulerCombined className="text-primary me-2" />
                      <strong className="text-dark">Kích cỡ</strong>
                    </div>
                    <p className="mb-0 text-muted">{order.size}</p>
                  </div>
                </Col>
                
                <Col md={6}>
                  <div className="p-3 bg-light rounded-3">
                    <div className="d-flex align-items-center mb-2">
                      <FaCreditCard className="text-primary me-2" />
                      <strong className="text-dark">Phương thức thanh toán</strong>
                    </div>
                    <p className="mb-0 text-muted">{order.payment_method}</p>
                  </div>
                </Col>
                
                <Col md={6}>
                  <div className="p-3 bg-light rounded-3">
                    <div className="d-flex align-items-center mb-2">
                      <FaCalendarAlt className="text-primary me-2" />
                      <strong className="text-dark">Ngày đặt hàng</strong>
                    </div>
                    <p className="mb-0 text-muted">
                      {order.order_date
                        ? new Date(order.order_date).toLocaleString("vi-VN")
                        : "Không rõ"}
                    </p>
                  </div>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Price Summary */}
      <Row className="mt-4">
        <Col>
          <Card className="border-0 shadow-sm bg-gradient" style={{background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'}}>
            <Card.Body className="p-4 text-white">
              <h5 className="mb-3 text-white">
                <FaCreditCard className="me-2" />
                Tổng quan thanh toán
              </h5>
              <Row className="align-items-center">
                <Col md={6}>
                  <div className="mb-2">
                    <span className="opacity-75">Giá sản phẩm:</span>
                    <span className="float-end fw-bold">{formatCurrency(order.price)}</span>
                  </div>
                </Col>
                <Col md={6}>
                  <div className="text-md-end">
                    <div className="mb-1">
                      <span className="opacity-75">Thành tiền:</span>
                    </div>
                    <h4 className="mb-0 fw-bold text-white">{formatCurrency(order.amount)}</h4>
                  </div>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Action Buttons */}
      <div className="text-center mt-4">
        <Button 
          variant="primary" 
          size="lg" 
          className="me-3 rounded-pill px-4"
          onClick={() => navigate('/history')}
        >
          Xem tất cả đơn hàng
        </Button>
        <Button 
          variant="outline-primary" 
          size="lg" 
          className="rounded-pill px-4"
          onClick={() => navigate('/products')}
        >
          Tiếp tục mua sắm
        </Button>
      </div>
    </div>
  );
};

export default OrderDetail;