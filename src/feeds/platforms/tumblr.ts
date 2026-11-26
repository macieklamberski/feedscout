import { tumblr } from 'feedintel'
import { getPathSegments, isAnyOf, isHostOf, parseUrl } from 'trousse'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { getHostOrigin, getTenantSubdomain } from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Generic covers blog, wwwBlog (html).
// Handler needed for: tagged.

export type TumblrUrl = { kind: 'blog'; blog: string } | { kind: 'tag'; blog: string; tag: string }

const hosts = tumblr.hosts.exact
export const domains = tumblr.hosts.tenants

const tagRegex = /^\/tagged\/([^/]+)/i

const feeds = withHintLabels(tumblr.feeds)

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
  const tag = parseUrl(url)?.pathname.match(tagRegex)?.[1]

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
    const page = feeds.forUrl(url)

    if (!parsed || !page) {
      return []
    }

    const host = `${parsed.blog}.tumblr.com`

    // A blog name read from a www.tumblr.com path has to be one host label.
    if (!getHostOrigin(host)) {
      return []
    }

    // The blog's posts and podcast need no value from the page but its blog, so every page builds
    // them after its own feeds.
    if (parsed.kind === 'tag') {
      return [
        page.getFeedEntry('tag', { host, tag: parsed.tag }),
        page.getFeedEntry('posts', { host }),
        page.getFeedEntry('theme-posts', { host }),
        page.getFeedEntry('podcast', { host }),
      ]
    }

    return [
      page.getFeedEntry('posts', { host }),
      page.getFeedEntry('theme-posts', { host }),
      page.getFeedEntry('podcast', { host }),
    ]
  },

  getFeedHint: feeds.getFeedHint,
}
