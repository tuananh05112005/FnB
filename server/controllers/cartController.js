// ==============================================================
// TÊN FILE: cartController.js
// MÔ TẢ: Controller quản lý Giỏ hàng (Cart) và Đơn hàng.
//        Thực hiện các nghiệp vụ: thêm vào giỏ, cập nhật số lượng, cập nhật trạng thái đơn,
//        xác nhận nhận hàng thành công (chuyển trạng thái sang 'received')
//        và hủy đơn hàng (chuyển trạng thái sang 'cancelled') từ phía User hoặc Admin.
//        Tích hợp lưu thông báo vào cơ sở dữ liệu và phát tín hiệu Real-time qua Socket.io.
// ==============================================================

const { getDB } = require("../config/db");

/**
 * add: Thêm sản phẩm mới vào giỏ hàng của người dùng (POST /api/cart/add).
 * Hỗ trợ nhận order_code từ body để gộp món, tự động sinh mã mới nếu chưa có.
 */
exports.add = (req, res) => {
  const db = getDB();
  const { user_id, product_id, quantity, size, order_code, sugar, ice, toppings } = req.body;
  
  // Nếu có order_code thì dùng, nếu không thì tự sinh mã mới
  const finalOrderCode = order_code || `DH${Date.now()}`;
  
  const q = "INSERT INTO cart (user_id, product_id, quantity, size, order_code, sugar, ice, toppings) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
  const finalToppings = typeof toppings === "object" && toppings !== null ? JSON.stringify(toppings) : toppings;

  db.query(q, [user_id, product_id, quantity, size, finalOrderCode, sugar || null, ice || null, finalToppings || null], (err, results) => {
    if (err) {
      console.error("Lỗi khi thêm giỏ hàng:", err);
      return res.status(500).send("Lỗi server");
    }
    res.status(201).json({ id: results.insertId, ...req.body, order_code: finalOrderCode });
  });
};

/**
 * listByUser: Lấy danh sách toàn bộ các sản phẩm hiện có trong giỏ hàng của một người dùng cụ thể (GET /api/cart/:user_id).
 */
exports.listByUser = (req, res) => {
  const db = getDB();
  const { user_id } = req.params;
  const q = `
    SELECT cart.id, cart.quantity, cart.size, cart.status, cart.order_date, cart.order_code,
           cart.sugar, cart.ice, cart.toppings,
           products.id AS product_id, products.code, products.name, products.price, products.image
    FROM cart
    JOIN products ON cart.product_id = products.id
    WHERE cart.user_id = ?
  `;
  db.query(q, [user_id], (err, results) => {
    if (err) return res.status(500).send("Lỗi server");
    
    // Parse toppings sang JSON nếu có để client dễ xử lý
    const parsedResults = results.map(row => {
      let toppingsList = [];
      if (row.toppings) {
        try {
          toppingsList = JSON.parse(row.toppings);
        } catch (e) {
          // Fallback nếu không phải JSON
          toppingsList = row.toppings.split(",").map(t => ({ name: t.trim(), price: 0 }));
        }
      }
      return {
        ...row,
        toppings: toppingsList
      };
    });
    
    res.json(parsedResults);
  });
};

/**
 * updateQty: Cập nhật số lượng của một sản phẩm trong giỏ hàng (PUT /api/cart/update/:id).
 */
exports.updateQty = (req, res) => {
  const db = getDB();
  const { id } = req.params;
  const { quantity } = req.body;
  if (!id || !quantity || isNaN(quantity)) {
    return res.status(400).json({ error: "Dữ liệu không hợp lệ" });
  }
  db.query("UPDATE cart SET quantity = ? WHERE id = ?", [quantity, id], (err) => {
    if (err) return res.status(500).send("Lỗi server");
    res.status(200).json({ message: "Cập nhật số lượng thành công" });
  });
};

