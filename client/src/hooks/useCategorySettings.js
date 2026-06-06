// ==============================================================
// TÊN FILE: useCategorySettings.js
// MÔ TẢ: Custom hook để truy vấn cấu hình danh mục sản phẩm (ẩn/hiện, thứ tự).
//        Tự động tải cấu hình từ Backend khi khởi chạy và lắng nghe
//        sự kiện WebSocket để đồng bộ cấu hình thời gian thực (real-time).
// ==============================================================

import { useEffect, useState } from "react";
import { fetchCategorySettings } from "../lib/categorySettings";
import { onCategorySettingsUpdated, offCategorySettingsUpdated } from "../lib/socket";

export const useCategorySettings = () => {
  // Trạng thái cấu hình danh mục (mặc định ban đầu là undefined thể hiện đang tải)
  const [categorySettings, setCategorySettings] = useState(undefined);

  // Load cấu hình lần đầu từ server
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const data = await fetchCategorySettings();
      if (!cancelled) setCategorySettings(data);
    };
    load();
    return () => {
      cancelled = true; // Tránh cập nhật state khi component đã unmount
    };
  }, []);

  // Lắng nghe WebSocket để tự động đồng bộ khi Admin thay đổi cấu hình danh mục
  useEffect(() => {
    const handler = (data) => setCategorySettings(data);
    onCategorySettingsUpdated(handler);
    return () => offCategorySettingsUpdated(handler); // Dọn dẹp listener khi unmount
  }, []);

  return categorySettings;
};
