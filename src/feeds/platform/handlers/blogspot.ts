import type { DiscoverUriEntry } from '../../../common/types.js'
import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { composeHint } from '../../../common/utils.js'

// Discoverable without handler.
//
// HTML autodiscovery on Blogspot blogs commonly returns Feedburner aliases or, for
// some Google-owned blogs, an entirely different consolidated URL (e.g.
// googleblog.blogspot.com → blog.google/rss/). The handler emits native
// /feeds/posts/default URLs which serve directly or redirect to equivalent content.

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
