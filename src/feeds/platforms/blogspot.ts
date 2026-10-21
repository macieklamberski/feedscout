import { parseUrl } from 'trousse'
import type { DiscoverUriEntry } from '../../common/types.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint, findElement, getTenantSubdomain, hasMarker } from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Generic partly covers blog, blogPost, customDomainBlog, customDomainLabel, label.

export type BlogspotUrl = { kind: 'label'; label: string } | { kind: 'post' } | { kind: 'blog' }

// Blogger's country domains, from before Blogger moved every blog to blogspot.com. A few no
// longer resolve.
const domains = [
  'blogspot.ae',
  'blogspot.al',
  'blogspot.am',
  'blogspot.ba',
  'blogspot.be',
  'blogspot.bg',
  'blogspot.bj',
  'blogspot.ca',
  'blogspot.cf',
  'blogspot.ch',
  'blogspot.cl',
  'blogspot.co.at',
  'blogspot.co.id',
  'blogspot.co.il',
  'blogspot.co.ke',
  'blogspot.co.nz',
  'blogspot.co.uk',
  'blogspot.co.za',
  'blogspot.com',
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
  'blogspot.cv',
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
  'blogspot.mr',
  'blogspot.mx',
  'blogspot.my',
  'blogspot.nl',
  'blogspot.no',
  'blogspot.pe',
  'blogspot.pt',
  'blogspot.qa',
  'blogspot.re',
  'blogspot.ro',
  'blogspot.rs',
  'blogspot.ru',
  'blogspot.se',
  'blogspot.sg',
  'blogspot.si',
  'blogspot.sk',
  'blogspot.sn',
  'blogspot.td',
  'blogspot.tw',
  'blogspot.ug',
  'blogspot.vn',
]

const labelRegex = /^\/search\/label\/([^/]+)/i
const postRegex = /^\/\d{4}\/\d{2}\/[^/]+\.html$/i
const postCommentsFeedRegex = /\/feeds\/(\d+)\/comments\/default/i
const widgetsScriptRegex = /^(?:https?:)?\/\/www\.blogger\.com\/static\/v1\/widgets\//

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

export const blogspotHandler: PlatformHandler = {
  match: (url, content, headers) => {
    const parsedUrl = parseUrl(url)

    if (!parsedUrl) {
      return false
    }

    if (getTenantSubdomain(parsedUrl, domains)) {
      return true
    }

    return hasMarker(content, headers, { html: isBlogspotHtml })
  },

  resolve: (url, content) => {
    const parsed = parseBlogspotUrl(url)

    if (!parsed) {
      return []
    }

    const { origin } = new URL(url)
    const uris: Array<DiscoverUriEntry> = []

    if (parsed.kind === 'label') {
      uris.push({
        uri: `${origin}/feeds/posts/default/-/${parsed.label}`,
        hint: composeHint('blogspot:label', 'atom'),
      })
      uris.push({
        uri: `${origin}/feeds/posts/default/-/${parsed.label}?alt=rss`,
        hint: composeHint('blogspot:label', 'rss'),
      })
    }

    // The post id is not in the URL, so it is read from the comments feed link in the page.
    if (parsed.kind === 'post' && content) {
      const commentsFeedLink = findElement(content, (element) => {
        return postCommentsFeedRegex.test(element.attribs.href ?? '')
      })
      const postId = commentsFeedLink?.attribs.href?.match(postCommentsFeedRegex)?.[1]

      if (postId) {
        uris.push({
          uri: `${origin}/feeds/${postId}/comments/default`,
          hint: composeHint('blogspot:post-comments', 'atom'),
        })
        uris.push({
          uri: `${origin}/feeds/${postId}/comments/default?alt=rss`,
          hint: composeHint('blogspot:post-comments', 'rss'),
        })
      }
    }

    // Always include main blog feeds.
    uris.push({
      uri: `${origin}/feeds/posts/default`,
      hint: composeHint('blogspot:posts', 'atom'),
    })
    uris.push({
      uri: `${origin}/feeds/posts/default?alt=rss`,
      hint: composeHint('blogspot:posts', 'rss'),
    })
    uris.push({
      uri: `${origin}/feeds/posts/summary`,
      hint: composeHint('blogspot:posts-summary', 'atom'),
    })
    uris.push({
      uri: `${origin}/feeds/posts/summary?alt=rss`,
      hint: composeHint('blogspot:posts-summary', 'rss'),
    })
    uris.push({
      uri: `${origin}/feeds/comments/default`,
      hint: composeHint('blogspot:comments', 'atom'),
    })
    uris.push({
      uri: `${origin}/feeds/comments/default?alt=rss`,
      hint: composeHint('blogspot:comments', 'rss'),
    })

    return uris
  },
}
