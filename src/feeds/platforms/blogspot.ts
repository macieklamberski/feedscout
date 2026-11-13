import { parseUrl } from 'trousse'
import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { findElement, getTenantSubdomain, hasMarker } from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Generic partly covers blog, blogPost, customDomainBlog, customDomainLabel, label.

export type BlogspotUrl = { kind: 'label'; label: string } | { kind: 'post' } | { kind: 'blog' }
export type BlogspotPage =
  | { kind: 'label'; label: string }
  | { kind: 'post'; postId?: string }
  | { kind: 'blog' }

// blogspot.com and Blogger's country domains like .co.uk, .com.br and .de, which still serve
// feeds. getTenantSubdomain then refuses www and nested subdomains.
// length: keeps any suffix but a two-letter country code out
const domains = [/^blogspot\.(?:com|co\.[a-z]{2}|com\.[a-z]{2}|[a-z]{2})$/]

const labelRegex = /^\/search\/label\/([^/]+)/i
const postRegex = /^\/\d{4}\/\d{2}\/[^/]+\.html$/i
const postCommentsFeedRegex = /\/feeds\/(\d+)\/comments\/default/i
const widgetsScriptRegex = /^(?:https?:)?\/\/www\.blogger\.com\/static\/v1\/widgets\//i

// A custom domain is known only by its markup, so its feeds are built here but not claimed.
// Blogger serves the posts feed at /feeds/posts/full and /atom.xml too, and the comments feed at
// /feeds/comments/full.
const feeds = definePlatformFeeds(
  [
    { key: 'blogspot:posts', template: '{scheme}://{host}/feeds/posts/default', format: 'atom' },
    {
      key: 'blogspot:posts',
      template: '{scheme}://{host}/feeds/posts/default?alt=rss',
      format: 'rss',
    },
    { key: 'blogspot:posts', template: '{scheme}://{host}/feeds/posts/full', format: 'atom' },
    {
      key: 'blogspot:posts',
      template: '{scheme}://{host}/feeds/posts/full?alt=rss',
      format: 'rss',
    },
    { key: 'blogspot:posts', template: '{scheme}://{host}/atom.xml', format: 'atom' },
    {
      key: 'blogspot:posts-summary',
      template: '{scheme}://{host}/feeds/posts/summary',
      format: 'atom',
    },
    {
      key: 'blogspot:posts-summary',
      template: '{scheme}://{host}/feeds/posts/summary?alt=rss',
      format: 'rss',
    },
    {
      key: 'blogspot:comments',
      template: '{scheme}://{host}/feeds/comments/default',
      format: 'atom',
    },
    {
      key: 'blogspot:comments',
      template: '{scheme}://{host}/feeds/comments/default?alt=rss',
      format: 'rss',
    },
    { key: 'blogspot:comments', template: '{scheme}://{host}/feeds/comments/full', format: 'atom' },
    {
      key: 'blogspot:comments-summary',
      template: '{scheme}://{host}/feeds/comments/summary',
      format: 'atom',
    },
    {
      key: 'blogspot:comments-summary',
      template: '{scheme}://{host}/feeds/comments/summary?alt=rss',
      format: 'rss',
    },
    {
      key: 'blogspot:label',
      template: '{scheme}://{host}/feeds/posts/default/-/{label}',
      format: 'atom',
    },
    {
      key: 'blogspot:label',
      template: '{scheme}://{host}/feeds/posts/default/-/{label}?alt=rss',
      format: 'rss',
    },
    {
      key: 'blogspot:label-summary',
      template: '{scheme}://{host}/feeds/posts/summary/-/{label}',
      format: 'atom',
    },
    {
      key: 'blogspot:label-summary',
      template: '{scheme}://{host}/feeds/posts/summary/-/{label}?alt=rss',
      format: 'rss',
    },
    // Several labels, as `/-/{a}/{b}`, give the posts carrying all of them. These rows go after the
    // single-label ones, which `resolve` builds, since a label can hold a slash.
    {
      key: 'blogspot:label',
      template: '{scheme}://{host}/feeds/posts/default/-/{labels*}',
      format: 'atom',
    },
    {
      key: 'blogspot:label',
      template: '{scheme}://{host}/feeds/posts/default/-/{labels*}?alt=rss',
      format: 'rss',
    },
    {
      key: 'blogspot:label-summary',
      template: '{scheme}://{host}/feeds/posts/summary/-/{labels*}',
      format: 'atom',
    },
    {
      key: 'blogspot:label-summary',
      template: '{scheme}://{host}/feeds/posts/summary/-/{labels*}?alt=rss',
      format: 'rss',
    },
    {
      key: 'blogspot:post-comments',
      template: '{scheme}://{host}/feeds/{postId}/comments/default',
      format: 'atom',
    },
    {
      key: 'blogspot:post-comments',
      template: '{scheme}://{host}/feeds/{postId}/comments/default?alt=rss',
      format: 'rss',
    },
  ],
  { domains },
)

