import { isHostOf } from 'trousse'
import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { uuidRegex } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

export type Art19Url = { kind: 'show'; slug: string }

const hosts = ['art19.com', 'www.art19.com']

const showPathRegex = /^\/shows\/([^/]+)/i

// Stored feeds also name a show by its uuid, and the one segment placeholder claims both spellings.
const feeds = definePlatformFeeds([
  { key: 'art19:show', template: 'https://rss.art19.com/{slug}' },
  // A listener's private feed, such as an ad-free one, under a token no page gives.
  {
    key: 'art19:show',
    template: 'https://rss.art19.com/alternate_feeds/user/{slug}/{token}',
  },
])

export const parseArt19Url = (url: string): Art19Url | undefined => {
  if (!isHostOf(url, hosts)) {
    return
  }

  const slug = new URL(url).pathname.match(showPathRegex)?.[1]

  // A show page also answers under the show's uuid, and rss.art19.com serves a feed only under the
  // slug, which the page alone names.
  if (!slug || uuidRegex.test(slug)) {
    return
  }

  return { kind: 'show', slug }
}

export const art19Handler: PlatformHandler = {
  match: (url) => {
    return parseArt19Url(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseArt19Url(url)

    if (!parsed) {
      return []
    }

    return [feeds.getFeedEntry('art19:show', { slug: parsed.slug })]
  },

  getFeedHint: feeds.getFeedHint,
}
