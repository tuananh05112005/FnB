import React, { useState, useEffect } from "react";
import { Coffee, RefreshCw } from "lucide-react";

export default function ServerWarmupAlert() {
  const [show, setShow] = useState(false);
  const [seconds, setSeconds] = useState(25);

  useEffect(() => {
    const handleColdStart = (e) => {
      setShow(e.detail.isSlow);
      if (e.detail.isSlow) {
        setSeconds(25);
      }
    };

    window.addEventListener("server-cold-start", handleColdStart);
    return () => window.removeEventListener("server-cold-start", handleColdStart);
  }, []);

  useEffect(() => {
    let interval = null;
    if (show && seconds > 0) {
      interval = setInterval(() => {
        setSeconds((prev) => Math.max(0, prev - 1));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [show, seconds]);

  if (!show) return null;

  return (
    <div style={{
      position: "fixed",
      bottom: "24px",
      right: "24px",
      zIndex: 9999,
      maxWidth: "380px",
      background: "#1C120C",
      color: "#FFFDF9",
      padding: "16px 20px",
      borderRadius: "16px",
      boxShadow: "0 12px 36px rgba(0, 0, 0, 0.35)",
      border: "1px solid rgba(245, 200, 66, 0.3)",
      display: "flex",
      alignItems: "flex-start",
      gap: "14px",
      animation: "fadeInUp 0.3s ease"
    }}>
      <div style={{
        width: "36px",
        height: "36px",
        borderRadius: "50%",
        background: "rgba(200, 134, 10, 0.2)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#F5C842",
        flexShrink: 0
      }}>
        <Coffee size={20} />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "4px" }}>
          <h4 style={{ margin: 0, fontSize: "0.9rem", fontWeight: 700, color: "#F5C842" }}>Đang kết nối máy chủ...</h4>
          <span style={{ fontSize: "0.75rem", opacity: 0.8 }}>{seconds}s</span>
        </div>
        <p style={{ margin: 0, fontSize: "0.8rem", color: "rgba(255, 255, 255, 0.75)", lineHeight: 1.4 }}>
          Máy chủ đám mây đang thức giấc sau thời gian nghỉ. Dữ liệu sẽ xuất hiện ngay!
        </p>
      </div>
    </div>
  );
}