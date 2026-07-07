import type { DiscoverUriEntry } from '../../../common/types.js'
import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { composeHint } from '../../../common/utils.js'

// Discoverability: Partially discoverable without handler.
//
// Blogspot blogs (`*.blogspot.{com,tld}`) expose canonical Atom and RSS at
// `/feeds/posts/default[?alt=rss]`, plus summary variants at
// `/feeds/posts/summary`, comments at `/feeds/comments/default`, per-label
// feeds at `/feeds/posts/default/-/{label}`, and per-post comment feeds at
// `/feeds/{postId}/comments/default`. HTML autodiscovery is unreliable: it
// often returns FeedBurner aliases or, for some Google-owned blogs, an
// entirely different consolidated URL (e.g. `blog.google/rss/`).
// The handler emits the native `/feeds/...` URLs for every variant and
// scrapes the post ID from HTML for per-post comment feeds.

// Matches *.blogspot.com and country TLDs like *.blogspot.co.uk, *.blogspot.de, etc.
const blogspotDomainRegex = /^.+\.blogspot\.(?:com|co\.[a-z]{2}|com\.[a-z]{2}|[a-z]{2,3})$/
const labelRegex = /^\/search\/label\/([^/]+)/
const postRegex = /^\/\d{4}\/\d{2}\/[^/]+\.html$/
const postCommentsFeedRegex = /href="[^"]*\/feeds\/(\d+)\/comments\/default/

export const blogspotHandler: PlatformHandler = {
  match: (url) => {
    try {
      const hostname = new URL(url).hostname.toLowerCase()

      return blogspotDomainRegex.test(hostname)
    } catch {}

    return false
  },

  resolve: (url, content) => {
    const { origin, pathname } = new URL(url)
    const uris: Array<DiscoverUriEntry> = []

    // Label page: /search/label/{label}
    const labelMatch = pathname.match(labelRegex)

    if (labelMatch?.[1]) {
      const label = labelMatch[1]

      uris.push({
        uri: `${origin}/feeds/posts/default/-/${label}`,
        hint: composeHint('blogspot:label-atom'),
      })
      uris.push({
        uri: `${origin}/feeds/posts/default/-/${label}?alt=rss`,
        hint: composeHint('blogspot:label-rss'),
      })
    }

    // Post page: /{year}/{month}/{slug}.html — extract postId from content.
    if (content && postRegex.test(pathname)) {
      const postIdMatch = content.match(postCommentsFeedRegex)

      if (postIdMatch?.[1]) {
        const postId = postIdMatch[1]

        uris.push({
          uri: `${origin}/feeds/${postId}/comments/default`,
          hint: composeHint('blogspot:post-comments-atom'),
        })
        uris.push({
          uri: `${origin}/feeds/${postId}/comments/default?alt=rss`,
          hint: composeHint('blogspot:post-comments-rss'),
        })
      }
    }

    // Always include main blog feeds.
    uris.push({
      uri: `${origin}/feeds/posts/default`,
      hint: composeHint('blogspot:posts-atom'),
    })
    uris.push({
      uri: `${origin}/feeds/posts/default?alt=rss`,
      hint: composeHint('blogspot:posts-rss'),
    })
    uris.push({
      uri: `${origin}/feeds/posts/summary`,
      hint: composeHint('blogspot:posts-summary-atom'),
    })
    uris.push({
      uri: `${origin}/feeds/posts/summary?alt=rss`,
      hint: composeHint('blogspot:posts-summary-rss'),
    })
    uris.push({
      uri: `${origin}/feeds/comments/default`,
      hint: composeHint('blogspot:comments-atom'),
    })
    uris.push({
      uri: `${origin}/feeds/comments/default?alt=rss`,
      hint: composeHint('blogspot:comments-rss'),
    })

    return uris
  },
}
