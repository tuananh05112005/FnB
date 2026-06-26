// ==============================================================
// TÊN FILE: AddProductForm.js
// MÔ TẢ: Trang thêm sản phẩm mới dành cho Admin/Staff.
//        - Sử dụng thư viện Formik kết hợp Yup để kiểm tra tính hợp lệ dữ liệu nhập.
//        - Cho phép chọn ảnh nhanh từ thư viện ảnh gợi ý (ProductImagePicker).
//        - Tích hợp tính năng AI gợi ý mô tả sản phẩm tự động (buildProductDescription).
// ==============================================================

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ErrorMessage, Field, Form, Formik } from "formik";
import { FaArrowLeft, FaBoxOpen, FaMagic, FaPlus, FaUpload } from "react-icons/fa";

import ProductImagePicker from "../../components/admin/ProductImagePicker";
import { api } from "../../lib/api";
import { createProduct } from "../../services/productService";
import { buildProductDescription, getImageNameSuggestion } from "../../utils/productContent";
import "../../styles/dashboard.css";
import "../../styles/commerce.css";

// Quy tắc kiểm tra tính hợp lệ dữ liệu đầu vào (Custom Validation)
const validateForm = (values) => {
  const errors = {};
  if (!values.image) {
    errors.image = "Vui lòng nhập URL hình ảnh.";
  }
  
  const actualCategory = values.category === "new" ? values.newCategory : values.category;
  if (!actualCategory) {
    errors.category = "Vui lòng chọn hoặc nhập danh mục.";
  } else if (values.category === "new" && !values.newCategory.trim()) {
    errors.newCategory = "Vui lòng nhập danh mục mới.";
  }

  const isTopping = actualCategory && actualCategory.trim().toLowerCase() === "topping";

  if (!isTopping) {
    if (!values.code) {
      errors.code = "Vui lòng nhập mã sản phẩm.";
    } else if (values.code.length > 20) {
      errors.code = "Mã sản phẩm không quá 20 ký tự.";
    }
    if (!values.size) {
      errors.size = "Vui lòng nhập kích cỡ.";
    }
  }

  if (!values.name) {
    errors.name = "Vui lòng nhập tên sản phẩm.";
  } else if (values.name.length > 100) {
    errors.name = "Tên sản phẩm không quá 100 ký tự.";
  }
  
  if (!values.price) {
    errors.price = "Vui lòng nhập giá sản phẩm.";
  } else if (isNaN(values.price) || Number(values.price) <= 0) {
    errors.price = "Giá phải là số dương.";
  }
  
  if (!values.description) {
    errors.description = "Vui lòng nhập mô tả.";
  }

  return errors;
};

