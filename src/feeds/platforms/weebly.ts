import { encodePathSegment, getPathSegments, isAnyOf } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint, formatSuffixRegex, getTenantSubdomain } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

export type WeeblyUrl = { kind: 'blog'; page?: string }

const domains = ['weebly.com']

export const parseWeeblyUrl = (url: string): WeeblyUrl | undefined => {
  if (!getTenantSubdomain(url, domains)) {
    return
  }

  // A blog sits under its page slug, such as /articles/feed, or under a numeric blog id, such as
  // /1/feed. A page address ends in `.html`, which redirects to the bare slug the blog feed sits
  // under.
  const first = getPathSegments(url)[0]?.replace(formatSuffixRegex, '')

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

    return [{ uri: `${origin}/${encodePathSegment(page)}/feed`, hint: composeHint('weebly:blog') }]
  },
}
