// ==============================================================
// TÊN FILE: userController.js
// MÔ TẢ: Bộ điều khiển quản lý tài khoản người dùng và nhân viên (User Management).
//        - Lấy toàn bộ người dùng (loại trừ Admin) phục vụ quản trị.
//        - Cập nhật vai trò (phân quyền: user/staff/admin).
//        - Xóa tài khoản người dùng (ngăn chặn xóa tài khoản admin).
//        - Cập nhật thông tin cơ bản của người dùng (hỗ trợ đổi mật khẩu mã hóa).
//        - Thay đổi trạng thái khóa/kích hoạt hoạt động của tài khoản (`is_active`).
//        - Tạo mới tài khoản nhân viên (Staff) và lấy danh sách nhân viên.
// ==============================================================

const bcrypt = require("bcryptjs");
const { getDB, getQuery } = require("../config/db");

// Lấy danh sách toàn bộ người dùng và nhân viên trong hệ thống (loại bỏ vai trò admin)
exports.getAll = async (req, res) => {
  try {
    const query = getQuery();
    const users = await query(
      "SELECT id, name, email, role, is_active FROM users WHERE role != 'admin'"
    );
    res.json(users);
  } catch (err) {
    console.error("Lỗi khi lấy danh sách người dùng:", err);
    res.status(500).json({ message: "Lỗi server" });
  }
};

// Cập nhật vai trò / phân quyền của người dùng (chỉ cho phép các vai trò hợp lệ)
exports.updateRole = async (req, res) => {
  const { id } = req.params;
  const { role } = req.body;
  if (!["user", "staff", "admin"].includes(role)) {
    return res.status(400).json({ message: "Vai trò không hợp lệ" });
  }
  try {
    const query = getQuery();
    await query("UPDATE users SET role = ? WHERE id = ?", [role, id]);
    res.json({ message: "Cập nhật vai trò thành công" });
  } catch (err) {
    console.error("Lỗi khi cập nhật role:", err);
    res.status(500).json({ message: "Lỗi server" });
  }
};

// Xóa tài khoản người dùng theo ID (không được phép xóa tài khoản của admin)
exports.remove = async (req, res) => {
  const { id } = req.params;
  try {
    const query = getQuery();
    const [user] = await query("SELECT * FROM users WHERE id = ?", [id]);
    if (!user) return res.status(404).json({ message: "Người dùng không tồn tại" });
    if (user.role === "admin")
      return res.status(403).json({ message: "Không thể xóa người dùng admin" });

    await query("DELETE FROM users WHERE id = ?", [id]);
    res.json({ message: "Xoá người dùng thành công" });
  } catch (err) {
    console.error("Lỗi khi xóa người dùng:", err);
    res.status(500).json({ message: "Lỗi server" });
  }
};

// Cập nhật thông tin chi tiết người dùng (có thể cập nhật mật khẩu mới nếu được gửi lên)
exports.update = async (req, res) => {
  const { id } = req.params;
  const { name, email, password } = req.body;
  try {
    const query = getQuery();
    if (password) {
      // Nếu có đổi mật khẩu, tiến hành băm mật khẩu trước khi lưu
      const hashedPassword = bcrypt.hashSync(password, 8);
      await query("UPDATE users SET name = ?, email = ?, password = ? WHERE id = ?",
        [name, email, hashedPassword, id]);
    } else {
      // Nếu không đổi mật khẩu, chỉ lưu tên và email
      await query("UPDATE users SET name = ?, email = ? WHERE id = ?",
        [name, email, id]);
    }
    res.json({ message: "Cập nhật người dùng thành công" });
  } catch (err) {
    console.error("Lỗi khi cập nhật người dùng:", err);
    res.status(500).json({ message: "Lỗi server" });
  }
};

// Khóa hoặc Mở khóa hoạt động của tài khoản người dùng (cột is_active)
exports.updateStatus = (req, res) => {
  const db = getDB();
  const { id } = req.params;
  const { is_active } = req.body;
  const sql = "UPDATE users SET is_active = ? WHERE id = ?";
  db.query(sql, [is_active, id], (err) => {
    if (err) return res.status(500).send("Lỗi server");
    res.send("Cập nhật trạng thái thành công");
  });
};

// Tạo tài khoản nhân viên (Staff) mới
exports.createStaff = async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const query = getQuery();
    const hashedPassword = bcrypt.hashSync(password, 8);
    // Kiểm tra xem email muốn tạo đã tồn tại trên hệ thống chưa
    const [exist] = await query("SELECT * FROM users WHERE email = ?", [email]);
    if (exist) return res.status(400).json({ message: "Email đã tồn tại" });

    // Tạo tài khoản mới gán cứng quyền là 'staff'
    await query(
      "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, 'staff')",
      [name, email, hashedPassword]
    );
    res.status(201).json({ message: "Tạo tài khoản nhân viên thành công" });
  } catch (err) {
    console.error("Lỗi khi tạo tài khoản staff:", err);
    res.status(500).json({ message: "Lỗi server" });
  }
};

// Lấy danh sách tài khoản thuộc bộ phận nhân viên (role = 'staff')
exports.getStaffs = async (_req, res) => {
  try {
    const query = getQuery();
    const staffs = await query("SELECT id, name, email FROM users WHERE role = 'staff'");
    res.json(staffs);
  } catch (err) {
    console.error("Lỗi khi lấy danh sách nhân viên:", err);
    res.status(500).json({ message: "Lỗi server" });
  }
};

// Lấy thông tin cá nhân của người dùng theo ID
exports.getProfile = async (req, res) => {
  const { id } = req.params;
  try {
    const query = getQuery();
    const [user] = await query("SELECT id, name, email, role, points FROM users WHERE id = ?", [id]);
    if (!user) return res.status(404).json({ message: "Người dùng không tồn tại" });
    res.json(user);
  } catch (err) {
    console.error("Lỗi khi lấy thông tin cá nhân:", err);
    res.status(500).json({ message: "Lỗi server" });
  }
};
