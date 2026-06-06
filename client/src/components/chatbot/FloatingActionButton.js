import React from 'react';
import { FaRegComment } from 'react-icons/fa';
import '../../styles/geminiChat.css';

/**
 * Nút nổi hành động (Floating Action Button) dùng để bật/tắt cửa sổ chat Gemini.
 * Thuộc tính (Props):
 *   onClick: Hàm callback được gọi khi người dùng nhấn vào nút.
 */
const FloatingActionButton = ({ onClick }) => {
  return (
    <button
      className="gemini-fab"
      aria-label="Mở chatbot Gemini"
      onClick={onClick}
    >
      <FaRegComment size={24} />
    </button>
  );
};

export default FloatingActionButton;
