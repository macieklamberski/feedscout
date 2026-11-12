import { parseUrl } from 'trousse'
import type { DiscoverUriEntry } from '../../common/types.js'
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

// The Blogger domains whose feeds are claimed, each serving every blog's feeds on 2026-11-12.
const domains = [
  'blogspot.com',
  'blogspot.ae',
  'blogspot.al',
  'blogspot.am',
  'blogspot.ba',
  'blogspot.be',
  'blogspot.bg',
  'blogspot.ca',
  'blogspot.ch',
  'blogspot.cl',
  'blogspot.co.at',
  'blogspot.co.id',
  'blogspot.co.il',
  'blogspot.co.ke',
  'blogspot.co.nz',
  'blogspot.co.uk',
  'blogspot.co.za',
  'blogspot.com.ar',
  'blogspot.com.au',
  'blogspot.com.br',
  'blogspot.com.by',
  'blogspot.com.co',
  'blogspot.com.cy',
  'blogspot.com.ee',
  'blogspot.com.eg',
  'blogspot.com.es',
  'blogspot.com.mt',
  'blogspot.com.ng',
  'blogspot.com.tr',
  'blogspot.com.uy',
  'blogspot.cz',
  'blogspot.de',
  'blogspot.dk',
  'blogspot.fi',
  'blogspot.fr',
  'blogspot.gr',
  'blogspot.hk',
  'blogspot.hr',
  'blogspot.hu',
  'blogspot.ie',
  'blogspot.in',
  'blogspot.is',
  'blogspot.it',
  'blogspot.jp',
  'blogspot.kr',
  'blogspot.li',
  'blogspot.lt',
  'blogspot.lu',
  'blogspot.md',
  'blogspot.mk',
  'blogspot.mx',
  'blogspot.my',
  'blogspot.nl',
  'blogspot.no',
  'blogspot.pe',
  'blogspot.pt',
  'blogspot.qa',
  'blogspot.ro',
  'blogspot.rs',
  'blogspot.ru',
  'blogspot.se',
  'blogspot.sg',
  'blogspot.si',
  'blogspot.sk',
  'blogspot.sn',
  'blogspot.tw',
  'blogspot.ug',
]

// Matches blogspot.com and Blogger's country domains like .co.uk, .com.br and .de, which still
// serve feeds. getTenantSubdomain then refuses www and nested subdomains.
// length: keeps any suffix but a two-letter country code out
const blogspotDomainRegex = /\.(blogspot\.(?:com|co\.[a-z]{2}|com\.[a-z]{2}|[a-z]{2}))$/
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
    const parsedUrl = parseUrl(url)

    if (!parsedUrl) {
      return false
    }

    const domain = parsedUrl.hostname.match(blogspotDomainRegex)?.[1]

    if (domain && getTenantSubdomain(parsedUrl, [domain])) {
      return true
    }

    return hasMarker(content, headers, { html: isBlogspotHtml })
  },

  resolve: (url, content) => {
    const page = getBlogspotPage(url, content)

    if (!page) {
      return []
    }

    const { protocol, host } = new URL(url)
    const params = { scheme: protocol.slice(0, -1), host }
    const uris: Array<DiscoverUriEntry> = []

    if (page.kind === 'label') {
      const labelParams = { ...params, label: page.label }

      uris.push(
        feeds.getFeedEntry('blogspot:label', labelParams, 'atom'),
        feeds.getFeedEntry('blogspot:label', labelParams, 'rss'),
      )
    }

    if (page.kind === 'post' && page.postId) {
      const postParams = { ...params, postId: page.postId }

      uris.push(
        feeds.getFeedEntry('blogspot:post-comments', postParams, 'atom'),
        feeds.getFeedEntry('blogspot:post-comments', postParams, 'rss'),
      )
    }

    // Always include main blog feeds.
    uris.push(
      feeds.getFeedEntry('blogspot:posts', params, 'atom'),
      feeds.getFeedEntry('blogspot:posts', params, 'rss'),
      feeds.getFeedEntry('blogspot:posts-summary', params, 'atom'),
      feeds.getFeedEntry('blogspot:posts-summary', params, 'rss'),
      feeds.getFeedEntry('blogspot:comments', params, 'atom'),
      feeds.getFeedEntry('blogspot:comments', params, 'rss'),
    )

    return uris
  },

  // The table reads any host under a Blogger domain, so the apex, www and a nested subdomain are
  // refused first: blogspot.com redirects its feeds to blogger.com, and a nested host fails its
  // TLS handshake.
  getFeedHint: (url) => {
    if (!getTenantSubdomain(url, domains)) {
      return
    }

    return feeds.getFeedHint(url)
  },
}
