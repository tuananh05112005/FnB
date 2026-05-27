import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FaArrowLeft, FaHistory, FaMagic, FaSave } from "react-icons/fa";

import ProductImagePicker from "../../components/admin/ProductImagePicker";
import { api } from "../../lib/api";
import { getProduct, updateProduct } from "../../services/productService";
import { buildProductDescription, getImageNameSuggestion } from "../../utils/productContent";
import "../../styles/dashboard.css";
import "../../styles/commerce.css";

const defaultProduct = {
  image: "",
  code: "",
  name: "",
  price: "",
  description: "",
  size: "",
};

const EditProductForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [editingProduct, setEditingProduct] = useState(defaultProduct);
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

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

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setEditingProduct((prev) => ({ ...prev, [name]: value }));
  };

  const handleUpdateProduct = async () => {
    try {
      setError("");
      setSuccessMessage("");
      await updateProduct(id, editingProduct);
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
                <label htmlFor="edit-image">Hình ảnh URL</label>
                <input
                  id="edit-image"
                  name="image"
                  className="dashboard-input"
                  value={editingProduct.image || ""}
                  onChange={handleInputChange}
                />
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
                <label htmlFor="edit-code">Mã sản phẩm</label>
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
                <label htmlFor="edit-size">Kích cỡ</label>
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
                Goi y mo ta
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
