import { useState } from "react";
import { FaImage, FaSearch } from "react-icons/fa";

import { searchProductImages } from "../../services/productService";

const ProductImagePicker = ({ query, onSelect }) => {
  const [images, setImages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async () => {
    const keyword = String(query || "").trim();

    if (!keyword) {
      setError("Nhap ten san pham truoc khi tim anh.");
      return;
    }

    try {
      setIsLoading(true);
      setError("");
      setHasSearched(true);
      const data = await searchProductImages(keyword);
      setImages(data.images || []);
    } catch (searchError) {
      console.error("Khong the tim anh san pham:", searchError);
      setImages([]);
      setError(searchError.response?.data?.message || "Khong the tim anh luc nay.");
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
        {isLoading ? "Dang tim anh..." : "Tim anh tu dong"}
      </button>

      {error && <div className="commerce-alert commerce-alert-danger">{error}</div>}

      {hasSearched && !isLoading && images.length === 0 && !error && (
        <div className="dashboard-empty product-image-picker-empty">
          <FaImage />
          Khong tim thay anh phu hop.
        </div>
      )}

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
              <img src={image.thumbnail} alt={image.alt || "Anh san pham"} />
              <span>{image.photographer || "Pexels"}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProductImagePicker;
