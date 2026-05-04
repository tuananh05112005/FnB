import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FaArrowLeft, FaHistory, FaSave } from "react-icons/fa";

import { api } from "../../lib/api";
import { getProduct, updateProduct } from "../../services/productService";
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
        console.error("Khong the tai du lieu san pham:", fetchError);
        setError("Khong the tai thong tin san pham.");
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
      setSuccessMessage("Cap nhat san pham thanh cong.");
      setTimeout(() => navigate("/products"), 1200);
    } catch (updateError) {
      console.error("Khong the cap nhat san pham:", updateError);
      setError(
        updateError.response?.status === 400
          ? "Ma hoac ten san pham da ton tai."
          : "Co loi xay ra khi cap nhat san pham."
      );
    }
  };

  if (isLoading) {
    return (
      <div className="dashboard-page">
        <div className="dashboard-shell">
          <section className="dashboard-panel">
            <div className="dashboard-empty">Dang tai thong tin san pham...</div>
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
              <h1 className="dashboard-title">Chinh sua san pham</h1>
              <p className="dashboard-subtitle">
                Cap nhat thong tin va theo doi lich su thay doi cua san pham.
              </p>
            </div>
          </div>

          <button
            type="button"
            className="dashboard-back-btn"
            onClick={() => navigate("/products")}
          >
            <FaArrowLeft />
            Quay lai
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
                <label htmlFor="edit-image">Hinh anh URL</label>
                <input
                  id="edit-image"
                  name="image"
                  className="dashboard-input"
                  value={editingProduct.image || ""}
                  onChange={handleInputChange}
                />
              </div>
              <div className="dashboard-field">
                <label htmlFor="edit-code">Ma san pham</label>
                <input
                  id="edit-code"
                  name="code"
                  className="dashboard-input"
                  value={editingProduct.code || ""}
                  onChange={handleInputChange}
                />
              </div>
              <div className="dashboard-field">
                <label htmlFor="edit-name">Ten san pham</label>
                <input
                  id="edit-name"
                  name="name"
                  className="dashboard-input"
                  value={editingProduct.name || ""}
                  onChange={handleInputChange}
                />
              </div>
              <div className="dashboard-field">
                <label htmlFor="edit-price">Gia ban</label>
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
                <label htmlFor="edit-size">Kich co</label>
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
              <label htmlFor="edit-description">Mo ta</label>
              <textarea
                id="edit-description"
                name="description"
                className="dashboard-textarea"
                value={editingProduct.description || ""}
                onChange={handleInputChange}
              />
            </div>

            <div className="dashboard-form-actions">
              <button
                type="button"
                className="dashboard-btn dashboard-btn-secondary"
                onClick={() => navigate("/products")}
              >
                Huy
              </button>
              <button
                type="button"
                className="dashboard-btn dashboard-btn-primary"
                onClick={handleUpdateProduct}
              >
                <FaSave />
                Luu thay doi
              </button>
            </div>

            {editingProduct.image && (
              <div className="dashboard-preview">
                <h3 className="commerce-product-title" style={{ marginBottom: 16 }}>
                  Xem truoc hinh anh
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
                    {showHistory ? "An lich su" : "Xem lich su"}
                  </button>
                </div>
              </div>
            )}

            {showHistory && (
              <div className="commerce-history-log" style={{ marginTop: 18 }}>
                {history.length === 0 ? (
                  <div className="dashboard-mini-card">Chua co lich su chinh sua.</div>
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
