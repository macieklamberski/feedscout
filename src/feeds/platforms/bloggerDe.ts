import { bloggerDe } from 'feedintel'
import { decodeSegment, getPathSegments } from 'trousse'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { getTenantSubdomain } from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Generic finds: posts.
// Handler needed for: posts-comments, topic.

export type BloggerDeUrl =
  | { kind: 'blog'; blog: string }
  | { kind: 'topic'; blog: string; topic: string }

const domains = bloggerDe.hosts.tenants

const feeds = withHintLabels(bloggerDe.feeds)

export const parseBloggerDeUrl = (url: string): BloggerDeUrl | undefined => {
  // A nested subdomain like a.b.blogger.de fails TLS, since the certificate covers one label.
  const blog = getTenantSubdomain(url, domains)

  if (!blog) {
    return
  }

  // A topic path writes a space as `+`, as `/topics/Best+of+2006/`.
  const [route, segment] = getPathSegments(url)
  const topic = route === 'topics' ? decodeSegment(segment?.replaceAll('+', ' ')) : undefined

  if (topic) {
    return { kind: 'topic', blog, topic }
  }

  return { kind: 'blog', blog }
}

export const bloggerDeHandler: PlatformHandler = {
  match: (url) => {
    return parseBloggerDeUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseBloggerDeUrl(url)
    const page = feeds.forUrl(url)

    if (!parsed || !page) {
      return []
    }

    if (parsed.kind === 'topic') {
      return [
        page.getFeedEntry('topic', { topic: parsed.topic }),
        page.getFeedEntry('posts'),
        page.getFeedEntry('posts-comments'),
      ]
    }

    return [page.getFeedEntry('posts'), page.getFeedEntry('posts-comments')]
  },

  getFeedHint: feeds.getFeedHint,
}
