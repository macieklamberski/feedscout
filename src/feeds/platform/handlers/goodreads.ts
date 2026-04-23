import type { DiscoverUriEntry } from '../../../common/types.js'
import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { composeHint, isHostOf } from '../../../common/utils.js'

const hosts = ['goodreads.com', 'www.goodreads.com']

const parseUserId = (segment: string): number | undefined => {
  const id = Number.parseInt(segment, 10)

  return Number.isNaN(id) ? undefined : id
}

export const goodreadsHandler: PlatformHandler = {
  match: (url) => {
    return isHostOf(url, hosts)
  },

  resolve: (url) => {
    const { origin, pathname, searchParams } = new URL(url)
    const pathSegments = pathname.split('/').filter(Boolean)
    const shelf = searchParams.get('shelf')

    // User page: goodreads.com/user/show/{id}-{slug}
    if (pathSegments[0] === 'user' && pathSegments[1] === 'show' && pathSegments[2]) {
      const userId = parseUserId(pathSegments[2])

      if (userId) {
        return [
          {
            uri: `${origin}/user/updates_rss/${userId}`,
            hint: composeHint('goodreads:updates'),
          },
          {
            uri: `${origin}/review/list_rss/${userId}`,
            hint: composeHint('goodreads:reviews'),
          },
        ]
      }
    }

    // Review list page: goodreads.com/review/list/{id}-{slug}
    if (pathSegments[0] === 'review' && pathSegments[1] === 'list' && pathSegments[2]) {
      const userId = parseUserId(pathSegments[2])

      if (userId) {
        const uris: Array<DiscoverUriEntry> = []

        if (shelf) {
          uris.push({
            uri: `${origin}/review/list_rss/${userId}?shelf=${encodeURIComponent(shelf)}`,
            hint: composeHint('goodreads:shelf'),
          })
        }

        uris.push({
          uri: `${origin}/review/list_rss/${userId}`,
          hint: composeHint('goodreads:reviews'),
        })
        uris.push({
          uri: `${origin}/user/updates_rss/${userId}`,
          hint: composeHint('goodreads:updates'),
        })

        return uris
      }
    }

    return []
  },
}
