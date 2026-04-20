import React from "react";
import axios from "axios";

const InvoiceDownloadButton = ({ paymentId }) => {
  const handleDownload = async () => {
    try {
      const res = await axios.get(
        `http://localhost:5000/api/payments/invoice/${paymentId}`,
        {
          responseType: "blob", // Quan trọng để nhận dữ liệu PDF
        }
      );

      const blob = new Blob([res.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = `hoa_don_${paymentId}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();

      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Tải hóa đơn lỗi:", err);
      alert("Không thể tải hóa đơn. Vui lòng thử lại sau.");
    }
  };

  return (
    <button onClick={handleDownload} className="btn btn-outline-primary">
      🧾 Tải hóa đơn PDF
    </button>
  );
};

export default InvoiceDownloadButton;
