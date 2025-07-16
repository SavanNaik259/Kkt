/**
 * Cache Optimizer for Product Images
 * Prevents existing product images from being re-fetched when new products are added
 */

const CacheOptimizer = (function() {
    let imageCache = new Map();
    
    /**
     * Preload and cache product images to prevent re-fetching
     * @param {Array} products - Array of product objects
     */
    function preloadImages(products) {
        products.forEach(product => {
            if (product.image && !imageCache.has(product.image)) {
                const img = new Image();
                img.onload = () => {
                    imageCache.set(product.image, {
                        loaded: true,
                        timestamp: Date.now(),
                        productId: product.id
                    });
                    console.log(`Cached image for product ${product.id}`);
                };
                img.onerror = () => {
                    console.warn(`Failed to cache image for product ${product.id}`);
                };
                img.src = product.image;
            }
        });
    }

    /**
     * Get cached image info
     * @param {string} imageUrl - Image URL
     * @returns {Object|null} Cache info or null if not cached
     */
    function getCachedImageInfo(imageUrl) {
        return imageCache.get(imageUrl) || null;
    }

    /**
     * Clear cache for specific image
     * @param {string} imageUrl - Image URL to clear
     */
    function clearImageCache(imageUrl) {
        imageCache.delete(imageUrl);
        console.log(`Cleared cache for image: ${imageUrl}`);
    }

    /**
     * Clear all cached images
     */
    function clearAllCache() {
        imageCache.clear();
        console.log('Cleared all image cache');
    }

    /**
     * Get cache statistics
     * @returns {Object} Cache statistics
     */
    function getCacheStats() {
        return {
            totalCached: imageCache.size,
            cacheEntries: Array.from(imageCache.entries()).map(([url, info]) => ({
                url,
                loaded: info.loaded,
                timestamp: info.timestamp,
                productId: info.productId
            }))
        };
    }

    return {
        preloadImages,
        getCachedImageInfo,
        clearImageCache,
        clearAllCache,
        getCacheStats
    };
})();

// Make available globally
window.CacheOptimizer = CacheOptimizer;