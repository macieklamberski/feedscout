import { getPathSegments, isAnyOf } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint, getTenantSubdomain } from '../../common/utils.js'

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

  // A blog sits under its page slug, such as /articles/feed, or under a numeric blog id, such as
  // /1/feed.
  const first = getPathSegments(url)[0]?.replace(htmlSuffixRegex, '')

  if (first && !isAnyOf(first, 'blog')) {
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
    const page = parsed.page ?? 'blog'

    return [{ uri: `${origin}/${page}/feed`, hint: composeHint('weebly:blog') }]
  },
}
