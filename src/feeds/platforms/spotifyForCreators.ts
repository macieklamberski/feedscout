import { isHostOf, parseUrl } from 'trousse'
import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'

// Discoverability: Discoverable without handler.

export type SpotifyForCreatorsUrl = { kind: 'show' }
export type SpotifyForCreatorsPage = { kind: 'show'; stationId: string }

const hosts = ['creators.spotify.com']

const showRegex = /^\/pod\/(?:show|profile)\/[^/]+(?:\/|$)/i
// The alternate link omits `/s/` and ends on HTML, and a show without RSS answers 404 on `/s/`.
// Only 2 of the 4 shows measured also show a visible `/s/` link, which generic discovery reads,
// so the block above holds for those shows alone.
const feedUrlRegex = /anchor\.fm\/(?:s\/)?([\da-f]+)\/podcast\/rss/i

const feeds = definePlatformFeeds([
  { key: 'spotify-for-creators:podcast', template: 'https://anchor.fm/s/{stationId}/podcast/rss' },
])

export const parseSpotifyForCreatorsUrl = (url: string): SpotifyForCreatorsUrl | undefined => {
  const parsedUrl = parseUrl(url)

  if (!parsedUrl || !isHostOf(parsedUrl, hosts) || !showRegex.test(parsedUrl.pathname)) {
    return
  }

  return { kind: 'show' }
}

export const getSpotifyForCreatorsPage = (
  url: string,
  content: string | undefined,
): SpotifyForCreatorsPage | undefined => {
  const parsed = parseSpotifyForCreatorsUrl(url)
  const stationId = content?.match(feedUrlRegex)?.[1]

  if (!parsed || !stationId) {
    return
  }

  return { kind: 'show', stationId }
}

export const spotifyForCreatorsHandler: PlatformHandler = {
  match: (url) => {
    return parseSpotifyForCreatorsUrl(url) !== undefined
  },

  resolve: (url, content) => {
    const page = getSpotifyForCreatorsPage(url, content)

    if (!page) {
      return []
    }

    return [feeds.getFeedEntry('spotify-for-creators:podcast', { stationId: page.stationId })]
  },

  getFeedKey: feeds.getFeedKey,
}
