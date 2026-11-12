import { getPathSegments, isAnyOf } from 'trousse'
import type { DiscoverUriEntry } from '../../common/types.js'
import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { getTenantSubdomain } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

export type BloggoUrl = { kind: 'blog' } | { kind: 'post'; slug: string }
export type BloggoPage = BloggoUrl

const domains = ['bloggo.nu']

const postBodyRegex = /<body[^>]*\bpost-id-\d+/

// Every page redirects to https and its feed links spell https.
const feeds = definePlatformFeeds([
  { key: 'bloggo:posts', template: 'https://{blog}.bloggo.nu/feed/' },
  { key: 'bloggo:post-comments', template: 'https://{blog}.bloggo.nu/{slug}/feed/' },
])

// The about page belongs to the blog, not to a post.
const blogPaths = ['about']

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
    const blog = getTenantSubdomain(url, domains)

    if (!page || !blog) {
      return []
    }

    const uris: Array<DiscoverUriEntry> = []

    if (page.kind === 'post') {
      uris.push(feeds.getFeedEntry('bloggo:post-comments', { blog, slug: page.slug }))
    }

    uris.push(feeds.getFeedEntry('bloggo:posts', { blog }))

    return uris
  },

  getFeedHint: feeds.getFeedHint,
}
