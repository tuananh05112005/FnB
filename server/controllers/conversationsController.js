// ==============================================================
// TÊN FILE: conversationsController.js
// MÔ TẢ: Bộ điều khiển xử lý các cuộc hội thoại chatbot AI của người dùng.
//        - Tạo cuộc hội thoại tư vấn mới.
//        - Lấy danh sách các cuộc hội thoại của một người dùng cụ thể.
//        - Lấy toàn bộ tin nhắn thuộc một cuộc hội thoại.
//        - Xóa cuộc hội thoại và toàn bộ tin nhắn liên quan (dọn dẹp bộ nhớ).
// ==============================================================

const { getQuery } = require("../config/db");

// Tạo cuộc hội thoại chat AI mới cho người dùng
exports.createConversations= async (req, res) => {
    try {
    const { userId } = req.body;
    const query = getQuery();
    // Chèn dòng mới vào bảng conversations với tiêu đề mặc định
    const result = await query(
        `
        INSERT INTO conversations (user_id, title) VALUES (?, ?)
        `,
        [userId, "Cuộc trò chuyện mới"]
    );
    res.json({
        success: true,
        conversationId: result.insertId, // Trả lại ID cuộc trò chuyện vừa tạo
    });
} catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Lỗi server" });
}
};

// Lấy danh sách các cuộc hội thoại của một người dùng sắp xếp theo thứ tự mới nhất
exports.getConversations = async (req, res) => {
    try {
        const query = getQuery();

        const rows = await query(
            `SELECT * FROM conversations WHERE user_id = ? ORDER BY created_at DESC`,
            [req.params.userId]
        );
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Lỗi server" });
    }
}

// Lấy danh sách toàn bộ các tin nhắn trong một cuộc hội thoại cụ thể (sắp xếp tăng dần theo thời gian)
exports.getMessages = async (req, res) => {
    try {
        const query = getQuery();
        
        const rows = await query(
            `SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at ASC`,
            [req.params.conversationId]
        );
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Lỗi server" });
    }
}

// Xóa cuộc hội thoại và xóa các tin nhắn liên đới thuộc cuộc hội thoại đó
exports.deleteConversation = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const query = getQuery();
    
    // Bước 1: Xóa các tin nhắn liên quan trong bảng messages trước (tránh lỗi khóa ngoại)
    await query(`DELETE FROM messages WHERE conversation_id = ?`, [conversationId]);
    
    // Bước 2: Xóa chính cuộc hội thoại trong bảng conversations
    const result = await query(`DELETE FROM conversations WHERE id = ?`, [conversationId]);
    res.json({ success: true, affectedRows: result.affectedRows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
};
