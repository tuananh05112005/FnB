// ==============================================================
// TÊN FILE: OrderDetail.js
// MÔ TẢ: Trang Chi tiết đơn hàng (OrderDetail) sử dụng React Bootstrap.
//        Hiển thị chi tiết một đơn đặt hàng cụ thể (tên sản phẩm, hình ảnh,
//        mã đơn, kích cỡ, phương thức thanh toán, thời gian đặt hàng và tổng tiền).
//        Dữ liệu đơn hàng được truyền từ component cha thông qua React Router Location State.
// ==============================================================

import React, { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button, Card, Badge, Row, Col } from "react-bootstrap";
import { FaArrowLeft, FaBox, FaCalendarAlt, FaCreditCard, FaTag, FaRulerCombined } from "react-icons/fa";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

// Thiết lập token Mapbox
mapboxgl.accessToken = process.env.REACT_APP_MAPBOX_ACCESS_TOKEN || "";

// Địa chỉ cửa hàng: 100a/4 Nguyễn Xuân Khoát, phường Phú Thọ Hòa, Tân Phú, HCMC
const SHOP_COORDINATES = [106.6343, 10.7806]; // Lng, Lat

const mapStyles = `
  @keyframes bounce-slow {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-8px); }
  }
  .animate-bounce-slow {
    animation: bounce-slow 2s infinite ease-in-out;
  }
  @keyframes pulse-slow {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.6; }
  }
  .animate-pulse-slow {
    animation: pulse-slow 1.5s infinite ease-in-out;
  }
  .map-custom-marker {
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 999px;
    width: 42px;
    height: 42px;
  }
  .shop-marker {
    background: white;
    box-shadow: 0 4px 10px rgba(0,0,0,0.15);
    border: 2px solid #10b981;
    font-size: 24px;
  }
  .dest-marker {
    background: white;
    box-shadow: 0 4px 10px rgba(0,0,0,0.15);
    border: 2px solid #ef4444;
    font-size: 24px;
  }
`;

