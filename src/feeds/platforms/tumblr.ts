import { getPathSegments, getSubdomain, isAnyOf, isHostOf } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint } from '../../common/utils.js'

// Discoverability: Unmeasured, bot wall.

export type TumblrUrl = { kind: 'blog'; blog: string }

const hosts = ['tumblr.com', 'www.tumblr.com']
export const domains = ['tumblr.com']

const tagRegex = /^\/tagged\/([^/]+)/

// Top-level routes of www.tumblr.com that are not blogs.
const reservedPaths = [
  'about',
  'activity',
  'apps',
  'blog',
  'communities',
  'dashboard',
  'developers',
  'docs',
  'explore',
  'following',
  'help',
  'inbox',
  'jobs',
  'likes',
  'login',
  'logout',
  'messages',
  'new',
  'oauth',
  'policy',
  'privacy',
  'reblog',
  'register',
  'search',
  'settings',
  'support',
  'tagged',
  'tumblelog',
]

export const parseTumblrUrl = (url: string): TumblrUrl | undefined => {
  // www.tumblr.com/{blog} and the legacy www.tumblr.com/blog/view/{blog} show a blog.
  if (isHostOf(url, hosts)) {
    const [first, second, third] = getPathSegments(url)
    const blog = first === 'blog' && second === 'view' ? third : first

    if (!blog || isAnyOf(blog, reservedPaths)) {
      return
    }

    return { kind: 'blog', blog }
  }

  const blog = getSubdomain(url, domains)

  if (!blog || blog.includes('.')) {
    return
  }

  return { kind: 'blog', blog }
}

export const tumblrHandler: PlatformHandler = {
  match: (url) => {
    return parseTumblrUrl(url) !== undefined
  },

  resolve: (url) => {
    const blog = parseTumblrUrl(url)?.blog

    if (!blog) {
      return []
    }

    const { origin, pathname } = new URL(url)
    const blogOrigin = isHostOf(url, hosts) ? `https://${blog}.tumblr.com` : origin

    // Tagged posts: /tagged/{tag}
    const tagMatch = pathname.match(tagRegex)

    if (tagMatch?.[1]) {
      const tag = tagMatch[1]

      return [{ uri: `${blogOrigin}/tagged/${tag}/rss`, hint: composeHint('tumblr:tag') }]
    }

    return [{ uri: `${blogOrigin}/rss`, hint: composeHint('tumblr:posts') }]
  },
}
