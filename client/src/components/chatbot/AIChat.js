// ==============================================================
// TÊN FILE: AIChat.js
// MÔ TẢ: Hợp phần giao diện trò chuyện AI đơn giản (Bản thử nghiệm ban đầu).
//        Cung cấp một hộp nhập liệu và nút bấm gửi tin nhắn thô tới API chat AI.
// ==============================================================

import { useState } from "react";
import axios from "axios";

const AIChat = () => {
  const [message, setMessage] = useState("");
  const [reply, setReply] = useState("");

  // Gửi tin nhắn thô lên API chat AI của server
  const sendMessage = async () => {
    const res = await axios.post(
      "http://localhost:5000/api/ai/chat",
      {
        message,
        userId: 1,
      }
    );

    setReply(res.data.reply);
  };

  return (
    <div>
      <h2>FnB AI Assistant</h2>

      <input
        value={message}
        onChange={(e) => setMessage(e.target.value)}
      />

      <button onClick={sendMessage}>
        Gửi
      </button>

      <p>{reply}</p>
    </div>
  );
};

export default AIChat;