const DeliveryMap = ({ address }) => {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const shipperMarkerRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [shipperInfo, setShipperInfo] = useState({
    name: "Nguyễn Văn Nam",
    phone: "0901 234 567",
    vehicle: "Honda Wave Alpha (59-X3 456.78)",
    distance: "...",
    duration: "...",
    progress: 0,
    statusText: "Tài xế đang nhận nước tại cửa hàng..."
  });

  useEffect(() => {
    if (!mapContainerRef.current) return;

    let map = null;
    let animationFrameId = null;

    const initializeMap = async () => {
      try {
        let destCoords = null;
        
        // 1. Geocode qua OSM Nominatim trước
        try {
          const geoRes = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
              address + ", Hồ Chí Minh"
            )}&limit=1`
          );
          const geoData = await geoRes.json();
          if (geoData && geoData.length > 0) {
            destCoords = [parseFloat(geoData[0].lon), parseFloat(geoData[0].lat)];
          }
        } catch (e) {
          console.error("OSM Geocoding failed, trying Mapbox...", e);
        }

        // 2. Geocode qua Mapbox làm fallback
        if (!destCoords && mapboxgl.accessToken) {
          try {
            const geoRes = await fetch(
              `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
                address
              )}.json?access_token=${mapboxgl.accessToken}&limit=1&bbox=106.35,10.35,107.05,11.16`
            );
            const geoData = await geoRes.json();
            if (geoData && geoData.features && geoData.features.length > 0) {
              destCoords = geoData.features[0].center;
            }
          } catch (e) {
            console.error("Mapbox Geocoding failed...", e);
          }
        }

        // 3. Fallback cuối cùng nếu không tìm thấy tọa độ địa chỉ
        if (!destCoords) {
          destCoords = [SHOP_COORDINATES[0] - 0.015, SHOP_COORDINATES[1] - 0.01]; 
        }

        const center = [
          (SHOP_COORDINATES[0] + destCoords[0]) / 2,
          (SHOP_COORDINATES[1] + destCoords[1]) / 2
        ];
        
        map = new mapboxgl.Map({
          container: mapContainerRef.current,
          style: "mapbox://styles/mapbox/streets-v12",
          center: center,
          zoom: 13,
          pitch: 30
        });
        mapRef.current = map;

        map.addControl(new mapboxgl.NavigationControl(), "top-right");

        map.on("load", async () => {
          setLoading(false);

          // Marker cửa hàng
          const shopEl = document.createElement("div");
          shopEl.className = "map-custom-marker shop-marker";
          shopEl.innerHTML = "🏪";
          
          new mapboxgl.Marker(shopEl)
            .setLngLat(SHOP_COORDINATES)
            .setPopup(new mapboxgl.Popup({ offset: 25 }).setHTML("<b>Tiệm trà Happy</b><br/>Địa chỉ cửa hàng"))
            .addTo(map);

          // Marker điểm giao
          const destEl = document.createElement("div");
          destEl.className = "map-custom-marker dest-marker";
          destEl.innerHTML = "📍";
          
          new mapboxgl.Marker(destEl)
            .setLngLat(destCoords)
            .setPopup(new mapboxgl.Popup({ offset: 25 }).setHTML(`<b>Địa chỉ nhận hàng</b><br/>${address}`))
            .addTo(map);

          // Lấy tuyến đường thực tế qua Directions API
          let routeCoordinates = [SHOP_COORDINATES, destCoords];
          let distanceKm = 2.5;
          let durationMin = 10;

          if (mapboxgl.accessToken) {
            try {
              const directionsRes = await fetch(
                `https://api.mapbox.com/directions/v5/mapbox/driving/${SHOP_COORDINATES[0]},${SHOP_COORDINATES[1]};${destCoords[0]},${destCoords[1]}.json?geometries=geojson&overview=full&access_token=${mapboxgl.accessToken}`
              );
              const directionsData = await directionsRes.json();
              if (directionsData && directionsData.routes && directionsData.routes.length > 0) {
                const route = directionsData.routes[0];
                routeCoordinates = route.geometry.coordinates;
                distanceKm = (route.distance / 1000).toFixed(1);
                durationMin = Math.round(route.duration / 60);
              }
            } catch (e) {
              console.error("Failed to get Mapbox driving route, using straight line...", e);
            }
          }

          // Vẽ đường đi trên map
          map.addSource("route", {
            type: "geojson",
            data: {
              type: "Feature",
              properties: {},
              geometry: {
                type: "LineString",
                coordinates: routeCoordinates
              }
            }
          });

          map.addLayer({
            id: "route",
            type: "line",
            source: "route",
            layout: {
              "line-join": "round",
              "line-cap": "round"
            },
            paint: {
              "line-color": "#c8860a",
              "line-width": 6,
              "line-opacity": 0.85
            }
          });

          const bounds = new mapboxgl.LngLatBounds();
          bounds.extend(SHOP_COORDINATES);
          bounds.extend(destCoords);
          map.fitBounds(bounds, { padding: 60 });

          // Marker Shipper
          const shipperEl = document.createElement("div");
          shipperEl.className = "map-custom-marker shipper-marker animate-bounce-slow";
          shipperEl.innerHTML = "🛵";
          shipperEl.style.fontSize = "32px";
          shipperEl.style.cursor = "pointer";
          
          const shipperMarker = new mapboxgl.Marker(shipperEl)
            .setLngLat(SHOP_COORDINATES)
            .addTo(map);
          shipperMarkerRef.current = shipperMarker;

          // Chạy vòng lặp mô phỏng
          const totalPoints = routeCoordinates.length;
          const animationDuration = 25000; // 25s
          let startTime = null;

          const animateShipper = (timestamp) => {
            if (!startTime) startTime = timestamp;
            const elapsed = timestamp - startTime;
            const progress = Math.min(elapsed / animationDuration, 1);

            const targetIndex = progress * (totalPoints - 1);
            const index = Math.floor(targetIndex);
            const nextIndex = Math.min(index + 1, totalPoints - 1);
            const segmentProgress = targetIndex - index;

            const currentPoint = routeCoordinates[index];
            const nextPoint = routeCoordinates[nextIndex];

            const lng = currentPoint[0] + (nextPoint[0] - currentPoint[0]) * segmentProgress;
            const lat = currentPoint[1] + (nextPoint[1] - currentPoint[1]) * segmentProgress;

            shipperMarker.setLngLat([lng, lat]);

            let statusText = "Tài xế đang nhận nước tại cửa hàng...";
            if (progress > 0.05 && progress <= 0.4) {
              statusText = "Tài xế đang di chuyển trên đường...";
            } else if (progress > 0.4 && progress <= 0.8) {
              statusText = "Tài xế sắp tới địa chỉ nhận hàng...";
            } else if (progress > 0.8 && progress < 1) {
              statusText = "Tài xế đã đến ngõ, đang gọi cho bạn...";
            } else if (progress === 1) {
              statusText = "Giao hàng thành công! Chúc bạn ngon miệng!";
            }

            const remainingDist = (distanceKm * (1 - progress)).toFixed(1);
            const remainingDur = Math.round(durationMin * (1 - progress));

            setShipperInfo((prev) => ({
              ...prev,
              distance: remainingDist > 0 ? `${remainingDist} km` : "Đã đến nơi",
              duration: remainingDur > 0 ? `${remainingDur} phút` : "0 phút",
              progress: Math.round(progress * 100),
              statusText
            }));

            if (progress < 1) {
              animationFrameId = requestAnimationFrame(animateShipper);
            } else {
              setTimeout(() => {
                startTime = null;
                animationFrameId = requestAnimationFrame(animateShipper);
              }, 8000);
            }
          };

          animationFrameId = requestAnimationFrame(animateShipper);
        });

      } catch (err) {
        console.error("Error setting up delivery map:", err);
      }
    };

    initializeMap();

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      if (map) map.remove();
    };
  }, [address]);

  return (
    <div style={{ position: "relative" }}>
      <style>{mapStyles}</style>
      {loading && (
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(255,255,255,0.9)", zIndex: 10,
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center"
        }}>
          <div className="spinner-border text-warning mb-2" role="status" />
          <span className="text-muted fw-bold">Đang tải hành trình shipper...</span>
        </div>
      )}

      <div ref={mapContainerRef} style={{ height: "350px", width: "100%", borderRadius: "8px 8px 0 0" }} />

      <div className="p-3 bg-white border-top shadow-sm" style={{ borderRadius: "0 0 8px 8px" }}>
        <Row className="align-items-center g-3">
          <Col md={6}>
            <div className="d-flex align-items-center gap-3">
              <div style={{
                width: 48, height: 48, borderRadius: 99,
                background: "linear-gradient(135deg, #c8860a 0%, #3D2B14 100%)",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "#fff", fontSize: "0.95rem", fontWeight: 800
              }}>
                SHIP
              </div>
              <div>
                <h6 className="mb-0 fw-bold text-dark">{shipperInfo.name}</h6>
                <p className="mb-0 text-muted" style={{ fontSize: "0.78rem" }}>{shipperInfo.vehicle}</p>
                <div className="d-flex gap-2 mt-1">
                  <a href={`tel:${shipperInfo.phone}`} className="badge bg-light text-warning text-decoration-none border px-2 py-1" style={{ borderColor: "#c8860a" }}>
                    📞 Gọi điện
                  </a>
                  <span className="badge bg-light text-muted border px-2 py-1" style={{ cursor: "pointer" }}>
                    💬 Nhắn tin
                  </span>
                </div>
              </div>
            </div>
          </Col>
          <Col md={6}>
            <div className="bg-light p-3 rounded-3">
              <div className="d-flex justify-content-between mb-1" style={{ fontSize: "0.82rem" }}>
                <span className="text-dark fw-bold">{shipperInfo.statusText}</span>
                <span className="text-warning fw-bold">{shipperInfo.progress}%</span>
              </div>
              <div className="progress" style={{ height: 6, marginBottom: 8 }}>
                <div className="progress-bar progress-bar-striped progress-bar-animated bg-warning"
                  role="progressbar"
                  style={{ width: `${shipperInfo.progress}%` }}
                />
              </div>
              <div className="d-flex justify-content-between" style={{ fontSize: "0.78rem", color: "#64748b" }}>
                <div>
                  <span>Khoảng cách: </span>
                  <strong className="text-dark">{shipperInfo.distance}</strong>
                </div>
                <div>
                  <span>Còn lại: </span>
                  <strong className="text-warning">{shipperInfo.duration}</strong>
                </div>
              </div>
            </div>
          </Col>
        </Row>
      </div>
    </div>
  );
};

