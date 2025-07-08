import React, { useState } from "react";
import axios from "axios";
import { Form, Button, Card, Container, Alert } from "react-bootstrap";
import { FaUser, FaEnvelope, FaLock, FaUserTie } from "react-icons/fa";
import { useNavigate } from "react-router-dom"; // Import useNavigate để chuyển hướng

const CreateStaff = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate(); // Sử dụng useNavigate để chuyển hướng

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post("http://localhost:5000/api/admin/create-staff", {
        name,
        email,
        password,
      });
      setMessage(res.data.message);
      setError("");
      setName("");
      setEmail("");
      setPassword("");
       // ✅ Chuyển về trang quản lý sau khi tạo thành công
      navigate("/admin/staffs");
    } catch (err) {
      setError(err.response?.data?.message || "Lỗi tạo tài khoản");
      setMessage("");
    }
  };

  return (
    <Container className="d-flex justify-content-center align-items-center vh-100">
      <Card style={{ width: "400px" }} className="shadow">
        <Card.Body>
          <h3 className="text-center mb-4">Tạo tài khoản nhân viên</h3>

          {message && <Alert variant="success">{message}</Alert>}
          {error && <Alert variant="danger">{error}</Alert>}

          <Form onSubmit={handleCreate}>
            <Form.Group className="mb-3">
              <div className="input-group">
                <span className="input-group-text bg-primary text-white">
                  <FaUser />
                </span>
                <Form.Control
                  type="text"
                  placeholder="Tên nhân viên"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
            </Form.Group>

            <Form.Group className="mb-3">
              <div className="input-group">
                <span className="input-group-text bg-primary text-white">
                  <FaEnvelope />
                </span>
                <Form.Control
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
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
                  placeholder="Mật khẩu"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </Form.Group>

            <Button type="submit" variant="success" className="w-100 d-flex align-items-center justify-content-center">
              <FaUserTie className="me-2" /> Tạo nhân viên
            </Button>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default CreateStaff;
