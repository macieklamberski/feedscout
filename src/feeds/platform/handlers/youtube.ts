import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { isHostOf } from '../../../common/utils.js'

const hosts = ['youtube.com', 'www.youtube.com', 'm.youtube.com']
const channelIdRegex = /"channelId":"(UC[a-zA-Z0-9_-]+)"/
const channelPathRegex = /^\/channel\/(UC[a-zA-Z0-9_-]+)/
const handlePathRegex = /^\/@([^/]+)/
const userPathRegex = /^\/user\/([^/]+)/
const customPathRegex = /^\/c\/([^/]+)/

const extractChannelIdFromContent = (content: string): string | undefined => {
  const match = content.match(channelIdRegex)

  return match?.[1]
}

// Convert channel ID to playlist ID for videos-only feed (excludes shorts).
// YouTube uses special playlist prefixes: UC = all, UULF = videos only, UUSH = shorts only.
const getVideosOnlyPlaylistId = (channelId: string): string => {
  return channelId.replace(/^UC/, 'UULF')
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
    if (uris.length === 0 && content) {
      const needsContentParsing =
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
        }
      }
    }

    return uris
  },
}
