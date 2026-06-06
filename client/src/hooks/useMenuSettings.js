// ==============================================================
// TÊN FILE: useMenuSettings.js
// MÔ TẢ: Custom hook để theo dõi cấu hình giao diện hiển thị của menu thực đơn (tên quán, banner).
//        Đọc cấu hình từ LocalStorage và lắng nghe sự kiện thay đổi
//        ('menu-settings-updated' & 'storage') để tự động cập nhật giao diện lập tức.
// ==============================================================

import { useEffect, useState } from "react";
import { getMenuSettings, MENU_SETTINGS_EVENT } from "../lib/menuSettings";

export const useMenuSettings = () => {
  // Lấy cấu hình ban đầu từ LocalStorage
  const [menuSettings, setMenuSettings] = useState(getMenuSettings);

  useEffect(() => {
    // Hàm đồng bộ khi nhận được CustomEvent cập nhật trong ứng dụng
    const syncSettings = (event) => {
      setMenuSettings(event.detail || getMenuSettings());
    };

    // Hàm đồng bộ khi có thay đổi LocalStorage từ các tab/cửa sổ trình duyệt khác
    const syncFromStorage = () => {
      setMenuSettings(getMenuSettings());
    };

    window.addEventListener(MENU_SETTINGS_EVENT, syncSettings);
    window.addEventListener("storage", syncFromStorage);

    return () => {
      window.removeEventListener(MENU_SETTINGS_EVENT, syncSettings);
      window.removeEventListener("storage", syncFromStorage);
    };
  }, []);

  return menuSettings;
};
