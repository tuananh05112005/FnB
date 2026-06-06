import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

// Khởi tạo Context cho hộp thoại chat Gemini
const GeminiChatContext = createContext();

/**
 * Bộ cung cấp (Provider) quản lý lịch sử chat và xử lý gửi tin nhắn.
 * Lưu trữ lịch sử chat trong localStorage với khóa 'geminiChatHistory'.
 */
export const GeminiChatProvider = ({ children }) => {
  const [messages, setMessages] = useState(() => {
    try {
      const stored = localStorage.getItem('geminiChatHistory');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Tự động lưu lịch sử chat vào localStorage mỗi khi danh sách tin nhắn thay đổi
  useEffect(() => {
    try {
      localStorage.setItem('geminiChatHistory', JSON.stringify(messages));
    } catch {}
  }, [messages]);

  const sendMessage = async (text) => {
    if (!text) return;
    const userMsg = { from: 'user', text };
    setMessages((prev) => [...prev, userMsg]);
    try {
      const res = await axios.post('http://localhost:5000/api/ai/chat', {
        message: text,
        userId: 1,
      });
      const botMsg = { from: 'bot', text: res.data.reply || '' };
      setMessages((prev) => [...prev, botMsg]);
    } catch (e) {
      const errMsg = { from: 'bot', text: 'Có lỗi khi gọi Gemini. Vui lòng thử lại.' };
      setMessages((prev) => [...prev, errMsg]);
    }
  };

  return (
    <GeminiChatContext.Provider value={{ messages, sendMessage }}>
      {children}
    </GeminiChatContext.Provider>
  );
};

// Hook tiện ích để sử dụng nhanh chat context từ các component con
export const useGeminiChat = () => useContext(GeminiChatContext);
