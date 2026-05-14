import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  FaArrowDown,
  FaArrowLeft,
  FaArrowUp,
  FaBoxOpen,
  FaCog,
  FaMugHot,
  FaPalette,
  FaSave,
  FaSearch,
  FaTags,
  FaToggleOff,
  FaToggleOn,
  FaUndo,
} from "react-icons/fa";

import ProductImage from "../../components/common/ProductImage";
import {
  DEFAULT_CATEGORY_SETTINGS,
  fetchCategorySettings,
  normalizeCategories,
  saveCategorySettings,
} from "../../lib/categorySettings";
import { DEFAULT_MENU_SETTINGS, getMenuSettings, saveMenuSettings } from "../../lib/menuSettings";
import {
  isProductAvailable,
  listProducts,
  updateProductAvailability,
} from "../../services/productService";
import "../../styles/dashboard.css";
import "../../styles/commerce.css";

const ProductAvailabilitySettings = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const tab = searchParams.get("tab");
  const activeSetting =
    tab === "products" || tab === "menu" || tab === "categories" ? tab : null;

  const [categoryForm, setCategoryForm] = useState(DEFAULT_CATEGORY_SETTINGS);
  const [menuForm, setMenuForm] = useState(getMenuSettings);
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [availabilityFilter, setAvailabilityFilter] = useState("all");
  const [updatingId, setUpdatingId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setIsLoading(true);
        setError("");
        const data = await listProducts();
        setProducts(data);
      } catch (fetchError) {
        console.error("Không thể tải danh sách món:", fetchError);
        setError("Không thể tải danh sách món lúc này.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // Load category settings when component mounts
  useEffect(() => {
    const loadCategory = async () => {
      try {
        const data = await fetchCategorySettings();
        setCategoryForm(data);
      } catch (error) {
        console.error('Failed to load category settings:', error);
      }
    };
    loadCategory();
  }, []);



  const stats = useMemo(
    () => ({
      total: products.length,
      available: products.filter(isProductAvailable).length,
      unavailable: products.filter((product) => !isProductAvailable(product)).length,
    }),
    [products]
  );

  const categories = useMemo(() => {
    const categoryCounts = products.reduce((counts, product) => {
      if (!product.category) return counts;
      return { ...counts, [product.category]: (counts[product.category] || 0) + 1 };
    }, {});
    const categoryNames = normalizeCategories(Object.keys(categoryCounts));
    const savedOrder = categoryForm.categoryOrder || [];
    const orderedNames = [
      ...savedOrder.filter((category) => categoryNames.includes(category)),
      ...categoryNames.filter((category) => !savedOrder.includes(category)),
    ];

    return orderedNames.map((category) => ({
      name: category,
      count: categoryCounts[category] || 0,
      hidden: (categoryForm.hiddenCategories || []).includes(category),
    }));
  }, [categoryForm, products]);

  const filteredProducts = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return products.filter((product) => {
      const available = isProductAvailable(product);
      const matchesStatus =
        availabilityFilter === "all" ||
        (availabilityFilter === "available" && available) ||
        (availabilityFilter === "unavailable" && !available);
      const haystack = [product.name, product.code, product.description, product.category]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return matchesStatus && (!normalizedSearch || haystack.includes(normalizedSearch));
    });
  }, [availabilityFilter, products, searchTerm]);

  const setActiveTab = (nextTab) => {
    setSearchParams(nextTab ? { tab: nextTab } : {});
    setSuccessMessage("");
    setError("");
  };

  const handleToggleAvailability = async (product) => {
    const nextAvailable = !isProductAvailable(product);

    setUpdatingId(product.id);
    setError("");
    setSuccessMessage("");

    setProducts((currentProducts) =>
      currentProducts.map((item) =>
        item.id === product.id ? { ...item, is_available: nextAvailable ? 1 : 0 } : item
      )
    );

    try {
      await updateProductAvailability(product, nextAvailable);
      setSuccessMessage(nextAvailable ? "Đã bật món trở lại." : "Đã tắt món hết hàng.");
    } catch (updateError) {
      console.error("Không thể cập nhật trạng thái món:", updateError);
      setProducts((currentProducts) =>
        currentProducts.map((item) =>
          item.id === product.id
            ? { ...item, is_available: isProductAvailable(product) ? 1 : 0 }
            : item
        )
      );
      setError("Không thể lưu trạng thái món. Hãy kiểm tra cột is_available trong bảng products.");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleMenuInputChange = (event) => {
    const { name, value } = event.target;
    setMenuForm((currentForm) => ({ ...currentForm, [name]: value }));
  };

  const handleSaveMenuSettings = () => {
    const nextSettings = saveMenuSettings(menuForm);
    setMenuForm(nextSettings);
    setSuccessMessage("Đã lưu cài đặt giao diện menu.");
  };

  const handleResetMenuSettings = () => {
    const nextSettings = saveMenuSettings(DEFAULT_MENU_SETTINGS);
    setMenuForm(nextSettings);
    setSuccessMessage("Đã khôi phục giao diện menu mặc định.");
  };

  const handleToggleCategory = (categoryName) => {
    setCategoryForm((currentForm) => {
      const hiddenSet = new Set(currentForm.hiddenCategories || []);

      if (hiddenSet.has(categoryName)) {
        hiddenSet.delete(categoryName);
      } else {
        hiddenSet.add(categoryName);
      }

      return { ...currentForm, hiddenCategories: [...hiddenSet] };
    });
  };

  const handleMoveCategory = (categoryName, direction) => {
    setCategoryForm((currentForm) => {
      const currentOrder = categories.map((category) => category.name);
      const currentIndex = currentOrder.indexOf(categoryName);
      const nextIndex = currentIndex + direction;

      if (currentIndex === -1 || nextIndex < 0 || nextIndex >= currentOrder.length) {
        return currentForm;
      }

      const nextOrder = [...currentOrder];
      [nextOrder[currentIndex], nextOrder[nextIndex]] = [
        nextOrder[nextIndex],
        nextOrder[currentIndex],
      ];

      return { ...currentForm, categoryOrder: nextOrder };
    });
  };

  const handleSaveCategorySettings = async () => {
    const nextSettings = await saveCategorySettings(categoryForm);
    setCategoryForm(nextSettings);
    setSuccessMessage("Đã lưu cài đặt danh mục.");
  };

  const handleResetCategorySettings = () => {
    const nextSettings = saveCategorySettings(DEFAULT_CATEGORY_SETTINGS);
    setCategoryForm(nextSettings);
    setSuccessMessage("Đã khôi phục cài đặt danh mục mặc định.");
  };

  const headerTitle =
    activeSetting === "products"
      ? "Cài đặt món"
      : activeSetting === "menu"
        ? "Cài đặt giao diện menu"
        : activeSetting === "categories"
          ? "Cài đặt danh mục"
          : "Cài đặt";
  const headerSubtitle =
    activeSetting === "products"
      ? "Bật hoặc tắt món khi tạm hết hàng để khách không đặt nhầm."
      : activeSetting === "menu"
        ? "Tùy chỉnh tên quán, tiêu đề menu và banner hiển thị cho khách."
        : activeSetting === "categories"
          ? "Bật hoặc tắt danh mục và sắp xếp thứ tự hiển thị trên menu."
          : "Chọn nhóm cài đặt bạn muốn quản lý.";

  return (
    <div className="dashboard-page">
      <div className="dashboard-shell">
        <div className="dashboard-header">
          <div className="dashboard-title-wrap">
            <div className="dashboard-icon">
              <FaCog />
            </div>
            <div>
              <h1 className="dashboard-title">{headerTitle}</h1>
              <p className="dashboard-subtitle">{headerSubtitle}</p>
            </div>
          </div>

          <button
            type="button"
            className="dashboard-back-btn"
            onClick={() => (activeSetting ? setActiveTab(null) : navigate("/products"))}
          >
            <FaArrowLeft />
            {activeSetting ? "Quay lại cài đặt" : "Quay lại"}
          </button>
        </div>

        {!activeSetting && (
          <section className="dashboard-panel">
            <div className="dashboard-panel-body">
              <div className="dashboard-card-grid">
                <button
                  type="button"
                  className="dashboard-mini-card settings-option-card"
                  onClick={() => setActiveTab("products")}
                >
                  <div
                    className="dashboard-stat-icon"
                    style={{ background: "#f5f3ff", color: "#7c3aed" }}
                  >
                    <FaMugHot />
                  </div>
                  <div>
                    <h4>Cài đặt món</h4>
                    <p>Bật hoặc tắt món khi tạm hết hàng.</p>
                  </div>
                </button>

                <button
                  type="button"
                  className="dashboard-mini-card settings-option-card"
                  onClick={() => setActiveTab("menu")}
                >
                  <div
                    className="dashboard-stat-icon"
                    style={{ background: "#eff6ff", color: "#2563eb" }}
                  >
                    <FaPalette />
                  </div>
                  <div>
                    <h4>Cài đặt giao diện menu</h4>
                    <p>Đổi tên quán, tiêu đề menu và banner.</p>
                  </div>
                </button>

                <button
                  type="button"
                  className="dashboard-mini-card settings-option-card"
                  onClick={() => setActiveTab("categories")}
                >
                  <div
                    className="dashboard-stat-icon"
                    style={{ background: "#ecfdf3", color: "#16a34a" }}
                  >
                    <FaTags />
                  </div>
                  <div>
                    <h4>Cài đặt danh mục</h4>
                    <p>Bật/tắt danh mục và sắp xếp thứ tự hiển thị.</p>
                  </div>
                </button>
              </div>
            </div>
          </section>
        )}

        {activeSetting === "categories" && (
          <section className="dashboard-panel">
            <div className="dashboard-panel-body">
              {successMessage && (
                <div className="commerce-alert commerce-alert-success" style={{ marginBottom: 16 }}>
                  {successMessage}
                </div>
              )}

              {isLoading ? (
                <div className="dashboard-empty">Đang tải danh mục...</div>
              ) : categories.length === 0 ? (
                <div className="dashboard-empty">Chưa có danh mục nào để cài đặt.</div>
              ) : (
                <div className="dashboard-table-wrap">
                  <table className="dashboard-table dashboard-table-compact">
                    <thead>
                      <tr>
                        <th>Thứ tự</th>
                        <th>Danh mục</th>
                        <th>Số món</th>
                        <th>Trạng thái</th>
                        <th>Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {categories.map((category, index) => (
                        <tr key={category.name}>
                          <td className="dashboard-index">{index + 1}</td>
                          <td>
                            <strong>{category.name}</strong>
                          </td>
                          <td>{category.count}</td>
                          <td>
                            <span
                              className={`dashboard-badge ${
                                category.hidden
                                  ? "dashboard-badge-danger"
                                  : "dashboard-badge-success"
                              }`}
                            >
                              {category.hidden ? "Đang ẩn" : "Đang hiển thị"}
                            </span>
                          </td>
                          <td>
                            <div className="dashboard-action-row">
                              <button
                                type="button"
                                className="dashboard-btn dashboard-btn-secondary"
                                disabled={index === 0}
                                onClick={() => handleMoveCategory(category.name, -1)}
                              >
                                <FaArrowUp />
                              </button>
                              <button
                                type="button"
                                className="dashboard-btn dashboard-btn-secondary"
                                disabled={index === categories.length - 1}
                                onClick={() => handleMoveCategory(category.name, 1)}
                              >
                                <FaArrowDown />
                              </button>
                              <button
                                type="button"
                                className={`dashboard-btn ${
                                  category.hidden
                                    ? "dashboard-btn-success"
                                    : "dashboard-btn-danger"
                                }`}
                                onClick={() => handleToggleCategory(category.name)}
                              >
                                {category.hidden ? <FaToggleOn /> : <FaToggleOff />}
                                {category.hidden ? "Bật danh mục" : "Tắt danh mục"}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="dashboard-form-actions">
                <button
                  type="button"
                  className="dashboard-btn dashboard-btn-secondary"
                  onClick={handleResetCategorySettings}
                >
                  <FaUndo />
                  Khôi phục mặc định
                </button>
                <button
                  type="button"
                  className="dashboard-btn dashboard-btn-primary"
                  onClick={handleSaveCategorySettings}
                >
                  <FaSave />
                  Lưu cài đặt danh mục
                </button>
              </div>
            </div>
          </section>
        )}

        {activeSetting === "menu" && (
          <section className="dashboard-panel">
            <div className="dashboard-panel-body">
              {successMessage && (
                <div className="commerce-alert commerce-alert-success" style={{ marginBottom: 16 }}>
                  {successMessage}
                </div>
              )}

              <div className="menu-settings-layout">
                <div className="dashboard-form-grid">
                  <div className="dashboard-field">
                    <label htmlFor="storeName">Tên quán trên sidebar</label>
                    <input
                      id="storeName"
                      name="storeName"
                      className="dashboard-input"
                      value={menuForm.storeName}
                      onChange={handleMenuInputChange}
                    />
                  </div>

                  <div className="dashboard-field">
                    <label htmlFor="topbarName">Tên trên thanh trên</label>
                    <input
                      id="topbarName"
                      name="topbarName"
                      className="dashboard-input"
                      value={menuForm.topbarName}
                      onChange={handleMenuInputChange}
                    />
                  </div>

                  <div className="dashboard-field">
                    <label htmlFor="menuTitle">Tiêu đề trang menu</label>
                    <input
                      id="menuTitle"
                      name="menuTitle"
                      className="dashboard-input"
                      value={menuForm.menuTitle}
                      onChange={handleMenuInputChange}
                    />
                  </div>

                  <div className="dashboard-field">
                    <label htmlFor="bannerImage">Ảnh banner URL</label>
                    <input
                      id="bannerImage"
                      name="bannerImage"
                      className="dashboard-input"
                      value={menuForm.bannerImage}
                      onChange={handleMenuInputChange}
                      placeholder="/image/banner.jpg hoặc https://..."
                    />
                  </div>

                  <div className="dashboard-field" style={{ gridColumn: "1 / -1" }}>
                    <label htmlFor="menuSubtitle">Mô tả trang menu</label>
                    <textarea
                      id="menuSubtitle"
                      name="menuSubtitle"
                      className="dashboard-textarea"
                      value={menuForm.menuSubtitle}
                      onChange={handleMenuInputChange}
                    />
                  </div>
                </div>

                <div className="dashboard-preview menu-settings-preview">
                  <h3 className="commerce-product-title" style={{ marginBottom: 16 }}>
                    Xem trước
                  </h3>
                  <div
                    className="menu-display-banner"
                    style={{
                      backgroundImage: menuForm.bannerImage
                        ? `url(${menuForm.bannerImage})`
                        : "linear-gradient(135deg, #7c3aed, #2563eb)",
                    }}
                  >
                    <div>
                      <p>{menuForm.storeName}</p>
                      <h2>{menuForm.menuTitle}</h2>
                    </div>
                  </div>
                  <p className="dashboard-subtitle">{menuForm.menuSubtitle}</p>
                </div>
              </div>

              <div className="dashboard-form-actions">
                <button
                  type="button"
                  className="dashboard-btn dashboard-btn-secondary"
                  onClick={handleResetMenuSettings}
                >
                  <FaUndo />
                  Khôi phục mặc định
                </button>
                <button
                  type="button"
                  className="dashboard-btn dashboard-btn-primary"
                  onClick={handleSaveMenuSettings}
                >
                  <FaSave />
                  Lưu giao diện menu
                </button>
              </div>
            </div>
          </section>
        )}

        {activeSetting === "products" && (
          <>
            <div className="dashboard-stats-grid" style={{ marginBottom: 20 }}>
              <article
                className="dashboard-stat dashboard-stat-accent"
                style={{ "--stat-accent": "#7c3aed" }}
              >
                <div
                  className="dashboard-stat-icon"
                  style={{ background: "#f5f3ff", color: "#7c3aed" }}
                >
                  <FaBoxOpen />
                </div>
                <div>
                  <p className="dashboard-stat-value">{stats.total}</p>
                  <p className="dashboard-stat-label">Tổng món</p>
                </div>
              </article>

              <article
                className="dashboard-stat dashboard-stat-accent"
                style={{ "--stat-accent": "#16a34a" }}
              >
                <div
                  className="dashboard-stat-icon"
                  style={{ background: "#ecfdf3", color: "#16a34a" }}
                >
                  <FaToggleOn />
                </div>
                <div>
                  <p className="dashboard-stat-value">{stats.available}</p>
                  <p className="dashboard-stat-label">Đang bán</p>
                </div>
              </article>

              <article
                className="dashboard-stat dashboard-stat-accent"
                style={{ "--stat-accent": "#ef4444" }}
              >
                <div
                  className="dashboard-stat-icon"
                  style={{ background: "#fef2f2", color: "#ef4444" }}
                >
                  <FaToggleOff />
                </div>
                <div>
                  <p className="dashboard-stat-value">{stats.unavailable}</p>
                  <p className="dashboard-stat-label">Hết món</p>
                </div>
              </article>
            </div>

            <section className="dashboard-panel" style={{ marginBottom: 20 }}>
              <div className="dashboard-panel-body">
                {error && <div className="commerce-alert commerce-alert-danger">{error}</div>}
                {successMessage && (
                  <div
                    className="commerce-alert commerce-alert-success"
                    style={{ marginTop: error ? 12 : 0 }}
                  >
                    {successMessage}
                  </div>
                )}

                <div
                  className="commerce-filter-layout"
                  style={{ marginTop: error || successMessage ? 16 : 0 }}
                >
                  <div className="commerce-search-main">
                    <label htmlFor="availability-search" className="commerce-filter-label">
                      Tìm món
                    </label>
                    <div className="commerce-search-input-wrap">
                      <FaSearch className="commerce-search-icon" />
                      <input
                        id="availability-search"
                        className="dashboard-input commerce-search-input"
                        value={searchTerm}
                        onChange={(event) => setSearchTerm(event.target.value)}
                        placeholder="Tên, mã hoặc danh mục"
                      />
                    </div>
                  </div>

                  <div className="commerce-filter-size">
                    <label className="commerce-filter-label">Trạng thái</label>
                    <div className="dashboard-toolbar-group">
                      {[
                        ["all", "Tất cả"],
                        ["available", "Đang bán"],
                        ["unavailable", "Hết món"],
                      ].map(([value, label]) => (
                        <button
                          key={value}
                          type="button"
                          className={`dashboard-chip ${
                            availabilityFilter === value ? "active" : ""
                          }`}
                          onClick={() => setAvailabilityFilter(value)}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section className="dashboard-panel">
              {isLoading ? (
                <div className="dashboard-empty">Đang tải danh sách món...</div>
              ) : filteredProducts.length === 0 ? (
                <div className="dashboard-empty">Không có món nào phù hợp.</div>
              ) : (
                <div className="dashboard-table-wrap">
                  <table className="dashboard-table dashboard-table-compact">
                    <thead>
                      <tr>
                        <th>Món</th>
                        <th>Danh mục</th>
                        <th>Giá</th>
                        <th>Trạng thái</th>
                        <th>Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredProducts.map((product) => {
                        const available = isProductAvailable(product);

                        return (
                          <tr key={product.id}>
                            <td>
                              <div className="dashboard-product">
                                <ProductImage
                                  src={product.image}
                                  alt={product.name}
                                  className="dashboard-thumb"
                                />
                                <div>
                                  <strong>{product.name}</strong>
                                  <br />
                                  <span className="dashboard-code">{product.code || "SP"}</span>
                                </div>
                              </div>
                            </td>
                            <td>{product.category || "Chưa phân loại"}</td>
                            <td className="dashboard-money">
                              {new Intl.NumberFormat("vi-VN", {
                                style: "currency",
                                currency: "VND",
                              }).format(Number(product.price) || 0)}
                            </td>
                            <td>
                              <span
                                className={`dashboard-badge ${
                                  available
                                    ? "dashboard-badge-success"
                                    : "dashboard-badge-danger"
                                }`}
                              >
                                {available ? "Đang bán" : "Hết món"}
                              </span>
                            </td>
                            <td>
                              <button
                                type="button"
                                className={`dashboard-btn ${
                                  available ? "dashboard-btn-danger" : "dashboard-btn-success"
                                }`}
                                disabled={updatingId === product.id}
                                onClick={() => handleToggleAvailability(product)}
                              >
                                {available ? <FaToggleOff /> : <FaToggleOn />}
                                {updatingId === product.id
                                  ? "Đang lưu..."
                                  : available
                                    ? "Tắt món"
                                    : "Bật món"}
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
};

export default ProductAvailabilitySettings;
