/**
 * Global Cache Invalidation System
 * Handles cache invalidation across all product loading systems
 */

window.CacheInvalidator = (function() {
    'use strict';

    // Cache keys to manage
    const CACHE_KEYS = [
        'bridalProducts',
        'bridalProductsTime', 
        'bridalProductsETag',
        'lastProductUpdate'
    ];

    /**
     * Detect current environment
     */
    function getEnvironment() {
        const hostname = window.location.hostname;
        const isNetlify = hostname.includes('netlify') || hostname.includes('.app');
        return {
            isNetlify,
            hostname,
            environment: isNetlify ? 'netlify' : 'local'
        };
    }

    /**
     * Get appropriate API endpoint for current environment
     */
    function getApiEndpoint(category = 'bridal') {
        const env = getEnvironment();
        return env.isNetlify 
            ? `/.netlify/functions/load-products?category=${category}`
            : `/api/load-products/${category}`;
    }

    /**
     * Clear all cache keys from localStorage
     */
    function clearLocalStorageCache() {
        console.log('🧹 Clearing localStorage cache...');
        let clearedCount = 0;
        
        CACHE_KEYS.forEach(key => {
            try {
                if (localStorage.getItem(key)) {
                    localStorage.removeItem(key);
                    clearedCount++;
                    console.log(`✅ Cleared: ${key}`);
                }
            } catch (e) {
                console.warn(`❌ Failed to clear ${key}:`, e);
            }
        });
        
        console.log(`🎯 Cleared ${clearedCount} cache entries from localStorage`);
        return clearedCount > 0;
    }

    /**
     * Clear module-specific caches
     */
    function clearModuleCaches() {
        console.log('🔄 Clearing module caches...');
        let modulesCleared = 0;

        // Clear BridalProductsLoader cache
        if (window.BridalProductsLoader && typeof window.BridalProductsLoader.clearCache === 'function') {
            try {
                window.BridalProductsLoader.clearCache();
                modulesCleared++;
                console.log('✅ BridalProductsLoader cache cleared');
            } catch (e) {
                console.warn('❌ Failed to clear BridalProductsLoader cache:', e);
            }
        }

        // Clear any other product loader caches here
        // Add more module cache clearing logic as needed

        console.log(`🎯 Cleared ${modulesCleared} module caches`);
        return modulesCleared > 0;
    }

    /**
     * Set cache invalidation flag
     */
    function setCacheInvalidationFlag() {
        const timestamp = Date.now();
        try {
            localStorage.setItem('lastProductUpdate', timestamp.toString());
            console.log('🚨 Set cache invalidation flag:', new Date(timestamp));
            return timestamp;
        } catch (e) {
            console.warn('❌ Failed to set cache invalidation flag:', e);
            return null;
        }
    }

    /**
     * Force cache invalidation by making a cache-busting request
     */
    async function forceCacheInvalidation(category = 'bridal') {
        const timestamp = Date.now();
        const endpoint = getApiEndpoint(category);
        const cacheBustEndpoint = `${endpoint}${endpoint.includes('?') ? '&' : '?'}cacheBust=${timestamp}`;
        
        console.log('🌐 Forcing cache invalidation via:', cacheBustEndpoint);

        try {
            const response = await fetch(cacheBustEndpoint, {
                method: 'GET',
                cache: 'no-store',
                headers: {
                    'Cache-Control': 'no-cache, no-store, must-revalidate',
                    'Pragma': 'no-cache',
                    'Expires': '0'
                }
            });

            console.log('📡 Cache invalidation response:', response.status, response.statusText);
            return response.ok;
        } catch (error) {
            console.warn('❌ Cache invalidation request failed:', error);
            return false;
        }
    }

    /**
     * Trigger fresh reload of product loaders
     */
    async function triggerFreshReload() {
        console.log('🔄 Triggering fresh reload of product loaders...');
        
        // Trigger BridalProductsLoader refresh if available
        if (window.BridalProductsLoader && typeof window.BridalProductsLoader.loadBridalProducts === 'function') {
            try {
                console.log('🔄 Refreshing BridalProductsLoader...');
                await window.BridalProductsLoader.loadBridalProducts(true);
                console.log('✅ BridalProductsLoader refreshed');
                
                // Update bridal section if available
                if (typeof window.BridalProductsLoader.updateBridalSection === 'function') {
                    window.BridalProductsLoader.updateBridalSection();
                    console.log('✅ Bridal section updated');
                }
            } catch (e) {
                console.warn('❌ Failed to refresh BridalProductsLoader:', e);
            }
        }
    }

    /**
     * Complete cache invalidation process
     * This is the main function to call when products are updated
     */
    async function invalidateAllCaches(category = 'bridal') {
        console.log('🚨 Starting complete cache invalidation process...');
        const startTime = Date.now();

        try {
            // Step 1: Clear all localStorage caches
            const localStorageCleared = clearLocalStorageCache();

            // Step 2: Clear module caches
            const moduleCachesCleared = clearModuleCaches();

            // Step 3: Set cache invalidation flag for future loads
            const invalidationFlag = setCacheInvalidationFlag();

            // Step 4: Force server cache invalidation
            const serverInvalidated = await forceCacheInvalidation(category);

            // Step 5: Trigger fresh reload of loaders
            await triggerFreshReload();

            const duration = Date.now() - startTime;
            
            console.log('✅ Complete cache invalidation finished in', duration, 'ms');
            console.log('📊 Results:', {
                localStorageCleared,
                moduleCachesCleared,
                invalidationFlag: !!invalidationFlag,
                serverInvalidated,
                duration: duration + 'ms'
            });

            return {
                success: true,
                localStorageCleared,
                moduleCachesCleared,
                serverInvalidated,
                duration
            };

        } catch (error) {
            console.error('❌ Cache invalidation process failed:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Simple cache clear for manual testing
     */
    function clearAllCaches() {
        console.log('🧹 Manual cache clear requested...');
        clearLocalStorageCache();
        clearModuleCaches();
        console.log('✅ Manual cache clear completed');
    }

    // Public API
    return {
        invalidateAllCaches,
        clearAllCaches,
        getEnvironment,
        getApiEndpoint,
        setCacheInvalidationFlag,
        forceCacheInvalidation,
        triggerFreshReload
    };
})();

// Auto-initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    const env = window.CacheInvalidator.getEnvironment();
    console.log('🌍 Cache Invalidator initialized for', env.environment, 'environment');
});