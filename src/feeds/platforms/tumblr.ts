import { getSubdomain } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint } from '../../common/utils.js'

// Discoverability: Unmeasured, bot wall.

export type TumblrUrl = { kind: 'blog'; blog: string }

export const domains = ['tumblr.com']

const tagRegex = /^\/tagged\/([^/]+)/

export const parseTumblrUrl = (url: string): TumblrUrl | undefined => {
  const blog = getSubdomain(url, domains)

  // Only {blog}.tumblr.com names a blog, www.tumblr.com serves no feed.
  if (!blog || blog.includes('.') || blog === 'www') {
    return
  }

  return { kind: 'blog', blog }
}

export const tumblrHandler: PlatformHandler = {
  match: (url) => {
    return parseTumblrUrl(url) !== undefined
  },

  resolve: (url) => {
    const { origin, pathname } = new URL(url)

    // Tagged posts: /tagged/{tag}
    const tagMatch = pathname.match(tagRegex)

    if (tagMatch?.[1]) {
      const tag = tagMatch[1]

      return [{ uri: `${origin}/tagged/${tag}/rss`, hint: composeHint('tumblr:tag') }]
    }

    return [{ uri: `${origin}/rss`, hint: composeHint('tumblr:posts') }]
  },
}
