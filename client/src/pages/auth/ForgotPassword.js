import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Container, Form, Button, Card, Alert } from "react-bootstrap";

const ForgotPassword = () => {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const navigate = useNavigate();

  const handleSendOTP = async () => {
    setError("");
    setMessage("");
    try {
      await axios.post("http://localhost:5000/api/send-otp", { email });
      setMessage("OTP đã được gửi về email!");
      setStep(2);
    } catch (err) {
      setError("Không thể gửi OTP. Vui lòng thử lại.");
    }
  };

  const handleResetPassword = async () => {
    setError("");
    setMessage("");

    if (newPassword !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp.");
      return;
    }

    try {
      await axios.post("http://localhost:5000/api/reset-password", {
        email,
        otp_code: otp,
        new_password: newPassword,
      });
      setMessage("Đặt lại mật khẩu thành công. Đang chuyển về trang đăng nhập...");

      setTimeout(() => {
        navigate("/login"); // hoặc thay bằng "/dang-nhap"
      }, 2000);
    } catch (err) {
      setError("OTP không hợp lệ hoặc đã hết hạn.");
    }
  };

  return (
    <Container className="d-flex justify-content-center align-items-center vh-100">
      <Card style={{ width: "400px", borderRadius: "15px" }}>
        <Card.Body className="p-4">
          <h4 className="text-center fw-bold mb-4">Quên mật khẩu</h4>

          {error && <Alert variant="danger">{error}</Alert>}
          {message && <Alert variant="success">{message}</Alert>}

          {step === 1 ? (
            <>
              <Form.Group className="mb-3">
                <Form.Label>Email đã đăng ký</Form.Label>
                <Form.Control
                  type="email"
                  placeholder="Nhập email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError("");
                    setMessage("");
                  }}
                  required
                />
              </Form.Group>
              <Button variant="primary" onClick={handleSendOTP} className="w-100 mb-2">
                Gửi mã OTP
              </Button>
              <Button variant="secondary" className="w-100" onClick={() => navigate("/login")}>
                Quay lại đăng nhập
              </Button>
            </>
          ) : (
            <>
              <Form.Group className="mb-3">
                <Form.Label>Mã OTP</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Nhập mã OTP"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Mật khẩu mới</Form.Label>
                <Form.Control
                  type="password"
                  placeholder="Nhập mật khẩu mới"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Xác nhận mật khẩu</Form.Label>
                <Form.Control
                  type="password"
                  placeholder="Nhập lại mật khẩu"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </Form.Group>
              <Button variant="success" onClick={handleResetPassword} className="w-100 mb-2">
                Xác nhận đặt lại mật khẩu
              </Button>
              <Button variant="secondary" onClick={() => setStep(1)} className="w-100">
                Quay lại
              </Button>
            </>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
};

export default ForgotPassword;
