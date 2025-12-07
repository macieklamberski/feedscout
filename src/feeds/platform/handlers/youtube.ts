import { isAnyOf } from '../../../common/utils.js'
import type { PlatformHandler } from '../types.js'

const hosts = ['youtube.com', 'www.youtube.com', 'm.youtube.com']

export const youtubeHandler: PlatformHandler = {
  match: (url) => isAnyOf(new URL(url).hostname, hosts),

  resolve: async (url, fetchFn) => {
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

    // Handle URLs (@username) - try to fetch and extract channel ID.
    const handleMatch = parsedUrl.pathname.match(/^\/@([^/]+)/)

    if (handleMatch?.[1] && uris.length === 0) {
      try {
        const response = await fetchFn(url)

        if (response.status === 200 && typeof response.body === 'string') {
          // Look for channel ID in the page.
          const channelIdMatch = response.body.match(/"channelId":"(UC[a-zA-Z0-9_-]+)"/)

          if (channelIdMatch?.[1]) {
            uris.push(`https://www.youtube.com/feeds/videos.xml?channel_id=${channelIdMatch[1]}`)
          }
        }
      } catch {
        // Ignore fetch errors.
      }
    }

    return uris
  },
}
