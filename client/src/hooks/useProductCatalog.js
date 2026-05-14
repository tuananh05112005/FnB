import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";

import { useCategorySettings } from "./useCategorySettings";
import { api } from "../lib/api";
import { applyCategorySettings } from "../lib/categorySettings";
import { getRole, getUserId } from "../lib/session";
import { addToCart, getCart } from "../services/cartService";
import { deleteProduct, isProductAvailable, listProducts } from "../services/productService";

export const DEFAULT_PRICE_RANGE = { min: 0, max: 1000000 };

export const useProductCatalog = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const category = searchParams.get("category");
  const userId = getUserId();
  const role = getRole();
  const categorySettings = useCategorySettings();

  const [products, setProducts] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [cartItems, setCartItems] = useState([]);
  const [viewMode, setViewMode] = useState("grid");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOption, setSortOption] = useState("latest");
  const [selectedSizes, setSelectedSizes] = useState([]);
  const [priceRange, setPriceRange] = useState(DEFAULT_PRICE_RANGE);
  const [currentPage, setCurrentPage] = useState(Number(searchParams.get("page")) || 1);
  const [itemsPerPage, setItemsPerPage] = useState(Number(searchParams.get("limit")) || 12);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

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

  useEffect(() => {
    const params = new URLSearchParams(searchParams);
    params.set("page", String(currentPage));
    params.set("limit", String(itemsPerPage));
    setSearchParams(params, { replace: true });
  }, [currentPage, itemsPerPage, searchParams, setSearchParams]);

  const uniqueSizes = useMemo(
    () => [...new Set(products.map((product) => product.size).filter(Boolean))],
    [products]
  );

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
  const pagedProducts = filteredProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const handleAddToCart = async (navigate, product) => {
    if (!userId) {
      navigate("/login");
      return;
    }

    try {
      if (!isProductAvailable(product)) {
        setError("Mon nay hien dang het, vui long chon mon khac.");
        return;
      }

      await addToCart(userId, product.id, 1, product.size || "M");
      const data = await getCart(userId);
      setCartItems(data);
    } catch (cartError) {
      console.error("Không thể thêm vào giỏ hàng:", cartError);
      setError("Không thể thêm sản phẩm vào giỏ hàng.");
    }
  };

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