/**
 * updateStatus: Cập nhật trạng thái đơn hàng (PUT /api/cart/status/:id).
 * Hỗ trợ cập nhật theo ID giỏ hàng hoặc order_code.
 */
exports.updateStatus = (req, res) => {
  const db = getDB();
  const { id } = req.params;
  const { status } = req.body;

  const qUpdate = isNaN(id)
    ? "UPDATE cart SET status = ? WHERE order_code = ?"
    : "UPDATE cart SET status = ? WHERE id = ?";

  db.query(qUpdate, [status, id], (err) => {
    if (err) return res.status(500).send("Lỗi server");
    res.status(200).json({ message: "Cập nhật trạng thái thành công" });
  });
};

/**
 * checkoutItem: Đánh dấu đơn hàng là đã thanh toán (chuyển trạng thái sang 'completed').
 * Hỗ trợ cập nhật theo ID giỏ hàng hoặc order_code.
 */
exports.checkoutItem = (req, res) => {
  const db = getDB();
  const { id } = req.params;

  const qUpdate = isNaN(id)
    ? "UPDATE cart SET status = 'completed' WHERE order_code = ?"
    : "UPDATE cart SET status = 'completed' WHERE id = ?";

  db.query(qUpdate, [id], (err) => {
    if (err) return res.status(500).send("Lỗi server");
    res.status(200).json({ message: "Thanh toán thành công" });
  });
};

/**
 * received: Xác nhận đơn hàng đã giao thành công và người dùng đã nhận hàng (PUT /api/cart/received/:id).
 * Hỗ trợ cả ID giỏ hàng riêng lẻ và order_code (Cập nhật đồng thời toàn bộ sản phẩm cùng đơn hàng).
 * - Cập nhật trạng thái 'received' trong DB.
 * - Lưu vết thông báo giao hàng thành công.
 * - Phát socket 'orderDelivered' tới Admin/Nhân viên và 'orderStatusUpdated' tới Khách hàng.
 */
exports.received = (req, res) => {
  const db = getDB();
  const { id } = req.params;

  const qFind = isNaN(id)
    ? "SELECT order_code, user_id FROM cart WHERE order_code = ? LIMIT 1"
    : "SELECT order_code, user_id FROM cart WHERE id = ? LIMIT 1";

  db.query(qFind, [id], (findErr, findResults) => {
    if (findErr) return res.status(500).json({ message: "Lỗi server" });
    if (!findResults.length) return res.status(404).json({ message: "Đơn hàng không tồn tại" });

    const { order_code, user_id } = findResults[0];

    const qSelect = `
      SELECT cart.user_id, users.name, GROUP_CONCAT(products.name SEPARATOR ', ') AS product_names 
      FROM cart 
      LEFT JOIN users ON cart.user_id = users.id 
      LEFT JOIN products ON cart.product_id = products.id
      WHERE cart.order_code = ?
      GROUP BY cart.user_id, users.name
    `;

    db.query(qSelect, [order_code], (selectErr, selectResults) => {
      if (selectErr) return res.status(500).json({ message: "Lỗi server" });
      const orderInfo = selectResults[0] || { name: "Khách hàng", product_names: "Sản phẩm" };

      db.query("UPDATE cart SET status = 'received' WHERE order_code = ?", [order_code], (err, results) => {
        if (err) return res.status(500).json({ message: "Lỗi server" });

        // Luu thong bao vao database cho khach hang
        db.query(
          "INSERT INTO notifications (user_id, message) VALUES (?, ?)",
          [user_id, `Đơn hàng #${order_code} đã giao thành công.`],
          (notifyErr) => {
            if (notifyErr) console.error("Lỗi lưu thông báo nhận hàng:", notifyErr);
          }
        );

        if (global.io) {
          global.io.to("managers").emit("orderDelivered", {
            id: order_code,
            userName: orderInfo.name || "Khách hàng",
            productName: orderInfo.product_names
          });
          global.io.to(`user:${user_id}`).emit("orderStatusUpdated", {
            orderId: order_code,
            status: "received"
          });
        }

        res.status(200).json({ message: "Cập nhật trạng thái thành công" });
      });
    });
  });
};

