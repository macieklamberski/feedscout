import type { DiscoverUriEntry } from '../../../common/types.js'
import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { composeHint, isSubdomainOf } from '../../../common/utils.js'

// Discoverability: Partially discoverable without handler.
//
// Excite Blog publishes RSS 2.0 and Atom feeds at `{user}.exblog.jp/index.xml`
// and `/atom.xml`, plus per-category variants at `/i{N}/index.xml` and
// `/i{N}/atom.xml`. Blog roots advertise the user-level feeds via HTML
// `<link rel="alternate">`, but category pages only link the user-level
// feeds; the handler is needed to emit both Atom variants and to surface
// the per-category RSS/Atom URIs that generic discovery would miss.

const categoryRegex = /^\/i(\d+)/

export const exblogHandler: PlatformHandler = {
  match: (url) => {
    return isSubdomainOf(url, 'exblog.jp')
  },

  resolve: (url) => {
    const { origin, pathname } = new URL(url)
    const uris: Array<DiscoverUriEntry> = []

    // Category page: /i{N}
    const categoryMatch = pathname.match(categoryRegex)

    if (categoryMatch?.[1]) {
      const categoryId = categoryMatch[1]

      uris.push({
        uri: `${origin}/i${categoryId}/index.xml`,
        hint: composeHint('exblog:category-rss'),
      })
      uris.push({
        uri: `${origin}/i${categoryId}/atom.xml`,
        hint: composeHint('exblog:category-atom'),
      })
    }

    uris.push({ uri: `${origin}/index.xml`, hint: composeHint('exblog:posts-rss') })
    uris.push({ uri: `${origin}/atom.xml`, hint: composeHint('exblog:posts-atom') })

    return uris
  },
}
