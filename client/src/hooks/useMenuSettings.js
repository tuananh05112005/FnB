import { useEffect, useState } from "react";

import { getMenuSettings, MENU_SETTINGS_EVENT } from "../lib/menuSettings";

export const useMenuSettings = () => {
  const [menuSettings, setMenuSettings] = useState(getMenuSettings);

  useEffect(() => {
    const syncSettings = (event) => {
      setMenuSettings(event.detail || getMenuSettings());
    };

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
