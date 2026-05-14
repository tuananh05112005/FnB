import { useEffect, useState } from "react";
import { fetchCategorySettings } from "../lib/categorySettings";
import { onCategorySettingsUpdated, offCategorySettingsUpdated } from "../lib/socket";

export const useCategorySettings = () => {
  // undefined => đang tải, sẽ được thay thế bằng object khi có dữ liệu
  const [categorySettings, setCategorySettings] = useState(undefined);

  // 1️⃣ Load lần đầu từ server
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const data = await fetchCategorySettings();
      if (!cancelled) setCategorySettings(data);
    };
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  // 2️⃣ Lắng nghe WebSocket để cập nhật real‑time
  useEffect(() => {
    const handler = (data) => setCategorySettings(data);
    onCategorySettingsUpdated(handler);
    return () => offCategorySettingsUpdated(handler);
  }, []);

  return categorySettings;
};
