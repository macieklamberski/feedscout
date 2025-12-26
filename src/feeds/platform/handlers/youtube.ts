import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { isHostOf } from '../../../common/utils.js'

const hosts = ['youtube.com', 'www.youtube.com', 'm.youtube.com', 'youtu.be', 'www.youtu.be']
const channelIdRegex = /"channelId":"(UC[a-zA-Z0-9_-]+)"/
const channelPathRegex = /^\/channel\/(UC[a-zA-Z0-9_-]+)/
const handlePathRegex = /^\/@([^/]+)/
const userPathRegex = /^\/user\/([^/]+)/
const customPathRegex = /^\/c\/([^/]+)/

const extractChannelIdFromContent = (content: string): string | undefined => {
  const match = content.match(channelIdRegex)

  return match?.[1]
}

// Convert channel ID to playlist ID for filtered feeds.
// YouTube uses special playlist prefixes: UC = all, UULF = videos only, UUSH = shorts only.
const getVideosOnlyPlaylistId = (channelId: string): string => {
  return channelId.replace(/^UC/, 'UULF')
}

const getShortsOnlyPlaylistId = (channelId: string): string => {
  return channelId.replace(/^UC/, 'UUSH')
}

export const youtubeHandler: PlatformHandler = {
  match: (url) => {
    return isHostOf(url, hosts)
  },

  resolve: (url, content) => {
    const parsedUrl = new URL(url)
    const uris: Array<string> = []

    // Direct channel ID: /channel/UC...
    const channelMatch = parsedUrl.pathname.match(channelPathRegex)

    if (channelMatch?.[1]) {
      const channelId = channelMatch[1]

      uris.push(`https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`)
      uris.push(
        `https://www.youtube.com/feeds/videos.xml?playlist_id=${getVideosOnlyPlaylistId(channelId)}`,
      )
      uris.push(
        `https://www.youtube.com/feeds/videos.xml?playlist_id=${getShortsOnlyPlaylistId(channelId)}`,
      )
    }

    // Playlist: /playlist?list=PL...
    const playlistId = parsedUrl.searchParams.get('list')

    if (playlistId) {
      uris.push(`https://www.youtube.com/feeds/videos.xml?playlist_id=${playlistId}`)
    }

    // For URL formats that require content parsing to get channel ID:
    // - Handle: /@username
    // - Legacy user: /user/username
    // - Custom URL: /c/customname
    // - Video pages: /watch?v= or youtu.be/videoId
    if (uris.length === 0 && content) {
      const isVideoPage =
        parsedUrl.searchParams.has('v') ||
        (parsedUrl.hostname.includes('youtu.be') && parsedUrl.pathname.length > 1)
      const needsContentParsing =
        isVideoPage ||
        parsedUrl.pathname.match(handlePathRegex) ||
        parsedUrl.pathname.match(userPathRegex) ||
        parsedUrl.pathname.match(customPathRegex)

      if (needsContentParsing) {
        const channelId = extractChannelIdFromContent(content)

        if (channelId) {
          uris.push(`https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`)
          uris.push(
            `https://www.youtube.com/feeds/videos.xml?playlist_id=${getVideosOnlyPlaylistId(channelId)}`,
          )
          uris.push(
            `https://www.youtube.com/feeds/videos.xml?playlist_id=${getShortsOnlyPlaylistId(channelId)}`,
          )
        }
      }
    }

    return uris
  },
}
