import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { isAnyOf } from '../../../common/utils.js'

const hosts = ['youtube.com', 'www.youtube.com', 'm.youtube.com']

const extractChannelIdFromContent = (content: string): string | undefined => {
  const match = content.match(/"channelId":"(UC[a-zA-Z0-9_-]+)"/)

  return match?.[1]
}

export const youtubeHandler: PlatformHandler = {
  match: (url) => {
    return isAnyOf(new URL(url).hostname, hosts)
  },

  resolve: (url, content) => {
    const parsedUrl = new URL(url)
    const uris: Array<string> = []

    // Direct channel ID: /channel/UC...
    const channelMatch = parsedUrl.pathname.match(/^\/channel\/(UC[a-zA-Z0-9_-]+)/)

    if (channelMatch?.[1]) {
      uris.push(`https://www.youtube.com/feeds/videos.xml?channel_id=${channelMatch[1]}`)
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
        parsedUrl.pathname.match(/^\/@([^/]+)/) ||
        parsedUrl.pathname.match(/^\/user\/([^/]+)/) ||
        parsedUrl.pathname.match(/^\/c\/([^/]+)/)

      if (needsContentParsing) {
        const channelId = extractChannelIdFromContent(content)

        if (channelId) {
          uris.push(`https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`)
        }
      }
    }

    return uris
  },
}
