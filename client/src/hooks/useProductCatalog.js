// ==============================================================
// TÊN FILE: useProductCatalog.js
// MÔ TẢ: Custom hook quản lý trạng thái và logic của Danh mục sản phẩm (Products Catalog).
//        - Xử lý đồng bộ hóa thanh tìm kiếm giữa ô nhập liệu và query parameters trên URL.
//        - Tải dữ liệu song song (Sản phẩm, Giỏ hàng, Yêu thích) từ server.
//        - Lọc sản phẩm theo cấu hình danh mục (ẩn/hiện), bộ lọc kích cỡ, khoảng giá, và sắp xếp.
//        - Cung cấp các hàm hành động: Thêm vào giỏ hàng, Xóa sản phẩm (Admin), và Thả tim/Bỏ yêu thích.
// ==============================================================

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";

import { useCategorySettings } from "./useCategorySettings";
import { api } from "../lib/api";
import { applyCategorySettings } from "../lib/categorySettings";
import { getRole, getUserId } from "../lib/session";
import { addToCart, getCart } from "../services/cartService";
import { deleteProduct, isProductAvailable, listProducts } from "../services/productService";
import { useNotifications } from "../components/common/NotificationContext";

// Định nghĩa khoảng giá mặc định của bộ lọc sản phẩm (Từ 0đ đến 1.000.000đ)
export const DEFAULT_PRICE_RANGE = { min: 0, max: 1000000 };

