  const styles = {
    productCard: {
      transition: "all 0.3s ease",
      border: "none",
      borderRadius: "15px",
      overflow: "hidden",
      boxShadow: "0 2px 20px rgba(0,0,0,0.1)",
      height: "100%",
    },
    productCardHover: {
      transform: "translateY(-5px)",
      boxShadow: "0 8px 30px rgba(0,0,0,0.15)",
    },
    productImage: {
      height: "250px",
      objectFit: "cover",
      transition: "transform 0.3s ease",
    },
    productImageHover: {
      transform: "scale(1.05)",
    },
    priceTag: {
      background: "linear-gradient(45deg, #28a745, #20c997)",
      color: "white",
      padding: "8px 15px",
      borderRadius: "25px",
      fontWeight: "bold",
      fontSize: "1.1rem",
    },
    addToCartBtn: {
      background: "linear-gradient(45deg, #007bff, #0056b3)",
      border: "none",
      borderRadius: "25px",
      padding: "10px 20px",
      transition: "all 0.3s ease",
    },
    favoriteBtn: {
      position: "absolute",
      top: "10px",
      right: "10px",
      background: "rgba(255, 255, 255, 0.9)",
      border: "none",
      borderRadius: "50%",
      width: "40px",
      height: "40px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      transition: "all 0.3s ease",
    },
    searchBox: {
      borderRadius: "25px",
      border: "2px solid #e9ecef",
      padding: "12px 20px",
      fontSize: "1rem",
      transition: "all 0.3s ease",
    },
    filterCard: {
      background: "#f8f9fa",
      borderRadius: "15px",
      padding: "20px",
      marginBottom: "20px",
    },
  };

  export default styles;