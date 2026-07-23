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
    const mobileSrc = `${imageServer}${basePath}-mobile.webp`;
    const tabletSrc = `${imageServer}${basePath}-tablet.webp`;
    const optimizedSrc = `${imageServer}${src}`;

    return `${mobileSrc} 480w, ${tabletSrc} 768w, ${optimizedSrc} 1920w`;
  }

  return null;
}
