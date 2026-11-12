import { getPathSegments, getQueryParam, isAnyOf, isHostOf, parseUrl } from 'trousse'
import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'

// Discoverability: Partially discoverable without handler.
// Generic covers userShow (html).
// Handler needed for: reviewList, shelf.

export type GoodreadsUrl =
  | { kind: 'user'; userId: string }
  | { kind: 'reviews'; userId: string; shelf?: string }

const hosts = ['goodreads.com', 'www.goodreads.com']

const feeds = definePlatformFeeds([
  {
    key: 'goodreads:shelf',
    template: 'https://www.goodreads.com/review/list_rss/{userId}?shelf={shelf}',
  },
  { key: 'goodreads:reviews', template: 'https://www.goodreads.com/review/list_rss/{userId}' },
  { key: 'goodreads:updates', template: 'https://www.goodreads.com/user/updates_rss/{userId}' },
])

// A user page is /user/show/{id}-{slug} and their review list /review/list/{id}-{slug}.
export const parseGoodreadsUrl = (url: string): GoodreadsUrl | undefined => {
  const parsedUrl = parseUrl(url)

  if (!parsedUrl || !isHostOf(parsedUrl, hosts)) {
    return
  }

  const [section, action, segment] = getPathSegments(url)
  const userId = Number.parseInt(segment ?? '', 10)

  if (!userId) {
    return
  }

  if (isAnyOf(section, 'user') && isAnyOf(action, 'show')) {
    return { kind: 'user', userId: String(userId) }
  }

  if (isAnyOf(section, 'review') && isAnyOf(action, 'list')) {
    const shelf = getQueryParam(parsedUrl.searchParams, 'shelf')

    return { kind: 'reviews', userId: String(userId), shelf }
  }
}

export const goodreadsHandler: PlatformHandler = {
  match: (url) => {
    return parseGoodreadsUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseGoodreadsUrl(url)

    if (!parsed) {
      return []
    }

    const { userId } = parsed

    if (parsed.kind === 'user') {
      return [
        feeds.getFeedEntry('goodreads:updates', { userId }),
        feeds.getFeedEntry('goodreads:reviews', { userId }),
      ]
    }

    if (parsed.shelf) {
      return [
        feeds.getFeedEntry('goodreads:shelf', { userId, shelf: parsed.shelf }),
        feeds.getFeedEntry('goodreads:reviews', { userId }),
        feeds.getFeedEntry('goodreads:updates', { userId }),
      ]
    }

    return [
      feeds.getFeedEntry('goodreads:reviews', { userId }),
      feeds.getFeedEntry('goodreads:updates', { userId }),
    ]
  },

  getFeedHint: (url) => {
    // A `key` parameter carries the account owner's private token.
    if (getQueryParam(parseUrl(url), 'key') !== undefined) {
      return
    }

    return feeds.getFeedHint(url)
  },
}
