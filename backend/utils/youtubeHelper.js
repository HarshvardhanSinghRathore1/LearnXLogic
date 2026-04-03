const { google } = require('googleapis');

// Note: initialize youtube instance dynamically to ensure process.env is read after dotenv config configures it
const getYoutubeService = () => {
    return google.youtube({
        version: 'v3',
        auth: process.env.YOUTUBE_API_KEY
    });
};

const extractPlaylistId = (url) => {
    const regExp = /[?&]list=([^#\&\?]+)/;
    const match = url.match(regExp);
    return match && match[1] ? match[1] : url; // If just ID is passed
};

async function fetchPlaylistDetails(playlistUrl) {
    try {
        const playlistId = extractPlaylistId(playlistUrl);
        const youtube = getYoutubeService();

        // 1. Get Playlist Title and Thumbnail
        const playlistResponse = await youtube.playlists.list({
            part: 'snippet',
            id: playlistId
        });

        if (!playlistResponse.data.items || playlistResponse.data.items.length === 0) {
            throw new Error("Playlist not found");
        }

        const playlistSnippet = playlistResponse.data.items[0].snippet;
        const title = playlistSnippet.title;
        const thumbnail = playlistSnippet.thumbnails?.high?.url || '';

        // 2. Get Video Items
        let videos = [];
        let nextPageToken = null;

        do {
            const playlistItemsResponse = await youtube.playlistItems.list({
                part: 'snippet',
                playlistId: playlistId,
                maxResults: 50,
                pageToken: nextPageToken
            });

            const items = playlistItemsResponse.data.items;
            
            for (let item of items) {
                videos.push({
                    videoId: item.snippet.resourceId.videoId,
                    title: item.snippet.title,
                    duration: '00:00' // YouTube Data API v3 requires a separate call to videos.list for durations. Mocking for now to save quota.
                });
            }

            nextPageToken = playlistItemsResponse.data.nextPageToken;
        } while (nextPageToken && videos.length < 200); // hard cap at 200 to save API calls

        return {
            playlistId,
            title,
            thumbnail,
            videos
        };
    } catch (error) {
        console.error("YouTube API Error:", error.message);
        throw new Error("Failed to fetch YouTube playlist details.");
    }
}

module.exports = { fetchPlaylistDetails, extractPlaylistId };
