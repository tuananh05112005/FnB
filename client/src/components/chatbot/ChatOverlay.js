// ==============================================================
// TÊN FILE: ChatOverlay.jsx
// MÔ TẢ: Hợp phần giao diện cửa sổ Chatbot AI đè trên màn hình (Chat Overlay).
//        - Sử dụng React Portal để hiển thị ngoài cây DOM chính (trong document.body).
//        - Cung cấp giao diện 2 cột: Cột bên trái hiển thị lịch sử chat và nút thêm/xóa cuộc trò chuyện;
//          Cột bên phải hiển thị cửa sổ chat với các bóng tin nhắn (User và Bot) và khung nhập tin nhắn.
//        - Tự động sinh hội thoại tư vấn sản phẩm chuyên biệt nếu được mở từ trang chi tiết sản phẩm.
// ==============================================================

import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { FaPaperPlane, FaTimes, FaPlus, FaTrash, FaBars } from 'react-icons/fa';
import './../../styles/geminiChat.css';
import aiService from '../../services/aiService';
import { getUserId } from '../../lib/session';

/**
 * ChatOverlay: Giao diện khung Chatbot phong cách ChatGPT
 * - Kết nối trực tiếp tới backend thông qua aiService
 */
const ChatOverlay = ({ onClose, product }) => {
  const userIdRaw = getUserId();
  const userId = userIdRaw ? Number(userIdRaw) : 1;
  const [conversations, setConversations] = useState([]);
  const [conversationId, setConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isInitializingNewConv, setIsInitializingNewConv] = useState(!!product);
  const [showSidebar, setShowSidebar] = useState(false);
  const bottomRef = useRef(null);

  // So khớp mã sản phẩm từ đường dẫn URL hiện tại
  const productIdMatch = window.location.pathname.match(/\/products\/(\d+)/);
  const productId = productIdMatch ? productIdMatch[1] : null;

  // Tạo mới một cuộc hội thoại chat AI
  const createConversation = async (customTitle) => {
    try {
      const title = (typeof customTitle === 'string' ? customTitle : null) || (productId ? `Chat sản phẩm ${productId}` : 'Cuộc trò chuyện mới');
      const result = await aiService.createConversation(userId, title);
      const newId = result.conversationId;
      await fetchConversations(); // Tải lại danh sách cuộc trò chuyện và tự động chọn cuộc trò chuyện mới
      setConversationId(newId);
    } catch (err) {
      console.error('Failed to create conversation', err);
    }
  };

  // Nút tạo cuộc trò chuyện mới từ thanh sidebar
  const handleNewConversation = async () => {
    setIsInitializingNewConv(true);
    await createConversation();
    setShowSidebar(false);
  };

  // Tải danh sách tin nhắn cũ của cuộc hội thoại
  const fetchMessages = async (convId) => {
    try {
      const msgs = await aiService.getMessages(convId);
      setMessages(msgs.map(m => ({
        id: m.id,
        from: m.role === 'assistant' ? 'bot' : 'user',
        text: m.content,
      })));
    } catch (err) {
      console.error('Failed to fetch messages', err);
    }
  };

  // Tải toàn bộ danh sách các cuộc trò chuyện của User hiện tại
  const fetchConversations = async () => {
    try {
      const convs = await aiService.getConversations(userId);
      setConversations(convs);
    } catch (err) {
      console.error('Failed to fetch conversations', err);
    }
  };

  // Tải danh sách cuộc trò chuyện khi component được khởi tạo
  useEffect(() => {
    fetchConversations();
  }, [userId]);

  // Xử lý gửi tin nhắn từ người dùng
  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const text = input.trim();

    if (!conversationId) {
      // Tự động tạo cuộc trò chuyện mới nếu chưa chọn cuộc trò chuyện nào
      try {
        const result = await aiService.createConversation(userId, 'Cuộc trò chuyện mới');
        const newId = result.conversationId;
        await fetchConversations();
        setConversationId(newId);
        await doSend(newId, text);
      } catch (err) {
        console.error('Failed to auto-create conversation', err);
      }
      return;
    }
    await doSend(conversationId, text);
  };

  // Xóa cuộc trò chuyện hiện tại
  const handleDeleteConversation = async (e, convId) => {
    e.stopPropagation();
    if (!window.confirm('Bạn có chắc muốn xoá cuộc trò chuyện này?')) return;
    try {
      await aiService.deleteConversation(convId);
      await fetchConversations();
      if (conversationId === convId) setConversationId(null);
    } catch (err) {
      console.error('Failed to delete conversation', err);
    }
  };

  // Thực hiện gọi API gửi tin nhắn tới AI và nhận câu trả lời
  const doSend = async (convId, text) => {
    const userMsg = { id: Date.now(), from: 'user', text };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    try {
      const reply = await aiService.sendMessage(userId, convId, text);
      const botMsg = { id: Date.now() + 1, from: 'bot', text: reply.reply };
      setMessages(prev => [...prev, botMsg]);
    } catch (err) {
      console.error('AI error', err);
      const errMsg = { id: Date.now() + 1, from: 'bot', text: '❌ Lỗi khi nhận phản hồi từ AI.' };
      setMessages(prev => [...prev, errMsg]);
    } finally {
      setLoading(false);
    }
  };

  // Bắt sự kiện gõ phím Enter (không đính kèm Shift) để gửi tin nhanh
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Tự động kích hoạt cuộc hội thoại tư vấn nếu có truyền thông tin sản phẩm (mở từ trang chi tiết)
  useEffect(() => {
    if (product && conversationId === null) {
      const handleProductConsultation = async () => {
        try {
          const title = `Tư vấn: ${product.name}`;
          const result = await aiService.createConversation(userId, title);
          const newId = result.conversationId;
          await fetchConversations();
          setConversationId(newId);
          
          // Gửi tin nhắn khởi tạo chứa nội dung tư vấn sản phẩm
          const initialText = `Tôi muốn được tư vấn về món ${product.name}. Giá của món này là ${product.price}đ. Món này hương vị thế nào và có gì đặc biệt?`;
          await doSend(newId, initialText);
        } catch (err) {
          console.error('Failed to start product consultation', err);
        }
      };
      handleProductConsultation();
    }
  }, [product, conversationId]);

  // Tải lại các tin nhắn khi người dùng chuyển đổi cuộc hội thoại trên sidebar
  useEffect(() => {
    if (conversationId) {
      if (isInitializingNewConv) {
        setIsInitializingNewConv(false);
      } else {
        fetchMessages(conversationId);
      }
    } else {
      setMessages([]);
    }
  }, [conversationId]);

  // Cuộn xuống dòng tin nhắn dưới cùng khi danh sách tin nhắn thay đổi
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Định dạng ngày hiển thị rút gọn (ví dụ: 06/06)
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
  };

  return createPortal(
    <div className="gc-backdrop" onClick={onClose}>
      <div className="gc-modal" onClick={e => e.stopPropagation()}>
        <div className={`gc-sidebar-overlay ${showSidebar ? 'show' : ''}`} onClick={() => setShowSidebar(false)} />

        {/* ── LEFT SIDEBAR ── */}
        <aside className={`gc-sidebar ${showSidebar ? 'show' : ''}`}>
          <div className="gc-sidebar-header">
            <span className="gc-sidebar-title">💬 Lịch sử chat</span>
            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
              <button className="gc-new-btn" onClick={handleNewConversation} title="Tạo cuộc trò chuyện mới">
                <FaPlus size={12} /> Mới
              </button>
              <button className="gc-close-sidebar-btn" onClick={() => setShowSidebar(false)} aria-label="Đóng lịch sử">
                <FaTimes size={12} />
              </button>
            </div>
          </div>

          <ul className="gc-conv-list">
            {conversations.length === 0 && (
              <li className="gc-conv-empty">Chưa có cuộc trò chuyện nào</li>
            )}
            {conversations.map(conv => (
              <li
                key={conv.id}
                className={`gc-conv-item ${conv.id === conversationId ? 'active' : ''}`}
                onClick={() => {
                  setConversationId(conv.id);
                  setShowSidebar(false);
                }}
              >
                <div className="gc-conv-title">{conv.title || 'Cuộc trò chuyện'}</div>
                <div className="gc-conv-date">{formatDate(conv.created_at)}</div>
                <button className="gc-delete-btn" onClick={(e) => handleDeleteConversation(e, conv.id)} title="Xóa cuộc trò chuyện">
                  <FaTrash size={12} />
                </button>
              </li>
            ))}
          </ul>
        </aside>

        {/* ── RIGHT: CHAT AREA ── */}
        <div className="gc-chat-area">

          {/* Header */}
          <div className="gc-header">
            <div className="gc-header-left">
              <button className="gc-toggle-sidebar-btn" onClick={() => setShowSidebar(true)} aria-label="Lịch sử chat">
                <FaBars />
              </button>
              <div className="gemini-avatar gemini-avatar--bot">🍵</div>
              <span className="gc-header-title">Happy Tea Chat</span>
            </div>
            <button className="gc-close-btn" onClick={onClose} aria-label="Đóng chat">
              <FaTimes />
            </button>
          </div>

          {/* Messages */}
          <ul className="gc-messages">
            {!conversationId && messages.length === 0 && (
              <li className="gc-empty-msg">
                <p>Chọn cuộc trò chuyện hoặc nhấn <strong>"+ Mới"</strong> để bắt đầu 🍵</p>
              </li>
            )}
            {messages.map((msg) => (
              <li key={msg.id} className={`gc-msg-row ${msg.from}`}>
                {msg.from === 'bot' && (
                  <div className="gemini-avatar gemini-avatar--bot">🍵</div>
                )}
                <div className={`gc-bubble ${msg.from}`}>
                  {msg.text.replace(/\*/g, '')}
                </div>
                {msg.from === 'user' && (
                  <div className="gemini-avatar gemini-avatar--user">👤</div>
                )}
              </li>
            ))}

            {loading && (
              <li className="gc-msg-row bot">
                <div className="gemini-avatar gemini-avatar--bot">🍵</div>
                <div className="gc-bubble bot gc-loading">
                  <span className="gc-dot" />
                  <span className="gc-dot" />
                  <span className="gc-dot" />
                </div>
              </li>
            )}
            <div ref={bottomRef} />
          </ul>

          {/* Input */}
          <div className="gc-input-wrap">
            <textarea
              className="gc-input"
              placeholder="Nhập tin nhắn... (Enter để gửi, Shift+Enter xuống dòng)"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
              disabled={loading}
            />
            <button
              className="gc-send-btn"
              onClick={handleSend}
              disabled={loading || !input.trim()}
              aria-label="Gửi"
            >
              <FaPaperPlane />
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ChatOverlay;
