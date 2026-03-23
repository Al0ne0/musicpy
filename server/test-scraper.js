import axios from 'axios';
const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

function extractVideos(obj, results = []) {
  if (!obj || typeof obj !== 'object') return results;
  
  if (obj.videoRenderer && obj.videoRenderer.videoId) {
    results.push({ type: 'video', data: obj.videoRenderer });
  } else if (obj.playlistRenderer && obj.playlistRenderer.playlistId) {
    results.push({ type: 'playlist', data: obj.playlistRenderer });
  } else if (obj.gridVideoRenderer && obj.gridVideoRenderer.videoId) {
    results.push({ type: 'video', data: obj.gridVideoRenderer });
  } else if (obj.gridPlaylistRenderer && obj.gridPlaylistRenderer.playlistId) {
    results.push({ type: 'playlist', data: obj.gridPlaylistRenderer });
  }
  
  for (const key in obj) {
    extractVideos(obj[key], results);
  }
  return results;
}

(async () => {
  try {
    const res = await axios.get('https://www.youtube.com/?hl=es', { headers: { 'User-Agent': USER_AGENT } });
    const match = res.data.match(/var ytInitialData = ({.*?});<\/script>/) || res.data.match(/ytInitialData\s*=\s*({.+?});/);
    const data = JSON.parse(match[1]);
    const extracted = extractVideos(data.contents);
    console.log('Extracted items:', extracted.length);
    if(extracted.length > 0) {
        console.log(extracted[0]);
    }
  } catch (e) {
    console.error(e.message);
  }
})();
