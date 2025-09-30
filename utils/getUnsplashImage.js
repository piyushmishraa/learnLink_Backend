import fetch from 'node-fetch';

export const getUnsplashImage = async (imageQuery) => {
    const API_URL = `https://api.unsplash.com/photos/random?query=${encodeURIComponent(imageQuery)}&orientation=landscape`;
    
    try {
        const response = await fetch(API_URL, {
            method: 'GET',
            headers: {
                'Authorization': `Client-ID ${process.env.UNSPLASH_ACCESS_KEY}`
            }
        });

        if (!response.ok) {
            throw new Error(`Unsplash API error: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        return {
            imageUrl: data.urls.regular,
            photographerName: data.user.name,
            photographerUsername: data.user.username
        };
        
    } catch (error) {
        console.error('Failed to fetch image from Unsplash:', error);
        return null;
    }
};