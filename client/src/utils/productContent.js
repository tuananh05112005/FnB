const PRODUCT_DESCRIPTION_RULES = [
  {
    keywords: ["tra sua", "milk tea"],
    description: (name) => `${name} co vi beo nhe, huong tra thom va hau vi ngot diu, phu hop de thuong thuc moi ngay.`,
  },
  {
    keywords: ["ca phe", "coffee", "cafe"],
    description: (name) => `${name} dam vi, thom nong mui ca phe va co do ngot can bang, danh cho nhung ai thich huong vi tinh tao.`,
  },
  {
    keywords: ["sinh to", "smoothie"],
    description: (name) => `${name} mem min, mat lanh va day huong trai cay, phu hop cho nhung ngay can mot mon uong tuoi moi.`,
  },
  {
    keywords: ["nuoc ep", "juice"],
    description: (name) => `${name} tuoi mat, thanh nhe va giu duoc vi trai cay tu nhien, de uong vao bat ky thoi diem nao.`,
  },
  {
    keywords: ["cacao", "cocoa"],
    description: (name) => `${name} co vi cacao thom be, ngot vua phai va hau vi am, rat hop de thuong thuc cung da hoac kem sua.`,
  },
  {
    keywords: ["matcha"],
    description: (name) => `${name} mang huong matcha thanh mat, be nhe va co vi dang diu dac trung, phu hop voi nguoi thich vi tra xanh.`,
  },
  {
    keywords: ["banh", "cake", "pancake", "waffle"],
    description: (name) => `${name} co ket cau mem ngon, huong vi hap dan va phu hop dung kem voi do uong yeu thich.`,
  },
  {
    keywords: ["kem", "ice cream"],
    description: (name) => `${name} mat lanh, beo min va co vi ngot diu, la lua chon de thuong thuc sau bua an hoac luc giai nhiet.`,
  },
];

export const normalizeProductText = (value = "") =>
  String(value)
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d");

export const buildProductDescription = (name = "") => {
  const productName = String(name || "").trim();

  if (!productName) {
    return "";
  }

  const normalizedName = normalizeProductText(productName);
  const matchedRule = PRODUCT_DESCRIPTION_RULES.find((rule) =>
    rule.keywords.some((keyword) => normalizedName.includes(normalizeProductText(keyword)))
  );

  if (matchedRule) {
    return matchedRule.description(productName);
  }

  return `${productName} duoc chon loc voi huong vi de thuong thuc, phu hop cho nhung ai muon mot mon ngon chat luong va de uong.`;
};

export const getImageNameSuggestion = (image) =>
  String(image?.alt || "").trim();
