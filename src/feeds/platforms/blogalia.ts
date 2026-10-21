import type { DiscoverUriEntry } from '../../common/types.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint, getTenantSubdomain } from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Generic partly covers blog.

export type BlogaliaUrl = { kind: 'blog' }

const domains = ['blogalia.com']

export const parseBlogaliaUrl = (url: string): BlogaliaUrl | undefined => {
  if (!getTenantSubdomain(url, domains)) {
    return
  }

  return { kind: 'blog' }
}

export const blogaliaHandler: PlatformHandler = {
  match: (url) => {
    return parseBlogaliaUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseBlogaliaUrl(url)

    if (!parsed) {
      return []
    }

    const { origin } = new URL(url)
    const uris: Array<DiscoverUriEntry> = []

    uris.push({ uri: `${origin}/rdf.xml`, hint: composeHint('blogalia:posts', 'rdf') })
    uris.push({ uri: `${origin}/rss20.xml`, hint: composeHint('blogalia:posts', 'rss') })

    return uris
  },
}
