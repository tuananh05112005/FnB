// ==============================================================
// TÊN FILE: aiService.js
// MÔ TẢ: Cung cấp các hàm dịch vụ gọi API liên quan đến hệ thống Chatbot AI.
//        Bao gồm tạo mới cuộc hội thoại, lấy danh sách cuộc hội thoại của user,
//        tải tin nhắn cũ, gửi tin nhắn mới cho AI và xóa cuộc hội thoại.
// ==============================================================

import { api } from '../lib/api';
import { getUserId } from '../lib/session';

const aiService = {
  // POST /api/conversations
  async createConversation(userId, title) {
    const res = await api.post('/api/conversations/', { userId, title });
    return res.data; // { success, conversationId }
  },

  // GET /api/conversations/user/:userId
  async getConversations(userId) {
    const res = await api.get(`/api/conversations/${userId}`);
    return res.data; // array
  },

  // GET /api/conversations/:conversationId/messages
  async getMessages(conversationId) {
    const res = await api.get(`/api/conversations/messages/${conversationId}`);
    return res.data; // array
  },

  // POST /api/ai/chat
  async sendMessage(userId, conversationId, message) {
    const res = await api.post('/api/ai/chat', { userId, conversationId, message });
    return res.data; // { success, reply }
  },
  // DELETE /api/conversations/:conversationId
  async deleteConversation(conversationId) {
    const res = await api.delete(`/api/conversations/${conversationId}`);
    return res.data; // { success, affectedRows }
  },
};

export default aiService;
