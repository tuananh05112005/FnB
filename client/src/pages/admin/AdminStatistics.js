import React, { useEffect, useState } from "react";
import axios from "axios";
import { Table, Card, Row, Col } from "react-bootstrap";
import { FaUsers, FaMoneyBillAlt, FaBox, FaTimesCircle } from "react-icons/fa";
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, PieChart, Pie, Cell } from "recharts";

const AdminStatistics = () => {
  const [statistics, setStatistics] = useState({
    totalRevenue: 0,
    totalUsers: 0,
    totalProductsSold: 0,
    totalCancelledOrders: 0,
  });

  // Lấy dữ liệu thống kê từ API khi component được mount
  useEffect(() => {
    const fetchStatistics = async () => {
      try {
        const response = await axios.get("http://localhost:5000/api/admin/statistics");
        setStatistics(response.data);
      } catch (error) {
        console.error("Lỗi khi lấy dữ liệu thống kê:", error);
      }
    };

    fetchStatistics();
  }, []);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);
  };

  const barChartData = [
    { name: "Người dùng", value: statistics.totalUsers },
    { name: "Sản phẩm bán", value: statistics.totalProductsSold },
    { name: "Đơn hàng hủy", value: statistics.totalCancelledOrders },
    { name: "Doanh thu", value: statistics.totalRevenue },
  ];

  const pieChartData = [
    { name: "Sản phẩm bán", value: statistics.totalProductsSold },
    { name: "Đơn hàng hủy", value: statistics.totalCancelledOrders },
  ];

  const COLORS = ["#0088FE", "#FF8042"];

  return (
    <div className="container mt-5">
      <h1 className="text-center mb-4">Thống kê hệ thống</h1>

      <Row className="mb-4">
        <Col md={3}>
          <Card className="text-center">
            <Card.Body>
              <FaUsers size={40} className="mb-3" />
              <Card.Title>Tổng người dùng</Card.Title>
              <Card.Text>{statistics.totalUsers}</Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center">
            <Card.Body>
              <FaBox size={40} className="mb-3" />
              <Card.Title>Sản phẩm đã bán</Card.Title>
              <Card.Text>{statistics.totalProductsSold}</Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center">
            <Card.Body>
              <FaTimesCircle size={40} className="mb-3" />
              <Card.Title>Đơn hàng hủy</Card.Title>
              <Card.Text>{statistics.totalCancelledOrders}</Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center">
            <Card.Body>
              <FaMoneyBillAlt size={40} className="mb-3" />
              <Card.Title>Tổng doanh thu</Card.Title>
              <Card.Text>{formatCurrency(statistics.totalRevenue)}</Card.Text>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <h2 className="text-center mb-4">Biểu đồ thống kê</h2>
      <Row className="mb-4">
        <Col md={8}>
          <Card>
            <Card.Body>
              <h4 className="text-center">Biểu đồ cột</h4>
              <BarChart width={700} height={300} data={barChartData}>
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" fill="#8884d8" />
              </BarChart>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card>
            <Card.Body>
              <h4 className="text-center">Biểu đồ tròn</h4>
              <PieChart width={400} height={300}>
                <Pie
                  data={pieChartData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label
                >
                  {pieChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <h2 className="text-center mb-4">Chi tiết thống kê</h2>
      <Table striped bordered hover>
        <thead>
          <tr>
            <th>#</th>
            <th>Chỉ số</th>
            <th>Giá trị</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>1</td>
            <td>Tổng người dùng</td>
            <td>{statistics.totalUsers}</td>
          </tr>
          <tr>
            <td>2</td>
            <td>Sản phẩm đã bán</td>
            <td>{statistics.totalProductsSold}</td>
          </tr>
          <tr>
            <td>3</td>
            <td>Đơn hàng hủy</td>
            <td>{statistics.totalCancelledOrders}</td>
          </tr>
          <tr>
            <td>4</td>
            <td>Tổng doanh thu</td>
            <td>{formatCurrency(statistics.totalRevenue)}</td>
          </tr>
        </tbody>
      </Table>
    </div>
  );
};

export default AdminStatistics;
