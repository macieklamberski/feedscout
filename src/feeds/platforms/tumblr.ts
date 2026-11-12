import { getPathSegments, isAnyOf, isHostOf } from 'trousse'
import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { getHostOrigin, getTenantSubdomain } from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Generic covers blog, wwwBlog (html).
// Handler needed for: tagged.

export type TumblrUrl = { kind: 'blog'; blog: string } | { kind: 'tag'; blog: string; tag: string }

const hosts = ['tumblr.com', 'www.tumblr.com']
export const domains = ['tumblr.com']

const tagRegex = /^\/tagged\/([^/]+)/i

const feeds = definePlatformFeeds([
  { key: 'tumblr:tag', template: 'https://{blog}.tumblr.com/tagged/{tag}/rss' },
  { key: 'tumblr:posts', template: 'https://{blog}.tumblr.com/rss' },
])

export const parseTumblrUrl = (url: string): TumblrUrl | undefined => {
  // www.tumblr.com/{blog} and the legacy www.tumblr.com/blog/view/{blog} show a blog, and
  // www.tumblr.com/{blog}/tagged/{tag} its tagged posts.
  if (isHostOf(url, hosts)) {
    const [routeOrBlog, viewOrTagged, blogOrTag] = getPathSegments(url)
    const blog =
      isAnyOf(routeOrBlog, 'blog') && isAnyOf(viewOrTagged, 'view') ? blogOrTag : routeOrBlog

    // Tumblr names carry no dots, so a dotted segment such as robots.txt is a file of the site.
    if (!blog || blog.includes('.')) {
      return
    }

    if (isAnyOf(viewOrTagged, 'tagged') && blogOrTag) {
      return { kind: 'tag', blog, tag: blogOrTag }
    }

    return { kind: 'blog', blog }
  }

  const blog = getTenantSubdomain(url, domains)

  if (!blog) {
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

    // A blog name read from a www.tumblr.com path has to be one host label.
    if (!parsed || !getHostOrigin(`${parsed.blog}.tumblr.com`)) {
      return []
    }

    if (parsed.kind === 'tag') {
      return [feeds.getFeedEntry('tumblr:tag', { blog: parsed.blog, tag: parsed.tag })]
    }

    return [feeds.getFeedEntry('tumblr:posts', { blog: parsed.blog })]
  },

  getFeedKey: feeds.getFeedKey,
}