export const useProductCatalog = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { addNotification } = useNotifications();
  const category = searchParams.get("category");
  const urlSearch = searchParams.get("search")?.trim() || "";
  const userId = getUserId();
  const role = getRole();
  const categorySettings = useCategorySettings();

  // --- Các Hook State quản lý dữ liệu sản phẩm ---
  const [products, setProducts] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [cartItems, setCartItems] = useState([]);
  const [viewMode, setViewMode] = useState("grid"); // Chế độ xem: "grid" (Lưới) hoặc "list" (Danh sách)
  const [searchTerm, setSearchTerm] = useState(urlSearch);

  // 1. Đồng bộ từ URL vào state khi URL thay đổi (Ví dụ: Tìm kiếm từ Topbar chuyển trang)
  useEffect(() => {
    setSearchTerm(urlSearch);
  }, [urlSearch]);

  // 2. Đồng bộ từ state lên URL khi người dùng nhập ở ô tìm kiếm giữa trang
  useEffect(() => {
    const currentParam = searchParams.get("search")?.trim() || "";
    if (searchTerm !== currentParam) {
      const params = new URLSearchParams(searchParams);
      if (searchTerm) {
        params.set('search', searchTerm);
      } else {
        params.delete('search');
      }
      setSearchParams(params, { replace: true });
    }
  }, [searchTerm, searchParams, setSearchParams]);

  const [sortOption, setSortOption] = useState("latest"); // Tùy chọn sắp xếp (latest, name-asc, price-asc, price-desc)
  const [selectedSizes, setSelectedSizes] = useState([]); // Danh sách các kích cỡ đang lọc (M, L, ...)
  const [priceRange, setPriceRange] = useState(DEFAULT_PRICE_RANGE); // Khoảng giá đang lọc
  const [currentPage, setCurrentPage] = useState(Number(searchParams.get("page")) || 1);
  const [itemsPerPage, setItemsPerPage] = useState(Number(searchParams.get("limit")) || 12);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  // 3. Tải song song danh sách sản phẩm, giỏ hàng hiện tại và các sản phẩm yêu thích khi thay đổi danh mục/người dùng
  useEffect(() => {
    const fetchPageData = async () => {
      setIsLoading(true);
      setError("");

      try {
        const [productData, cartData, favoriteData] = await Promise.all([
          listProducts(category),
          userId ? getCart(userId).catch(() => []) : Promise.resolve([]),
          userId
            ? api.get(`/api/favorites/${userId}`).then((res) => res.data).catch(() => [])
            : Promise.resolve([]),
        ]);

        // Áp dụng bộ lọc danh mục ẩn/hiện đã cấu hình (chỉ áp dụng đối với khách hàng - user, admin/staff thấy hết)
        const visibleCategories = applyCategorySettings(
          productData.map((product) => product.category),
          categorySettings
        );
        const visibleCategorySet = new Set(visibleCategories);
        const shouldFilterByCategorySettings = role !== "admin" && role !== "staff";

        setProducts(
          shouldFilterByCategorySettings
            ? productData.filter(
                (product) => !product.category || visibleCategorySet.has(product.category)
              )
            : productData
        );
        setCartItems(cartData);
        setFavorites(favoriteData.map((item) => item.id));
      } catch (fetchError) {
        console.error("Không thể tải danh sách sản phẩm:", fetchError);
        setError("Không thể tải danh sách sản phẩm lúc này.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchPageData();
  }, [category, categorySettings, role, userId]);

  // 4. Đồng bộ số trang và số lượng sản phẩm mỗi trang lên URL
  useEffect(() => {
    const params = new URLSearchParams(searchParams);
    params.set("page", String(currentPage));
    params.set("limit", String(itemsPerPage));
    setSearchParams(params, { replace: true });
  }, [currentPage, itemsPerPage, searchParams, setSearchParams]);

  // Trích xuất các kích cỡ sản phẩm duy nhất (phục vụ bộ lọc kích cỡ)
  const uniqueSizes = useMemo(
    () => [...new Set(products.map((product) => product.size).filter(Boolean))],
    [products]
  );

  // Lọc sản phẩm theo từ khóa tìm kiếm, khoảng giá, size và thực hiện sắp xếp theo tùy chọn
  const filteredProducts = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    const result = products.filter((product) => {
      const haystack = [product.name, product.code, product.description]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch = !normalizedSearch || haystack.includes(normalizedSearch);
      const matchesPrice =
        Number(product.price) >= priceRange.min && Number(product.price) <= priceRange.max;
      const matchesSize =
        selectedSizes.length === 0 || selectedSizes.includes(product.size);

      return matchesSearch && matchesPrice && matchesSize;
    });

    const sorted = [...result];

    if (sortOption === "name-asc") {
      sorted.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortOption === "price-asc") {
      sorted.sort((a, b) => Number(a.price) - Number(b.price));
    } else if (sortOption === "price-desc") {
      sorted.sort((a, b) => Number(b.price) - Number(a.price));
    } else {
      sorted.sort((a, b) => Number(b.id) - Number(a.id));
    }

    return sorted;
  }, [priceRange, products, searchTerm, selectedSizes, sortOption]);

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / itemsPerPage));
  // Lấy danh sách sản phẩm thuộc trang hiện tại
  const pagedProducts = filteredProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Điều chỉnh số trang nếu danh sách lọc thay đổi làm số lượng trang bị giảm xuống nhỏ hơn trang hiện tại
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  // Hành động: Thêm sản phẩm vào giỏ hàng
  const handleAddToCart = async (navigate, product, e, quantity = 1, sugar = null, ice = null, toppings = null) => {
    if (!userId) {
      navigate("/login");
      return;
    }

    try {
      if (!isProductAvailable(product)) {
        setError("Món này hiện đang hết, vui lòng chọn món khác.");
        return;
      }

      const activeOrderCode = localStorage.getItem("activeOrderCode");
      await addToCart(userId, product.id, quantity, product.size || "M", activeOrderCode, sugar, ice, toppings);
      
      // Hiện thông báo toast
      addNotification(
        "new_order",
        "🛒 Giỏ hàng",
        `Đã thêm "${product.name}" vào giỏ hàng thành công!`
      );

      const data = await getCart(userId);
      setCartItems(data);
    } catch (cartError) {
      console.error("Không thể thêm vào giỏ hàng:", cartError);
      setError("Không thể thêm sản phẩm vào giỏ hàng.");
    }
  };

  // Hành động: Xóa sản phẩm ra khỏi menu (Admin)
  const handleDelete = async (productId) => {
    if (!window.confirm("Bạn có chắc muốn xóa sản phẩm này?")) {
      return;
    }

    try {
      await deleteProduct(productId);
      setProducts((prev) => prev.filter((product) => product.id !== productId));
    } catch (deleteError) {
      console.error("Không thể xóa sản phẩm:", deleteError);
      setError("Không thể xóa sản phẩm vì đang có dữ liệu liên quan.");
    }
  };

  // Hành động: Thả tim/Bỏ yêu thích sản phẩm
  const handleToggleFavorite = async (navigate, productId) => {
    if (!userId) {
      navigate("/login");
      return;
    }

    const isFavorite = favorites.includes(productId);

    try {
      if (isFavorite) {
        await api.delete("/api/favorites", {
          data: { user_id: userId, product_id: productId },
        });
        setFavorites((prev) => prev.filter((id) => id !== productId));
      } else {
        await api.post("/api/favorites", {
          user_id: userId,
          product_id: productId,
        });
        setFavorites((prev) => [...prev, productId]);
      }
    } catch (favoriteError) {
      console.error("Không thể cập nhật yêu thích:", favoriteError);
      setError("Không thể cập nhật danh sách yêu thích.");
    }
  };

  return {
    category,
    products,
    favorites,
    cartItems,
    viewMode,
    setViewMode,
    searchTerm,
    setSearchTerm,
    sortOption,
    setSortOption,
    selectedSizes,
    setSelectedSizes,
    priceRange,
    setPriceRange,
    currentPage,
    setCurrentPage,
    itemsPerPage,
    setItemsPerPage,
    isLoading,
    error,
    uniqueSizes,
    filteredProducts,
    pagedProducts,
    totalPages,
    handleAddToCart,
    handleDelete,
    handleToggleFavorite,
  };
};
