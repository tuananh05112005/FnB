// AddProductForm.js
import React, { useState } from "react";
import { Container, Row, Col, Form, Button, Card, Alert, Spinner } from "react-bootstrap";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Formik, Field, ErrorMessage } from "formik";
import * as Yup from "yup";

const AddProductForm = () => {
  const navigate = useNavigate();
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [previewImage, setPreviewImage] = useState("");

  // Schema validation với Yup
  const validationSchema = Yup.object().shape({
    image: Yup.string()
      .required("Vui lòng nhập URL hình ảnh"),
    code: Yup.string()
      .required("Vui lòng nhập mã sản phẩm")
      .max(20, "Mã sản phẩm không được vượt quá 20 ký tự"),
    name: Yup.string()
      .required("Vui lòng nhập tên sản phẩm")
      .max(100, "Tên sản phẩm không được vượt quá 100 ký tự"),
    price: Yup.number()
      .typeError("Giá phải là một số")
      .positive("Giá phải lớn hơn 0")
      .required("Vui lòng nhập giá"),
    description: Yup.string()
      .required("Vui lòng nhập mô tả"),
    size: Yup.string()
      .required("Vui lòng nhập kích cỡ"),
  });

  const handleSubmit = async (values, { setSubmitting, resetForm }) => {
    try {
      setErrorMessage("");
      const response = await axios.post(
        "http://localhost:5000/api/products",
        values
      );
      setSuccessMessage("Sản phẩm đã được thêm thành công!");
      resetForm();
      setPreviewImage("");
      
      // Chuyển hướng sau 1.5 giây
      setTimeout(() => {
        navigate("/products");
      }, 1500);
    } catch (error) {
      console.error("Lỗi khi thêm sản phẩm:", error);
      if (error.response && error.response.status === 400) {
        setErrorMessage("Mã sản phẩm hoặc tên sản phẩm đã tồn tại");
      } else {
        setErrorMessage("Có lỗi xảy ra khi thêm sản phẩm. Vui lòng thử lại.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleBackToProducts = () => {
    navigate("/products");
  };

  const handleImageChange = (e, setFieldValue) => {
    const value = e.target.value;
    setFieldValue("image", value);
    setPreviewImage(value);
  };

  return (
    <Container className="py-5">
      <Row className="justify-content-center">
        <Col md={10} lg={8}>
          <Card className="shadow-lg border-0">
            <Card.Header className="bg-primary text-white p-4">
              <h2 className="mb-0 text-center">Thêm sản phẩm mới</h2>
            </Card.Header>
            <Card.Body className="p-4">
              {successMessage && (
                <Alert variant="success" className="mb-4">
                  <i className="bi bi-check-circle-fill me-2"></i>
                  {successMessage}
                </Alert>
              )}

              {errorMessage && (
                <Alert variant="danger" className="mb-4">
                  <i className="bi bi-exclamation-triangle-fill me-2"></i>
                  {errorMessage}
                </Alert>
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
                onSubmit={handleSubmit}
              >
                {({ handleSubmit, isSubmitting, errors, touched, setFieldValue }) => (
                  <Form onSubmit={handleSubmit}>
                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-4">
                          <Form.Label className="fw-bold">Hình ảnh URL</Form.Label>
                          <Field
                            type="text"
                            name="image"
                            as={Form.Control}
                            placeholder="Nhập URL hình ảnh"
                            className="py-2"
                            isInvalid={touched.image && !!errors.image}
                            onChange={(e) => handleImageChange(e, setFieldValue)}
                          />
                          <ErrorMessage
                            name="image"
                            component="div"
                            className="text-danger mt-1 small"
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-4">
                          <Form.Label className="fw-bold">Mã sản phẩm</Form.Label>
                          <Field
                            type="text"
                            name="code"
                            as={Form.Control}
                            placeholder="Nhập mã sản phẩm"
                            className="py-2"
                            isInvalid={touched.code && !!errors.code}
                          />
                          <ErrorMessage
                            name="code"
                            component="div"
                            className="text-danger mt-1 small"
                          />
                        </Form.Group>
                      </Col>
                    </Row>

                    <Form.Group className="mb-4">
                      <Form.Label className="fw-bold">Tên sản phẩm</Form.Label>
                      <Field
                        type="text"
                        name="name"
                        as={Form.Control}
                        placeholder="Nhập tên sản phẩm"
                        className="py-2"
                        isInvalid={touched.name && !!errors.name}
                      />
                      <ErrorMessage
                        name="name"
                        component="div"
                        className="text-danger mt-1 small"
                      />
                    </Form.Group>

                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-4">
                          <Form.Label className="fw-bold">Giá (VND)</Form.Label>
                          <Field
                            type="number"
                            name="price"
                            as={Form.Control}
                            placeholder="Nhập giá sản phẩm"
                            className="py-2"
                            isInvalid={touched.price && !!errors.price}
                          />
                          <ErrorMessage
                            name="price"
                            component="div"
                            className="text-danger mt-1 small"
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-4">
                          <Form.Label className="fw-bold">Kích cỡ</Form.Label>
                          <Field
                            type="text"
                            name="size"
                            as={Form.Control}
                            placeholder="Nhập kích cỡ"
                            className="py-2"
                            isInvalid={touched.size && !!errors.size}
                          />
                          <ErrorMessage
                            name="size"
                            component="div"
                            className="text-danger mt-1 small"
                          />
                        </Form.Group>
                      </Col>
                    </Row>

                    <Form.Group className="mb-4">
                      <Form.Label className="fw-bold">Mô tả sản phẩm</Form.Label>
                      <Field
                        as="textarea"
                        rows={4}
                        name="description"
                        className={`form-control py-2 ${
                          touched.description && errors.description ? "is-invalid" : ""
                        }`}
                        placeholder="Nhập mô tả chi tiết về sản phẩm"
                      />
                      <ErrorMessage
                        name="description"
                        component="div"
                        className="text-danger mt-1 small"
                      />
                    </Form.Group>

                    <div className="d-flex justify-content-center gap-3 mt-4">
                      <Button
                        variant="secondary"
                        onClick={handleBackToProducts}
                        className="px-4 py-2"
                        disabled={isSubmitting}
                      >
                        Quay về
                      </Button>
                      <Button
                        variant="primary"
                        type="submit"
                        className="px-4 py-2"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? (
                          <>
                            <Spinner
                              as="span"
                              animation="border"
                              size="sm"
                              role="status"
                              // aria-hidden="true"
                              className="me-2"
                            />
                            Đang thêm...
                          </>
                        ) : (
                          "Thêm sản phẩm"
                        )}
                      </Button>
                    </div>
                  </Form>
                )}
              </Formik>
            </Card.Body>
          </Card>

          {/* Preview Image Card */}
          {previewImage && (
            <Card className="mt-4 shadow-sm border-0">
              <Card.Header className="bg-light p-3">
                <h4 className="mb-0">Xem trước hình ảnh</h4>
              </Card.Header>
              <Card.Body className="p-3 text-center">
                <img
                  src={previewImage}
                  alt="Xem trước sản phẩm"
                  className="img-fluid"
                  style={{ maxHeight: "300px", objectFit: "contain" }}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = "https://via.placeholder.com/300x300?text=Hình+ảnh+không+tồn+tại";
                  }}
                />
              </Card.Body>
            </Card>
          )}
        </Col>
      </Row>
    </Container>
  );
};

export default AddProductForm;