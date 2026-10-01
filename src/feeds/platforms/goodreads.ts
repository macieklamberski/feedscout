import { getPathSegments, isAnyOf, isHostOf, parseUrl } from 'trousse'
import type { DiscoverUriEntry } from '../../common/types.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

export type GoodreadsUrl =
  | { kind: 'user'; userId: string }
  | { kind: 'reviews'; userId: string; shelf?: string }

const hosts = ['goodreads.com', 'www.goodreads.com']

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
    const shelf = parsedUrl.searchParams.get('shelf') ?? undefined

    return { kind: 'reviews', userId: String(userId), shelf }
  }
}

export const goodreadsHandler: PlatformHandler = {
  match: (url) => {
    return parseGoodreadsUrl(url) !== undefined
  },

  resolve: (url) => {
    const { origin } = new URL(url)
    const parsed = parseGoodreadsUrl(url)

    if (!parsed) {
      return []
    }

    if (parsed.kind === 'user') {
      return [
        {
          uri: `${origin}/user/updates_rss/${parsed.userId}`,
          hint: composeHint('goodreads:updates'),
        },
        {
          uri: `${origin}/review/list_rss/${parsed.userId}`,
          hint: composeHint('goodreads:reviews'),
        },
      ]
    }

    const uris: Array<DiscoverUriEntry> = []

    if (parsed.shelf) {
      uris.push({
        uri: `${origin}/review/list_rss/${parsed.userId}?shelf=${encodeURIComponent(parsed.shelf)}`,
        hint: composeHint('goodreads:shelf'),
      })
    }

    uris.push({
      uri: `${origin}/review/list_rss/${parsed.userId}`,
      hint: composeHint('goodreads:reviews'),
    })
    uris.push({
      uri: `${origin}/user/updates_rss/${parsed.userId}`,
      hint: composeHint('goodreads:updates'),
    })

    return uris
  },
}
