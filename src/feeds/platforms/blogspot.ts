import { parseUrl } from 'trousse'
import type { DiscoverUriEntry } from '../../common/types.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint, findElement, hasMarker } from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Generic partly covers blog, customDomainBlog, customDomainLabel, label.

export type BlogspotUrl = { kind: 'label'; label: string } | { kind: 'post' } | { kind: 'blog' }

// Matches *.blogspot.com and country TLDs like *.blogspot.co.uk, *.blogspot.de, etc.
const blogspotDomainRegex = /^.+\.blogspot\.(?:com|co\.[a-z]{2}|com\.[a-z]{2}|[a-z]{2,3})$/
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

    if (blogspotDomainRegex.test(parsedUrl.hostname)) {
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
