import { goodreads } from 'feedintel'
import { getPathSegments, getQueryParam, isAnyOf, isHostOf, parseUrl } from 'trousse'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'

// Discoverability: Unmeasured, handler emits no feed.

export type GoodreadsUrl =
  | { kind: 'user'; userId: string }
  | { kind: 'reviews'; userId: string; shelf?: string }

const hosts = goodreads.hosts.exact

const feeds = withHintLabels(goodreads.feeds)

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
      return [feeds.getFeedEntry('updates', { userId }), feeds.getFeedEntry('reviews', { userId })]
    }

    if (parsed.shelf) {
      return [
        feeds.getFeedEntry('shelf', { userId, shelf: parsed.shelf }),
        feeds.getFeedEntry('reviews', { userId }),
        feeds.getFeedEntry('updates', { userId }),
      ]
    }

    return [feeds.getFeedEntry('reviews', { userId }), feeds.getFeedEntry('updates', { userId })]
  },

  getFeedHint: feeds.getFeedHint,
}