// Component chính trang thêm sản phẩm mới
const AddProductForm = () => {
  const navigate = useNavigate();
  
  // Khai báo các trạng thái giao diện và thông báo lỗi/thành công
  const [successMessage, setSuccessMessage] = useState(""); // Thông báo thành công
  const [errorMessage, setErrorMessage] = useState("");     // Thông báo lỗi nếu gửi dữ liệu thất bại
  const [previewImage, setPreviewImage] = useState("");     // Ảnh xem trước của URL hình ảnh sản phẩm
  const [uploadLoading, setUploadLoading] = useState(false); // Trạng thái tải ảnh lên
  const [categoriesList, setCategoriesList] = useState([]);
  const [showNewCategoryInput, setShowNewCategoryInput] = useState(false);

  useEffect(() => {
    api.get("/api/product-categories")
      .then((res) => {
        const list = res.data ? res.data.filter(Boolean) : [];
        setCategoriesList(list);
      })
      .catch((err) => console.error("Lỗi lấy danh mục:", err));
  }, []);

  return (
    <div className="dashboard-page">
      <div className="dashboard-shell">
        <div className="dashboard-header">
          <div className="dashboard-title-wrap">
            <div className="dashboard-icon">
              <FaBoxOpen />
            </div>
            <div>
              <h1 className="dashboard-title">Thêm sản phẩm mới</h1>
              <p className="dashboard-subtitle">
                Điền thông tin sản phẩm và lưu ngay vào danh mục.
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
            {successMessage && (
              <div className="commerce-alert commerce-alert-success">{successMessage}</div>
            )}
            {errorMessage && (
              <div className="commerce-alert commerce-alert-danger" style={{ marginTop: 12 }}>
                {errorMessage}
              </div>
            )}

            {/* Sử dụng Formik quản lý trạng thái form và kiểm tra đầu vào */}
            <Formik
              initialValues={{
                image: "",
                code: "",
                name: "",
                price: "",
                description: "",
                size: "",
                category: "",
                newCategory: "",
              }}
              validate={validateForm}
              onSubmit={async (values, { setSubmitting, resetForm }) => {
                setErrorMessage("");
                setSuccessMessage("");

                const finalCategory = values.category === "new" ? values.newCategory.trim() : values.category;
                const isTopping = finalCategory.toLowerCase() === "topping";

                const payload = {
                  image: values.image,
                  code: isTopping ? (values.code.trim() || null) : values.code.trim(),
                  name: values.name.trim(),
                  price: Number(values.price),
                  description: values.description.trim(),
                  size: isTopping ? (values.size.trim() || null) : values.size.trim(),
                  category: finalCategory,
                };

                try {
                  // Gọi API thêm sản phẩm mới
                  await createProduct(payload);
                  setSuccessMessage("Sản phẩm đã được thêm thành công.");
                  resetForm();
                  setPreviewImage("");
                  setShowNewCategoryInput(false);
                  // Cập nhật lại danh mục
                  api.get("/api/product-categories")
                    .then((res) => setCategoriesList(res.data ? res.data.filter(Boolean) : []))
                    .catch(console.error);
                  // Quay lại trang danh mục sau khi thêm thành công
                  setTimeout(() => navigate(`/products?category=${encodeURIComponent(finalCategory)}`), 1200);
                } catch (error) {
                  console.error("Không thể thêm sản phẩm:", error);
                  setErrorMessage(
                    error.response?.status === 400
                      ? "Mã hoặc tên sản phẩm đã tồn tại."
                      : "Có lỗi xảy ra khi thêm sản phẩm."
                  );
                } finally {
                  setSubmitting(false);
                }
              }}
            >
              {({ isSubmitting, setFieldValue, values }) => {
                const actualCategory = values.category === "new" ? values.newCategory : values.category;
                const isTopping = actualCategory && actualCategory.trim().toLowerCase() === "topping";

                return (
                  <Form>
                  <div className="dashboard-form-grid">
                    <div className="dashboard-field">
                      <label htmlFor="product-image">Hình ảnh URL hoặc tải lên</label>
                      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                        <Field
                          id="product-image"
                          name="image"
                          className="dashboard-input"
                          style={{ flex: 1 }}
                          onChange={(event) => {
                            setFieldValue("image", event.target.value);
                            setPreviewImage(event.target.value);
                          }}
                          placeholder="https://..."
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
                                setErrorMessage("");
                                
                                const formData = new FormData();
                                formData.append("image", file);
                                
                                const response = await api.post("/api/upload", formData, {
                                  headers: {
                                    "Content-Type": "multipart/form-data"
                                  }
                                });
                                
                                const downloadUrl = response.data.url;
                                
                                setFieldValue("image", downloadUrl);
                                setPreviewImage(downloadUrl);
                                setSuccessMessage("Tải ảnh lên thành công!");
                                setTimeout(() => setSuccessMessage(""), 3000);
                              } catch (uploadErr) {
                                console.error("Upload error:", uploadErr);
                                setErrorMessage("Lỗi tải ảnh lên: " + (uploadErr.response?.data?.message || uploadErr.message || uploadErr));
                              } finally {
                                setUploadLoading(false);
                              }
                            }}
                          />
                        </label>
                      </div>
                      {uploadLoading && <span style={{ fontSize: "0.8rem", color: "var(--color-brand)" }}>Đang tải ảnh lên...</span>}
                      <ErrorMessage name="image" component="div" className="text-danger" />
                      <ProductImagePicker
                        query={values.name}
                        onSelect={(image) => {
                          const imageUrl = image.url;
                          const suggestedName = getImageNameSuggestion(image);
                          const nextName = values.name || suggestedName;

                          setFieldValue("image", imageUrl);
                          setPreviewImage(imageUrl);

                          if (!values.name && suggestedName) {
                            setFieldValue("name", suggestedName);
                          }

                          if (!values.description && nextName) {
                            setFieldValue("description", buildProductDescription(nextName));
                          }
                        }}
                      />
                    </div>

                    <div className="dashboard-field">
                      <label htmlFor="product-category">Danh mục sản phẩm</label>
                      <Field
                        as="select"
                        id="product-category"
                        name="category"
                        className="dashboard-input"
                        onChange={(e) => {
                          const val = e.target.value;
                          setFieldValue("category", val);
                          if (val === "new") {
                            setShowNewCategoryInput(true);
                          } else {
                            setShowNewCategoryInput(false);
                            setFieldValue("newCategory", "");
                          }
                        }}
                      >
                        <option value="">-- Chọn danh mục --</option>
                        {categoriesList.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                        <option value="new">+ Thêm danh mục mới...</option>
                      </Field>
                      <ErrorMessage name="category" component="div" className="text-danger" />
                    </div>

                    {showNewCategoryInput && (
                      <div className="dashboard-field">
                        <label htmlFor="product-newCategory">Tên danh mục mới</label>
                        <Field
                          id="product-newCategory"
                          name="newCategory"
                          className="dashboard-input"
                          placeholder="Ví dụ: trà hoa quả"
                        />
                        <ErrorMessage name="newCategory" component="div" className="text-danger" />
                      </div>
                    )}

                    <div className="dashboard-field">
                      <label htmlFor="product-code">
                        Mã sản phẩm {isTopping && <span style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", fontWeight: "normal" }}>(Không bắt buộc)</span>}
                      </label>
                      <Field
                        id="product-code"
                        name="code"
                        className="dashboard-input"
                        placeholder="PRD-001"
                      />
                      <ErrorMessage name="code" component="div" className="text-danger" />
                    </div>

                    <div className="dashboard-field">
                      <label htmlFor="product-name">Tên sản phẩm</label>
                      <Field
                        id="product-name"
                        name="name"
                        className="dashboard-input"
                        placeholder="Nhập tên sản phẩm"
                      />
                      <ErrorMessage name="name" component="div" className="text-danger" />
                    </div>

                    <div className="dashboard-field">
                      <label htmlFor="product-price">Giá bán</label>
                      <Field
                        id="product-price"
                        name="price"
                        type="number"
                        className="dashboard-input"
                        placeholder="25000"
                      />
                      <ErrorMessage name="price" component="div" className="text-danger" />
                    </div>

                    <div className="dashboard-field">
                      <label htmlFor="product-size">
                        Kích cỡ {isTopping && <span style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", fontWeight: "normal" }}>(Không bắt buộc)</span>}
                      </label>
                      <Field
                        id="product-size"
                        name="size"
                        className="dashboard-input"
                        placeholder="M"
                      />
                      <ErrorMessage name="size" component="div" className="text-danger" />
                    </div>
                  </div>

                  <div className="dashboard-field" style={{ marginTop: 16 }}>
                    <label htmlFor="product-description">Mô tả</label>
                    <Field
                      as="textarea"
                      id="product-description"
                      name="description"
                      className="dashboard-textarea"
                      placeholder="Mô tả chi tiết sản phẩm"
                    />
                    <ErrorMessage
                      name="description"
                      component="div"
                      className="text-danger"
                    />
                    <button
                      type="button"
                      className="dashboard-btn dashboard-btn-secondary product-description-button"
                      onClick={() => {
                        setFieldValue("description", buildProductDescription(values.name));
                      }}
                      disabled={!values.name}
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
                      Huy
                    </button>
                    <button
                      type="submit"
                      className="dashboard-btn dashboard-btn-primary"
                      disabled={isSubmitting}
                    >
                      <FaPlus />
                      {isSubmitting ? "Đang thêm..." : "Thêm sản phẩm"}
                    </button>
                  </div>
                </Form>
              );}}
            </Formik>

            {previewImage && (
              <div className="dashboard-preview">
                <h3 className="commerce-product-title" style={{ marginBottom: 16 }}>
                  Xem trước hình ảnh
                </h3>
                <div className="commerce-image-preview">
                  <img
                    src={previewImage}
                    alt="Xem trước sản phẩm"
                    onError={(event) => {
                      event.currentTarget.src =
                        "https://via.placeholder.com/320x220?text=Khong+the+tai+anh";
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default AddProductForm;
