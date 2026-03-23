import axios from 'axios';
import * as cheerio from 'cheerio';

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

export async function searchYouTube(query, cookie = '') {
  try {
    const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}&hl=es`;
    const headers = { 'User-Agent': USER_AGENT };
    if (cookie) headers['Cookie'] = cookie;
    
    const response = await axios.get(url, { headers });

    const body = response.data;
    const initialDataMatch = body.match(/var ytInitialData = ({.*?});<\/script>/);
    if (!initialDataMatch) {
      // Falling back to a simpler check if script tag is different
      const altMatch = body.match(/ytInitialData\s*=\s*({.+?});/);
      if (!altMatch) return [];
      var initialData = JSON.parse(altMatch[1]);
    } else {
      var initialData = JSON.parse(initialDataMatch[1]);
    }

    const contents = initialData.contents.twoColumnSearchResultsRenderer.primaryContents.sectionListRenderer.contents[0].itemSectionRenderer.contents;

    return contents
      .filter(item => item.videoRenderer)
      .map(item => {
        const video = item.videoRenderer;
        return {
          id: video.videoId,
          title: video.title.runs[0].text,
          thumbnail: video.thumbnail.thumbnails[0].url,
          duration: video.lengthText ? video.lengthText.simpleText : 'N/A',
          channel: video.ownerText.runs[0].text,
          views: video.viewCountText ? video.viewCountText.simpleText : 'N/A',
          url: `https://www.youtube.com/watch?v=${video.videoId}`
        };
      });
  } catch (error) {
    console.error('YouTube Search Error:', error.message);
    return [];
  }
}

export async function getY2MateLink(videoId) {
  try {
    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;

    // Step 1: Get sanity key (from the research)
    const sanityRes = await axios.get('https://cnv.cx/v2/sanity/key', {
      headers: {
        'User-Agent': USER_AGENT,
        'Origin': 'https://iframe.y2meta-uk.com',
        'Referer': 'https://iframe.y2meta-uk.com/'
      }
    });
    const key = sanityRes.data.key || sanityRes.data; // Adjust based on actual response structure if needed

    // Step 2: Request conversion
    const convertRes = await axios.post('https://cnv.cx/v2/converter',
      new URLSearchParams({
        link: videoUrl,
        format: 'mp3',
        audioBitrate: '320',
        videoQuality: '720',
        filenameStyle: 'pretty',
        vCodec: 'h264'
      }).toString(),
      {
        headers: {
          'User-Agent': USER_AGENT,
          'key': key,
          'Origin': 'https://iframe.y2meta-uk.com',
          'Referer': 'https://iframe.y2meta-uk.com/',
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );

    let data = convertRes.data;

    // Polling logic if taskId is returned
    if (data.taskId) {
      let attempts = 0;
      const maxAttempts = 30; // 30 seconds max

      while (attempts < maxAttempts) {
        const statusRes = await axios.get(`https://cnv.cx/v2/task-status?taskId=${data.taskId}`, {
          headers: {
            'User-Agent': USER_AGENT,
            'key': key,
            'Origin': 'https://iframe.y2meta-uk.com',
            'Referer': 'https://iframe.y2meta-uk.com/'
          }
        });

        data = statusRes.data;
        if (data.status === 'tunnel') break;
        if (data.status === 'failed') throw new Error('Conversion task failed');

        attempts++;
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    if (data.status === 'tunnel') {
      return {
        downloadUrl: data.url,
        filename: data.filename
      };
    }

    throw new Error('Conversion failed or timed out');
  } catch (error) {
    console.error('Y2Mate Scraping Error:', error.message);
    throw error;
  }
}

export async function getHomeVideos(cookie = '') {
  try {
    const url = `https://www.youtube.com/?hl=es`;
    const headers = { 'User-Agent': USER_AGENT };
    if (cookie) headers['Cookie'] = cookie;

    const response = await axios.get(url, { headers });

    const body = response.data;
    const initialDataMatch = body.match(/var ytInitialData = ({.*?});<\/script>/);
    if (!initialDataMatch) {
      const altMatch = body.match(/ytInitialData\s*=\s*({.+?});/);
      if (!altMatch) return [];
      var initialData = JSON.parse(altMatch[1]);
    } else {
      var initialData = JSON.parse(initialDataMatch[1]);
    }
    const contents = initialData.contents.twoColumnBrowseResultsRenderer.tabs[0].tabRenderer.content.richGridRenderer.contents;

    const extracted = contents
      .map(item => {
        if (item.richItemRenderer && item.richItemRenderer.content.videoRenderer) {
          const video = item.richItemRenderer.content.videoRenderer;
          return {
            type: 'video',
            id: video.videoId,
            title: video.title.runs[0].text,
            thumbnail: video.thumbnail.thumbnails[0].url,
            duration: video.lengthText ? video.lengthText.simpleText : 'N/A',
            channel: video.shortBylineText?.runs?.[0]?.text || '',
            views: video.viewCountText ? video.viewCountText.simpleText : 'N/A',
            url: `https://www.youtube.com/watch?v=${video.videoId}`
          };
        }
        if (item.richItemRenderer && item.richItemRenderer.content.playlistRenderer) {
          const playlist = item.richItemRenderer.content.playlistRenderer;
          return {
            type: 'playlist',
            id: playlist.playlistId,
            title: playlist.title.simpleText,
            thumbnail: playlist.thumbnails[0].thumbnails[0].url,
            videoCount: playlist.videoCount,
            channel: playlist.shortBylineText?.runs?.[0]?.text || '',
            url: `https://www.youtube.com/playlist?list=${playlist.playlistId}`
          };
        }
        return null;
      })
      .filter(item => item !== null);
      
    if (extracted.length === 0) throw new Error("Empty extraction");
    return extracted;
  } catch (error) {
    console.error('YouTube Home failed, falling back to search:', error.message);
    return await searchYouTube('música', cookie);
  }
}

export async function getPlaylistVideos(playlistId, cookie = '') {
  try {
    const url = `https://www.youtube.com/playlist?list=${playlistId}&hl=es`;
    const headers = { 'User-Agent': USER_AGENT };
    if (cookie) headers['Cookie'] = cookie;

    const response = await axios.get(url, { headers });

    const body = response.data;
    const initialDataMatch = body.match(/var ytInitialData = ({.*?});<\/script>/);
    if (!initialDataMatch) return [];

    const initialData = JSON.parse(initialDataMatch[1]);
    const contents = initialData.contents.twoColumnBrowseResultsRenderer.tabs[0].tabRenderer.content.sectionListRenderer.contents[0].itemSectionRenderer.contents[0].playlistVideoListRenderer.contents;

    return contents
      .filter(item => item.playlistVideoRenderer)
      .map(item => {
        const video = item.playlistVideoRenderer;
        return {
          id: video.videoId,
          title: video.title.runs[0].text,
          thumbnail: video.thumbnail.thumbnails[0].url,
          duration: video.lengthText ? video.lengthText.simpleText : 'N/A',
          channel: video.shortBylineText.runs[0].text,
          url: `https://www.youtube.com/watch?v=${video.videoId}`
        };
      });
  } catch (error) {
    console.error('Playlist Scraping Error:', error.message);
    return [];
  }
}
