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

// `?format=rss` holds the posts as the theme renders them, `/podcast` the audio posts. Both
// answer a plain request with a browser check. `/podcast/rss` is a spelling of the podcast.
const feeds = definePlatformFeeds(
  [
    { key: 'tumblr:tag', template: '{scheme}://{host}/tagged/{tag}/rss' },
    { key: 'tumblr:posts', template: '{scheme}://{host}/rss' },
    { key: 'tumblr:theme-posts', template: '{scheme}://{host}/?format=rss' },
    { key: 'tumblr:podcast', template: '{scheme}://{host}/podcast' },
    { key: 'tumblr:podcast', template: '{scheme}://{host}/podcast/rss', isAlias: true },
  ],
  { domains },
)

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
    const page = feeds.forUrl(url)

    if (!parsed || !page) {
      return []
    }

    const host = `${parsed.blog}.tumblr.com`

    // A blog name read from a www.tumblr.com path has to be one host label.
    if (!getHostOrigin(host)) {
      return []
    }

    if (parsed.kind === 'tag') {
      return [page.getFeedEntry('tumblr:tag', { host, tag: parsed.tag })]
    }

    return [
      page.getFeedEntry('tumblr:posts', { host }),
      page.getFeedEntry('tumblr:theme-posts', { host }),
      page.getFeedEntry('tumblr:podcast', { host }),
    ]
  },

  getFeedHint: feeds.getFeedHint,
}
