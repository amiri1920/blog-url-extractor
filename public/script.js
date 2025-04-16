// DOM Elements
const inputDataEl = document.getElementById('input-data');
const clearBtn = document.getElementById('clear-btn');
const sampleBtn = document.getElementById('sample-btn');
const extractBtn = document.getElementById('extract-btn');
const totalUrlsEl = document.getElementById('total-urls');
const totalDomainsEl = document.getElementById('total-domains');
const domainStatsEl = document.getElementById('domain-stats');
const urlListEl = document.getElementById('url-list');
const copyUrlsBtn = document.getElementById('copy-urls');
const filterUrlsEl = document.getElementById('filter-urls');

// Sample data
const sampleData = [
  {
    "url": "https://www.searchenginejournal.com/",
    "markdown": "# Search Engine Journal - SEO News\n\n [![Article Title](https://example.com/image.jpg)](https://www.searchenginejournal.com/article-1/12345/)\n\n## [Google's Latest Update](https://www.searchenginejournal.com/google-update/54321/)\n\nBy [Author Name](https://www.searchenginejournal.com/author/name/)\n\nSome content here...",
    "text": "Search Engine Journal - SEO News\nGoogle's Latest Update\nSome content about SEO and marketing. Visit https://www.searchenginejournal.com/another-article/67890/ for more."
  },
  {
    "url": "https://www.searchengineland.com/",
    "markdown": "# Search Engine Land - SEO News\n\n [![Article Title](https://example.com/image2.jpg)](https://www.searchengineland.com/article-1/12345/)\n\n## [Bing's New Features](https://www.searchengineland.com/bing-features/54321/)\n\nBy [Author Name](https://www.searchengineland.com/author/name/)\n\nSome content here...",
    "text": "Search Engine Land - SEO News\nBing's New Features\nSome content about search. Visit https://www.searchengineland.com/another-article/67890/ for more."
  }
];

// Event Listeners
clearBtn.addEventListener('click', clearInput);
sampleBtn.addEventListener('click', loadSampleData);
extractBtn.addEventListener('click', extractUrls);
copyUrlsBtn.addEventListener('click', copyAllUrls);
filterUrlsEl.addEventListener('input', filterUrls);

// Functions
function clearInput() {
  inputDataEl.value = '';
  clearResults();
}

function loadSampleData() {
  inputDataEl.value = JSON.stringify(sampleData, null, 2);
}

function clearResults() {
  totalUrlsEl.textContent = '0';
  totalDomainsEl.textContent = '0';
  domainStatsEl.innerHTML = '';
  urlListEl.innerHTML = '';
}

async function extractUrls() {
  try {
    // Get and validate input
    const inputData = inputDataEl.value.trim();
    if (!inputData) {
      showError('Please enter scraping data');
      return;
    }

    // Clear previous results
    clearResults();
    
    // Show loading state
    showLoading(true);
    
    // Send data to API
    const response = await fetch('/api/extract', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ data: inputData })
    });
    
    const result = await response.json();
    
    // Hide loading state
    showLoading(false);
    
    if (!result.success) {
      showError(result.message || 'Error processing data');
      return;
    }
    
    // Display results
    displayResults(result);
    
  } catch (error) {
    showLoading(false);
    showError('Error: ' + error.message);
  }
}

function displayResults(data) {
  // Update stats
  totalUrlsEl.textContent = data.totalUrls;
  const domainsCount = Object.keys(data.urlsByDomain).length;
  totalDomainsEl.textContent = domainsCount;
  
  // Display domain breakdown
  const domains = Object.entries(data.urlsByDomain)
    .sort((a, b) => b[1] - a[1]); // Sort by count descending
  
  domainStatsEl.innerHTML = '';
  domains.forEach(([domain, count]) => {
    const domainDiv = document.createElement('div');
    domainDiv.className = 'domain-stat';
    domainDiv.innerHTML = `
      <span class="domain-name">${domain}</span>
      <span class="domain-count">${count}</span>
    `;
    domainStatsEl.appendChild(domainDiv);
  });
  
  // Display URL list
  urlListEl.innerHTML = '';
  data.extractedUrls.forEach(url => {
    const li = document.createElement('li');
    li.innerHTML = `<a href="${url}" target="_blank">${url}</a>`;
    urlListEl.appendChild(li);
  });
}

function copyAllUrls() {
  const urls = Array.from(urlListEl.querySelectorAll('a'))
    .map(a => a.href)
    .join('\n');
  
  if (!urls) {
    showError('No URLs to copy');
    return;
  }
  
  navigator.clipboard.writeText(urls)
    .then(() => {
      showSuccess('URLs copied to clipboard!');
    })
    .catch(err => {
      showError('Failed to copy: ' + err.message);
    });
}

function filterUrls() {
  const filterValue = filterUrlsEl.value.toLowerCase();
  const items = urlListEl.querySelectorAll('li');
  
  items.forEach(item => {
    const url = item.textContent.toLowerCase();
    if (url.includes(filterValue)) {
      item.style.display = '';
    } else {
      item.style.display = 'none';
    }
  });
}

function showError(message) {
  alert(message);
}

function showSuccess(message) {
  const original = copyUrlsBtn.textContent;
  copyUrlsBtn.textContent = message;
  copyUrlsBtn.disabled = true;
  
  setTimeout(() => {
    copyUrlsBtn.textContent = original;
    copyUrlsBtn.disabled = false;
  }, 2000);
}

function showLoading(isLoading) {
  if (isLoading) {
    extractBtn.textContent = 'Processing...';
    extractBtn.disabled = true;
  } else {
    extractBtn.textContent = 'Extract URLs';
    extractBtn.disabled = false;
  }
}