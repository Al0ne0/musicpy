import express from 'express';
import cors from 'cors';
import axios from 'axios';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import asyncHandler from 'express-async-handler';
import { searchYouTube, getY2MateLink, getPlaylistVideos, getHomeVideos } from './scraper.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Serve static frontend in production
app.use(express.static(join(__dirname, '..', 'dist')));

app.get('/api/home', asyncHandler(async (req, res) => {
    const cookie = req.headers['x-youtube-cookie'] || '';
    const results = await getHomeVideos(cookie);
    res.json(results);
}));

app.get('/api/search', asyncHandler(async (req, res) => {
    const { q } = req.query;
    const cookie = req.headers['x-youtube-cookie'] || '';
    if (!q) return res.status(400).json({ error: 'Query parameter "q" is required' });
    const results = await searchYouTube(q, cookie);
    res.json(results);
}));

app.get('/api/download-link', asyncHandler(async (req, res) => {
    const { videoId } = req.query;
    if (!videoId) return res.status(400).json({ error: 'Video ID is required' });
    const result = await getY2MateLink(videoId);
    res.json(result);
}));

app.get('/api/playlist', async (req, res) => {
    const { list } = req.query;
    const cookie = req.headers['x-youtube-cookie'] || '';
    if (!list) return res.status(400).json({ error: 'Playlist ID is required' });
    const videos = await getPlaylistVideos(list, cookie);
    res.json(videos);
});

app.get('/api/proxy-download', async (req, res) => {
    const { url, filename } = req.query;
    if (!url) return res.status(400).json({ error: 'URL is required' });

    try {
        console.log(`Proxying download: ${url}`);
        const response = await axios({
            method: 'get',
            url: url,
            responseType: 'stream',
            timeout: 25000,
            headers: {
                'User-Agent':'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
                'Accept': '*/*',
                'Referer': 'https://iframe.y2meta-uk.com/',
                'Origin': 'https://iframe.y2meta-uk.com'
            }
        });

        res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename || 'download.mp3')}"`);
        res.setHeader('Content-Type', 'audio/mpeg');
        response.data.pipe(res);
        
        response.data.on('error', (err) => {
            console.error('Stream Error:', err.message);
        });
    } catch (error) {
        console.error('Proxy Download Error:', error.message);
        if (!res.headersSent) {
            res.status(500).json({ error: 'Failed to proxy download', details: error.message });
        }
    }
});

// SPA catch-all - serve index.html for any non-API route
app.get('/*splat', (req, res, next) => {
  res.sendFile(join(__dirname, '..', 'dist', 'index.html'));
});


app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
