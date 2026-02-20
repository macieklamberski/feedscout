import type { DiscoverUriEntry } from '../../../common/types.js'
import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { composeHint, isSubdomainOf } from '../../../common/utils.js'

const domains = ['hatenablog.com', 'hatenablog.jp', 'hateblo.jp']
const categoryPathRegex = /^\/archive\/category\/([^/]+)/
const authorPathRegex = /^\/archive\/author\/([^/]+)/

export const hatenablogHandler: PlatformHandler = {
  match: (url) => {
    return isSubdomainOf(url, domains)
  },

  resolve: (url) => {
    const { origin, pathname } = new URL(url)
    const uris: Array<DiscoverUriEntry> = []

    // Category page: /archive/category/{category}
    const categoryMatch = pathname.match(categoryPathRegex)

    if (categoryMatch?.[1]) {
      const category = categoryMatch[1]

      uris.push({
        uri: `${origin}/rss/category/${category}`,
        hint: composeHint('hatenablog:category-rss'),
      })
      uris.push({
        uri: `${origin}/feed/category/${category}`,
        hint: composeHint('hatenablog:category-atom'),
      })
    }

    // Author page: /archive/author/{author}
    const authorMatch = pathname.match(authorPathRegex)

    if (authorMatch?.[1]) {
      const author = authorMatch[1]

      uris.push({
        uri: `${origin}/rss/author/${author}`,
        hint: composeHint('hatenablog:author-rss'),
      })
      uris.push({
        uri: `${origin}/feed/author/${author}`,
        hint: composeHint('hatenablog:author-atom'),
      })
    }

    // Always include main blog feeds.
    uris.push({ uri: `${origin}/rss`, hint: composeHint('hatenablog:posts-rss') })
    uris.push({ uri: `${origin}/feed`, hint: composeHint('hatenablog:posts-atom') })

    return uris
  },
}
