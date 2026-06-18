const express = require('express');
const axios = require('axios');
const app = express();
const PORT = 3001;

// Define your projects and their corresponding live URLs
const projectsToCheck = [
    { id: "01", name: "Nateflix", url: "" },
    { id: "02", name: "SWAPPR", url: "https://swappr.nateponds.com" },
    { id: "03", name: "AQUALINE", url: "https://aqualine.nateponds.com" },
    { id: "04", name: "Linko", url: "" }
];
// In-Memory Cache Variables
let statusCache = null;
let cacheTimestamp = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 Minutes in milliseconds

// Helper function to handle status assessment rules
async function assessProjectStatus(url) {
    if (!url || url === '#') {
        return 'blue'; // Rule Blue: No URL configured yet
    }

    try {
        const response = await axios.get(url, {
            timeout: 5000, 
            headers: { 'User-Agent': 'Portfolio-Status-Bot/1.0' },
            validateStatus: () => true // Prevents axios from automatically throwing on 4xx/5xx
        });

        // 🔴 FIX: If the server returns ANY HTTP error code (400-599), the site is down/broken.
        if (response.status >= 400) {
            return 'red'; 
        }
        
        // 🟡 Rule Yellow check: The request succeeded (200 OK), but what did it return?
        const contentType = response.headers['content-type'] || '';
        if (!contentType.includes('text/html')) {
            return 'yellow'; // It's a file stream or API endpoint, not a portfolio website
        }

        const htmlContent = String(response.data).toLowerCase();
        if (
            htmlContent.includes('apache2 ubuntu default page') ||
            htmlContent.includes('welcome to nginx') ||
            htmlContent.includes('under maintenance') ||
            htmlContent.includes('index of /')
        ) {
            return 'yellow'; // It's just a default placeholder page
        }

        return 'green'; // 🟢 Clean, valid, customized web landing page
    } catch (error) {
        return 'red'; // 🔴 Network failure, connection refused, or timeout
    }
}

// API Endpoint
app.get('/api/project-statuses', async (req, res) => {
    const now = Date.now();

    // Serve cached statuses if TTL has not expired
    if (statusCache && (now - cacheTimestamp < CACHE_TTL)) {
        return res.json(statusCache);
    }

    // Cache expired or missing -> Trigger fresh background asynchronous evaluations
    const updatedStatuses = {};
    
    await Promise.all(projectsToCheck.map(async (project) => {
        updatedStatuses[project.id] = await assessProjectStatus(project.url);
    }));

    // Update internal cache
    statusCache = updatedStatuses;
    cacheTimestamp = now;

    res.json(statusCache);
});

// Bind explicitly to localhost loopback for security
app.listen(PORT, '127.0.0.1', () => {
    console.log(`Portfolio Status API listening locally on port ${PORT}`);
});
