import { isHostOf } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

const hosts = ['creators.spotify.com']

const showRegex = /^\/pod\/(?:show|profile)\/[^/]+(?:\/|$)/i
// The page's alternate link omits `/s/` and ends on an HTML page. A show without RSS
// carries a `stationId` but no feed link, and its `/s/` feed answers 404. Generic discovery
// finds the feed only where the page also shows a visible `/s/` link, on 2 of the 4 shows
// measured, so the block above holds for those shows alone.
const feedUrlRegex = /anchor\.fm\/(?:s\/)?([\da-f]+)\/podcast\/rss/

export const spotifyForCreatorsHandler: PlatformHandler = {
  match: (url) => {
    if (!isHostOf(url, hosts)) {
      return false
    }

    return showRegex.test(new URL(url).pathname)
  },

  resolve: (_url, content) => {
    const stationId = content?.match(feedUrlRegex)?.[1]

    if (!stationId) {
      return []
    }

    return [
      {
        uri: `https://anchor.fm/s/${stationId}/podcast/rss`,
        hint: composeHint('spotify-for-creators:podcast'),
      },
    ]
  },
}
