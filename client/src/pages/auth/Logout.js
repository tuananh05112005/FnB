import React, { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { clearSession } from "../../lib/session";
import { auth } from "../../config/firebase";

const Logout = () => {
  const navigate = useNavigate();
  const hasLoggedOut = useRef(false);

  useEffect(() => {
    if (hasLoggedOut.current) return;
    hasLoggedOut.current = true;

    const confirmLogout = window.confirm("Bạn có chắc chắn muốn đăng xuất?");
    if (confirmLogout) {
      // 1. Clear local storage session (token, role, user_id, name)
      clearSession();

      // 2. Sign out from Firebase Authentication if active
      auth.signOut()
        .then(() => {
          alert("Đăng xuất thành công!");
          navigate("/login");
        })
        .catch((err) => {
          console.error("Firebase sign out error:", err);
          alert("Đăng xuất thành công!");
          navigate("/login");
        });
    } else {
      // If cancelled, navigate back to previous page
      navigate(-1);
    }
  }, [navigate]);

  return (
    <div style={{
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      height: "100vh",
      background: "var(--color-bg)",
      color: "var(--color-text-muted)",
      fontFamily: "var(--app-font-sans)",
      fontWeight: 600,
    }}>
      <p>⏳ Đang xử lý đăng xuất...</p>
    </div>
  );
};

export default Logout;