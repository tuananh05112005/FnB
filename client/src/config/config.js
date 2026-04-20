// // src/config.js
// export const config = {
//     initialMessages: [
//       {
//         id: 1,
//         message: "Xin chào! Tôi có thể giúp gì cho bạn?",
//         type: "text",
//       },
//     ],
//     botName: "Trợ lý ảo",
//     customStyles: {
//       botMessageBox: {
//         backgroundColor: "#007bff",
//       },
//       chatButton: {
//         backgroundColor: "#007bff",
//       },
//     },
//     actionProvider: {
//       handleUserInput: (message) => {
//         // Xử lý tin nhắn từ người dùng
//         if (message.toLowerCase().includes("giá")) {
//           return "Bạn muốn hỏi về giá sản phẩm nào?";
//         } else if (message.toLowerCase().includes("giỏ hàng")) {
//           return "Bạn có thể xem giỏ hàng của mình tại đây.";
//         } else {
//           return "Xin lỗi, tôi không hiểu. Bạn có thể hỏi lại không?";
//         }
//       },
//     },
//   };