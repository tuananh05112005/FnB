// ==============================================================
// TÊN FILE: EditProductForm.js
// MÔ TẢ: Trang chỉnh sửa thông tin sản phẩm và theo dõi lịch sử chỉnh sửa dành cho Admin/Staff.
//        - Tải thông tin sản phẩm từ backend bằng `getProduct`.
//        - Gọi API lấy lịch sử chỉnh sửa sản phẩm (`/api/product/:id/history`).
//        - Hỗ trợ đổi ảnh bằng gợi ý (ProductImagePicker) và sinh mô tả tự động (buildProductDescription).
// ==============================================================

import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FaArrowLeft, FaHistory, FaMagic, FaSave, FaUpload } from "react-icons/fa";

import ProductImagePicker from "../../components/admin/ProductImagePicker";
import { api } from "../../lib/api";
import { getProduct, updateProduct } from "../../services/productService";
import { buildProductDescription, getImageNameSuggestion } from "../../utils/productContent";
import "../../styles/dashboard.css";
import "../../styles/commerce.css";

// Khởi tạo trạng thái sản phẩm mặc định
const defaultProduct = {
  image: "",
  code: "",
  name: "",
  price: "",
  description: "",
  size: "",
  category: "",
};

// Component chính chỉnh sửa sản phẩm
const EditProductForm = () => {
  const { id } = useParams(); // Lấy ID sản phẩm cần chỉnh sửa từ thanh địa chỉ URL
  const navigate = useNavigate();

  // Khai báo các trạng thái của component
  const [editingProduct, setEditingProduct] = useState(defaultProduct); // Dữ liệu sản phẩm đang chỉnh sửa
  const [history, setHistory] = useState([]);                           // Lịch sử chỉnh sửa sản phẩm
  const [showHistory, setShowHistory] = useState(false);                 // Toggle hiển thị lịch sử chỉnh sửa
  const [isLoading, setIsLoading] = useState(true);                     // Trạng thái đang tải dữ liệu sản phẩm
  const [error, setError] = useState("");                               // Lưu thông báo lỗi
  const [successMessage, setSuccessMessage] = useState("");             // Lưu thông báo thành công
  const [uploadLoading, setUploadLoading] = useState(false);             // Trạng thái tải ảnh lên
  const [categoriesList, setCategoriesList] = useState([]);
  const [showNewCategoryInput, setShowNewCategoryInput] = useState(false);
  const [newCategoryVal, setNewCategoryVal] = useState("");

  useEffect(() => {
    api.get("/api/product-categories")
      .then((res) => {
        setCategoriesList(res.data ? res.data.filter(Boolean) : []);
      })
      .catch((err) => console.error("Lỗi lấy danh mục:", err));
  }, []);

  // Tải thông tin sản phẩm và lịch sử chỉnh sửa khi mở trang
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productData, historyData] = await Promise.all([
          getProduct(id),
          api.get(`/api/product/${id}/history`).then((res) => res.data).catch(() => []),
        ]);

        setEditingProduct(productData || defaultProduct);
        setHistory(historyData);
      } catch (fetchError) {
        console.error("Không thể tải dữ liệu sản phẩm:", fetchError);
        setError("Không thể tải thông tin sản phẩm.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [id]);

  // Xử lý sự thay đổi dữ liệu của các ô nhập thông tin
  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setEditingProduct((prev) => ({ ...prev, [name]: value }));
  };

  const handleCategorySelectChange = (e) => {
    const val = e.target.value;
    if (val === "new") {
      setShowNewCategoryInput(true);
      setEditingProduct((prev) => ({ ...prev, category: "new" }));
    } else {
      setShowNewCategoryInput(false);
      setNewCategoryVal("");
      setEditingProduct((prev) => ({ ...prev, category: val }));
    }
  };

  // Gửi yêu cầu cập nhật thông tin sản phẩm lên API backend
  const handleUpdateProduct = async () => {
    const finalCategory = editingProduct.category === "new" ? newCategoryVal.trim() : (editingProduct.category || "").trim();

    if (!editingProduct.image) {
      setError("Vui lòng nhập URL hình ảnh.");
      return;
    }
    if (!editingProduct.name) {
      setError("Vui lòng nhập tên sản phẩm.");
      return;
    }
    if (!editingProduct.price || isNaN(editingProduct.price) || Number(editingProduct.price) <= 0) {
      setError("Giá bán phải là số dương.");
      return;
    }
    if (!editingProduct.description) {
      setError("Vui lòng nhập mô tả.");
      return;
    }
    if (!finalCategory) {
      setError("Vui lòng chọn hoặc nhập danh mục.");
      return;
    }

    const isTopping = finalCategory.toLowerCase() === "topping";
    if (!isTopping) {
      if (!editingProduct.code) {
        setError("Vui lòng nhập mã sản phẩm.");
        return;
      }
      if (editingProduct.code.length > 20) {
        setError("Mã sản phẩm không quá 20 ký tự.");
        return;
      }
      if (!editingProduct.size) {
        setError("Vui lòng nhập kích cỡ.");
        return;
      }
    }

    try {
      setError("");
      setSuccessMessage("");

      const payload = {
        image: editingProduct.image,
        code: isTopping ? (editingProduct.code?.trim() || null) : editingProduct.code?.trim(),
        name: editingProduct.name.trim(),
        price: Number(editingProduct.price),
        description: editingProduct.description.trim(),
        size: isTopping ? (editingProduct.size?.trim() || null) : editingProduct.size?.trim(),
        category: finalCategory,
        is_available: editingProduct.is_available,
      };

      await updateProduct(id, payload);
      setSuccessMessage("Cập nhật sản phẩm thành công.");
      setTimeout(() => navigate("/products"), 1200);
    } catch (updateError) {
      console.error("Không thể cập nhật sản phẩm:", updateError);
      setError(
        updateError.response?.status === 400
          ? "Mã hoặc tên sản phẩm đã tồn tại."
          : "Có lỗi xảy ra khi cập nhật sản phẩm."
      );
    }
  };

  if (isLoading) {
    return (
      <div className="dashboard-page">
        <div className="dashboard-shell">
          <section className="dashboard-panel">
            <div className="dashboard-empty">Đang tải thông tin sản phẩm...</div>
          </section>
        </div>
      </div>
    );
  }

  const actualCategory = editingProduct.category === "new" ? newCategoryVal : editingProduct.category;
  const isTopping = actualCategory && actualCategory.trim().toLowerCase() === "topping";

  return (
    <div className="dashboard-page">
      <div className="dashboard-shell">
        <div className="dashboard-header">
          <div className="dashboard-title-wrap">
            <div className="dashboard-icon">
              <FaSave />
            </div>
            <div>
              <h1 className="dashboard-title">Chỉnh sửa sản phẩm</h1>
              <p className="dashboard-subtitle">
                cập nhật thông tin và theo dõi lịch sử thay đổi của sản phẩm.
              </p>
            </div>
          </div>

          <button
            type="button"
            className="dashboard-back-btn"
            onClick={() => navigate("/products")}
          >
            <FaArrowLeft />
            Quay lại
          </button>
        </div>

        <section className="dashboard-panel commerce-form-card">
          <div className="dashboard-panel-body">
            {error && <div className="commerce-alert commerce-alert-danger">{error}</div>}
            {successMessage && (
              <div className="commerce-alert commerce-alert-success" style={{ marginTop: 12 }}>
                {successMessage}
              </div>
            )}

            <div className="dashboard-form-grid" style={{ marginTop: error || successMessage ? 16 : 0 }}>
              <div className="dashboard-field">
                <label htmlFor="edit-image">Hình ảnh URL hoặc tải lên</label>
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <input
                    id="edit-image"
                    name="image"
                    className="dashboard-input"
                    style={{ flex: 1 }}
                    value={editingProduct.image || ""}
                    onChange={handleInputChange}
                  />
                  <label className="dashboard-btn dashboard-btn-secondary" style={{ margin: 0, padding: "10px 16px", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6, height: 42, boxSizing: "border-box", borderRadius: "var(--radius-pill)", border: "1.5px solid var(--color-border)" }}>
                    <FaUpload />
                    <span>Tải ảnh lên</span>
                    <input
                      type="file"
                      accept="image/*"
                      style={{ display: "none" }}
                      onChange={async (e) => {
                        const file = e.target.files[0];
                        if (!file) return;
                        
                        try {
                          setUploadLoading(true);
                          setError("");
                          
                          const formData = new FormData();
                          formData.append("image", file);
                          
                          const response = await api.post("/api/upload", formData, {
                            headers: {
                              "Content-Type": "multipart/form-data"
                            }
                          });
                          
                          const downloadUrl = response.data.url;
                          
                          setEditingProduct((prev) => ({ ...prev, image: downloadUrl }));
                          setSuccessMessage("Tải ảnh lên thành công!");
                          setTimeout(() => setSuccessMessage(""), 3000);
                        } catch (uploadErr) {
                          console.error("Upload error:", uploadErr);
                          setError("Lỗi tải ảnh lên: " + (uploadErr.response?.data?.message || uploadErr.message || uploadErr));
                        } finally {
                          setUploadLoading(false);
                        }
                      }}
                    />
                  </label>
                </div>
                {uploadLoading && <span style={{ fontSize: "0.8rem", color: "var(--color-brand)" }}>Đang tải ảnh lên...</span>}
                <ProductImagePicker
                  query={editingProduct.name}
                  onSelect={(image) => {
                    const suggestedName = getImageNameSuggestion(image);

                    setEditingProduct((prev) => {
                      const nextName = prev.name || suggestedName;

                      return {
                        ...prev,
                        image: image.url,
                        name: nextName,
                        description: prev.description || buildProductDescription(nextName),
                      };
                    });
                  }}
                />
              </div>
              <div className="dashboard-field">
                <label htmlFor="edit-category">Danh mục sản phẩm</label>
                <select
                  id="edit-category"
                  name="category"
                  className="dashboard-input"
                  value={editingProduct.category || ""}
                  onChange={handleCategorySelectChange}
                >
                  <option value="">-- Chọn danh mục --</option>
                  {categoriesList.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                  <option value="new">+ Thêm danh mục mới...</option>
                </select>
              </div>

              {showNewCategoryInput && (
                <div className="dashboard-field">
                  <label htmlFor="edit-new-category">Tên danh mục mới</label>
                  <input
                    id="edit-new-category"
                    className="dashboard-input"
                    placeholder="Ví dụ: trà hoa quả"
                    value={newCategoryVal}
                    onChange={(e) => setNewCategoryVal(e.target.value)}
                  />
                </div>
              )}

              <div className="dashboard-field">
                <label htmlFor="edit-code">
                  Mã sản phẩm {isTopping && <span style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", fontWeight: "normal" }}>(Không bắt buộc)</span>}
                </label>
                <input
                  id="edit-code"
                  name="code"
                  className="dashboard-input"
                  value={editingProduct.code || ""}
                  onChange={handleInputChange}
                />
              </div>
              <div className="dashboard-field">
                <label htmlFor="edit-name">Tên sản phẩm</label>
                <input
                  id="edit-name"
                  name="name"
                  className="dashboard-input"
                  value={editingProduct.name || ""}
                  onChange={handleInputChange}
                />
              </div>
              <div className="dashboard-field">
                <label htmlFor="edit-price">Giá bán</label>
                <input
                  id="edit-price"
                  name="price"
                  type="number"
                  className="dashboard-input"
                  value={editingProduct.price || ""}
                  onChange={handleInputChange}
                />
              </div>
              <div className="dashboard-field">
                <label htmlFor="edit-size">
                  Kích cỡ {isTopping && <span style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", fontWeight: "normal" }}>(Không bắt buộc)</span>}
                </label>
                <input
                  id="edit-size"
                  name="size"
                  className="dashboard-input"
                  value={editingProduct.size || ""}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            <div className="dashboard-field" style={{ marginTop: 16 }}>
              <label htmlFor="edit-description">Mô tả</label>
              <textarea
                id="edit-description"
                name="description"
                className="dashboard-textarea"
                value={editingProduct.description || ""}
                onChange={handleInputChange}
              />
              <button
                type="button"
                className="dashboard-btn dashboard-btn-secondary product-description-button"
                onClick={() => {
                  setEditingProduct((prev) => ({
                    ...prev,
                    description: buildProductDescription(prev.name),
                  }));
                }}
                disabled={!editingProduct.name}
              >
                <FaMagic />
                Gợi ý mô tả
              </button>
            </div>

            <div className="dashboard-form-actions">
              <button
                type="button"
                className="dashboard-btn dashboard-btn-secondary"
                onClick={() => navigate("/products")}
              >
                Hủy
              </button>
              <button
                type="button"
                className="dashboard-btn dashboard-btn-primary"
                onClick={handleUpdateProduct}
              >
                <FaSave />
                Lưu thay đổi
              </button>
            </div>

            {editingProduct.image && (
              <div className="dashboard-preview">
                <h3 className="commerce-product-title" style={{ marginBottom: 16 }}>
                  Xem trước hình ảnh
                </h3>
                <div className="commerce-image-preview">
                  <img
                    src={editingProduct.image}
                    alt={editingProduct.name}
                    onError={(event) => {
                      event.currentTarget.src =
                        "https://via.placeholder.com/320x220?text=Khong+the+tai+anh";
                    }}
                  />
                </div>
                <div className="dashboard-form-actions">
                  <button
                    type="button"
                    className="dashboard-btn dashboard-btn-secondary"
                    onClick={() => setShowHistory((prev) => !prev)}
                  >
                    <FaHistory />
                    {showHistory ? "Ẩn lịch sử" : "Xem lịch sử"}
                  </button>
                </div>
              </div>
            )}

            {showHistory && (
              <div className="commerce-history-log" style={{ marginTop: 18 }}>
                {history.length === 0 ? (
                  <div className="dashboard-mini-card">Chưa có lịch sử chỉnh sửa.</div>
                ) : (
                  history.map((log) => (
                    <div key={log.id} className="commerce-history-item">
                      <div className="commerce-meta">
                        <span className="dashboard-badge dashboard-badge-neutral">
                          {new Date(log.edit_time).toLocaleString("vi-VN")}
                        </span>
                        <span className="dashboard-badge dashboard-badge-info">
                          {log.edited_by}
                        </span>
                      </div>
                      <pre className="commerce-json">
                        {JSON.stringify(JSON.parse(log.changed_fields), null, 2)}
                      </pre>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default EditProductForm;
