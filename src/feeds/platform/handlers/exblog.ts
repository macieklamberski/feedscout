import { isSubdomainOf } from 'trousse'
import type { DiscoverUriEntry } from '../../../common/types.js'
import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { composeHint } from '../../../common/utils.js'

// Partially discoverable without handler.

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
