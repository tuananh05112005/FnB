// routes/categorySettings.js - route cho cài đặt danh mục
const express = require('express');
const { getSettings, saveSettings } = require('../controllers/categorySettings');
const router = express.Router();

// Lấy cài đặt hiện tại (GET)
router.get('/', getSettings);

// Lưu cài đặt mới (POST) – admin
router.post('/', saveSettings);

module.exports = router;
