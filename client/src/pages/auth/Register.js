import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Container, Form, Button, Card, Alert } from 'react-bootstrap';
import { FaUser, FaEnvelope, FaLock, FaUserPlus } from 'react-icons/fa';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:5000/register', {
        name,
        email,
        password,
      });
      alert(response.data.message);
      navigate('/login');
    } catch (error) {
      setError('Đăng ký thất bại. Vui lòng thử lại.');
    }
  };
  
  return (
    <Container className="d-flex justify-content-center align-items-center vh-100">
      <Card className="shadow-lg border-0" style={{ width: '400px', borderRadius: '15px' }}>
        <Card.Body className="p-4">
          <h2 className="text-center mb-4 fw-bold">Đăng ký</h2>
          
          {error && <Alert variant="danger">{error}</Alert>}
          
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <div className="input-group">
                <span className="input-group-text bg-primary text-white">
                  <FaUser />
                </span>
                <Form.Control
                  type="text"
                  placeholder="Nhập tên"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="py-2"
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
              variant="success" 
              type="submit" 
              className="w-100 py-2 d-flex align-items-center justify-content-center"
            >
              <FaUserPlus className="me-2" /> Đăng ký
            </Button>
          </Form>
          
          <div className="text-center mt-4">
            <p className="mb-0">
              Đã có tài khoản? <a href="/login" className="text-decoration-none fw-bold">Đăng nhập ngay</a>
            </p>
          </div>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default Register;