/* ═══════════════════════════════════════════════════════════════
   Pagination – Shared Component
   ═══════════════════════════════════════════════════════════════ */

/**
 * Props:
 *   currentPage  : number (1-based)
 *   totalItems   : number
 *   pageSize     : number  (default 10)
 *   onChange     : (page: number) => void
 *   className    : string (optional)
 */

const Pagination = ({
  currentPage = 1,
  totalItems = 0,
  pageSize = 10,
  onChange,
  className = "",
}) => {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  if (totalPages <= 1) return null;

  const from = (currentPage - 1) * pageSize + 1;
  const to   = Math.min(currentPage * pageSize, totalItems);

  /* Build visible page numbers with ellipsis */
  const buildPages = () => {
    const pages = [];
    const delta = 2; // pages around current
    const left  = currentPage - delta;
    const right = currentPage + delta;

    let prev = null;
    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= left && i <= right)) {
        if (prev !== null && i - prev > 1) pages.push("...");
        pages.push(i);
        prev = i;
      }
    }
    return pages;
  };

  const pages = buildPages();

  const btnBase = {
    display: "inline-flex", alignItems: "center", justifyContent: "center",
    height: 36, minWidth: 36, padding: "0 10px",
    border: "1.5px solid var(--color-border)",
    borderRadius: "var(--radius-sm)",
    background: "var(--color-surface)",
    color: "var(--color-text-muted)",
    fontSize: "0.85rem", fontWeight: 600,
    cursor: "pointer", transition: "all var(--transition-fast)",
    fontFamily: "var(--app-font-sans)",
    userSelect: "none",
  };

  const btnActive = {
    ...btnBase,
    background: "linear-gradient(135deg, var(--color-brand), var(--color-brand-dark))",
    borderColor: "var(--color-brand)",
    color: "white",
    boxShadow: "var(--shadow-brand)",
  };

  const btnDisabled = {
    ...btnBase,
    opacity: 0.38,
    cursor: "not-allowed",
  };

  return (
    <div className={`pagination-wrap ${className}`} style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      flexWrap: "wrap", gap: "var(--space-3)",
      padding: "var(--space-4) var(--space-5)",
      borderTop: "1px solid var(--color-border-light)",
    }}>
      {/* Summary */}
      <span style={{ fontSize: "0.8rem", color: "var(--color-text-faint)", fontWeight: 500 }}>
        Hiển thị <strong style={{ color: "var(--color-text)" }}>{from}–{to}</strong> / {totalItems} kết quả
      </span>

      {/* Buttons */}
      <div style={{ display: "flex", gap: 6 }}>
        {/* Prev */}
        <button
          style={currentPage === 1 ? btnDisabled : btnBase}
          disabled={currentPage === 1}
          onClick={() => onChange(currentPage - 1)}
          onMouseEnter={(e) => { if (currentPage !== 1) { e.currentTarget.style.borderColor = "var(--color-brand)"; e.currentTarget.style.color = "var(--color-brand)"; } }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--color-border)"; e.currentTarget.style.color = "var(--color-text-muted)"; }}
        >‹</button>

        {/* Page numbers */}
        {pages.map((p, idx) =>
          p === "..." ? (
            <span key={`el-${idx}`} style={{ ...btnBase, cursor: "default", border: "none", background: "none", color: "var(--color-text-faint)" }}>…</span>
          ) : (
            <button
              key={p}
              style={p === currentPage ? btnActive : btnBase}
              onClick={() => p !== currentPage && onChange(p)}
              onMouseEnter={(e) => { if (p !== currentPage) { e.currentTarget.style.borderColor = "var(--color-brand)"; e.currentTarget.style.color = "var(--color-brand)"; } }}
              onMouseLeave={(e) => { if (p !== currentPage) { e.currentTarget.style.borderColor = "var(--color-border)"; e.currentTarget.style.color = "var(--color-text-muted)"; } }}
            >{p}</button>
          )
        )}

        {/* Next */}
        <button
          style={currentPage === totalPages ? btnDisabled : btnBase}
          disabled={currentPage === totalPages}
          onClick={() => onChange(currentPage + 1)}
          onMouseEnter={(e) => { if (currentPage !== totalPages) { e.currentTarget.style.borderColor = "var(--color-brand)"; e.currentTarget.style.color = "var(--color-brand)"; } }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--color-border)"; e.currentTarget.style.color = "var(--color-text-muted)"; }}
        >›</button>
      </div>
    </div>
  );
};

export default Pagination;
