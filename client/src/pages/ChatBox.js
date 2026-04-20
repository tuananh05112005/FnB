// src/ChatBox.js
import React from "react";
import { Chatbot } from "react-chatbot-kit";
import "react-chatbot-kit/build/main.css";
import { config } from "../config/config.js"; // Import cấu hình

const ChatBox = () => {
  return (
    <div style={{ position: "fixed", bottom: "20px", right: "20px" }}>
      <Chatbot config={config} />
    </div>
  );
};

export default ChatBox;