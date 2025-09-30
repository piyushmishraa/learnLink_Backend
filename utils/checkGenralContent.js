import MetaInspector from 'node-metainspector';

// --- CONFIGURATION ---
const CONFIG = {
    MAX_URL_LENGTH: 1000,
    SCRAPE_TIMEOUT: 10000,
    REQUEST_TIMEOUT: 5000,
    MAX_CONTENT_LENGTH: 3000,
    MIN_CONTENT_CONFIDENCE: 0.7,
    CACHE_TTL: 3600000, // 1 hour
};

// --- CACHING LAYER ---
class ResultCache {
    constructor() {
        this.cache = new Map();
    }

    get(url) {
        const entry = this.cache.get(url);
        if (!entry) return null;
        
        if (Date.now() - entry.timestamp > CONFIG.CACHE_TTL) {
            this.cache.delete(url);
            return null;
        }
        return entry.result;
    }

    set(url, result) {
        this.cache.set(url, {
            result,
            timestamp: Date.now()
        });
    }

    clear() {
        this.cache.clear();
    }
}

const cache = new ResultCache();

// --- ENHANCED SECURITY FUNCTIONS ---
function isValidUrl(url) {
    if (!url || typeof url !== 'string') return false;
    
    try {
        const parsedUrl = new URL(url);
        
        // Length check
        if (url.length > CONFIG.MAX_URL_LENGTH) return false;
        
        // Protocol check
        if (!['http:', 'https:'].includes(parsedUrl.protocol)) return false;
        
        // Hostname validation
        const hostname = parsedUrl.hostname.toLowerCase();
        
        // Block localhost and private IPs
        const privatePatterns = [
            /^localhost$/i,
            /^127\./,
            /^192\.168\./,
            /^10\./,
            /^172\.(1[6-9]|2[0-9]|3[01])\./,
            /^169\.254\./, // Link-local
            /^::1$/, // IPv6 localhost
            /^fe80::/i // IPv6 link-local
        ];
        
        if (privatePatterns.some(pattern => pattern.test(hostname))) {
            return false;
        }
        
        // Block suspicious TLDs
        const suspiciousTlds = ['.tk', '.ml', '.cf', '.onion'];
        if (suspiciousTlds.some(tld => hostname.endsWith(tld))) {
            return false;
        }
        
        return true;
    } catch {
        return false;
    }
}

function normalizeText(text) {
    if (!text) return '';
    return text
        .normalize('NFKD')
        .replace(/[^\w\s]/g, ' ')
        .replace(/\s+/g, ' ')
        .toLowerCase()
        .trim();
}

// --- ENHANCED DOMAIN LISTS ---
const DOMAINS = {
    educational: [
        // Coding platforms
        'github.com', 'stackoverflow.com', 'stackexchange.com', 'codepen.io',
        'jsfiddle.net', 'codesandbox.io', 'replit.com', 'glitch.com',
        
        // Learning platforms
        'freecodecamp.org', 'codecademy.com', 'udemy.com', 'coursera.org',
        'edx.org', 'khanacademy.org', 'pluralsight.com', 'lynda.com',
        'udacity.com', 'treehouse.com', 'skillshare.com',
        
        // Documentation and references
        'developer.mozilla.org', 'mdn.io', 'w3schools.com', 'w3.org',
        'docs.python.org', 'nodejs.org', 'reactjs.org', 'vuejs.org',
        'angular.io', 'django-doc.readthedocs.io', 'flask.palletsprojects.com',
        
        // Practice platforms
        'leetcode.com', 'hackerrank.com', 'codewars.com', 'codesignal.com',
        'topcoder.com', 'codeforces.com', 'atcoder.jp',
        
        // Tech blogs and resources
        'dev.to', 'medium.com', 'hashnode.com', 'css-tricks.com',
        'smashingmagazine.com', 'alistapart.com', 'scotch.io'
    ],
    
    blocked: [
        // Social media
        'tiktok.com', 'instagram.com', 'facebook.com', 'twitter.com', 'x.com',
        'snapchat.com', 'pinterest.com', 'linkedin.com',
        
        // Entertainment
        'netflix.com', 'hulu.com', 'disney.com', 'disneyplus.com',
        'youtube.com', 'youtu.be', 'vimeo.com', 'twitch.tv',
        
        // Shopping
        'amazon.com', 'ebay.com', 'alibaba.com', 'etsy.com',
        'shopify.com', 'walmart.com', 'target.com',
        
        // News and general content
        'reddit.com', 'buzzfeed.com', 'tmz.com', 'dailymail.co.uk'
    ]
};