// Blogger loads its widget script from this path on blogspot.com and custom domains alike,
// whatever the theme. A tag, not the text: READMEs and archived copies quote the url too.
export const isBlogspotHtml = (content: string): boolean => {
  const script = findElement(content, (element) => {
    return element.name === 'script' && widgetsScriptRegex.test(element.attribs.src ?? '')
  })

  return script !== undefined
}

export const parseBlogspotUrl = (url: string): BlogspotUrl | undefined => {
  const parsedUrl = parseUrl(url)

  if (!parsedUrl) {
    return
  }

  const { pathname } = parsedUrl
  // Label page: /search/label/{label}
  const label = pathname.match(labelRegex)?.[1]

  if (label) {
    return { kind: 'label', label }
  }

  // Post page: /{year}/{month}/{slug}.html
  if (postRegex.test(pathname)) {
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
    return postCommentsFeedRegex.test(element.attribs.href ?? '')
  })
  const postId = commentsFeedLink?.attribs.href?.match(postCommentsFeedRegex)?.[1]

  return { kind: 'post', postId }
}

export const blogspotHandler: PlatformHandler = {
  match: (url, content, headers) => {
    if (getTenantSubdomain(url, domains)) {
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

    if (page.kind === 'label') {
      return [
        pageFeeds.getFeedEntry('blogspot:label', { label: page.label }, 'atom'),
        pageFeeds.getFeedEntry('blogspot:label', { label: page.label }, 'rss'),
        pageFeeds.getFeedEntry('blogspot:label-summary', { label: page.label }, 'atom'),
        pageFeeds.getFeedEntry('blogspot:label-summary', { label: page.label }, 'rss'),
        pageFeeds.getFeedEntry('blogspot:posts', {}, 'atom'),
        pageFeeds.getFeedEntry('blogspot:posts', {}, 'rss'),
        pageFeeds.getFeedEntry('blogspot:posts-summary', {}, 'atom'),
        pageFeeds.getFeedEntry('blogspot:posts-summary', {}, 'rss'),
        pageFeeds.getFeedEntry('blogspot:comments', {}, 'atom'),
        pageFeeds.getFeedEntry('blogspot:comments', {}, 'rss'),
        pageFeeds.getFeedEntry('blogspot:comments-summary', {}, 'atom'),
        pageFeeds.getFeedEntry('blogspot:comments-summary', {}, 'rss'),
      ]
    }

    if (page.kind === 'post' && page.postId) {
      return [
        pageFeeds.getFeedEntry('blogspot:post-comments', { postId: page.postId }, 'atom'),
        pageFeeds.getFeedEntry('blogspot:post-comments', { postId: page.postId }, 'rss'),
        pageFeeds.getFeedEntry('blogspot:posts', {}, 'atom'),
        pageFeeds.getFeedEntry('blogspot:posts', {}, 'rss'),
        pageFeeds.getFeedEntry('blogspot:posts-summary', {}, 'atom'),
        pageFeeds.getFeedEntry('blogspot:posts-summary', {}, 'rss'),
        pageFeeds.getFeedEntry('blogspot:comments', {}, 'atom'),
        pageFeeds.getFeedEntry('blogspot:comments', {}, 'rss'),
        pageFeeds.getFeedEntry('blogspot:comments-summary', {}, 'atom'),
        pageFeeds.getFeedEntry('blogspot:comments-summary', {}, 'rss'),
      ]
    }

    return [
      pageFeeds.getFeedEntry('blogspot:posts', {}, 'atom'),
      pageFeeds.getFeedEntry('blogspot:posts', {}, 'rss'),
      pageFeeds.getFeedEntry('blogspot:posts-summary', {}, 'atom'),
      pageFeeds.getFeedEntry('blogspot:posts-summary', {}, 'rss'),
      pageFeeds.getFeedEntry('blogspot:comments', {}, 'atom'),
      pageFeeds.getFeedEntry('blogspot:comments', {}, 'rss'),
      pageFeeds.getFeedEntry('blogspot:comments-summary', {}, 'atom'),
      pageFeeds.getFeedEntry('blogspot:comments-summary', {}, 'rss'),
    ]
  },

  getFeedHint: feeds.getFeedHint,
}
