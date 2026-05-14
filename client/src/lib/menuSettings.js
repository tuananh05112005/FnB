const MENU_SETTINGS_KEY = "menu_display_settings";
export const MENU_SETTINGS_EVENT = "menu-settings-updated";

export const DEFAULT_MENU_SETTINGS = {
  storeName: "Tiệm trà happy",
  topbarName: "TeaShop",
  menuTitle: "Danh sách sản phẩm",
  menuSubtitle: "Duyệt menu, tìm nhanh sản phẩm và quản lý đơn giản hơn.",
  bannerImage: "",
};

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
