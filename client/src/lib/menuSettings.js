// ==============================================================
// TÊN FILE: menuSettings.js
// MÔ TẢ: Quản lý cấu hình giao diện hiển thị của menu thực đơn (tên cửa hàng, tiêu đề menu, banner).
//        Sử dụng LocalStorage để lưu trữ và tải cấu hình giao diện của quán,
//        đồng thời phát CustomEvent ('menu-settings-updated') toàn cục khi có thay đổi.
// ==============================================================

const MENU_SETTINGS_KEY = "menu_display_settings";
// Sự kiện dùng để đồng bộ nhanh giao diện giữa các thành phần React khi Admin lưu thay đổi
export const MENU_SETTINGS_EVENT = "menu-settings-updated";

// Giá trị mặc định của cửa hàng
export const DEFAULT_MENU_SETTINGS = {
  storeName: "Tiệm trà happy",
  topbarName: "TeaShop",
  menuTitle: "Danh sách sản phẩm",
  menuSubtitle: "Duyệt menu, tìm nhanh sản phẩm và quản lý đơn giản hơn.",
  bannerImage: "",
};

// Kiểm tra xem trình duyệt có hỗ trợ LocalStorage không
const canUseStorage = () => typeof window !== "undefined" && window.localStorage;

export const getMenuSettings = () => {
  if (!canUseStorage()) {
    return DEFAULT_MENU_SETTINGS;
  }

  try {
    const saved = window.localStorage.getItem(MENU_SETTINGS_KEY);
    return saved ? { ...DEFAULT_MENU_SETTINGS, ...JSON.parse(saved) } : DEFAULT_MENU_SETTINGS;
  } catch (error) {
    console.error("Không thể đọc cài đặt giao diện menu:", error);
    return DEFAULT_MENU_SETTINGS;
  }
};

export const saveMenuSettings = (settings) => {
  if (!canUseStorage()) {
    return DEFAULT_MENU_SETTINGS;
  }

  const nextSettings = { ...DEFAULT_MENU_SETTINGS, ...settings };
  window.localStorage.setItem(MENU_SETTINGS_KEY, JSON.stringify(nextSettings));
  window.dispatchEvent(new CustomEvent(MENU_SETTINGS_EVENT, { detail: nextSettings }));
  return nextSettings;
};
