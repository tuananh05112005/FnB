import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Table,
  Button,
  Container,
  Modal,
  Form,
  Alert,
  Dropdown,
} from "react-bootstrap";
import { FaTrash, FaEdit, FaPlus, FaLock, FaUnlock } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

const UserManagement = () => {
  const [userList, setUserList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });

  const fetchUsers = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/users/all");
      setUserList(res.data);
    } catch (err) {
      setError("Lỗi khi tải danh sách người dùng.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm("Bạn có chắc muốn xóa người này?")) return;
    try {
      await axios.delete(`http://localhost:5000/api/users/${id}`);
      fetchUsers();
    } catch (err) {
      setError("Không thể xóa người dùng.");
    }
  };

  const handleSave = async () => {
    try {
      if (editingUser) {
        await axios.put(`http://localhost:5000/api/users/${editingUser.id}`, {
          name: formData.name,
          email: formData.email,
          password: formData.password,
        });
      } else {
        await axios.post("http://localhost:5000/api/admin/create-staff", {
          name: formData.name,
          email: formData.email,
          password: formData.password,
        });
      }

      setShowModal(false);
      setFormData({ name: "", email: "", password: "" });
      setEditingUser(null);
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.message || "Lỗi khi lưu thông tin.");
    }
  };

  const openEditModal = (user) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      password: "",
    });
    setShowModal(true);
  };

  const openCreateModal = () => {
    navigate("/admin/create-staff");
  };

  const handleChangeRole = async (id, newRole) => {
    try {
      await axios.put(`http://localhost:5000/api/users/${id}/role`, { role: newRole });
      fetchUsers();
    } catch (err) {
      setError("Lỗi khi cập nhật vai trò.");
    }
  };

  const toggleUserStatus = async (id, newStatus) => {
      console.log("Toggle:", id, newStatus); // TEST LOG
    try {
      await axios.put(`http://localhost:5000/api/users/${id}/status`, {
        is_active: newStatus,
      });
      fetchUsers();
    } catch (err) {
      setError("Không thể thay đổi trạng thái hoạt động.");
    }
  };

  return (
    <Container className="mt-5">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h3>Quản lý người dùng & nhân viên</h3>
        <Button onClick={openCreateModal} variant="success">
          <FaPlus className="me-1" /> Thêm nhân viên
        </Button>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}
      {loading ? (
        <p>Đang tải dữ liệu...</p>
      ) : (
        <Table striped bordered hover responsive>
          <thead>
            <tr>
              <th>#</th>
              <th>Tên</th>
              <th>Email</th>
              <th>Vai trò</th>
              <th>Hành động</th>
              <th>Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            {userList.filter((user) => user.role !== "admin").map((user, index) => (
              <tr key={user.id}>
                <td>{index + 1}</td>
                <td>{user.name}</td>
                <td>{user.email}</td>
                <td>
                  <Dropdown>
                    <Dropdown.Toggle
                      size="sm"
                      variant="outline-secondary"
                      className="text-dark fw-bold"
                    >
                      {user.role}
                    </Dropdown.Toggle>
                    <Dropdown.Menu>
                      {["user", "staff", "admin"].map((r) => (
                        <Dropdown.Item
                          key={r}
                          onClick={() => handleChangeRole(user.id, r)}
                        >
                          {r}
                        </Dropdown.Item>
                      ))}
                    </Dropdown.Menu>
                  </Dropdown>
                </td>
                <td>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => openEditModal(user)}
                    className="me-2"
                  >
                    <FaEdit />
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleDelete(user.id)}
                  >
                    <FaTrash />
                  </Button>
                </td>
                <td>
                  <span
                    className={`badge me-2 ${
                      user.is_active ? "bg-success" : "bg-danger"
                    }`}
                  >
                    {user.is_active ? "Đang hoạt động" : "Đã khóa"}
                  </span>
                  <Button
                    variant={user.is_active ? "warning" : "success"}
                    size="sm"
                    onClick={() =>
                      toggleUserStatus(user.id, !user.is_active)
                    }
                  >
                    {user.is_active ? (
                      <>
                        <FaLock className="me-1" />
                        Khóa
                      </>
                    ) : (
                      <>
                        <FaUnlock className="me-1" />
                        Mở
                      </>
                    )}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}

      {/* Modal thêm/sửa */}
      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>
            {editingUser ? "Chỉnh sửa người dùng" : "Tạo nhân viên"}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Tên</Form.Label>
              <Form.Control
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Email</Form.Label>
              <Form.Control
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>
                {editingUser ? "Mật khẩu mới (nếu cần)" : "Mật khẩu"}
              </Form.Label>
              <Form.Control
                type="password"
                placeholder={
                  editingUser ? "Để trống nếu không đổi" : "Nhập mật khẩu"
                }
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                required={!editingUser}
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Đóng
          </Button>
          <Button variant="primary" onClick={handleSave}>
            Lưu
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default UserManagement;