const OrderDetail = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Nhận dữ liệu đơn hàng được truyền qua state khi chuyển hướng (ví dụ từ trang History)
  const order = location.state?.order;

  // Định dạng số tiền tệ VNĐ (ví dụ: 30.000 ₫), trả về "N/A" nếu không có giá trị hợp lệ
  const formatCurrency = (value) => {
    return value
      ? new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(value)
      : "N/A";
  };

  const getBadgeVariant = (status) => {
    const map = {
      pending: "warning",
      completed: "info",
      received: "success",
      cancelled: "danger"
    };
    return map[status] || "secondary";
  };

  const getStatusLabel = (status) => {
    const map = {
      pending: "Đang xử lý",
      completed: "Đang giao",
      received: "Đã giao",
      cancelled: "Đã hủy"
    };
    return map[status] || status;
  };

  // Nếu người dùng truy cập trực tiếp mà không qua chuyển hướng (không có order trong state)
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
      <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3 mb-4">
        <div className="d-flex align-items-center flex-wrap gap-2">
          <Button 
            variant="outline-secondary" 
            className="me-2 rounded-pill" 
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
            bg={getBadgeVariant(order.status)} 
            className="fs-6 px-3 py-2 rounded-pill align-self-start align-self-md-center"
          >
            {getStatusLabel(order.status)}
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
                    <p className="mb-0 text-muted">{order.payment_method === "cash" ? "Tiền mặt" : "Chuyển khoản"}</p>
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

      {/* Real-time Delivery Map */}
      {order.status === "completed" && (
        <Row className="mt-4">
          <Col>
            <Card className="border-0 shadow-sm overflow-hidden">
              <Card.Header className="bg-white border-0 py-3 d-flex align-items-center justify-content-between">
                <h5 className="mb-0 text-dark fw-bold">
                  <span className="me-2">🛵</span>
                  Theo dõi đơn hàng thời gian thực
                </h5>
                <Badge bg="warning" className="px-3 py-2 rounded-pill animate-pulse-slow" style={{ color: "#3d2b14" }}>
                  Đang giao hàng
                </Badge>
              </Card.Header>
              <Card.Body className="p-0 position-relative">
                <DeliveryMap address={order.address || "100a/4 Nguyễn Xuân Khoát, Phú Thọ Hòa, Tân Phú"} />
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

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
      <div className="d-flex flex-column flex-sm-row justify-content-center align-items-center gap-3 mt-4">
        <Button 
          variant="primary" 
          size="lg" 
          className="rounded-pill px-4 w-100 w-sm-auto"
          onClick={() => navigate('/carts')}
        >
          Xem tất cả đơn hàng
        </Button>
        <Button 
          variant="outline-primary" 
          size="lg" 
          className="rounded-pill px-4 w-100 w-sm-auto"
          onClick={() => navigate('/products')}
        >
          Tiếp tục mua sắm
        </Button>
      </div>
    </div>
  );
};

export default OrderDetail;