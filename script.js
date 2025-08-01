// Replace YOUR_API_KEY_HERE with your actual API key (or use simple version below)
const API_KEY = 'AIzaSyCxgTk1lBlOa-uzuyEolsu6aqaiuSVoCM4';
let currentDevice = 'mobile';
let lastTestedDomain = '';
let testResults = null;

function runSpeedTest() {
    const domain = document.getElementById('domainInput').value.trim();
    const firstName = document.getElementById('firstName').value.trim();
    const clientLink = document.getElementById('clientLink').value.trim();
    
    if (!domain) {
        showError('Please enter a domain to test');
        return;
    }
    
    // Auto-fill domain input from client link if empty
    if (clientLink && !domain) {
        try {
            const url = new URL(clientLink);
            document.getElementById('domainInput').value = url.hostname;
        } catch (e) {
            // Invalid URL, continue with manual input
        }
    }
    
    const url = domain.startsWith('http') ? domain : `https://${domain}`;
    lastTestedDomain = url;
    
    // For simple version without API key, uncomment the next line and comment out performTest
    // openPageSpeedInsights(url);
    performTest(url, currentDevice);
}

// Simple version - opens PageSpeed Insights in new tab
function openPageSpeedInsights(url) {
    window.open(`https://pagespeed.web.dev/report?url=${encodeURIComponent(url)}`, '_blank');
}

// Full API version
async function performTest(url, strategy) {
    const loading = document.getElementById('loading');
    const results = document.getElementById('results');
    const error = document.getElementById('error');
    const button = document.getElementById('testButton');
    
    loading.classList.remove('hidden');
    results.classList.add('hidden');
    error.classList.add('hidden');
    button.disabled = true;
    
    try {
        const apiUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(url)}&strategy=${strategy}&key=${API_KEY}`;
        
        const response = await fetch(apiUrl);
        
        if (!response.ok) {
            throw new Error('Failed to fetch data');
        }
        
        const data = await response.json();
        testResults = data;
        displayResults(data);
        generateEmailScript();
        
    } catch (err) {
        showError('Error running test. Please check the domain and try again.');
        console.error(err);
    } finally {
        loading.classList.add('hidden');
        button.disabled = false;
    }
}

function displayResults(data) {
    const results = document.getElementById('results');
    results.classList.remove('hidden');
    
    const categories = data.lighthouseResult.categories;
    
    updateScore('performanceScore', categories.performance.score);
    updateScore('accessibilityScore', categories.accessibility.score);
    updateScore('bestPracticesScore', categories['best-practices'].score);
    updateScore('seoScore', categories.seo.score);
    
    const metrics = data.lighthouseResult.audits;
    
    document.getElementById('fcp').textContent = metrics['first-contentful-paint'].displayValue;
    document.getElementById('lcp').textContent = metrics['largest-contentful-paint'].displayValue;
    document.getElementById('tbt').textContent = metrics['total-blocking-time'].displayValue;
    document.getElementById('cls').textContent = metrics['cumulative-layout-shift'].displayValue;
    document.getElementById('speedIndex').textContent = metrics['speed-index'].displayValue;
}

function updateScore(elementId, score) {
    const element = document.getElementById(elementId);
    const scoreValue = Math.round(score * 100);
    element.textContent = scoreValue;
    
    element.classList.remove('good', 'average', 'poor');
    
    if (scoreValue >= 90) {
        element.classList.add('good');
    } else if (scoreValue >= 50) {
        element.classList.add('average');
    } else {
        element.classList.add('poor');
    }
}

function generateEmailScript() {
    const firstName = document.getElementById('firstName').value.trim() || 'there';
    const clientLink = document.getElementById('clientLink').value.trim();
    const domain = document.getElementById('domainInput').value.trim();
    
    if (!testResults) return;
    
    const categories = testResults.lighthouseResult.categories;
    const performanceScore = Math.round(categories.performance.score * 100);
    const accessibilityScore = Math.round(categories.accessibility.score * 100);
    const bestPracticesScore = Math.round(categories['best-practices'].score * 100);
    const seoScore = Math.round(categories.seo.score * 100);
    
    const metrics = testResults.lighthouseResult.audits;
    const fcp = metrics['first-contentful-paint'].displayValue;
    const lcp = metrics['largest-contentful-paint'].displayValue;
    
    // Determine overall performance level
    let performanceLevel = 'needs improvement';
    if (performanceScore >= 90) {
        performanceLevel = 'excellent';
    } else if (performanceScore >= 50) {
        performanceLevel = 'moderate';
    }
    
    const emailScript = `Hi ${firstName},

I hope this email finds you well. I've completed a comprehensive performance analysis of ${clientLink || domain} using Google's Lighthouse testing tool, and I wanted to share the results with you.

📊 PERFORMANCE REPORT SUMMARY:

Overall Performance Score: ${performanceScore}/100 (${performanceLevel})
${performanceScore < 90 ? '\nYour website\'s performance score indicates there are opportunities for improvement that could significantly enhance your users\' experience and potentially improve your search rankings.' : '\nGreat news! Your website is performing well, though there may still be some opportunities for optimization.'}

Key Metrics:
• Performance: ${performanceScore}/100 ${getScoreEmoji(performanceScore)}
• Accessibility: ${accessibilityScore}/100 ${getScoreEmoji(accessibilityScore)}
• Best Practices: ${bestPracticesScore}/100 ${getScoreEmoji(bestPracticesScore)}
• SEO: ${seoScore}/100 ${getScoreEmoji(seoScore)}

⏱️ LOADING SPEED DETAILS:

• First Contentful Paint: ${fcp}
  (This is when users first see content on your page)

• Largest Contentful Paint: ${lcp}
  (This is when the main content becomes visible)

${performanceScore < 70 ? `
🚨 WHY THIS MATTERS:

1. User Experience: ${performanceScore < 50 ? 'Users may be experiencing frustratingly slow load times, which often leads to higher bounce rates.' : 'Users may notice some delays, which could impact engagement.'}

2. SEO Impact: Google uses page speed as a ranking factor. Improving your performance score could help improve your search visibility.

3. Conversion Rates: Studies show that a 1-second delay in page load time can result in a 7% reduction in conversions.
` : ''}

💡 NEXT STEPS:

I'd be happy to discuss these results with you in more detail and create a plan to ${performanceScore < 90 ? 'improve your website\'s performance' : 'further optimize your website'}. Some immediate areas we could focus on include:

${performanceScore < 70 ? '• Image optimization and lazy loading\n• Reducing JavaScript execution time\n• Implementing caching strategies' : '• Fine-tuning performance for
