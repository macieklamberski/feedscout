import { getPathSegments, getSubdomain, isAnyOf, isHostOf } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint } from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Generic covers blog, wwwBlog (html).
// Handler needed for: tagged.

export type TumblrUrl = { kind: 'blog'; blog: string } | { kind: 'tag'; blog: string; tag: string }

const hosts = ['tumblr.com', 'www.tumblr.com']
export const domains = ['tumblr.com']

const tagRegex = /^\/tagged\/([^/]+)/i

// Top-level routes of www.tumblr.com that are not blogs.
const excludedPaths = [
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
    const blog = isAnyOf(first, 'blog') && isAnyOf(second, 'view') ? third : first

    if (!blog || isAnyOf(blog, excludedPaths)) {
      return
    }

    return { kind: 'blog', blog }
  }

  const blog = getSubdomain(url, domains)

  if (!blog || blog.includes('.')) {
    return
  }

  // Tagged posts: /tagged/{tag}.
  const tag = new URL(url).pathname.match(tagRegex)?.[1]

  if (tag) {
    return { kind: 'tag', blog, tag }
  }

  return { kind: 'blog', blog }
}

export const tumblrHandler: PlatformHandler = {
  match: (url) => {
    return parseTumblrUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseTumblrUrl(url)

    if (!parsed) {
      return []
    }

    const { origin } = new URL(url)
    const blogOrigin = isHostOf(url, hosts) ? `https://${parsed.blog}.tumblr.com` : origin

    if (parsed.kind === 'tag') {
      return [{ uri: `${blogOrigin}/tagged/${parsed.tag}/rss`, hint: composeHint('tumblr:tag') }]
    }

    return [{ uri: `${blogOrigin}/rss`, hint: composeHint('tumblr:posts') }]
  },
}
