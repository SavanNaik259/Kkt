/**
 * Netlify Function: Load Products (Generic)
 * 
 * Loads products from Firebase Storage using direct CDN URLs for optimal caching
 * Handles GET requests to /.netlify/functions/load-products?category=CATEGORY
 * 
 * Uses direct Firebase Storage URLs with alt=media to ensure proper CDN caching,
 * avoiding the bandwidth consumption issues that occur with signed URLs or Admin SDK downloads.
 */

exports.handler = async (event, context) => {
  // Set CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Handle preflight OPTIONS request
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers
    };
  }

  // Only allow GET requests
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({
        success: false,
        message: 'Method not allowed'
      })
    };
  }

  try {
    // Get category from query parameters
    const category = event.queryStringParameters?.category;
    
    if (!category) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          products: [],
          error: 'Category parameter is required',
          message: 'Please provide a category parameter: ?category=bridal'
        })
      };
    }

    console.log(`Loading ${category} products from Cloud Storage...`);

    // Use direct Firebase Storage URL with alt=media for CDN caching
    // Check if this is a bandwidth test category
    const isBandwidthTest = category.startsWith('bandwidth-test-');
    const storageUrl = isBandwidthTest 
      ? `https://firebasestorage.googleapis.com/v0/b/auric-a0c92.firebasestorage.app/o/bandwidthTest%2F${category}-products.json?alt=media`
      : `https://firebasestorage.googleapis.com/v0/b/auric-a0c92.firebasestorage.app/o/productData%2F${category}-products.json?alt=media&token=c6a2eb63-56e3-4fc0-96ac-66773cf45f96`;

    console.log(`Fetching from Firebase Storage CDN: ${storageUrl}`);

    // Use fetch to get the file from Firebase Storage CDN
    const response = await fetch(storageUrl);
    
    if (!response.ok) {
      if (response.status === 404) {
        console.log(`No ${category} products file found in Firebase Storage`);
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            success: true,
            products: [],
            message: `No ${category} products found - add some through the admin panel`
          })
        };
      }
      throw new Error(`Failed to fetch from Firebase Storage: ${response.status}`);
    }

    const products = await response.json();
    
    // Get cache headers from Firebase Storage response to pass through
    const cacheControl = response.headers.get('cache-control') || response.headers.get('Cache-Control');
    const etag = response.headers.get('etag') || response.headers.get('ETag');
    
    console.log(`Cache-Control: ${cacheControl}, ETag: ${etag}`);

    console.log(`Successfully loaded ${products.length} ${category} products from Firebase Storage CDN`);

    // Pass through Firebase Storage cache headers for proper CDN behavior
    const responseHeaders = {
      ...headers
    };
    
    if (cacheControl) responseHeaders['Cache-Control'] = cacheControl;
    if (etag) responseHeaders['ETag'] = etag;

    return {
      statusCode: 200,
      headers: responseHeaders,
      body: JSON.stringify({
        success: true,
        products: Array.isArray(products) ? products : [],
        message: `Loaded ${products.length} ${category} products from Firebase Storage CDN`
      })
    };

  } catch (error) {
    console.error(`Error loading ${category || 'unknown'} products:`, error);

    // Return proper error response without fallback products
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        products: [],
        error: `Failed to load products: ${error.message}`,
        message: 'Please check Firebase configuration and try again'
      })
    };
  }
};