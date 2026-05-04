import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ErrorMessage, Field, Form, Formik } from "formik";
import * as Yup from "yup";
import { FaArrowLeft, FaBoxOpen, FaPlus } from "react-icons/fa";

import { createProduct } from "../../services/productService";
import "../../styles/dashboard.css";
import "../../styles/commerce.css";

const validationSchema = Yup.object({
  image: Yup.string().required("Vui long nhap URL hinh anh."),
  code: Yup.string().required("Vui long nhap ma san pham.").max(20),
  name: Yup.string().required("Vui long nhap ten san pham.").max(100),
  price: Yup.number().typeError("Gia phai la so.").positive().required(),
  description: Yup.string().required("Vui long nhap mo ta."),
  size: Yup.string().required("Vui long nhap kich co."),
});

const AddProductForm = () => {
  const navigate = useNavigate();
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [previewImage, setPreviewImage] = useState("");

  return (
    <div className="dashboard-page">
      <div className="dashboard-shell">
        <div className="dashboard-header">
          <div className="dashboard-title-wrap">
            <div className="dashboard-icon">
              <FaBoxOpen />
            </div>
            <div>
              <h1 className="dashboard-title">Them san pham moi</h1>
              <p className="dashboard-subtitle">
                Dien thong tin san pham va luu ngay vao danh muc.
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
            {successMessage && (
              <div className="commerce-alert commerce-alert-success">{successMessage}</div>
            )}
            {errorMessage && (
              <div className="commerce-alert commerce-alert-danger" style={{ marginTop: 12 }}>
                {errorMessage}
              </div>
            )}

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
                  await createProduct(values);
                  setSuccessMessage("San pham da duoc them thanh cong.");
                  resetForm();
                  setPreviewImage("");
                  setTimeout(() => navigate("/products"), 1200);
                } catch (error) {
                  console.error("Khong the them san pham:", error);
                  setErrorMessage(
                    error.response?.status === 400
                      ? "Ma hoac ten san pham da ton tai."
                      : "Co loi xay ra khi them san pham."
                  );
                } finally {
                  setSubmitting(false);
                }
              }}
            >
              {({ isSubmitting, setFieldValue }) => (
                <Form>
                  <div className="dashboard-form-grid">
                    <div className="dashboard-field">
                      <label htmlFor="product-image">Hinh anh URL</label>
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
                    </div>

                    <div className="dashboard-field">
                      <label htmlFor="product-code">Ma san pham</label>
                      <Field
                        id="product-code"
                        name="code"
                        className="dashboard-input"
                        placeholder="PRD-001"
                      />
                      <ErrorMessage name="code" component="div" className="text-danger" />
                    </div>

                    <div className="dashboard-field">
                      <label htmlFor="product-name">Ten san pham</label>
                      <Field
                        id="product-name"
                        name="name"
                        className="dashboard-input"
                        placeholder="Nhap ten san pham"
                      />
                      <ErrorMessage name="name" component="div" className="text-danger" />
                    </div>

                    <div className="dashboard-field">
                      <label htmlFor="product-price">Gia ban</label>
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
                      <label htmlFor="product-size">Kich co</label>
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
                    <label htmlFor="product-description">Mo ta</label>
                    <Field
                      as="textarea"
                      id="product-description"
                      name="description"
                      className="dashboard-textarea"
                      placeholder="Mo ta chi tiet san pham"
                    />
                    <ErrorMessage
                      name="description"
                      component="div"
                      className="text-danger"
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
                      type="submit"
                      className="dashboard-btn dashboard-btn-primary"
                      disabled={isSubmitting}
                    >
                      <FaPlus />
                      {isSubmitting ? "Dang them..." : "Them san pham"}
                    </button>
                  </div>
                </Form>
              )}
            </Formik>

            {previewImage && (
              <div className="dashboard-preview">
                <h3 className="commerce-product-title" style={{ marginBottom: 16 }}>
                  Xem truoc hinh anh
                </h3>
                <div className="commerce-image-preview">
                  <img
                    src={previewImage}
                    alt="Xem truoc san pham"
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
