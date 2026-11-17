import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { getTenantSubdomain } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

export type CastosUrl = { kind: 'show'; slug: string }
export type CastosPage = { kind: 'show'; slug: string; feedId?: string }

const domains = ['castos.com']

// The feed id is opaque, so it is read from the feed link every show page carries.
const feedIdRegex = /https:\/\/feeds\.castos\.com\/([a-z0-9]+)/i

const feeds = definePlatformFeeds(
  [
    {
      key: 'castos:podcast',
      main: 'https://feeds.castos.com/{feedId}',
      aliases: [
        // The show site redirects /feed to its feeds.castos.com URL.
        '{scheme}://{host}/feed',
      ],
    },
  ],
  { domains },
)

export const parseCastosUrl = (url: string): CastosUrl | undefined => {
  const slug = getTenantSubdomain(url, domains)

  if (!slug) {
    return
  }

  return { kind: 'show', slug }
}

export const getCastosPage = (url: string, content: string | undefined): CastosPage | undefined => {
  const parsed = parseCastosUrl(url)

  if (!parsed) {
    return
  }

  return { ...parsed, feedId: content?.match(feedIdRegex)?.[1] }
}

export const castosHandler: PlatformHandler = {
  match: (url) => {
    return parseCastosUrl(url) !== undefined
  },

  resolve: (url, content) => {
    const page = getCastosPage(url, content)
    const pageFeeds = feeds.forUrl(url)

    if (!page || !pageFeeds) {
      return []
    }

    return [pageFeeds.getFeedEntry('castos:podcast', { feedId: page.feedId })]
  },

  getFeedHint: feeds.getFeedHint,
}
