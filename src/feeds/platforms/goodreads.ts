import { getPathSegments, isHostOf } from 'trousse'
import type { DiscoverUriEntry } from '../../common/types.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

export type GoodreadsUrl = { kind: 'user'; userId: string } | { kind: 'reviews'; userId: string }

const hosts = ['goodreads.com', 'www.goodreads.com']

// A user page is /user/show/{id}-{slug} and their review list /review/list/{id}-{slug}.
export const parseGoodreadsUrl = (url: string): GoodreadsUrl | undefined => {
  if (!isHostOf(url, hosts)) {
    return
  }

  const [section, action, segment] = getPathSegments(url)
  const userId = Number.parseInt(segment ?? '', 10)

  if (!userId) {
    return
  }

  if (section === 'user' && action === 'show') {
    return { kind: 'user', userId: String(userId) }
  }

  if (section === 'review' && action === 'list') {
    return { kind: 'reviews', userId: String(userId) }
  }
}

export const goodreadsHandler: PlatformHandler = {
  match: (url) => {
    return isHostOf(url, hosts)
  },

  resolve: (url) => {
    const { origin, searchParams } = new URL(url)
    const parsed = parseGoodreadsUrl(url)
    const shelf = searchParams.get('shelf')

    if (parsed?.kind === 'user') {
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

    if (parsed?.kind !== 'reviews') {
      return []
    }

    const uris: Array<DiscoverUriEntry> = []

    if (shelf) {
      uris.push({
        uri: `${origin}/review/list_rss/${parsed.userId}?shelf=${encodeURIComponent(shelf)}`,
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
