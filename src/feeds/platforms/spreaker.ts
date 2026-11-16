import { getPathSegments, isHostOf, parseUrl } from 'trousse'
import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { digitsRegex } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

export type SpreakerUrl = { kind: 'show'; showId: string }

const hosts = ['spreaker.com', 'www.spreaker.com']

const podcastRegex = /^\/podcast\/[\w-]+--(\d+)(?:\/|$)/i
// /show/{id} bare numeric form 301-redirects to the slug-suffixed canonical.
const showRegex = /^\/show\/(\d+)(?:\/|$)/i

const feeds = definePlatformFeeds([
  { key: 'spreaker:podcast', template: 'https://www.spreaker.com/show/{showId}/episodes/feed' },
  // The same feed cut to its newest episodes, as `items/3`.
  {
    key: 'spreaker:podcast',
    template: 'https://www.spreaker.com/show/{showId}/episodes/feed/items/{count}',
  },
])

export const parseSpreakerUrl = (url: string): SpreakerUrl | undefined => {
  const parsedUrl = parseUrl(url)

  if (!parsedUrl || !isHostOf(parsedUrl, hosts)) {
    return
  }

  const { pathname } = parsedUrl
  const showId = pathname.match(podcastRegex)?.[1] ?? pathname.match(showRegex)?.[1]

  if (!showId) {
    return
  }

  return { kind: 'show', showId }
}

export const spreakerHandler: PlatformHandler = {
  match: (url) => {
    return parseSpreakerUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseSpreakerUrl(url)

    if (!parsed) {
      return []
    }

    return [feeds.getFeedEntry('spreaker:podcast', { showId: parsed.showId })]
  },

  // A show id is digits, and a word in its place answers 404.
  getFeedHint: (url) => {
    const [, showId] = getPathSegments(url)

    if (!showId || !digitsRegex.test(showId)) {
      return
    }

    return feeds.getFeedHint(url)
  },
}
