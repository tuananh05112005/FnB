// ==============================================================
// TÊN FILE: ProductImagePicker.js
// MÔ TẢ: Hợp phần giao diện chọn ảnh sản phẩm tự động dành cho Admin (ProductImagePicker).
//        Tích hợp nút bấm gọi API dịch vụ tìm kiếm ảnh minh họa từ Pexels (qua Backend),
//        hiển thị danh sách kết quả ảnh lưới (grid) kèm tác giả chụp hình,
//        và trả về ảnh được chọn cho form sản phẩm.
// ==============================================================

import { useState } from "react";
import { FaImage, FaSearch } from "react-icons/fa";

import { searchProductImages } from "../../services/productService";

const ProductImagePicker = ({ query, onSelect }) => {
  const [images, setImages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [hasSearched, setHasSearched] = useState(false);

  // Gọi API tìm kiếm ảnh dựa trên từ khóa tên sản phẩm truyền vào
  const handleSearch = async () => {
    const keyword = String(query || "").trim();

    if (!keyword) {
      setError("Nhập tên sản phẩm trước khi tìm ảnh.");
      return;
    }

    try {
      setIsLoading(true);
      setError("");
      setHasSearched(true);
      const data = await searchProductImages(keyword);
      setImages(data.images || []);
    } catch (searchError) {
      console.error("Không thể tìm sản phẩm:", searchError);
      setImages([]);
      setError(searchError.response?.data?.message || "Khônng thể tìm ảnh lúc này.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="product-image-picker">
      <button
        type="button"
        className="dashboard-btn dashboard-btn-secondary product-image-picker-button"
        onClick={handleSearch}
        disabled={isLoading}
      >
        <FaSearch />
        {isLoading ? "Đang tìm ảnh..." : "Tìm ảnh tự động"}
      </button>

      {error && <div className="commerce-alert commerce-alert-danger">{error}</div>}

      {/* Trạng thái trống khi đã tìm kiếm nhưng không trả về kết quả ảnh nào */}
      {hasSearched && !isLoading && images.length === 0 && !error && (
        <div className="dashboard-empty product-image-picker-empty">
          <FaImage />
          Không tìm thấy ảnh phù hợp.
        </div>
      )}

      {/* Hiển thị danh sách ảnh Pexels dưới dạng lưới để Admin click lựa chọn */}
      {images.length > 0 && (
        <div className="product-image-picker-grid">
          {images.map((image) => (
            <button
              key={image.id}
              type="button"
              className="product-image-picker-card"
              onClick={() => onSelect(image)}
              title={`Photo by ${image.photographer || "Pexels"}`}
            >
              <img src={image.thumbnail} alt={image.alt || "Ảnh sản phẩm"} />
              <span>{image.photographer || "Pexels"}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProductImagePicker;
