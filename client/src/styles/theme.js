import { createGlobalStyle } from "styled-components";

/* ── Themed design tokens (mirrors index.css CSS variables) ──────── */
export const theme = {
  colors: {
    brand:        "#C8860A",
    brandDark:    "#9D6208",
    brandDeeper:  "#7A4C04",
    brandLight:   "#F5C842",
    brandPale:    "#FFF3CC",

    cream:        "#FFF8F0",
    bg:           "#FFFBF5",
    bgAlt:        "#FFF8F0",
    surface:      "#FFFFFF",
    surface2:     "#FDF6EC",

    text:         "#1A1207",
    textMuted:    "#6B5B4E",
    textFaint:    "#A89080",
    textInverse:  "#FFFFFF",

    matcha:       "#5A8A5A",
    rose:         "#E8778A",
    caramel:      "#D4A44C",

    success:      "#3DAA72",
    warning:      "#F59E0B",
    danger:       "#EF4444",
    info:         "#3B82F6",

    border:       "#EDE0CC",
    borderLight:  "#F5ECE0",

    sidebarBg:    "#1C1008",
  },

  fonts: {
    sans:    '"Be Vietnam Pro", "Segoe UI", system-ui, sans-serif',
    display: '"Poppins", "Be Vietnam Pro", sans-serif',
  },

  radius: {
    xs:   "6px",
    sm:   "10px",
    md:   "16px",
    lg:   "20px",
    xl:   "28px",
    pill: "9999px",
  },

  shadows: {
    sm:    "0 2px 8px rgba(62, 39, 35, 0.08)",
    md:    "0 4px 20px rgba(62, 39, 35, 0.10)",
    lg:    "0 8px 32px rgba(62, 39, 35, 0.13)",
    brand: "0 4px 20px rgba(200, 134, 10, 0.30)",
  },

  sidebar: { width: "260px", widthCollapsed: "68px" },
  topbar:  { height: "64px" },
};

/* ── Global Style (minimal – index.css handles most) ─────────────── */
export const GlobalStyle = createGlobalStyle`
  /* React-datepicker theme overrides */
  .react-datepicker {
    border: 1px solid var(--color-border) !important;
    border-radius: var(--radius-md) !important;
    font-family: var(--app-font-sans) !important;
    background: var(--color-surface) !important;
    box-shadow: var(--shadow-lg) !important;
  }
  .react-datepicker__header {
    background: var(--color-bg-alt) !important;
    border-bottom: 1px solid var(--color-border) !important;
    border-radius: var(--radius-md) var(--radius-md) 0 0 !important;
  }
  .react-datepicker__day--selected,
  .react-datepicker__day--keyboard-selected {
    background: var(--color-brand) !important;
    border-radius: var(--radius-sm) !important;
    color: white !important;
  }
  .react-datepicker__day:hover {
    background: var(--color-brand-pale) !important;
    color: var(--color-brand-dark) !important;
    border-radius: var(--radius-sm) !important;
  }
  .react-datepicker__current-month,
  .react-datepicker__day-name {
    color: var(--color-text-muted) !important;
    font-family: var(--app-font-sans) !important;
  }
  .react-datepicker__day { color: var(--color-text) !important; }

  /* Bootstrap Modal override (if still used anywhere) */
  .modal-content {
    border-radius: var(--radius-xl) !important;
    border: 1px solid var(--color-border) !important;
    background: var(--color-surface) !important;
    color: var(--color-text) !important;
    box-shadow: var(--shadow-xl) !important;
  }
  .modal-header {
    border-bottom: 1px solid var(--color-border-light) !important;
    padding: var(--space-5) var(--space-6) !important;
  }
  .modal-footer {
    border-top: 1px solid var(--color-border-light) !important;
    padding: var(--space-4) var(--space-6) !important;
  }
  .modal-backdrop.show { opacity: 0.6 !important; }

  /* Focus ring */
  :focus-visible {
    outline: 2px solid var(--color-brand);
    outline-offset: 2px;
  }

  /* Selection */
  ::selection {
    background: rgba(200, 134, 10, 0.2);
    color: var(--color-brand-dark);
  }
`;
