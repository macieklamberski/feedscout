import { spotifyForCreators } from 'feedintel'
import { getPathSegments, isHostOf, parseUrl } from 'trousse'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'

// Discoverability: Discoverable without handler.

export type SpotifyForCreatorsUrl = { kind: 'show' }
export type SpotifyForCreatorsPage = { kind: 'show'; stationId: string }

const hosts = spotifyForCreators.hosts.exact

const showRegex = /^\/pod\/(?:show|profile)\/[^/]+(?:\/|$)/i
// The alternate link omits `/s/` and ends on HTML, and a show without RSS answers 404 on `/s/`.
// Only 2 of the 4 shows measured also show a visible `/s/` link, which generic discovery reads,
// so the block above holds for those shows alone.
const feedUrlRegex = /anchor\.fm\/(?:s\/)?([\da-f]+)\/podcast\/rss/i
const stationIdRegex = /^[\da-f]/i

const feeds = withHintLabels(spotifyForCreators.feeds)

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

    return [feeds.getFeedEntry('podcast', { stationId: page.stationId })]
  },

  // A station id starts with hex, and a word in its place answers 404.
  getFeedHint: (url) => {
    const [, stationId] = getPathSegments(url)

    if (!stationId || !stationIdRegex.test(stationId)) {
      return
    }

    return feeds.getFeedHint(url)
  },
}
