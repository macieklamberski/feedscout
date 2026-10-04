import { getPathSegments, getSubdomain, isAnyOf } from 'trousse'
import type { DiscoverUriEntry } from '../../common/types.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

export type BloggoUrl = { kind: 'blog' } | { kind: 'post'; slug: string }

const domains = ['bloggo.nu']

// Bloggo's own services, not blogs.
const excludedSubdomains = ['admin', 'img', 'reg', 'static', 'www']
const excludedPaths = ['about', 'feed']
// A made-up post answers its comments feed with a 200 placeholder channel, and only a real
// post page carries a post-id body class.
const postBodyRegex = /<body[^>]*\bpost-id-\d+/

export const parseBloggoUrl = (url: string): BloggoUrl | undefined => {
  const subdomain = getSubdomain(url, domains)

  if (!subdomain || isAnyOf(subdomain, excludedSubdomains)) {
    return
  }

  const segments = getPathSegments(url)
  const [slug] = segments

  if (segments.length === 1 && slug && !isAnyOf(slug, excludedPaths)) {
    return { kind: 'post', slug }
  }

  return { kind: 'blog' }
}

export const bloggoHandler: PlatformHandler = {
  match: (url) => {
    return parseBloggoUrl(url) !== undefined
  },

  resolve: (url, content) => {
    const parsed = parseBloggoUrl(url)

    if (!parsed) {
      return []
    }

    // Every page redirects to https and its feed links spell https.
    const origin = `https://${new URL(url).hostname}`
    const uris: Array<DiscoverUriEntry> = []

    if (parsed.kind === 'post' && (!content || postBodyRegex.test(content))) {
      uris.push({
        uri: `${origin}/${parsed.slug}/feed/`,
        hint: composeHint('bloggo:post-comments'),
      })
    }

    uris.push({ uri: `${origin}/feed/`, hint: composeHint('bloggo:posts') })

    return uris
  },
}
