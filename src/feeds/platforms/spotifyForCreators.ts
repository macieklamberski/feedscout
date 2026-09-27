import { isHostOf } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

const hosts = ['creators.spotify.com']

const showRegex = /^\/pod\/(?:show|profile)\/[^/]+(?:\/|$)/i
// The alternate link omits `/s/` and ends on HTML, and a show without RSS answers 404 on `/s/`.
// Only 2 of the 4 shows measured also show a visible `/s/` link, which generic discovery reads,
// so the block above holds for those shows alone.
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
