const SESSION_KEYS = {
  token: "token",
  role: "role",
  userId: "user_id",
  name: "name",
};

const safeStorage = () => {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage;
};

export const getToken = () => safeStorage()?.getItem(SESSION_KEYS.token) || "";
export const getRole = () => safeStorage()?.getItem(SESSION_KEYS.role) || "";
export const getUserId = () => safeStorage()?.getItem(SESSION_KEYS.userId) || "";
export const getUserName = () => safeStorage()?.getItem(SESSION_KEYS.name) || "";

export const isAuthenticated = () => Boolean(getToken());

export const getSession = () => ({
  token: getToken(),
  role: getRole(),
  userId: getUserId(),
  name: getUserName(),
});

export const saveSession = ({ token, role, userId, name }) => {
  const storage = safeStorage();

  if (!storage) {
    return;
  }

  if (token) storage.setItem(SESSION_KEYS.token, token);
  if (role) storage.setItem(SESSION_KEYS.role, role);
  if (userId) storage.setItem(SESSION_KEYS.userId, userId);
  if (name) storage.setItem(SESSION_KEYS.name, name);
};

export const clearSession = () => {
  const storage = safeStorage();

  if (!storage) {
    return;
  }

  Object.values(SESSION_KEYS).forEach((key) => storage.removeItem(key));
};

export const decodeTokenPayload = (token = getToken()) => {
  if (!token) {
    return null;
  }

  try {
    const [, payload] = token.split(".");

    if (!payload) {
      return null;
    }

    return JSON.parse(atob(payload));
  } catch (error) {
    console.error("Failed to decode token payload:", error);
    return null;
  }
};
