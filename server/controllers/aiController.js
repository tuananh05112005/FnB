// ==============================================================
// TÊN FILE: aiController.js
// MÔ TẢ: Bộ điều khiển xử lý logic chatbot tư vấn thông minh (FnB AI Assistant).
//        - Sử dụng thư viện @google/generative-ai (Gemini 2.5 Flash).
//        - Tự động truy vấn và nhúng dữ liệu thực tế từ Database bao gồm:
//          + Menu sản phẩm hiện tại (`products`).
//          + Lịch sử đặt hàng của khách (`payments` join `products`).
//          + Danh sách mã giảm giá khuyến mãi (`vouchers`).
//          + Sở thích ăn uống/ghi chú của khách hàng (`user_preferences`).
//          + Phương thức thanh toán được hỗ trợ (`payments`).
//          + Lịch sử chat trước đó trong cuộc hội thoại (`messages`).
//        - Lưu trữ tin nhắn mới của người dùng và phản hồi của AI vào DB.
// ==============================================================

const { GoogleGenerativeAI } = require("@google/generative-ai");
const { getQuery } = require("../config/db");

// Khởi tạo thực thể Google Generative AI với khóa API từ biến môi trường
const genAI = new GoogleGenerativeAI(
  process.env.GEMINI_API_KEY
);

// Xử lý chat AI: gom menu, lịch sử, voucher, sở thích để tạo prompt và gửi cho Gemini
exports.chat = async (req, res) => {
  console.log("CHAT API CALLED");

  try {
    const { message, userId, conversationId } = req.body;
    const query = getQuery();

    // 1. Lấy danh sách sản phẩm đang mở bán (is_available = 1)
    const products = await query(`
      SELECT id, name, category, price, description
      FROM products
      WHERE is_available = 1
    `);

    // 2. Lấy lịch sử 10 món mua gần đây nhất của khách hàng
    const orders = await query(`
      SELECT p.name
      FROM payments pay
      JOIN products p ON pay.product_id = p.id
      WHERE pay.user_id = ?
      ORDER BY pay.id DESC
      LIMIT 10
    `, [userId]);

    // 3. Lấy danh sách mã giảm giá khuyến mãi
    const vouchers = await query(`
      SELECT code, discount_type
      FROM vouchers
    `);

    // 4. Lấy cấu hình sở thích cá nhân hóa của khách hàng
    const preferences = await query(`
      SELECT *
      FROM user_preferences
      WHERE user_id = ?
    `, [userId]);

    // 5. Lấy danh sách các phương thức thanh toán có trên hệ thống
    const payments = await query(`
        SELECT DISTINCT payment_method
        FROM payments
        `);

    // 6. Lấy 30 tin nhắn cũ nhất trong cuộc hội thoại hiện tại để làm ngữ cảnh hội thoại
    const messages = await query(`
        SELECT role, content
        FROM messages
        WHERE conversation_id = ?
        ORDER BY created_at ASC
        LIMIT 30
        `, [conversationId]);


    console.log("========== DEBUG ==========");
    console.log("User message:", message);
    console.log("Products count:", products.length);
    console.log(products.slice(0, 5));
    console.log("Orders count:", orders.length);
    console.log(orders);
    console.log("Vouchers count:", vouchers.length);
    console.log(vouchers);
    console.log("Preferences count:", preferences.length);
    console.log(preferences);

    // 7. Tạo Prompt kết hợp đầy đủ dữ liệu thực tế từ Database để tránh hiện tượng AI ảo tưởng (Hallucination)
    const prompt = `
Bạn là trợ lý bán hàng của Tiệm Trà Happy.

QUAN TRỌNG:
- Luôn ưu tiên trả lời bằng dữ liệu MENU bên dưới.
- Không được trả lời chung chung.
- Nếu khách hỏi món nào đang bán thì phải đọc MENU.
- Nếu khách hỏi trà trái cây thì chỉ liệt kê sản phẩm thuộc danh mục trà trái cây.
- Phương thức thanh toán 
- Nếu khách hỏi cà phê thì chỉ liệt kê cà phê.
- Nếu không tìm thấy sản phẩm thì mới xin thêm thông tin.

Menu:
${JSON.stringify(products)}

Voucher:
${JSON.stringify(vouchers)}

Lịch sử mua hàng:
${JSON.stringify(orders)}

Sở thích khách hàng:
${JSON.stringify(preferences)}

Phương thức thanh toán:
${JSON.stringify(payments)}

Lịch sử chat:
${JSON.stringify(messages)}

Tin nhắn khách:
${message}

Hãy trả lời ngắn gọn, thân thiện và hữu ích.
`;

console.log("========== PROMPT ==========");
console.log(prompt.substring(0, 2000));

    // Khởi tạo model Gemini 2.5 Flash
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
    });

    // Gọi Gemini API để sinh câu trả lời
    const result = await model.generateContent(prompt);
    const reply = result.response.text();

      // 8. Lưu tin nhắn người dùng và phản hồi của AI vào bảng messages của cuộc trò chuyện hiện tại
      const insertMsg = async (role, content) => {
        await query(`
          INSERT INTO messages (conversation_id, role, content)
          VALUES (?, ?, ?)
        `, [conversationId, role, content]);
      };
      await insertMsg('user', message);
      await insertMsg('assistant', reply);
      
      // Trả kết quả về cho Client
      res.json({
        success: true,
        reply,
      });

  } catch (error) {
    console.error("Lỗi khi gọi Gemini API:", error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
