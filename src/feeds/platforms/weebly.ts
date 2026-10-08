import { getPathSegments, isAnyOf, isSubdomainOf } from 'trousse'
import type { DiscoverUriEntry } from '../../common/types.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint } from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Generic covers blog, blogPath (html), partly covers blogCustomSlug.

export type WeeblyUrl = { kind: 'blog'; page?: string }

const domains = ['weebly.com']
const numericRegex = /^\d+$/

export const parseWeeblyUrl = (url: string): WeeblyUrl | undefined => {
  if (!isSubdomainOf(url, domains)) {
    return
  }

  // Custom blog page slug (e.g., /articles/feed when page is named "articles").
  const [first] = getPathSegments(url)

  if (first && !isAnyOf(first, 'blog') && !numericRegex.test(first)) {
    return { kind: 'blog', page: first }
  }

  return { kind: 'blog' }
}

export const weeblyHandler: PlatformHandler = {
  match: (url) => {
    return parseWeeblyUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseWeeblyUrl(url)

    if (!parsed) {
      return []
    }

    const { origin } = new URL(url)
    const uris: Array<DiscoverUriEntry> = []

    if (parsed.page) {
      uris.push({
        uri: `${origin}/${parsed.page}/feed`,
        hint: composeHint('weebly:blog'),
      })
    }

    uris.push({ uri: `${origin}/blog/feed`, hint: composeHint('weebly:blog') })

    return uris
  },
}
