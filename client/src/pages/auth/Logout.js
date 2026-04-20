import React from 'react';
import { useNavigate } from 'react-router-dom';

const Logout = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user_id'); // Xóa user_id
    localStorage.removeItem('role');
    alert('Đăng xuất thành công!');
    navigate('/login');
  };

  return (
    <button className="btn btn-danger" onClick={handleLogout}>
      Đăng xuất
    </button>
  );
};

export default Logout;