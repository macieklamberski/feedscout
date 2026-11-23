import { sapoBlogs } from 'feedintel'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { getTenantSubdomain } from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Generic finds: posts.
// Handler needed for: comments, post-comments, tag.

export type SapoBlogsUrl =
  | { kind: 'blog'; blog: string }
  | { kind: 'post'; blog: string; postId: string }
  | { kind: 'tag'; blog: string; tag: string }
export type SapoBlogsPage = SapoBlogsUrl

const domains = sapoBlogs.hosts.tenants

const feeds = withHintLabels(sapoBlogs.feeds)

export const parseSapoBlogsUrl = (url: string): SapoBlogsUrl | undefined => {
  const page = sapoBlogs.pages.read(url)
  const blog = getTenantSubdomain(url, domains)

  if (!page || !blog) {
    return
  }

  if (page.key === 'post') {
    return { kind: 'post', blog, postId: page.params.postId }
  }

  if (page.key === 'tag') {
    const { tag } = page.params

    // Tag paths spell a space as a plus, and a tag can hold a slash.
    if (Array.isArray(tag)) {
      return { kind: 'tag', blog, tag: tag.join('/').replaceAll('+', ' ') }
    }

    if (tag) {
      return { kind: 'tag', blog, tag }
    }
  }

  return { kind: 'blog', blog }
}

export const getSapoBlogsPage = (
  url: string,
  content: string | undefined,
): SapoBlogsPage | undefined => {
  const parsed = parseSapoBlogsUrl(url)

  if (parsed?.kind !== 'post') {
    return parsed
  }

  const postLinkRegex = new RegExp(`ditemid=${parsed.postId}(?!\\d)`)

  // The endpoint answers an empty channel for a made-up post id, so only a linked post counts.
  if (!postLinkRegex.test(content ?? '')) {
    return { kind: 'blog', blog: parsed.blog }
  }

  return parsed
}

export const sapoBlogsHandler: PlatformHandler = {
  match: (url) => {
    return parseSapoBlogsUrl(url) !== undefined
  },

  resolve: (url, content) => {
    const page = getSapoBlogsPage(url, content)
    const pageFeeds = feeds.forUrl(url)

    if (!page || !pageFeeds) {
      return []
    }

    const { blog } = page

    if (page.kind === 'post') {
      return [
        pageFeeds.getFeedEntry('post-comments', { blog, postId: page.postId }),
        pageFeeds.getFeedEntry('posts', {}, 'rss'),
        pageFeeds.getFeedEntry('posts', {}, 'atom'),
        pageFeeds.getFeedEntry('comments', { blog }),
      ]
    }

    if (page.kind === 'tag') {
      return [
        pageFeeds.getFeedEntry('tag', { tag: page.tag }),
        pageFeeds.getFeedEntry('posts', {}, 'rss'),
        pageFeeds.getFeedEntry('posts', {}, 'atom'),
        pageFeeds.getFeedEntry('comments', { blog }),
      ]
    }

    return [
      pageFeeds.getFeedEntry('posts', {}, 'rss'),
      pageFeeds.getFeedEntry('posts', {}, 'atom'),
      pageFeeds.getFeedEntry('comments', { blog }),
    ]
  },

  getFeedHint: feeds.getFeedHint,
}
