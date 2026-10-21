import { getPathSegments, isAnyOf } from 'trousse'
import type { DiscoverUriEntry } from '../../common/types.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint, getTenantSubdomain } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

export type BloggoUrl = { kind: 'blog' } | { kind: 'post'; slug: string }
export type BloggoPage = BloggoUrl

const domains = ['bloggo.nu']

const postBodyRegex = /<body[^>]*\bpost-id-\d+/

// The about page and the feed belong to the blog, not to a post.
const blogPaths = ['about', 'feed']

export const parseBloggoUrl = (url: string): BloggoUrl | undefined => {
  const subdomain = getTenantSubdomain(url, domains)

  if (!subdomain) {
    return
  }

  const segments = getPathSegments(url)
  const [slug] = segments

  if (segments.length === 1 && slug && !isAnyOf(slug, blogPaths)) {
    return { kind: 'post', slug }
  }

  return { kind: 'blog' }
}

export const getBloggoPage = (url: string, content: string | undefined): BloggoPage | undefined => {
  const parsed = parseBloggoUrl(url)

  if (!parsed) {
    return
  }

  // A made-up post answers its comments feed with a 200 placeholder channel, and only a real
  // post page carries a post-id body class.
  if (parsed.kind === 'post' && content && !postBodyRegex.test(content)) {
    return { kind: 'blog' }
  }

  return parsed
}

export const bloggoHandler: PlatformHandler = {
  match: (url) => {
    return parseBloggoUrl(url) !== undefined
  },

  resolve: (url, content) => {
    const page = getBloggoPage(url, content)

    if (!page) {
      return []
    }

    // Every page redirects to https and its feed links spell https.
    const origin = `https://${new URL(url).hostname}`
    const uris: Array<DiscoverUriEntry> = []

    if (page.kind === 'post') {
      uris.push({
        uri: `${origin}/${page.slug}/feed/`,
        hint: composeHint('bloggo:post-comments'),
      })
    }

    uris.push({ uri: `${origin}/feed/`, hint: composeHint('bloggo:posts') })

    return uris
  },
}
