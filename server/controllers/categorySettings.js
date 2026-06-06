// ==============================================================
// TÊN FILE: categorySettings.js
// MÔ TẢ: Bộ điều khiển quản lý cài đặt danh mục sản phẩm (Category Settings).
//        - Lấy cấu hình danh mục ẩn/hiển thị và thứ tự sắp xếp danh mục.
//        - Lưu cấu hình mới của Admin vào Database, đồng thời phát Socket.io để đồng bộ Real-time sang Client.
// ==============================================================

const { getQuery } = require('../config/db');

// Lấy cấu hình ẩn/hiện và thứ tự sắp xếp danh mục sản phẩm từ Database
exports.getSettings = async (req, res) => {
  try {
    const rows = await getQuery()(
      'SELECT hidden_categories, category_order FROM category_settings LIMIT 1'
    );
    if (!rows.length) {
      // Nếu chưa cấu hình, trả về mảng rỗng mặc định
      return res.json({ hiddenCategories: [], categoryOrder: [] });
    }
    const { hidden_categories, category_order } = rows[0];
    res.json({
      hiddenCategories: JSON.parse(hidden_categories || '[]'),
      categoryOrder: JSON.parse(category_order || '[]'),
    });
  } catch (err) {
    console.error('Error fetching category settings:', err);
    res.status(500).json({ error: 'Không thể lấy cài đặt danh mục' });
  }
};

// Lưu cấu hình danh mục sản phẩm và phát đi sự kiện cập nhật Real-time
exports.saveSettings = async (req, res) => {
  const { hiddenCategories = [], categoryOrder = [] } = req.body;

  try {
    // Xóa cấu hình cũ trước khi chèn cấu hình mới (giới hạn 1 dòng duy nhất trên bảng)
    await getQuery()('DELETE FROM category_settings');

    await getQuery()(
      'INSERT INTO category_settings (hidden_categories, category_order) VALUES (?, ?)',
      [JSON.stringify(hiddenCategories), JSON.stringify(categoryOrder)]
    );

    const saved = { hiddenCategories, categoryOrder };

    // Lấy instance Socket.io gán trên app để phát sự kiện cho toàn bộ client đang kết nối
    const io = req.app.get("io");

    // Phát sự kiện cập nhật thời gian thực
    if (io) {
      io.emit("categorySettingsUpdated", saved);
    }

    res.json(saved);
  } catch (err) {
    console.error('Error saving category settings:', err);
    res.status(500).json({ error: 'Không thể lưu cài đặt danh mục' });
  }
};
