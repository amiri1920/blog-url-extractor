const express = require('express');
const router = express.Router();

// URL extraction function
function extractBlogPostUrls(items) {
  // Array to store unique blog post URLs
  const uniqueUrls = new Set();
  // Stats tracking with dynamic domain keys
  const stats = {
    total: 0,
    bySite: {}
  };

  // Helper function to extract domain from URL
  function extractDomain(url) {
    try {
      const hostname = new URL(url).hostname;
      return hostname;
    } catch (e) {
      return "unknown";
    }
  }

  // Helper function to add URL to results and update stats
  function addUrl(url) {
    if (!uniqueUrls.has(url)) {
      uniqueUrls.add(url);
      stats.total++;
      
      const domain = extractDomain(url);
      if (!stats.bySite[domain]) {
        stats.bySite[domain] = 0;
      }
      stats.bySite[domain]++;
    }
  }

  // Process each item in the input array
  if (!Array.isArray(items)) {
    items = [items]; // Convert to array if single item
  }

  items.forEach(item => {
    try {
      // Check if the item has markdown content (preferred source)
      if (item.markdown) {
        // Use regex to find all URLs in markdown content - more generic pattern
        const markdownUrlRegex = /\[.*?\]\((https?:\/\/[^)]+\/[^)]*\d+[^)]*\/)\)/g;
        let match;
        
        while ((match = markdownUrlRegex.exec(item.markdown)) !== null) {
          addUrl(match[1]);
        }
        
        // Additional pattern for other markdown link formats
        const altMarkdownUrlRegex = /href="(https?:\/\/[^\s"]+\/[^\s"]*\d+[^\s"]*\/)"/g;
        while ((match = altMarkdownUrlRegex.exec(item.markdown)) !== null) {
          addUrl(match[1]);
        }
      }
      
      // Extract from URL field if available
      if (item.url && item.url.includes("http")) {
        addUrl(item.url);
      }
      
      // Fallback to plain text content
      if (item.text) {
        // Simple regex to find URLs in text content - more generic pattern
        const textUrlRegex = /(https?:\/\/[^\s]+\/[^\s]*\d+[^\s]*\/)/g;
        let match;
        
        while ((match = textUrlRegex.exec(item.text)) !== null) {
          addUrl(match[1]);
        }
      }
    } catch (error) {
      console.error(`Error processing item: ${error.message}`);
    }
  });

  // Convert Set to Array for the final output
  return {
    urls: Array.from(uniqueUrls),
    stats
  };
}

// POST endpoint to extract URLs
router.post('/extract', (req, res) => {
  try {
    const data = req.body.data;
    
    // Handle empty or invalid input
    if (!data) {
      return res.status(400).json({
        success: false,
        message: 'No data provided'
      });
    }
    
    // Parse the data if it's a string (JSON string)
    let parsedData;
    if (typeof data === 'string') {
      try {
        parsedData = JSON.parse(data);
      } catch (e) {
        return res.status(400).json({
          success: false,
          message: 'Invalid JSON format'
        });
      }
    } else {
      parsedData = data;
    }
    
    // Process the data
    const result = extractBlogPostUrls(parsedData);
    
    // Return the results
    return res.json({
      success: true,
      extractedUrls: result.urls,
      totalUrls: result.stats.total,
      urlsByDomain: result.stats.bySite
    });
  } catch (error) {
    console.error('Error processing request:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error processing request',
      error: error.message
    });
  }
});

module.exports = router;