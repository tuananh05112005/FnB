import axios from "axios";
import { useEffect, useState } from "react";
import { Alert, Button, Card, Container, Form } from "react-bootstrap";
import { FaEnvelope, FaGoogle, FaLock, FaSignInAlt } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { auth, googleProvider, signInWithPopup } from "../../config/firebase";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  // Xử lý đăng xuất khi vào trang đăng nhập
  useEffect(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("user_id");
    auth.signOut(); // Đăng xuất khỏi Firebase nếu có
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post("http://localhost:5000/login", {
        email,
        password,
      });
      localStorage.setItem("user_id", response.data.user_id); // Lưu user_id
      localStorage.setItem("token", response.data.token);
      localStorage.setItem("role", response.data.role);
      alert("Đăng nhập thành công!");
      navigate("/");
    } catch (error) {
      setError("Đăng nhập thất bại. Vui lòng kiểm tra lại email và mật khẩu.");
    }
  };

 const handleGoogleLogin = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    const token = await user.getIdToken(); // <- Lấy ID Token từ Firebase

    const response = await axios.post("http://localhost:5000/login/google", {
      idToken: token,
    });

    localStorage.setItem("token", response.data.token);
    localStorage.setItem("user_id", response.data.user_id);
    localStorage.setItem("role", response.data.role);

    alert("Đăng nhập Google thành công!");
    navigate("/");
  } catch (error) {
    console.error("Lỗi đăng nhập Google:", error);
    setError("Đăng nhập bằng Google thất bại.");
  }
};


  return (
    <Container className="d-flex justify-content-center align-items-center vh-100">
      <Card
        className="shadow-lg border-0"
        style={{ width: "400px", borderRadius: "15px" }}
      >
        <Card.Body className="p-4">
          <h2 className="text-center mb-4 fw-bold">Đăng nhập</h2>
          {error && <Alert variant="danger">{error}</Alert>}
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <div className="input-group">
                <span className="input-group-text bg-primary text-white">
                  <FaEnvelope />
                </span>
                <Form.Control
                  type="email"
                  placeholder="Nhập email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="py-2"
                />
              </div>
            </Form.Group>
            <Form.Group className="mb-4">
              <div className="input-group">
                <span className="input-group-text bg-primary text-white">
                  <FaLock />
                </span>
                <Form.Control
                  type="password"
                  placeholder="Nhập mật khẩu"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="py-2"
                />
              </div>
            </Form.Group>
            <Button
              variant="primary"
              type="submit"
              className="w-100 mb-3 py-2 d-flex align-items-center justify-content-center"
            >
              <FaSignInAlt className="me-2" /> Đăng nhập
            </Button>
            <div className="text-center mt-3">
              <p className="mb-0">
                <a href="/forgot-password" className="text-decoration-none">
                  Quên mật khẩu?
                </a>
              </p>
            </div>
            <div className="text-center mb-3">
              <span className="text-muted">hoặc</span>
            </div>
            <Button
              variant="outline-danger"
              className="w-100 py-2 d-flex align-items-center justify-content-center"
              onClick={handleGoogleLogin}
            >
              <FaGoogle className="me-2" /> Đăng nhập bằng Google
            </Button>
          </Form>
          <div className="text-center mt-4">
            <p className="mb-0">
              Chưa có tài khoản?{" "}
              <a href="/register" className="text-decoration-none fw-bold">
                Đăng ký ngay
              </a>
            </p>
          </div>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default Login;
