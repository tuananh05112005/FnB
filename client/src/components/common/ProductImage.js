import { useEffect, useMemo, useState } from "react";
import { API_BASE_URL } from "../../lib/api";

const FALLBACK_IMAGE =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="640" height="640" viewBox="0 0 640 640">
      <defs>
        <linearGradient id="bg" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stop-color="#fff7ed"/>
          <stop offset="55%" stop-color="#eef2ff"/>
          <stop offset="100%" stop-color="#fdf2f8"/>
        </linearGradient>
      </defs>
      <rect width="640" height="640" fill="url(#bg)"/>
      <circle cx="320" cy="270" r="112" fill="#ffffff" opacity="0.8"/>
      <path d="M218 344c26-68 76-108 135-108 48 0 87 27 109 75 10 22-6 47-30 47H245c-20 0-34-18-27-14Z" fill="#7c3aed" opacity="0.18"/>
      <text x="320" y="405" text-anchor="middle" font-family="Arial, sans-serif" font-size="30" font-weight="700" fill="#475569">Ảnh đang được cập nhật</text>
    </svg>
  `);

const buildProxyUrl = (imageUrl) => {
  if (!/^https?:\/\//i.test(imageUrl)) {
    return null;
  }

  const withoutProtocol = imageUrl.replace(/^https?:\/\//i, "");
  return `https://images.weserv.nl/?url=${encodeURIComponent(withoutProtocol)}&output=png`;
};

const normalizeText = (value = "") =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

const getCuratedFallback = (alt = "") => {
  const name = normalizeText(alt);

  if (name.includes("macaron")) {
    return "https://images.unsplash.com/photo-1558326567-98ae2405596b?auto=format&fit=crop&w=800&q=80";
  }

  if (name.includes("donut")) {
    return "https://images.unsplash.com/photo-1551024601-bec78aea704b?auto=format&fit=crop&w=800&q=80";
  }

  if (name.includes("sandwitch") || name.includes("sandwich")) {
    return "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=800&q=80";
  }

  if (name.includes("sung bo")) {
    return "https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=800&q=80";
  }

  if (name.includes("banh mi")) {
    return "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=80";
  }

  if (name.includes("quy")) {
    return "https://images.unsplash.com/photo-1499636136210-6f4ee915583e?auto=format&fit=crop&w=800&q=80";
  }

  if (name.includes("kep")) {
    return "https://images.unsplash.com/photo-1528207776546-365bb710ee93?auto=format&fit=crop&w=800&q=80";
  }

  if (name.includes("kem") || name.includes("nuong") || name.includes("trung") || name.includes("su")) {
    return "https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?auto=format&fit=crop&w=800&q=80";
  }

  if (name.includes("banh")) {
    return "https://images.unsplash.com/photo-1486427944299-d1955d23e34d?auto=format&fit=crop&w=800&q=80";
  }

  return null;
};

const ProductImage = ({ src, alt, className, ...props }) => {
  const sources = useMemo(() => {
    let trimmedSrc = typeof src === "string" ? src.trim() : "";

    // Chuyển đổi link localhost thành link API base URL thực tế khi đang ở môi trường online
    if (trimmedSrc && trimmedSrc.includes("localhost:5000") && !API_BASE_URL.includes("localhost:5000")) {
      trimmedSrc = trimmedSrc.replace("http://localhost:5000", API_BASE_URL);
    }
    if (trimmedSrc && trimmedSrc.includes("127.0.0.1:5000") && !API_BASE_URL.includes("localhost:5000")) {
      trimmedSrc = trimmedSrc.replace("http://127.0.0.1:5000", API_BASE_URL);
    }

    // Nếu là đường dẫn tương đối, tự động nối thêm API_BASE_URL
    if (trimmedSrc && !/^https?:\/\//i.test(trimmedSrc)) {
      trimmedSrc = `${API_BASE_URL}${trimmedSrc.startsWith("/") ? trimmedSrc : `/${trimmedSrc}`}`;
    }

    const proxySrc = trimmedSrc ? buildProxyUrl(trimmedSrc) : null;
    const curatedFallback = getCuratedFallback(alt);

    return [trimmedSrc, proxySrc, curatedFallback, FALLBACK_IMAGE].filter(Boolean);
  }, [alt, src]);

  const [sourceIndex, setSourceIndex] = useState(0);
  const currentSource = sources[Math.min(sourceIndex, sources.length - 1)];

  useEffect(() => {
    setSourceIndex(0);
  }, [src]);

  return (
    <img
      {...props}
      src={currentSource}
      alt={alt || "San pham"}
      className={className}
      loading={props.loading || "lazy"}
      decoding={props.decoding || "async"}
      referrerPolicy="no-referrer"
      onError={(event) => {
        props.onError?.(event);
        setSourceIndex((previous) => Math.min(previous + 1, sources.length - 1));
      }}
    />
  );
};

export default ProductImage;
