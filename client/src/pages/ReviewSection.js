// src/components/ReviewSection.jsx
import { useEffect, useState } from "react";
import { listReviews, createReview } from "../services/reviewService";
import { useNavigate } from "react-router-dom";
import { FaStar } from "react-icons/fa";

const ReviewSection = ({ productId }) => {
  const [reviews, setReviews] = useState([]);
  const [newReview, setNewReview] = useState("");
  const [rating, setRating] = useState(0);
  const navigate = useNavigate();

  // Lấy danh sách review khi load
  useEffect(() => {
    fetchReviews();
  }, [productId]);

  const fetchReviews = async () => {
    try {
      const data = await listReviews(productId);
      setReviews(data);
    } catch (err) {
      console.error("Lỗi khi lấy review:", err);
    }
  };

  const handleSubmitReview = async () => {
    const user_id = localStorage.getItem("user_id");
    if (!user_id) {
      alert("Vui lòng đăng nhập để đánh giá.");
      navigate("/login");
      return;
    }

    if (!rating) {
      alert("Vui lòng chọn số sao.");
      return;
    }

    try {
      await createReview({
          product_id: productId,
          rating,
          comment: newReview,
          user_id,
        });

      alert("Đánh giá thành công!");
      setNewReview("");
      setRating(0);
      fetchReviews();
    } catch (err) {
      console.error("Lỗi khi gửi review:", err);
      alert("Không thể gửi đánh giá.");
    }
  };

  return (
    <div className="mt-5">
      <h4>Đánh giá sản phẩm</h4>

      {/* Form nhập review */}
      <div className="card p-3 mb-4">
        <div className="mb-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <FaStar
              key={star}
              size={22}
              style={{ cursor: "pointer", marginRight: "5px" }}
              color={star <= rating ? "gold" : "lightgray"}
              onClick={() => setRating(star)}
            />
          ))}
        </div>
        <textarea
          className="form-control mb-2"
          rows="3"
          placeholder="Viết nhận xét..."
          value={newReview}
          onChange={(e) => setNewReview(e.target.value)}
        />
        <button className="btn btn-success" onClick={handleSubmitReview}>
          Gửi đánh giá
        </button>
      </div>

      {/* Danh sách review */}
      {reviews.length === 0 ? (
        <p className="text-muted">Chưa có đánh giá nào.</p>
      ) : (
        reviews.map((r) => (
          <div key={r.id} className="border-bottom py-2">
            <div>
              {[1, 2, 3, 4, 5].map((star) => (
                <FaStar
                  key={star}
                  size={18}
                  color={star <= r.rating ? "gold" : "lightgray"}
                  style={{ marginRight: "3px" }}
                />
              ))}
            </div>
            <p className="mb-1">{r.comment}</p>
            <small className="text-muted">
              Bởi {r.email} -{" "}
              {new Date(r.created_at).toLocaleDateString("vi-VN")}
            </small>
          </div>
        ))
      )}
    </div>
  );
};

export default ReviewSection;
