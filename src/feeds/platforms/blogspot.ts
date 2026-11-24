import { blogspot } from 'feedintel'
import { parseUrl } from 'trousse'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { findElement, hasMarker } from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Generic finds: comments, post-comments, posts.
// Handler needed for: comments-summary, label, label-summary, posts-summary.

export type BlogspotUrl = { kind: 'label'; label: string } | { kind: 'post' } | { kind: 'blog' }
export type BlogspotPage =
  | { kind: 'label'; label: string }
  | { kind: 'post'; postId?: string }
  | { kind: 'blog' }

const widgetsScriptRegex = /^(?:https?:)?\/\/www\.blogger\.com\/static\/v1\/widgets\//i

const feeds = withHintLabels(blogspot.feeds)

// Blogger loads its widget script from this path on blogspot.com and custom domains alike,
// whatever the theme. A tag, not the text: READMEs and archived copies quote the url too.
export const isBlogspotHtml = (content: string): boolean => {
  const script = findElement(content, (element) => {
    return element.name === 'script' && widgetsScriptRegex.test(element.attribs.src ?? '')
  })

  return script !== undefined
}

// A post's comments feed, as a link in its page names it, on blogspot.com or a custom domain.
const readPostId = (href: string | undefined, url: string): string | undefined => {
  const feedUrl = href ? parseUrl(href, url) : undefined

  if (!feedUrl) {
    return
  }

  const feed = blogspot.feeds.read(feedUrl.href, { isAnyHost: true })

  if (feed?.key !== 'post-comments') {
    return
  }

  return feed.params.postId
}

export const parseBlogspotUrl = (url: string): BlogspotUrl | undefined => {
  const page = blogspot.pages.read(url, { isAnyHost: true })

  if (!page) {
    return
  }

  if (page.key === 'label') {
    return { kind: 'label', label: page.params.label }
  }

  if (page.key === 'post') {
    return { kind: 'post' }
  }

  return { kind: 'blog' }
}

export const getBlogspotPage = (
  url: string,
  content: string | undefined,
): BlogspotPage | undefined => {
  const parsed = parseBlogspotUrl(url)

  if (parsed?.kind !== 'post') {
    return parsed
  }

  // The post id is not in the URL, so it is read from the comments feed link in the page.
  const commentsFeedLink = findElement(content, (element) => {
    return readPostId(element.attribs.href, url) !== undefined
  })
  const postId = readPostId(commentsFeedLink?.attribs.href, url)

  return { kind: 'post', postId }
}

export const blogspotHandler: PlatformHandler = {
  match: (url, content, headers) => {
    if (blogspot.pages.read(url)) {
      return true
    }

    return hasMarker(content, headers, { html: isBlogspotHtml })
  },

  resolve: (url, content) => {
    const page = getBlogspotPage(url, content)
    const pageFeeds = feeds.forUrl(url)

    if (!page || !pageFeeds) {
      return []
    }

    // A blog's name builds its feeds on blogspot.com. Without one, as on a blog's own domain,
    // they are built on the page's host.
    const blogPage = blogspot.pages.read(url)
    const blog = blogPage?.key === 'blog' ? blogPage.params.blog : undefined
    const params = { blog }

    if (page.kind === 'label') {
      return [
        pageFeeds.getFeedEntry('label', { blog, labels: page.label }, 'atom'),
        pageFeeds.getFeedEntry('label', { blog, labels: page.label }, 'rss'),
        pageFeeds.getFeedEntry('label-summary', { blog, labels: page.label }, 'atom'),
        pageFeeds.getFeedEntry('label-summary', { blog, labels: page.label }, 'rss'),
        pageFeeds.getFeedEntry('posts', params, 'atom'),
        pageFeeds.getFeedEntry('posts', params, 'rss'),
        pageFeeds.getFeedEntry('posts-summary', params, 'atom'),
        pageFeeds.getFeedEntry('posts-summary', params, 'rss'),
        pageFeeds.getFeedEntry('comments', params, 'atom'),
        pageFeeds.getFeedEntry('comments', params, 'rss'),
        pageFeeds.getFeedEntry('comments-summary', params, 'atom'),
        pageFeeds.getFeedEntry('comments-summary', params, 'rss'),
      ]
    }

    if (page.kind === 'post' && page.postId) {
      return [
        pageFeeds.getFeedEntry('post-comments', { blog, postId: page.postId }, 'atom'),
        pageFeeds.getFeedEntry('post-comments', { blog, postId: page.postId }, 'rss'),
        pageFeeds.getFeedEntry('posts', params, 'atom'),
        pageFeeds.getFeedEntry('posts', params, 'rss'),
        pageFeeds.getFeedEntry('posts-summary', params, 'atom'),
        pageFeeds.getFeedEntry('posts-summary', params, 'rss'),
        pageFeeds.getFeedEntry('comments', params, 'atom'),
        pageFeeds.getFeedEntry('comments', params, 'rss'),
        pageFeeds.getFeedEntry('comments-summary', params, 'atom'),
        pageFeeds.getFeedEntry('comments-summary', params, 'rss'),
      ]
    }

    return [
      pageFeeds.getFeedEntry('posts', params, 'atom'),
      pageFeeds.getFeedEntry('posts', params, 'rss'),
      pageFeeds.getFeedEntry('posts-summary', params, 'atom'),
      pageFeeds.getFeedEntry('posts-summary', params, 'rss'),
      pageFeeds.getFeedEntry('comments', params, 'atom'),
      pageFeeds.getFeedEntry('comments', params, 'rss'),
      pageFeeds.getFeedEntry('comments-summary', params, 'atom'),
      pageFeeds.getFeedEntry('comments-summary', params, 'rss'),
    ]
  },

  getFeedHint: feeds.getFeedHint,
}
