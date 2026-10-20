import { getPathSegments, isAnyOf } from 'trousse'
import type { DiscoverUriEntry } from '../../common/types.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint, digitsRegex, getTenantSubdomain } from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Generic covers blog, blogPath (html), partly covers blogCustomSlug.

export type WeeblyUrl = { kind: 'blog'; page?: string }

const domains = ['weebly.com']
// A page address ends in `.html`, which redirects to the bare slug the blog feed sits under.
const htmlSuffixRegex = /\.html$/i

export const parseWeeblyUrl = (url: string): WeeblyUrl | undefined => {
  if (!getTenantSubdomain(url, domains)) {
    return
  }

  // Custom blog page slug (e.g., /articles/feed when page is named "articles").
  const first = getPathSegments(url)[0]?.replace(htmlSuffixRegex, '')

  if (first && !isAnyOf(first, 'blog') && !digitsRegex.test(first)) {
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
