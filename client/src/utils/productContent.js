// ==============================================================
// TÊN FILE: productContent.js
// MÔ TẢ: File tiện ích tạo mô tả tự động cho món ăn/đồ uống dựa trên tên sản phẩm.
//        Chứa bảng từ khóa phân loại (trà sữa, cà phê, nước ép, cacao...)
//        và các hàm chuẩn hóa chữ tiếng Việt để so khớp chính xác.
// ==============================================================

// Cấu hình quy tắc sinh mô tả tự động dựa trên từ khóa trong tên món
const PRODUCT_DESCRIPTION_RULES = [
  {
    keywords: ["tra sua", "milk tea"],
    description: (name) =>
      `${name} có vị béo nhẹ, hương trà thơm và hậu vị ngọt dịu, phù hợp để thưởng thức mỗi ngày.`,
  },
  {
    keywords: ["ca phe", "coffee", "cafe"],
    description: (name) =>
      `${name} đậm vị, thơm nồng mùi cà phê và có độ ngọt cân bằng, dành cho những ai thích hương vị tỉnh táo.`,
  },
  {
    keywords: ["sinh to", "smoothie"],
    description: (name) =>
      `${name} mềm mịn, mát lạnh và đầy hương trái cây, phù hợp cho những ngày cần một món uống tươi mới.`,
  },
  {
    keywords: ["nuoc ep", "juice"],
    description: (name) =>
      `${name} tươi mát, thanh nhẹ và giữ được vị trái cây tự nhiên, dễ uống vào bất kỳ thời điểm nào.`,
  },
  {
    keywords: ["cacao", "cocoa"],
    description: (name) =>
      `${name} có vị cacao thơm béo, ngọt vừa phải và hậu vị ấm, rất hợp để thưởng thức cùng đá hoặc kem sữa.`,
  },
  {
    keywords: ["matcha"],
    description: (name) =>
      `${name} mang hương matcha thanh mát, béo nhẹ và có vị đắng dịu đặc trưng, phù hợp với người thích vị trà xanh.`,
  },
  {
    keywords: ["banh", "cake", "pancake", "waffle"],
    description: (name) =>
      `${name} có kết cấu mềm ngon, hương vị hấp dẫn và phù hợp dùng kèm với đồ uống yêu thích.`,
  },
  {
    keywords: ["kem", "ice cream"],
    description: (name) =>
      `${name} mát lạnh, béo mịn và có vị ngọt dịu, là lựa chọn phù hợp để thưởng thức sau bữa ăn hoặc lúc giải nhiệt.`,
  },
];

// Hàm tiện ích: Loại bỏ dấu tiếng Việt và chuẩn hóa về dạng chữ thường không dấu
export const normalizeProductText = (value = "") =>
  String(value)
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d");

/**
 * buildProductDescription: Tự động sinh chuỗi mô tả sản phẩm dựa trên tên món.
 * Dùng khi Admin tạo món mới nhưng để trống phần mô tả sản phẩm.
 */
export const buildProductDescription = (name = "") => {
  const productName = String(name || "").trim();

  if (!productName) {
    return "";
  }

  const normalizedName = normalizeProductText(productName);

  const matchedRule = PRODUCT_DESCRIPTION_RULES.find((rule) =>
    rule.keywords.some((keyword) =>
      normalizedName.includes(normalizeProductText(keyword))
    )
  );

  if (matchedRule) {
    return matchedRule.description(productName);
  }

  // Fallback mô tả mặc định nếu không khớp từ khóa nào ở trên
  return `${productName} được chọn lọc với hương vị dễ thưởng thức, phù hợp cho những ai muốn một món ngon chất lượng và dễ uống.`;
};

// Lấy nhãn gợi ý alt của ảnh Pexels
export const getImageNameSuggestion = (image) =>
  String(image?.alt || "").trim();