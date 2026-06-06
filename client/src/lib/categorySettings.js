// ==============================================================
// TÊN FILE: categorySettings.js
// MÔ TẢ: Quản lý cài đặt danh mục sản phẩm (sắp xếp thứ tự danh mục, ẩn/hiện danh mục).
//        Cung cấp các hàm gọi API lấy và lưu cấu hình từ server,
//        và các hàm xử lý danh mục phía client (chuẩn hóa danh mục, sắp xếp tiếng Việt).
// ==============================================================

import { api } from "./api";

// Cấu hình mặc định cho danh mục (mảng trống nghĩa là hiện tất cả và không thay đổi thứ tự)
export const DEFAULT_CATEGORY_SETTINGS = {
  hiddenCategories: [],
  categoryOrder: [],
};

// Gọi API lấy thông tin cấu hình ẩn/hiện và sắp xếp danh mục từ server
export const fetchCategorySettings = async () => {
  try {
    const { data } = await api.get("/api/category-settings");
    return { ...DEFAULT_CATEGORY_SETTINGS, ...data };
  } catch (err) {
    console.error("Không thể lấy cài đặt danh mục từ server:", err);
    // fallback về mặc định nếu lỗi
    return DEFAULT_CATEGORY_SETTINGS;
  }
};

// Lưu cài đặt (POST) – admin
export const saveCategorySettings = async (settings) => {
  try {
    const { data } = await api.post("/api/category-settings", settings);
    return { ...DEFAULT_CATEGORY_SETTINGS, ...data };
  } catch (err) {
    console.error("Không thể lưu cài đặt danh mục:", err);
    // trả về mặc định để UI không break
    return { ...DEFAULT_CATEGORY_SETTINGS, ...settings };
  }
};

// Các hàm trợ giúp (giữ nguyên)
export const normalizeCategories = (categories) =>
  [...new Set((categories || []).filter(Boolean))];

export const applyCategorySettings = (categories, settings = DEFAULT_CATEGORY_SETTINGS) => {
  const normalized = normalizeCategories(categories);
  const hidden = new Set(settings.hiddenCategories || []);
  const order = settings.categoryOrder || [];

  return normalized
    .filter((category) => !hidden.has(category))
    .sort((a, b) => {
      const indexA = order.indexOf(a);
      const indexB = order.indexOf(b);
      if (indexA === -1 && indexB === -1) {
        return a.localeCompare(b, "vi");
      }
      if (indexA === -1) return 1;
      if (indexB === -1) return -1;
      return indexA - indexB;
    });
};
