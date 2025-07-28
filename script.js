function runSpeedTest() {
    const domain = document.getElementById('domainInput').value.trim();
    
    if (!domain) {
        showError('Please enter a domain');
        return;
    }
    
    // Add https:// if no protocol specified
    const url = domain.startsWith('http') ? domain : `https://${domain}`;
    
    // Open PageSpeed Insights in a new tab
    window.open(`https://pagespeed.web.dev/report?url=${encodeURIComponent(url)}`, '_blank');
}

function showError(message) {
    const error = document.getElementById('error');
    error.textContent = message;
    error.classList.remove('hidden');
    
    // Hide error after 3 seconds
    setTimeout(() => {
        error.classList.add('hidden');
    }, 3000);
}

// Allow Enter key to trigger test
document.getElementById('domainInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        runSpeedTest();
    }
});

// Hide the unused elements for simple version
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('loading').style.display = 'none';
    document.getElementById('results').style.display = 'none';
});