// --- ENHANCED KEYWORD SYSTEM ---
const KEYWORDS = {
    strong_educational: [
        // Learning indicators
        'tutorial', 'course', 'lesson', 'guide', 'documentation', 'reference',
        'walkthrough', 'how to', 'step by step', 'beginners', 'fundamentals',
        'crash course', 'masterclass', 'bootcamp', 'workshop', 'training',
        
        // Programming concepts
        'programming', 'coding', 'development', 'software engineering',
        'algorithm', 'data structure', 'design pattern', 'best practices',
        'clean code', 'refactoring', 'debugging', 'testing', 'deployment'
    ],
    
    educational: [
        // Languages and frameworks (condensed for space)
        'javascript', 'python', 'java', 'react', 'angular', 'vue', 'node',
        'django', 'flask', 'spring', 'express', 'laravel', 'rails',
        'html', 'css', 'sql', 'mongodb', 'postgresql', 'redis',
        'docker', 'kubernetes', 'aws', 'azure', 'gcp', 'git', 'linux'
    ],
    
    strong_negative: [
        'official video', 'music video', 'lyrics', 'gameplay', 'funny',
        'hilarious', 'prank', 'memes', 'fails', 'compilation', 'vlog',
        'unboxing', 'haul', 'gossip', 'celebrity', 'dating', 'relationship'
    ],
    
    negative: [
        'entertainment', 'movie', 'trailer', 'episode', 'season', 'netflix',
        'spotify', 'gaming', 'esports', 'fortnite', 'minecraft', 'tiktok',
        'instagram', 'shopping', 'deal', 'discount', 'crypto', 'bitcoin'
    ]
};

// --- SCORING SYSTEM ---
function calculateContentScore(text) {
    const normalizedText = normalizeText(text);
    const words = normalizedText.split(' ');
    
    let score = 0;
    let totalMatches = 0;
    
    // Strong educational indicators
    KEYWORDS.strong_educational.forEach(keyword => {
        if (normalizedText.includes(keyword)) {
            score += 3;
            totalMatches++;
        }
    });
    
    // Regular educational keywords
    KEYWORDS.educational.forEach(keyword => {
        if (normalizedText.includes(keyword)) {
            score += 1;
            totalMatches++;
        }
    });
    
    // Strong negative indicators
    KEYWORDS.strong_negative.forEach(keyword => {
        if (normalizedText.includes(keyword)) {
            score -= 4;
            totalMatches++;
        }
    });
    
    // Regular negative keywords
    KEYWORDS.negative.forEach(keyword => {
        if (normalizedText.includes(keyword)) {
            score -= 2;
            totalMatches++;
        }
    });
    
    // Normalize score based on content length and matches
    const lengthFactor = Math.min(words.length / 50, 1); // Cap at 50 words
    const confidenceScore = totalMatches > 0 ? (score / totalMatches) * lengthFactor : 0;
    
    return {
        rawScore: score,
        normalizedScore: confidenceScore,
        totalMatches,
        confidence: Math.min(Math.abs(confidenceScore), 1)
    };
}

// --- ENHANCED DOMAIN CHECKING ---
function checkDomain(url) {
    const hostname = new URL(url).hostname.toLowerCase();
    
    // Check educational domains
    const isEducational = DOMAINS.educational.some(domain => 
        hostname === domain || hostname.endsWith('.' + domain)
    );
    
    if (isEducational) {
        return { approved: true, source: 'domain_allowlist', confidence: 1.0 };
    }
    
    // Check blocked domains
    const isBlocked = DOMAINS.blocked.some(domain => 
        hostname === domain || hostname.endsWith('.' + domain)
    );
    
    if (isBlocked) {
        return { 
            approved: false, 
            reason: "Content from this domain is not permitted.", 
            source: 'domain_blocklist',
            confidence: 1.0 
        };
    }
    
    return null; // Unknown domain, needs content analysis
}

// --- MAIN FUNCTION WITH IMPROVEMENTS ---
export async function checkGeneralContent(url, userSubmittedTitle = '') {
    try {
        // Input validation
        if (!url || typeof url !== 'string') {
            return { approved: false, reason: "Invalid URL provided." };
        }
        
        // Check cache first
        const cacheKey = `${url}|${userSubmittedTitle}`;
        const cachedResult = cache.get(cacheKey);
        if (cachedResult) {
            return { ...cachedResult, cached: true };
        }
        
        // URL validation
        if (!isValidUrl(url)) {
            const result = { approved: false, reason: "Invalid or potentially unsafe URL format." };
            cache.set(cacheKey, result);
            return result;
        }
        
        // Domain-based checking
        const domainResult = checkDomain(url);
        if (domainResult) {
            cache.set(cacheKey, domainResult);
            return domainResult;
        }
        
        // Title-based pre-screening
        if (userSubmittedTitle) {
            const titleScore = calculateContentScore(userSubmittedTitle);
            
            if (titleScore.confidence > CONFIG.MIN_CONTENT_CONFIDENCE) {
                if (titleScore.normalizedScore < -0.5) {
                    const result = { 
                        approved: false, 
                        reason: "Title indicates non-educational content.",
                        source: 'title_analysis',
                        confidence: titleScore.confidence
                    };
                    cache.set(cacheKey, result);
                    return result;
                }
                
                if (titleScore.normalizedScore > 0.5) {
                    const result = { 
                        approved: true, 
                        source: 'title_analysis',
                        confidence: titleScore.confidence
                    };
                    cache.set(cacheKey, result);
                    return result;
                }
            }
        }
        
        // Content scraping with enhanced error handling
        const scrapingResult = await scrapeAndAnalyze(url, userSubmittedTitle);
        cache.set(cacheKey, scrapingResult);
        return scrapingResult;
        
    } catch (error) {
        console.error('Content filter error:', error);
        return { 
            approved: false, 
            reason: "System error during content analysis. Manual review required.",
            error: true
        };
    }
}

