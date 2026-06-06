// ==============================================================
// TÊN FILE: AddProductForm.js
// MÔ TẢ: Trang thêm sản phẩm mới dành cho Admin/Staff.
//        - Sử dụng thư viện Formik kết hợp Yup để kiểm tra tính hợp lệ dữ liệu nhập.
//        - Cho phép chọn ảnh nhanh từ thư viện ảnh gợi ý (ProductImagePicker).
//        - Tích hợp tính năng AI gợi ý mô tả sản phẩm tự động (buildProductDescription).
// ==============================================================

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ErrorMessage, Field, Form, Formik } from "formik";
import * as Yup from "yup";
import { FaArrowLeft, FaBoxOpen, FaMagic, FaPlus } from "react-icons/fa";

import ProductImagePicker from "../../components/admin/ProductImagePicker";
import { createProduct } from "../../services/productService";
import { buildProductDescription, getImageNameSuggestion } from "../../utils/productContent";
import "../../styles/dashboard.css";
import "../../styles/commerce.css";

// Định nghĩa quy tắc kiểm tra tính hợp lệ dữ liệu đầu vào (Validation Schema) bằng Yup
const validationSchema = Yup.object({
  image: Yup.string().required("Vui lòng nhập URL hình ảnh."),
  code: Yup.string().required("Vui lòng nhập mã sản phẩm.").max(20),
  name: Yup.string().required("Vui lòng nhập tên sản phẩm.").max(100),
  price: Yup.number().typeError("Giá phải là số.").positive().required("Vui lòng nhập giá sản phẩm."),
  description: Yup.string().required("Vui lòng nhập mô tả."),
  size: Yup.string().required("Vui lòng nhập kích cỡ."),
});

// Component chính trang thêm sản phẩm mới
const AddProductForm = () => {
  const navigate = useNavigate();
  
  // Khai báo các trạng thái giao diện và thông báo lỗi/thành công
  const [successMessage, setSuccessMessage] = useState(""); // Thông báo thành công
  const [errorMessage, setErrorMessage] = useState("");     // Thông báo lỗi nếu gửi dữ liệu thất bại
  const [previewImage, setPreviewImage] = useState("");     // Ảnh xem trước của URL hình ảnh sản phẩm

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
              }}
              validationSchema={validationSchema}
              onSubmit={async (values, { setSubmitting, resetForm }) => {
                setErrorMessage("");
                setSuccessMessage("");

                try {
                  // Gọi API thêm sản phẩm mới
                  await createProduct(values);
                  setSuccessMessage("ản phẩm đã được thêm thành công.");
                  resetForm();
                  setPreviewImage("");
                  // Quay lại trang danh mục sau khi thêm thành công
                  setTimeout(() => navigate("/products"), 1200);
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
              {({ isSubmitting, setFieldValue, values }) => (
                <Form>
                  <div className="dashboard-form-grid">
                    <div className="dashboard-field">
                      <label htmlFor="product-image">Hình ảnh URL</label>
                      <Field
                        id="product-image"
                        name="image"
                        className="dashboard-input"
                        onChange={(event) => {
                          setFieldValue("image", event.target.value);
                          setPreviewImage(event.target.value);
                        }}
                        placeholder="https://..."
                      />
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
                      <label htmlFor="product-code">Mã sản phẩm</label>
                      <Field
                        id="product-code"
                        name="code"
                        className="dashboard-input"
                        placeholder="PRD-001"
                      />
                      <ErrorMessage name="code" component="div" className="text-danger" />
                    </div>

                    <div className="dashboard-field">
                      <label htmlFor="product-name">ên sản phẩm</label>
                      <Field
                        id="product-name"
                        name="name"
                        className="dashboard-input"
                        placeholder="Nhap ten san pham"
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
                      <label htmlFor="product-size">Kích cỡ</label>
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
              )}
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
