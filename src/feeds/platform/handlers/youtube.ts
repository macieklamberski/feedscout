import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { isAnyOf } from '../../../common/utils.js'

const hosts = ['youtube.com', 'www.youtube.com', 'm.youtube.com']

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

    // Handle URLs (@username) - extract channel ID from content.
    const handleMatch = parsedUrl.pathname.match(/^\/@([^/]+)/)

    if (handleMatch?.[1] && uris.length === 0 && content) {
      const channelIdMatch = content.match(/"channelId":"(UC[a-zA-Z0-9_-]+)"/)

      if (channelIdMatch?.[1]) {
        uris.push(`https://www.youtube.com/feeds/videos.xml?channel_id=${channelIdMatch[1]}`)
      }
    }

    return uris
  },
}
