const express = require('express');
const cors = require('cors');
const axios = require('axios');
const { GoogleGenAI } = require('@google/genai');

require('dotenv').config();

const app = express();
const port = 4560;

app.use(cors());
app.use(express.json());

if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not set in the environment variables.");
}
const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const spotifyClientId = process.env.SPOTIFY_CLIENT_ID;
const spotifyClientSecret = process.env.SPOTIFY_CLIENT_SECRET;

const getSpotifyToken = async () => {
    try {
        const response = await axios.post('https://accounts.spotify.com/api/token',
            'grant_type=client_credentials', {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Authorization': 'Basic ' + Buffer.from(spotifyClientId + ':' + spotifyClientSecret).toString('base64')
                }
            });
        return response.data.access_token;
    } catch (error) {
        console.error('Error fetching Spotify token:', error.response ? error.response.data : error.message);
        throw new Error('Failed to authenticate with Spotify.');
    }
};

app.post('/api/generate-playlist', async (req, res) => {
    const { mood } = req.body;

    if (!mood) {
        return res.status(400).json({ error: 'Mood prompt is required.' });
    }

    try {
        const prompt = `
            Based on the mood or activity: "${mood}", generate a concise and effective search query string to find relevant tracks on Spotify.
            The query could be a combination of genres, artists, descriptive terms, or even a fictional playlist title.
            Return ONLY the search query string. Do not include any other text, labels, or explanations.
            
            Examples:
            - Mood: "rainy day focus" -> Query: "lo-fi beats for studying"
            - Mood: "80s retro party" -> Query: "80s synth-pop hits"
            - Mood: "feeling adventurous and epic" -> Query: "epic orchestral film score"
        `;

        const response = await genAI.models.generateContent({
          model: 'gemini-2.5-flash-preview-05-20',
          contents: prompt,
        })
        const searchQuery = response.text.trim();

        console.log('Generated search query:', searchQuery);

        if (!searchQuery) {
            throw new Error('Gemini could not generate a valid search query for the given mood.');
        }

        const token = await getSpotifyToken();

        const searchResponse = await axios.get('https://api.spotify.com/v1/search', {
            headers: {
                'Authorization': `Bearer ${token}`
            },
            params: {
                q: searchQuery,
                type: 'track',
                limit: 20
            }
        });

        const tracks = searchResponse.data.tracks.items.map(track => ({
            id: track.id,
            name: track.name,
            artists: track.artists.map(artist => artist.name).join(', '),
            duration: track.duration_ms,
            albumName: track.album.name,
            albumArt: track.album.images[0]?.url || 'https://via.placeholder.com/150',
            url: track.external_urls.spotify
        }));

        res.json({ tracks });

    } catch (error) {
        console.error('Error in playlist generation process:', error.response ? error.response.data : error.message);
        res.status(500).json({ error: 'Failed to generate playlist. ' + (error.message || 'Please try a different mood.') });
    }
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
