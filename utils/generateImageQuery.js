// Fix the typo: gernerateImageQuery -> generateImageQuery
export const generateImageQuery = (title, category) => {
    const genericWords = new Set([
        'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
        'your', 'my', 'our', 'their', 'this', 'that', 'these', 'those', 'is', 'are', 'was', 'were',
        'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
        'should', 'may', 'might', 'can', 'must', 'about', 'into', 'over', 'under', 'again', 'further',
        'then', 'once', 'here', 'there', 'when', 'where', 'why', 'how', 'all', 'any', 'both', 'each',
        'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same',
        'so', 'than', 'too', 'very', 'just', 'now', 'out', 'up', 'down', 'off', 'above', 'below'
    ]);

    const allWords = `${title} ${category}`.toLowerCase().split(/\s+/); // makes an array of the words
    const uniqueWords = [];
    const seen = new Set();
    
    for (const word of allWords) {
        // Remove any non-alphanumeric characters
        const cleanWord = word.replace(/[^\w]/g, '');
        if (cleanWord.length > 2 &&
            !genericWords.has(cleanWord) &&
            !seen.has(cleanWord) &&
            !/^\d+$/.test(cleanWord)
        ) {
            uniqueWords.push(cleanWord);
            seen.add(cleanWord);
        }
    }
    
    const mainKeywords = uniqueWords.slice(0, 4); // take only first 4 words
    
    if (mainKeywords.length > 0) {
        return mainKeywords.join(' ') + ' programming computer code';
    } else {
        return `${category} programming computer technology`;
    }
};