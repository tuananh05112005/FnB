// controllers/categorySettings.js - CRUD cho cài đặt danh mục
const { getQuery } = require('../config/db');
// const { io } = require('../app'); // socket.io instance

// GET /api/category-settings
exports.getSettings = async (req, res) => {
  try {
    const rows = await getQuery()(
      'SELECT hidden_categories, category_order FROM category_settings LIMIT 1'
    );
    if (!rows.length) {
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

// POST /api/category-settings (admin)
exports.saveSettings = async (req, res) => {
  const { hiddenCategories = [], categoryOrder = [] } = req.body;

  try {
    await getQuery()('DELETE FROM category_settings');

    await getQuery()(
      'INSERT INTO category_settings (hidden_categories, category_order) VALUES (?, ?)',
      [JSON.stringify(hiddenCategories), JSON.stringify(categoryOrder)]
    );

    const saved = { hiddenCategories, categoryOrder };

    // LẤY IO TỪ APP
    const io = req.app.get("io");

    // emit realtime
    if (io) {
      io.emit("categorySettingsUpdated", saved);
    }

    res.json(saved);
  } catch (err) {
    console.error('Error saving category settings:', err);
    res.status(500).json({ error: 'Không thể lưu cài đặt danh mục' });
  }
};