/**
 * cancel: Hủy đơn hàng và ghi nhận lý do hủy đơn (PUT /api/cart/cancel/:id).
 * Hỗ trợ cả ID giỏ hàng riêng lẻ và order_code (Hủy đồng thời toàn bộ sản phẩm cùng đơn hàng).
 * Hỗ trợ hủy đơn từ phía khách hàng (User) hoặc người quản trị (Admin/Staff).
 * - Cập nhật trạng thái 'cancelled' và lưu lý do.
 * - Lưu vết thông báo bị hủy đơn kèm theo lý do cụ thể.
 * - Phát socket 'orderStatusUpdated' (cho User) và 'orderCancelled' (cho Managers) kèm thông tin chi tiết.
 */
exports.cancel = (req, res) => {
  const db = getDB();
  const { id } = req.params;
  const { cancellation_reason, role } = req.body;

  const qFind = isNaN(id)
    ? "SELECT order_code, user_id FROM cart WHERE order_code = ? LIMIT 1"
    : "SELECT order_code, user_id FROM cart WHERE id = ? LIMIT 1";

  db.query(qFind, [id], (findErr, findResults) => {
    if (findErr) return res.status(500).json({ message: "Lỗi server" });
    if (!findResults.length) return res.status(404).json({ message: "Đơn hàng không tồn tại" });

    const { order_code, user_id } = findResults[0];
    const isByAdmin = role === "admin" || role === "staff";

    const qSelect = `
      SELECT cart.user_id, users.name, GROUP_CONCAT(products.name SEPARATOR ', ') AS product_names 
      FROM cart 
      LEFT JOIN users ON cart.user_id = users.id 
      LEFT JOIN products ON cart.product_id = products.id
      WHERE cart.order_code = ?
      GROUP BY cart.user_id, users.name
    `;

    db.query(qSelect, [order_code], (selectErr, selectResults) => {
      if (selectErr) return res.status(500).json({ message: "Lỗi server" });
      const orderInfo = selectResults[0] || { name: "Khách hàng", product_names: "Sản phẩm" };

      db.query(
        "UPDATE cart SET status = 'cancelled', cancellation_reason = ? WHERE order_code = ?",
        [cancellation_reason, order_code],
        (err) => {
          if (err) return res.status(500).send("Lỗi server");

          // Luu thong bao vao database cho khach hang
          const notifyMsg = isByAdmin
            ? `Đơn hàng #${order_code} của bạn đã bị hủy với lý do: ${cancellation_reason || "Không có lý do"}.`
            : `Đơn hàng #${order_code} đã bị hủy. Lý do: ${cancellation_reason || "Không có lý do"}.`;

          db.query(
            "INSERT INTO notifications (user_id, message) VALUES (?, ?)",
            [user_id, notifyMsg],
            (notifyErr) => {
              if (notifyErr) console.error("Lỗi lưu thông báo hủy đơn:", notifyErr);
            }
          );

          if (global.io) {
            // Gui thong bao cho khach hang
            global.io.to(`user:${user_id}`).emit("orderStatusUpdated", {
              orderId: order_code,
              status: "cancelled",
              cancellation_reason: cancellation_reason,
              cancelledBy: isByAdmin ? "admin" : "user"
            });
            // Gui thong bao cho managers (admin/staff)
            global.io.to("managers").emit("orderCancelled", {
              id: order_code,
              userName: orderInfo.name || "Khách hàng",
              productName: orderInfo.product_names,
              cancellation_reason: cancellation_reason,
              cancelledBy: isByAdmin ? "admin" : "user"
            });
          }

          res.status(200).json({ message: "Hủy đơn hàng thành công" });
        }
      );
    });
  });
};
