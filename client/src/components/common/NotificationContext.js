// Component Context quản lý thông báo thời gian thực toàn cục (Real-time Notifications) cho cả Admin, Nhân viên và Khách hàng
import React, { createContext, useContext, useEffect, useState, useMemo } from "react";
import { useLocation } from "react-router-dom";
import { Bell, ShoppingCart, CheckCircle, CreditCard, X, Gift } from "lucide-react";
import socket from "../../lib/socket";
import { getSession, decodeTokenPayload } from "../../lib/session";
import { api } from "../../lib/api";
import "./NotificationToast.css";

// Tạo Context cho hệ thống thông báo
const NotificationContext = createContext(null);

/**
 * Hàm playChime: Phát âm thanh chime tinh tế (hai nốt) khi có thông báo mới.
 * Sử dụng Web Audio API tích hợp sẵn trong trình duyệt để tạo âm thanh trực tiếp.
 */
const playChime = () => {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = "sine";
    // Tiếng chime hai nốt thanh mảnh (nốt D5 ở tần số 587.33Hz rồi chuyển tiếp sang nốt A5 ở tần số 880Hz)
    osc.frequency.setValueAtTime(587.33, ctx.currentTime); 
    osc.frequency.setValueAtTime(880, ctx.currentTime + 0.08); 
    
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.35);
  } catch (e) {
    console.warn("Audio Context blocked by browser auto-play policy");
  }
};

/**
 * Hàm formatCurrency: Định dạng số tiền thành định dạng tiền tệ VNĐ (ví dụ: 10.000 ₫)
 */
const formatCurrency = (amount) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(Number(amount) || 0);

/**
 * Hàm mapDbNotification: Chuyển đổi dữ liệu thông báo thô từ database thành object chuẩn để hiển thị trên frontend
 * Định dạng tiêu đề (title) và kiểu thông báo (type) dựa trên nội dung (message) của thông báo đó.
 */
const mapDbNotification = (n) => {
  let title = "🔔 Thông báo";
  let type = "status_updated";

  // Phân loại thông báo dựa vào từ khóa trong nội dung
  if (n.message.includes("voucher") || n.message.includes("Voucher")) {
    title = "🎁 Voucher mới!";
    type = "new_voucher";
  } else if (n.message.includes("thanh toán") || n.message.includes("thanh toan")) {
    title = "🎉 Đơn hàng đã được thanh toán!";
    type = "payment_success_customer";
  } else if (n.message.includes("trạng thái") || n.message.includes("trang thai")) {
    title = "🔔 Cập nhật trạng thái đơn!";
    type = "status_updated";
  } else if (n.message.includes("giao thành công") || n.message.includes("giao thanh cong")) {
    title = "✅ Giao hàng thành công!";
    type = "status_updated";
  } else if (n.message.includes("hủy") || n.message.includes("huy")) {
    title = "❌ Đơn hàng đã bị hủy!";
    type = "order_cancelled";
  }

  return {
    id: `db_${n.id}`, // Gắn tiền tố db_ để phân biệt với các thông báo Real-time lưu tạm thời
    title,
    message: n.message,
    type,
    createdAt: n.created_at || new Date().toISOString(),
    isRead: n.is_read === 1 || n.is_read === true
  };
};

/**
 * NotificationProvider: Nhà cung cấp Context bao bọc ứng dụng để lắng nghe socket, lưu trữ danh sách thông báo và điều khiển hiển thị.
 */
