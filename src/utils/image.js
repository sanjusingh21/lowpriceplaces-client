/**
 * Generates the responsive srcSet attribute for optimized WebP images.
 * 
 * @param {string} src - The image path returned from the database.
 * @param {string} imageServer - The base server URL.
 * @returns {string|null} - The srcSet string or null if not applicable.
 */
export function getImageSrcSet(src, imageServer = "") {
  if (!src || src.startsWith("http") || src.startsWith("data:")) {
    return null;
  }

  // Check if it's an optimized image path
  if (src.endsWith("-optimized.webp")) {
    const basePath = src.replace("-optimized.webp", "");
    const serverUrl = imageServer || getImageServer();
    const cleanServer = serverUrl ? serverUrl.replace(/\/$/, "") : "";
    const mobileSrc = `${cleanServer}${basePath}-mobile.webp`;
    const tabletSrc = `${cleanServer}${basePath}-tablet.webp`;
    const optimizedSrc = `${cleanServer}${src}`;

    return `${mobileSrc} 480w, ${tabletSrc} 768w, ${optimizedSrc} 1920w`;
  }

  return null;
}

/**
 * Dynamically gets the active Image Server base URL.
 * 
 * @returns {string} - Base server URL (e.g., "https://api.lowpriceplaces.com" or "http://localhost:5000")
 */
export function getImageServer() {
  if (typeof process !== "undefined" && process.env.NEXT_PUBLIC_IMAGE_SERVER) {
    return process.env.NEXT_PUBLIC_IMAGE_SERVER.replace(/\/$/, "");
  }
  if (typeof process !== "undefined" && process.env.NEXT_PUBLIC_API_BASE) {
    return process.env.NEXT_PUBLIC_API_BASE.replace(/\/api\/?$/, "").replace(/\/$/, "");
  }
  if (typeof window !== "undefined") {
    if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
      return "http://localhost:5000";
    }
    return window.location.origin;
  }
  return "";
}

/**
 * Safely resolves an image path, preventing malformed double-domain URLs,
 * mixed content errors, and hardcoded localhost fallbacks in production.
 * 
 * @param {string} src - The image path returned from the database.
 * @param {string} customImageServer - Optional base server URL override.
 * @returns {string} - The cleaned absolute image URL.
 */
export function getImageUrl(src, customImageServer = "") {
  if (!src) return "";
  if (
    typeof src === "string" &&
    (src.startsWith("http://") ||
      src.startsWith("https://") ||
      src.startsWith("blob:") ||
      src.startsWith("data:"))
  ) {
    return src;
  }

  const cleanPath = src.startsWith("/") ? src : `/${src}`;
  const base = customImageServer || getImageServer();
  const cleanBase = base ? base.replace(/\/$/, "") : "";
  return `${cleanBase}${cleanPath}`;
}
