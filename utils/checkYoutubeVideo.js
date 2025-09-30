import { google } from "googleapis";

const youtube = google.youtube({ version: 'v3', auth: process.env.GOOGLE_SAFE_API_KEY });

// --- FUNCTION: Checks for exact phrase matches ---
function containsExactPhrase(text, phrase) {
  const textWords = new Set(text.split(/\s+/));
  return phrase.split(/\s+/).every(word => textWords.has(word));
}

export const checkyoutubeVideo = async (url) => {
    const videoIdRegex = /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&]+)/;
    const match = url.match(videoIdRegex);
    const videoId = match ? match[1] : null;

    if (!videoId) {
        return { approved: false, reason: "This doesn't look like a valid YouTube video link." };
    }

    try {
        const videoInfo = await youtube.videos.list({
            part: 'snippet',
            id: videoId
        });

        if (!videoInfo.data.items || videoInfo.data.items.length === 0) {
            return { approved: false, reason: "YouTube video not found. It might be private, deleted, or the ID is invalid." };
        }

        const video = videoInfo.data.items[0];
        const title = video.snippet.title.toLowerCase();
        const description = video.snippet.description.toLowerCase();
        const tags = video.snippet.tags || [];

        const goodWords = [
            // Learning Formats & Content Types
            'tutorial', 'course', 'lecture', 'guide', 'how to', 'explain', 'walkthrough',
            'beginners', 'learning', 'fundamentals', 'crash course', 'full course',
            'masterclass', 'workshop', 'bootcamp', 'deep dive', 'overview', 'introduction',
            'documentation', 'article', 'blog', 'ebook', 'textbook', 'reference', 'cheatsheet',
            'example', 'demo', 'session', 'training', 'lesson', 'module', 'unit', 'primeagen',

            // Core Programming Concepts
            'programming', 'coding', 'development', 'software engineering', 'web development',
            'algorithm', 'data structure', 'pattern', 'paradigm', 'concept', 'principle',
            'framework', 'library', 'package', 'module', 'dependency',

            // Programming Languages (A massive list)
            'javascript', 'js', 'python', 'py', 'java', 'c++', 'cpp', 'c#', 'csharp',
            'go', 'golang', 'rust', 'ruby', 'php', 'swift', 'kotlin', 'typescript', 'ts',
            'scala', 'r language', 'dart', 'elixir', 'haskell', 'perl', 'lua',
            'html', 'css', 'sass', 'scss', 'sql', 'nosql',

            // Web Technologies
            'react', 'angular', 'vue', 'vue.js', 'svelte', 'next.js', 'nuxt.js',
            'node', 'node.js', 'express', 'django', 'flask', 'spring', 'spring boot',
            'laravel', 'ruby on rails', 'rails', 'asp.net', 'jquery',
            'api', 'rest', 'graphql', 'websocket', 'http', 'https', 'json', 'xml',

            // Data & Databases
            'database', 'db', 'sql', 'mysql', 'postgresql', 'postgres', 'sqlite', 'oracle',
            'mongodb', 'redis', 'elasticsearch', 'dynamodb', 'firebase', 'firestore',
            'data science', 'data analysis', 'machine learning', 'ml', 'ai', 'artificial intelligence',
            'big data', 'data visualization', 'etl',

            // Systems & DevOps
            'devops', 'git', 'github', 'gitlab', 'docker', 'kubernetes', 'k8s',
            'aws', 'amazon web services', 'azure', 'google cloud', 'gcp', 'cloud',
            'server', 'backend', 'frontend', 'fullstack', 'serverless', 'microservices',
            'linux', 'unix', 'bash', 'shell', 'scripting', 'command line', 'terminal',

            // Computer Science Fundamentals
            'computer science', 'cs', 'data structure', 'array', 'linked list', 'stack',
            'queue', 'tree', 'binary tree', 'graph', 'hash table', 'hashmap', 'set',
            'algorithm', 'sorting', 'searching', 'recursion', 'dynamic programming', 'dp',
            'time complexity', 'big o', 'space complexity', 'oop', 'object oriented',
            'functional programming', 'compiler', 'interpreter', 'operating system', 'os',

            // Specific Technologies & Tools
            'vscode', 'visual studio code', 'intellij', 'pycharm', 'webstorm', 'ide',
            'vim', 'neovim', 'emacs', 'terminal', 'command line', 'cli',
            'npm', 'yarn', 'pip', 'maven', 'gradle', 'webpack', 'babel', 'parcel',
            'jest', 'testing', 'unit test', 'integration test', 'tdd', 'ci', 'cd',

            // Problem Solving & Practice
            'problem solving', 'leetcode', 'hackerrank', 'codesignal', 'codewars',
            'interview', 'interview preparation', 'faang', 'career', 'resume', 'portfolio',
            'project', 'build', 'create', 'code along', 'challenge', 'exercise',

            // General Positive Educational Terms
            'learn', 'understand', 'master', 'build', 'create', 'develop', 'design',
            'implement', 'optimize', 'debug', 'deploy', 'secure', 'scale', 'performance',
            'best practices', 'clean code', 'refactor', 'version control', 'collaborate'
        ];

        const badWords = [
            // 1. Music & Audio (Specific phrases only - removed broad single words)
            'official video', 'lyrics', 'lyric', 'album',
            'spotify', 'soundcloud', 'rap', 'hip hop', 'pop', 'rock',
            'beat', 'instrumental', 'mix', 'remix', 'release',
            'mp3', 'download', 'playlist', 'concert', 'tour',

            // 2. Gaming & Esports (Specific phrases only - removed broad single words)
            'gameplay', 'walkthrough', 'playthrough', 'lets play',
            'ps5', 'xbox', 'nintendo', 'steam', 'epic games',
            'fortnite', 'minecraft', 'roblox', 'valorant', 'league of legends', 'lol',
            'dota', 'call of duty', 'warzone', 'overwatch', 'twitch',
            'esports', 'pro player', 'speedrun',

            // 3. Entertainment & Comedy
            'funny', 'comedy', 'hilarious', 'prank', 'joke', 'memes', 'meme',
            'fails', 'compilation', 'try not to laugh', 'tiktok', 'vine', 'reels',
            'shorts', 'celebrities', 'entertainment', 'gossip', 'rumor', 'hollywood',
            'bollywood',

            // 4. Vlogs & Lifestyle
            'vlog', 'vlogger', 'my day', 'routine', 'day in the life', 'lifestyle',
            'morning routine', 'night routine', 'get ready with me', 'grwm',
            'personal', 'storytime', 'q&a', 'question and answer',
            'story time', 'my story', 'travel', 'vacation', 'food',
            'cooking', 'recipe', 'fitness', 'workout', 'gym', 'motivation',

            // 5. Movies & TV
            'movie', 'film', 'trailer', 'clip', 'episode', 'series', 'season',
            'netflix', 'disney+', 'disney plus', 'hulu', 'hbo max', 'prime video',
            'amazon prime', 'cinema', 'theatre', 'actor', 'actress', 'director',
            'oscars', 'awards', 'tv show', 'anime', 'manga', 'cartoon',

            // 6. Shopping & Deals
            'shop', 'shopping', 'buy', 'purchase', 'deal', 'discount', 'sale',
            'offer', 'price', 'cost', 'amazon', 'ebay', 'alibaba', 'unboxing',
            'unbox', 'haul', 'sponsor', 'sponsored', 'advertisement', 'ad',
            'promo', 'promotion', 'affiliate link',

            // 7. Spam & Clickbait
            'free robux', 'free vbucks', 'how to get free', 'make money fast',
            'get rich', 'crypto', 'bitcoin', 'ethereum', 'nft', 'investment',
            'secret', 'exposed', 'they didn\'t want you to know', 'shocking',
            'you won\'t believe', 'gone wrong', 'gone sexual', 'almost died',
            'life hacks', 'trick', 'secret method',

            // 8. Adult & Inappropriate
            'dating', 'relationship', 'bf', 'gf', 'boyfriend', 'girlfriend',
            'crush', 'love', 'breakup', 'wedding', 'makeup', 'beauty', 'skincare',
            'fashion', 'outfit', 'style', 'asmr', 'satisfying', 'oddly satisfying',

            // 9. General Off-Topic
            'sports', 'football', 'soccer', 'nba', 'nfl', 'cricket', 'highlights',
            'podcast', 'documentary', 'physics', 'biology', 'politics', 'news',
            'current events', 'conspiracy'
        ];

        // --- Check for clues using EXACT PHRASE MATCHING ---
        const foundStrongGoodClue = goodWords.some(item => containsExactPhrase(title, item));
        const foundAnyGoodClue = goodWords.some(item => containsExactPhrase(title, item) || containsExactPhrase(description, item));
        
        const foundStrongBadClue = badWords.some(item => containsExactPhrase(title, item) || tags.some(tag => containsExactPhrase(tag.toLowerCase(), item)));
        const foundAnyBadClue = badWords.some(item => containsExactPhrase(title, item) || containsExactPhrase(description, item) || tags.some(tag => containsExactPhrase(tag.toLowerCase(), item)));

        // NEW & IMPROVED DECISION LOGIC
                // --- DEBUG: See what's being found ---
        console.log("=== DEBUG START ===");
        console.log("Title:", title);
        console.log("Description snippet:", description.substring(0, 200) + "...");
        console.log("First 10 tags:", tags.slice(0, 10));
        
        // Find which specific words are triggering
        const triggeringGoodWords = goodWords.filter(item => containsExactPhrase(title, item));
        const triggeringBadWords = badWords.filter(item => 
            containsExactPhrase(title, item) || 
            tags.some(tag => containsExactPhrase(tag.toLowerCase(), item))
        );
        
        console.log("Triggering good words in title:", triggeringGoodWords);
        console.log("Triggering bad words in title/tags:", triggeringBadWords);
        console.log("foundStrongGoodClue:", foundStrongGoodClue);
        console.log("foundStrongBadClue:", foundStrongBadClue);
        console.log("=== DEBUG END ===");

        // --- UPDATED DECISION LOGIC: EDUCATIONAL INTENT FIRST ---
        if (foundStrongGoodClue) {
            console.log("DECISION: APPROVED (Strong educational content found)");
            return { approved: true };
        } else if (foundStrongBadClue) {
            console.log("DECISION: REJECTED (Strong bad content found)");
            return { approved: false, reason: "This appears to be entertainment or gaming content, which is not allowed." };
        } else if (foundAnyGoodClue && !foundAnyBadClue) {
            console.log("DECISION: APPROVED (Some educational content found, no bad content)");
            return { approved: true };
        } else if (foundAnyBadClue) {
            console.log("DECISION: REJECTED (Some bad content found)");
            return { approved: false, reason: "This appears to be non-educational content." };
        } else {
            console.log("DECISION: MANUAL REVIEW (No clear signals)");
            return { approved: false, reason: "Our system couldn't confirm this is educational. It will be reviewed manually." };
        }
    } catch (error) {
        console.error('YouTube Detective had a problem:', error);
        return { approved: false, reason: "Temporary system error. Your video is pending manual review." };
    }
};