export const NotificationProvider = ({ children }) => {
  // notifications: lưu trữ các thông báo Toast đang nổi trên màn hình (sẽ tự biến mất sau 30s)
  const [notifications, setNotifications] = useState([]);
  
  // history: lưu trữ lịch sử các thông báo trong trung tâm thông báo (Dropdown chuông), được đồng bộ với localStorage và DB.
  const [history, setHistory] = useState(() => {
    try {
      const local = localStorage.getItem("fnb-notifications-history");
      return local ? JSON.parse(local) : [];
    } catch {
      return [];
    }
  });

  const location = useLocation();

  // Đồng bộ session người dùng (userId, role) để gửi qua socket.io
  const session = getSession();
  const tokenPayload = useMemo(() => decodeTokenPayload(session.token), [session.token, location.pathname]);
  const userId = session.userId || tokenPayload?.id || tokenPayload?.user_id;
  const role = tokenPayload?.role || session.role;

  // Đếm số thông báo chưa đọc trong lịch sử
  const unreadCount = useMemo(() => history.filter((n) => !n.isRead).length, [history]);

  // Effect 1: Lắng nghe sự kiện kết nối Socket và tự động xác thực gửi kèm userId, role khi socket kết nối thành công hoặc thay đổi route
  useEffect(() => {
    const handleConnect = () => {
      if (userId) {
        socket.emit("authenticate", { userId, role });
      }
    };

    socket.on("connect", handleConnect);

    // Xác thực ngay nếu socket đã có kết nối sẵn
    if (socket.connected && userId) {
      socket.emit("authenticate", { userId, role });
    }

    return () => {
      socket.off("connect", handleConnect);
    };
  }, [userId, role, location.pathname]);

  // Effect 2: Đồng bộ lịch sử thông báo từ database về Local Storage khi người dùng là Khách hàng
  useEffect(() => {
    if (userId && role !== "admin" && role !== "staff") {
      api.get(`/api/loyalty/${userId}`)
        .then((res) => {
          const dbNotifs = res.data.notifications || [];
          const mapped = dbNotifs.map(mapDbNotification);

          setHistory((prev) => {
            // Tạo tập hợp Set các ID từ DB để tránh trùng lặp
            const dbIds = new Set(mapped.map((item) => item.id));
            // Lọc các thông báo local chỉ lưu tạm thời không thuộc DB
            const locals = prev.filter(
              (item) => !dbIds.has(item.id) && !item.id.toString().startsWith("db_")
            );
            // Gộp lại, sắp xếp mới nhất lên đầu và giới hạn lưu tối đa 30 thông báo gần đây
            const combined = [...locals, ...mapped]
              .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
              .slice(0, 30);
            localStorage.setItem("fnb-notifications-history", JSON.stringify(combined));
            return combined;
          });
        })
        .catch(console.error);
    }
  }, [userId, role, location.pathname]);

  /**
   * Hàm addNotification: Tạo một thông báo Toast nổi lên màn hình và thêm vào Lịch sử thông báo.
   */
  const addNotification = (type, title, message) => {
    const id = `${Date.now()}-${Math.random()}`;
    // Thêm vào danh sách nổi (Toast)
    setNotifications((prev) => [...prev, { id, type, title, message }]);
    playChime(); // Phát âm thanh

    // Tạo thông báo mới lưu vào lịch sử
    const newItem = {
      id,
      type,
      title,
      message,
      createdAt: new Date().toISOString(),
      isRead: false
    };

    setHistory((prev) => {
      const updated = [newItem, ...prev].slice(0, 30);
      localStorage.setItem("fnb-notifications-history", JSON.stringify(updated));
      return updated;
    });

    // Tự động tắt và xóa Toast đó khỏi màn hình sau 30 giây
    setTimeout(() => {
      removeNotification(id);
    }, 30000);
  };

  /**
   * Hàm removeNotification: Xóa Toast thông báo khỏi màn hình dựa trên ID (khi hết thời gian hoặc ấn nút X)
   */
  const removeNotification = (id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  // Effect 3: Đăng ký toàn bộ các sự kiện Socket.io thời gian thực
  useEffect(() => {
    // 1. Lắng nghe đơn hàng mới (Dành cho Admin/Nhân viên)
    const handleNewOrder = (data) => {
      if (role === "admin" || role === "staff") {
        if (data.payment_method === "cash") {
          addNotification(
            "new_order",
            "🛒 Đơn hàng mới (Tiền mặt)!",
            `Khách hàng ${data.name} vừa đặt món ${data.productName || "sản phẩm"} trị giá ${formatCurrency(data.amount)} bằng tiền mặt.`
          );
        } else {
          addNotification(
            "new_order",
            "🛒 Đơn hàng mới (Chuyển khoản)!",
            `Khách hàng ${data.name} vừa tạo đơn hàng: ${data.productName || "sản phẩm"} trị giá ${formatCurrency(data.amount)} (Đang chờ chuyển khoản).`
          );
        }
      }
    };

    // 2. Lắng nghe xác nhận thanh toán thành công của đơn hàng chuyển khoản (Dành cho Admin/Nhân viên)
    const handleOrderPaid = (data) => {
      if (role === "admin" || role === "staff") {
        addNotification(
          "payment_success",
          "💰 Thanh toán chuyển khoản thành công!",
          `Đơn hàng #${data.id} của khách hàng ${data.name} (${data.productName || "sản phẩm"}) trị giá ${formatCurrency(data.amount)} đã được thanh toán bằng chuyển khoản thành công.`
        );
      }
    };

    // 3. Lắng nghe xác nhận thanh toán thành công (Dành cho Khách hàng tương ứng)
    const handleOrderPaidCustomer = (data) => {
      if (role !== "admin" && role !== "staff") {
        addNotification(
          "payment_success_customer",
          "🎉 Đơn hàng đã được thanh toán!",
          `Món ${data.productName || "sản phẩm"} của bạn đã được thanh toán thành công.`
        );
      }
    };

    // 4. Lắng nghe cập nhật trạng thái chuẩn bị/giao hàng/hủy đơn của đơn hàng (Dành cho Khách hàng)
    const handleOrderStatusUpdated = (data) => {
      if (role !== "admin" && role !== "staff") {
        if (data.status === "received") {
          addNotification(
            "order_delivered",
            "✅ Giao hàng thành công!",
            `Đơn hàng #${data.orderId} của bạn đã được giao thành công. Cảm ơn bạn đã mua hàng!`
          );
        } else if (data.status === "cancelled") {
          const msg = data.cancelledBy === "admin"
            ? `Đơn hàng #${data.orderId} của bạn đã bị hủy với lý do: ${data.cancellation_reason || "Không có lý do"}.`
            : `Đơn hàng #${data.orderId} của bạn đã bị hủy. Lý do: ${data.cancellation_reason || "Không có lý do"}.`;
          addNotification(
            "order_cancelled",
            "❌ Đơn hàng đã bị hủy!",
            msg
          );
        }
      }
    };

    // 5. Lắng nghe Khách hàng đã xác nhận nhận được hàng (Dành cho Admin/Nhân viên)
    const handleOrderDelivered = (data) => {
      if (role === "admin" || role === "staff") {
        addNotification(
          "order_delivered",
          "✅ Đã nhận được hàng!",
          `Khách hàng ${data.userName} đã xác nhận đã nhận được món: ${data.productName || "sản phẩm"} (Đơn hàng #${data.id}).`
        );
      }
    };

    // 6. Lắng nghe khi được cấp Voucher mới (Dành cho Khách hàng)
    const handleNewVoucher = (data) => {
      if (role !== "admin" && role !== "staff") {
        addNotification(
          "new_voucher",
          "🎁 Voucher mới!",
          data.message || `Bạn vừa nhận được voucher mới.`
        );
      }
    };

    // 7. Lắng nghe Khách hàng hủy đơn (Dành cho Admin/Nhân viên)
    const handleOrderCancelled = (data) => {
      if (role === "admin" || role === "staff") {
        if (data.cancelledBy === "admin") {
          addNotification(
            "order_cancelled",
            "❌ Bạn đã hủy đơn hàng!",
            `Bạn đã hủy đơn hàng #${data.id} với lý do: ${data.cancellation_reason || "Không có lý do"}.`
          );
        } else {
          addNotification(
            "order_cancelled",
            "❌ Đơn hàng bị hủy!",
            `Khách hàng ${data.userName} vừa hủy đơn hàng #${data.id} (${data.productName || "sản phẩm"}). Lý do: ${data.cancellation_reason || "Không có lý do"}.`
          );
        }
      }
    };

    // Đăng ký các hàm xử lý sự kiện tương ứng với từng tín hiệu Socket.io nhận về
    socket.on("newOrder", handleNewOrder);
    socket.on("orderPaid", handleOrderPaid);
    socket.on("orderPaidCustomer", handleOrderPaidCustomer);
    socket.on("orderStatusUpdated", handleOrderStatusUpdated);
    socket.on("orderDelivered", handleOrderDelivered);
    socket.on("newVoucher", handleNewVoucher);
    socket.on("orderCancelled", handleOrderCancelled);

    // Hủy đăng ký listener khi component unmount để tránh rò rỉ bộ nhớ (memory leaks)
    return () => {
      socket.off("newOrder", handleNewOrder);
      socket.off("orderPaid", handleOrderPaid);
      socket.off("orderPaidCustomer", handleOrderPaidCustomer);
      socket.off("orderStatusUpdated", handleOrderStatusUpdated);
      socket.off("orderDelivered", handleOrderDelivered);
      socket.off("newVoucher", handleNewVoucher);
      socket.off("orderCancelled", handleOrderCancelled);
    };
  }, [role, userId]);

  /**
   * Hàm getIcon: Trả về icon React component (Lucide-react) tương ứng với mỗi kiểu thông báo.
   */
  const getIcon = (type) => {
    switch (type) {
      case "new_order":
        return <ShoppingCart size={18} className="text-brand" />;
      case "payment_success":
      case "payment_success_customer":
        return <CheckCircle size={18} className="text-success" />;
      case "order_delivered":
        return <CheckCircle size={18} className="text-success" style={{ color: "#10b981" }} />;
      case "status_updated":
        return <Bell size={18} className="text-info" />;
      case "new_voucher":
        return <Gift size={18} className="text-warning" style={{ color: "#f59e0b" }} />;
      case "order_cancelled":
        return <X size={18} className="text-danger" style={{ color: "#ef4444" }} />;
      default:
        return <CreditCard size={18} />;
    }
  };

  /**
   * Hàm markAllAsRead: Đánh dấu tất cả thông báo hiện có trong lịch sử là ĐÃ ĐỌC (trên local storage, state và DB nếu là khách hàng)
   */
  const markAllAsRead = async () => {
    setHistory((prev) => {
      const updated = prev.map((n) => ({ ...n, isRead: true }));
      localStorage.setItem("fnb-notifications-history", JSON.stringify(updated));
      return updated;
    });

    if (userId && role !== "admin" && role !== "staff") {
      try {
        await api.put(`/api/notifications/read/${userId}`);
      } catch (err) {
        console.error("Lỗi đánh dấu đã đọc trên DB:", err);
      }
    }
  };

  /**
   * Hàm markAsRead: Đánh dấu duy nhất MỘT thông báo cụ thể là ĐÃ ĐỌC dựa vào ID.
   */
  const markAsRead = async (notifId) => {
    setHistory((prev) => {
      const updated = prev.map((n) => (n.id === notifId ? { ...n, isRead: true } : n));
      localStorage.setItem("fnb-notifications-history", JSON.stringify(updated));
      return updated;
    });

    // Nếu là thông báo thuộc DB (có tiền tố db_), gọi API cập nhật trạng thái trong database
    if (userId && role !== "admin" && role !== "staff" && notifId.toString().startsWith("db_")) {
      const dbId = notifId.replace("db_", "");
      try {
        await api.put(`/api/notifications/read-single/${dbId}`);
      } catch (err) {
        console.error("Lỗi đánh dấu đã đọc một tin trên DB:", err);
      }
    }
  };

  /**
   * Hàm clearHistory: Xóa toàn bộ lịch sử thông báo lưu ở Local Storage và State hiện tại.
   */
  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem("fnb-notifications-history");
  };

  return (
    <NotificationContext.Provider value={{ 
      notifications, 
      addNotification, 
      removeNotification,
      history,
      unreadCount,
      markAllAsRead,
      markAsRead,
      clearHistory,
      getIcon
    }}>
      {children}

      {/* Cổng hiển thị Toast thông báo ở góc trên bên phải màn hình */}
      <div className="notification-toast-container">
        {notifications.map((n) => (
          <div key={n.id} className={`notification-toast ${n.type} animate-slide-in`}>
            <div className="notification-toast-header">
              <span className="notification-toast-icon-wrap">{getIcon(n.type)}</span>
              <strong className="notification-toast-title">{n.title}</strong>
              <button
                type="button"
                className="notification-toast-close-btn"
                onClick={() => removeNotification(n.id)}
                aria-label="Đóng thông báo"
              >
                <X size={14} />
              </button>
            </div>
            <div className="notification-toast-body">{n.message}</div>
            <div className="notification-toast-progress" />
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  );
};

// Hook tiện ích để lấy dữ liệu thông báo nhanh chóng từ các component con
export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotifications must be used within a NotificationProvider");
  }
  return context;
};