// --- ENHANCED SCRAPING FUNCTION ---
async function scrapeAndAnalyze(url, userSubmittedTitle) {
    return new Promise((resolve) => {
        const timeoutId = setTimeout(() => {
            resolve({ 
                approved: false, 
                reason: "Website response timeout. Manual review required.",
                source: 'scraping_timeout'
            });
        }, CONFIG.SCRAPE_TIMEOUT);
        
        try {
            const client = new MetaInspector(url, { 
                timeout: CONFIG.REQUEST_TIMEOUT,
                maxRedirects: 3
            });
            
            client.on('fetch', function() {
                clearTimeout(timeoutId);
                
                try {
                    // Gather all text content
                    const pageTitle = client.title || '';
                    const pageDescription = client.description || '';
                    const bodyText = (client.response?.body || '').substring(0, CONFIG.MAX_CONTENT_LENGTH);
                    const keywords = (client.keywords || []).join(' ');
                    
                    const allContent = [
                        userSubmittedTitle,
                        pageTitle,
                        pageDescription,
                        keywords,
                        bodyText
                    ].join(' ');
                    
                    const contentScore = calculateContentScore(allContent);
                    
                    // Decision logic based on scoring
                    if (contentScore.confidence < CONFIG.MIN_CONTENT_CONFIDENCE) {
                        resolve({ 
                            approved: false, 
                            reason: "Unable to determine content type with confidence. Manual review required.",
                            source: 'low_confidence',
                            confidence: contentScore.confidence
                        });
                    } else if (contentScore.normalizedScore > 0.3) {
                        resolve({ 
                            approved: true,
                            source: 'content_analysis',
                            confidence: contentScore.confidence,
                            score: contentScore.normalizedScore
                        });
                    } else {
                        resolve({ 
                            approved: false, 
                            reason: "Content analysis suggests non-educational material.",
                            source: 'content_analysis',
                            confidence: contentScore.confidence,
                            score: contentScore.normalizedScore
                        });
                    }
                    
                } catch (analysisError) {
                    console.error('Content analysis error:', analysisError);
                    resolve({ 
                        approved: false, 
                        reason: "Error analyzing content. Manual review required.",
                        source: 'analysis_error'
                    });
                }
            });
            
            client.on('error', function(err) {
                clearTimeout(timeoutId);
                console.error('Scraping error:', err);
                resolve({ 
                    approved: false, 
                    reason: "Unable to access website for verification. Manual review required.",
                    source: 'scraping_error'
                });
            });
            
            client.fetch();
            
        } catch (error) {
            clearTimeout(timeoutId);
            console.error('Scraping setup error:', error);
            resolve({ 
                approved: false, 
                reason: "Technical error during content verification. Manual review required.",
                source: 'setup_error'
            });
        }
    });
}

// --- UTILITY FUNCTIONS ---
export function clearCache() {
    cache.clear();
}

export function getCacheStats() {
    return {
        size: cache.cache.size,
        entries: Array.from(cache.cache.keys()).slice(0, 10) // First 10 for debugging
    };
}

export function updateKeywords(category, words, operation = 'add') {
    if (!KEYWORDS[category]) return false;
    
    if (operation === 'add') {
        KEYWORDS[category].push(...words);
    } else if (operation === 'remove') {
        words.forEach(word => {
            const index = KEYWORDS[category].indexOf(word);
            if (index > -1) KEYWORDS[category].splice(index, 1);
        });
    }
    
    return true;
}

// --- ANALYTICS HELPER ---
export function analyzeText(text) {
    const score = calculateContentScore(text);
    return {
        score: score,
        recommendation: score.confidence > CONFIG.MIN_CONTENT_CONFIDENCE ? 
            (score.normalizedScore > 0.3 ? 'APPROVE' : 'REJECT') : 'MANUAL_REVIEW'
    };
}