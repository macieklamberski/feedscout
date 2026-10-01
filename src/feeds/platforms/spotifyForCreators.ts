import { isHostOf, parseUrl } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

export type SpotifyForCreatorsUrl = { kind: 'show' }

const hosts = ['creators.spotify.com']

const showRegex = /^\/pod\/(?:show|profile)\/[^/]+(?:\/|$)/i
// The alternate link omits `/s/` and ends on HTML, and a show without RSS answers 404 on `/s/`.
// Only 2 of the 4 shows measured also show a visible `/s/` link, which generic discovery reads,
// so the block above holds for those shows alone.
const feedUrlRegex = /anchor\.fm\/(?:s\/)?([\da-f]+)\/podcast\/rss/

export const parseSpotifyForCreatorsUrl = (url: string): SpotifyForCreatorsUrl | undefined => {
  const parsedUrl = parseUrl(url)

  if (!parsedUrl || !isHostOf(parsedUrl, hosts) || !showRegex.test(parsedUrl.pathname)) {
    return
  }

  return { kind: 'show' }
}

export const spotifyForCreatorsHandler: PlatformHandler = {
  match: (url) => {
    return parseSpotifyForCreatorsUrl(url) !== undefined
  },

  resolve: (url, content) => {
    const parsed = parseSpotifyForCreatorsUrl(url)
    const stationId = content?.match(feedUrlRegex)?.[1]

    if (!parsed || !stationId) {
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
