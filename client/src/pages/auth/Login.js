import { useEffect, useState } from "react";
import { Alert, Button, Card, Container, Form } from "react-bootstrap";
import { FaEnvelope, FaGoogle, FaLock, FaSignInAlt } from "react-icons/fa";
import { Link, useNavigate } from "react-router-dom";

import { auth, googleProvider, signInWithPopup } from "../../config/firebase";
import { api } from "../../lib/api";
import { clearSession, saveSession } from "../../lib/session";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    clearSession();
    auth.signOut();
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    try {
      const response = await api.post("/login", {
        email,
        password,
      });

      saveSession({
        userId: response.data.user_id,
        token: response.data.token,
        role: response.data.role,
        name: response.data.name,
      });

      navigate("/");
    } catch (requestError) {
      setError("Dang nhap that bai. Vui long kiem tra lai email va mat khau.");
    }
  };

  const handleGoogleLogin = async () => {
    setError("");

    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      const idToken = await user.getIdToken();

      const response = await api.post("/login/google", {
        idToken,
      });

      saveSession({
        token: response.data.token,
        userId: response.data.user_id,
        role: response.data.role,
        name: response.data.name || user.displayName || "",
      });

      navigate("/");
    } catch (requestError) {
      console.error("Google login failed:", requestError);
      setError("Dang nhap bang Google that bai.");
    }
  };

  return (
    <Container className="d-flex justify-content-center align-items-center vh-100">
      <Card
        className="shadow-lg border-0"
        style={{ width: "400px", borderRadius: "15px" }}
      >
        <Card.Body className="p-4">
          <h2 className="text-center mb-4 fw-bold">Dang nhap</h2>
          {error && <Alert variant="danger">{error}</Alert>}

          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <div className="input-group">
                <span className="input-group-text bg-primary text-white">
                  <FaEnvelope />
                </span>
                <Form.Control
                  type="email"
                  placeholder="Nhap email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
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
                  placeholder="Nhap mat khau"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
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
              <FaSignInAlt className="me-2" /> Dang nhap
            </Button>

            <div className="text-center mt-3">
              <p className="mb-0">
                <Link to="/forgot-password" className="text-decoration-none">
                  Quen mat khau?
                </Link>
              </p>
            </div>

            <div className="text-center mb-3">
              <span className="text-muted">hoac</span>
            </div>

            <Button
              variant="outline-danger"
              className="w-100 py-2 d-flex align-items-center justify-content-center"
              onClick={handleGoogleLogin}
            >
              <FaGoogle className="me-2" /> Dang nhap bang Google
            </Button>
          </Form>

          <div className="text-center mt-4">
            <p className="mb-0">
              Chua co tai khoan?{" "}
              <Link to="/register" className="text-decoration-none fw-bold">
                Dang ky ngay
              </Link>
            </p>
          </div>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default Login;
