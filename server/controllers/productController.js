// controllers/productController.js
const { getDB, getQuery } = require("../config/db");

const FOOD_IMAGE_QUERY_MAP = [
  ["tra sua", "milk tea"],
  ["trà sữa", "milk tea"],
  ["ca phe", "iced coffee"],
  ["cà phê", "iced coffee"],
  ["cafe", "iced coffee"],
  ["sinh to", "smoothie drink"],
  ["sinh tố", "smoothie drink"],
  ["nuoc ep", "fruit juice"],
  ["nước ép", "fruit juice"],
  ["cacao", "cocoa drink"],
  ["matcha", "matcha latte"],
  ["kem", "ice cream dessert"],
  ["banh", "cake dessert"],
  ["bánh", "cake dessert"],
  ["pancake", "pancake dessert"],
  ["waffle", "waffle dessert"],
];

function normalizeQuery(value = "") {
  return String(value)
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d");
}

function buildPexelsQuery(query) {
  const normalized = normalizeQuery(query);
  const matched = FOOD_IMAGE_QUERY_MAP.find(([keyword]) => normalized.includes(normalizeQuery(keyword)));
  return matched ? matched[1] : `${query} food drink`;
}

exports.searchImages = async (req, res) => {
  const apiKey = process.env.PEXELS_API_KEY;
  const rawQuery = String(req.query.query || "").trim();

  if (!apiKey) {
    return res.status(500).json({ message: "Chua cau hinh PEXELS_API_KEY trong server .env" });
  }

  if (!rawQuery) {
    return res.status(400).json({ message: "Vui long nhap tu khoa tim anh" });
  }

  try {
    const searchQuery = buildPexelsQuery(rawQuery);
    const perPage = Math.min(Math.max(Number(req.query.per_page) || 8, 1), 12);
    const url = new URL("https://api.pexels.com/v1/search");
    url.searchParams.set("query", searchQuery);
    url.searchParams.set("per_page", String(perPage));
    url.searchParams.set("orientation", "square");

    const response = await fetch(url, {
      headers: {
        Authorization: apiKey,
      },
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      console.error("[Pexels] Loi tim anh", {
        status: response.status,
        query: searchQuery,
        error: data,
      });
      return res.status(response.status).json({
        message: data?.error || "Khong the tim anh tu Pexels",
      });
    }

    const photos = Array.isArray(data.photos) ? data.photos : [];
    res.json({
      query: rawQuery,
      searchQuery,
      images: photos.map((photo) => ({
        id: photo.id,
        url: photo.src?.large || photo.src?.medium || photo.src?.original,
        thumbnail: photo.src?.medium || photo.src?.small || photo.src?.tiny,
        alt: photo.alt || rawQuery,
        photographer: photo.photographer,
        photographerUrl: photo.photographer_url,
        sourceUrl: photo.url,
      })).filter((photo) => photo.url && photo.thumbnail),
    });
  } catch (error) {
    console.error("[Pexels] Loi server khi tim anh:", error);
    res.status(500).json({ message: "Loi server khi tim anh san pham" });
  }
};

exports.list = (req, res) => {
  const db = getDB();
  const { category } = req.query;

  let q = "SELECT * FROM products";
  const values = [];
  if (category) {
    q += " WHERE LOWER(category) LIKE LOWER(?)";
    values.push(`%${category}%`); // 👈 thêm %
  }

  console.log("SQL query:", q, values); // 👈 log ra để check
  db.query(q, values, (err, results) => {
    if (err) {
      console.error("Lỗi truy vấn sản phẩm:", err);
      return res.status(500).send("Lỗi server");
    }
    console.log("Kết quả:", results); // 👈 log kết quả từ DB
    res.json(results);
  });
};


exports.detail = (req, res) => {
  const db = getDB();
  const productId = req.params.id;
  db.query("SELECT * FROM products WHERE id = ?", [productId], (err, results) => {
    if (err) return res.status(500).send("Lỗi server");
    if (!results.length) return res.status(404).send("Không tìm thấy sản phẩm");
    res.json(results[0]);
  });
};

exports.create = (req, res) => {
  const db = getDB();
  const { image, code, name, price, description, size, category, is_available = 1 } = req.body;
  const q = `
    INSERT INTO products (image, code, name, price, description, size, category, is_available)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `;
  db.query(q, [image, code, name, price, description, size, category, is_available], (err, results) => {
    if (err) {
      console.error("Lỗi khi thêm sản phẩm:", err);
      return res.status(500).send("Lỗi server");
    }
    res.status(201).json({ id: results.insertId, ...req.body });
  });
};

exports.update = async (req, res) => {
  const query = getQuery();
  const productId = req.params.id;
  const updatedProduct = req.body;

  try {
    const [oldProduct] = await query("SELECT * FROM products WHERE id = ?", [productId]);
    if (!oldProduct) return res.status(404).json({ message: "Không tìm thấy sản phẩm" });

    const duplicate = await query(
      "SELECT * FROM products WHERE (code = ? OR name = ?) AND id != ?",
      [updatedProduct.code, updatedProduct.name, productId]
    );
    if (duplicate.length > 0) {
      return res.status(400).json({ message: "Mã hoặc tên sản phẩm đã tồn tại" });
    }

    await query("UPDATE products SET ? WHERE id = ?", [updatedProduct, productId]);

    const changes = {};
    ["name", "price", "description", "size", "code", "image", "is_available"].forEach((f) => {
      if (oldProduct[f] !== updatedProduct[f]) {
        changes[f] = { from: oldProduct[f], to: updatedProduct[f] };
      }
    });

    await query(
      "INSERT INTO product_edit_logs (product_id, edited_by, changed_fields) VALUES (?, ?, ?)",
      [productId, (req.user && req.user.id) || "staff", JSON.stringify(changes)]
    );

    res.status(200).json({ message: "Cập nhật thành công", changes });
  } catch (error) {
    console.error("Lỗi cập nhật sản phẩm:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
};

exports.history = async (req, res) => {
  try {
    const query = getQuery();
    const logs = await query(
      "SELECT * FROM product_edit_logs WHERE product_id = ? ORDER BY edit_time DESC",
      [req.params.id]
    );
    res.json(logs);
  } catch (error) {
    console.error("Lỗi khi lấy lịch sử:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
};

exports.remove = (req, res) => {
  const db = getDB();
  const productId = req.params.id;

  db.query("DELETE FROM payments WHERE product_id = ?", [productId], (err) => {
    if (err) {
      console.error("Lỗi khi xóa payments:", err);
      return res.status(500).json({ message: "Lỗi khi xóa payments" });
    }
    db.query("DELETE FROM products WHERE id = ?", [productId], (err2) => {
      if (err2) {
        console.error("Lỗi khi xóa sản phẩm:", err2);
        return res.status(500).json({ message: "Lỗi khi xóa sản phẩm" });
      }
      res.status(200).json({ message: "Xóa sản phẩm thành công" });
    });
  });
};

exports.categories = (req, res) => {
  const db = getDB();
  const q = `
    SELECT DISTINCT category FROM products 
    WHERE category IS NOT NULL AND category != ''
  `;
  db.query(q, (err, results) => {
    if (err) return res.status(500).send("Lỗi server");
    res.json(results.map((r) => r.category));
  });
};
