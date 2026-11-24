import { wordpress } from 'feedintel'
import { getQueryParam, isAnyOf, isSubdomainOf } from 'trousse'
import type { DiscoverUriEntry, DiscoverUriHint } from '../../common/types.js'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint, findElement, getTenantSubdomain } from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Generic finds: author, category, comments, post-comments, posts, tag.
// Handler adds formats for: author (rdf), category (atom, rdf), comments (atom), post-comments (atom), posts (atom, rdf), tag (atom, rdf).

export type WordpressUrl =
  | { kind: 'archive'; path: string; hintKey: string }
  | { kind: 'post'; path: string }
  | { kind: 'home' }

const domains = wordpress.hosts.tenants
const postIdDomains = ['hypotheses.org']

// A nested category's path holds every parent slug and ends at WordPress's endpoint words.
const categoryRegex = /^\/category\/(.+?)(?:\/(?:feed|rdf|rss|rss2|atom|embed|page)(?:\/|$)|\/?$)/i
const tagRegex = /^\/tag\/([^/]+)/i
const authorRegex = /^\/author\/([^/]+)/i
// WordPress moves the date archives under /date/ when the post id is among the first three tags
// of the permalink, as in hypotheses.org's /{id} posts.
const yearRegex = /^(?:\/date)?\/(\d{4})\/?$/i
const yearMonthRegex = /^(?:\/date)?\/(\d{4})\/(\d{2})\/?$/i
const dayRegex = /^(?:\/date)?\/(\d{4})\/(\d{2})\/(\d{2})\/?$/i
const postIdRegex = /^\/\d+\/?$/
const trailingSlashRegex = /\/$/
const feedSegmentRegex = /\/feed(?:\/|$)/i
const paginationRegex = /\/page\/\d+\/?$/i
// A page's feed endpoint. The word right after a bare archive route is its slug: /tag/feed/ is
// the tag named feed.
const feedEndpointRegex = /(?<!^\/(?:category|tag|author))\/feed(?:\/(?:rss|rss2|atom|rdf))?\/?$/i
// The format word after a feed endpoint, as `atom` in /feed/atom/.
const feedFormatWordRegex = /\/feed\/(?<word>[^/]+)\/?$/i
// The site comments feed, whose /comments is no page of its own.
const commentsFeedRegex = /^\/comments\/feed(?:\/(?:rss|rss2|atom|rdf))?\/?$/i
// WordPress's rewrite endpoints under a post: its AMP and embed views, trackback and comment pages.
// The word right after a bare archive route is its slug: /tag/embed/ is the tag named embed.
const postEndpointRegex =
  /(?<=[^/])(?<!^\/(?:category|tag|author))\/(?:amp|embed|trackback|comment-page-\d+)\/?$/i
// suffixes: WordPress's own scripts and folders, the search results, and an archive route
// without its slug.
const reservedPathRegex =
  /^\/(?:wp-(?:admin|content|includes|json)|[^/]*\.(?:php|xml)|search|category|tag|author)(?:\/|$)/i

// An unregistered {name}.home.blog redirects to home.blog, whose every page links this feed.
const platformFeedUrl = 'https://home.blog/feed/'

// The `?feed=` values of a page's feeds and of the site comments feed.
const feedQueries = ['rss', 'rss2', 'atom', 'rdf']
const commentsFeedQueries = ['comments-rss2', 'comments-atom']
// The endpoint words and `?feed=` values of the Atom feeds. Every other spelling serves RSS but
// `rdf`.
const atomFormatWords = ['atom', 'comments-atom']

// The route word is emitted as listed, so a capitalized path still yields the canonical feed.
const archives: Array<{ regex: RegExp; hintKey: string; route?: string }> = [
  { regex: categoryRegex, hintKey: 'wordpress:category', route: 'category' },
  { regex: tagRegex, hintKey: 'wordpress:tag', route: 'tag' },
  { regex: authorRegex, hintKey: 'wordpress:author', route: 'author' },
  { regex: dayRegex, hintKey: 'wordpress:date-archive' },
  { regex: yearMonthRegex, hintKey: 'wordpress:date-archive' },
  { regex: yearRegex, hintKey: 'wordpress:date-archive' },
]

const hintPrefix = 'wordpress:'

const feeds = withHintLabels(wordpress.feeds)

type PageFeeds = NonNullable<ReturnType<typeof feeds.forUrl>>

// The page a WordPress URL shows, read from the path, so a WP Engine site reads the same. Only
// hypotheses.org's post-id paths need the host.
export const parseWordpressPage = (url: string): WordpressUrl => {
  // A paginated listing, `/page/2/` or `/2024/05/page/2/`, is the listing itself.
  const pathname = new URL(url).pathname.replace(paginationRegex, '').replace(postEndpointRegex, '')

  // hypotheses.org posts are /{post_id}, so a four-digit id is a post, never a year archive.
  if (isSubdomainOf(url, postIdDomains) && postIdRegex.test(pathname)) {
    return { kind: 'post', path: pathname.replace(trailingSlashRegex, '') }
  }

  for (const { regex, hintKey, route } of archives) {
    const archiveMatch = pathname.match(regex)

    if (!archiveMatch) {
      continue
    }

    const path = route
      ? `/${route}/${archiveMatch[1]}`
      : archiveMatch[0].replace(trailingSlashRegex, '')

    return { kind: 'archive', path, hintKey }
  }

  if (reservedPathRegex.test(pathname)) {
    return { kind: 'home' }
  }

  // Post page: any non-root, non-archive, non-feed path.
  if (pathname && pathname !== '/' && !feedSegmentRegex.test(pathname)) {
    return { kind: 'post', path: pathname.replace(trailingSlashRegex, '') }
  }

  return { kind: 'home' }
}

export const parseWordpressUrl = (url: string): WordpressUrl | undefined => {
  if (!getTenantSubdomain(url, domains)) {
    return
  }

  return parseWordpressPage(url)
}

// The bare endpoint serves RSS 2.0, as do `rss` and `rss2`.
const getFeedFormat = (
  pathname: string,
  feedQuery: string | undefined,
): DiscoverUriHint['format'] => {
  const word = feedFormatWordRegex.exec(pathname)?.groups?.word ?? feedQuery

  if (isAnyOf(word, atomFormatWords)) {
    return 'atom'
  }

  if (isAnyOf(word, 'rdf')) {
    return 'rdf'
  }

  return 'rss'
}

// The hint of a WordPress feed URL: the feed endpoint comes off the path, or the `?feed=` query
// is read, and the page left is the one whose feed it is. A WP Engine feed reads the same.
export const getWordpressFeedHint = (url: string): DiscoverUriHint | undefined => {
  const parsedUrl = new URL(url)
  const { origin, pathname } = parsedUrl
  const feedQuery = getQueryParam(parsedUrl, 'feed')
  const isCommentsFeedQuery = pathname === '/' && isAnyOf(feedQuery, commentsFeedQueries)
  const format = getFeedFormat(pathname, feedQuery)

  if (commentsFeedRegex.test(pathname) || isCommentsFeedQuery) {
    return composeHint('wordpress:comments', format)
  }

  const isFeedPath = feedEndpointRegex.test(pathname)

  if (!isFeedPath && !isAnyOf(feedQuery, feedQueries)) {
    return
  }

  const pagePath = isFeedPath ? pathname.replace(feedEndpointRegex, '') : pathname
  const page = parseWordpressPage(`${origin}${pagePath}`)

  if (page.kind === 'archive') {
    return composeHint(page.hintKey, format)
  }

  if (page.kind === 'post') {
    return composeHint('wordpress:post-comments', format)
  }

  return composeHint('wordpress:posts', format)
}

// The spellings of a site on its own domain, which a page of a tenant gets too.
const siteVariant = 'site'

// The site-wide feeds, which every page gets after its own.
const getSiteFeeds = (pageFeeds: PageFeeds): Array<DiscoverUriEntry | undefined> => {
  return [
    pageFeeds.getFeedSpellings('posts', {}, 'rss', siteVariant),
    pageFeeds.getFeedSpellings('posts', {}, 'atom', siteVariant),
    pageFeeds.getFeedSpellings('posts', {}, 'rdf', siteVariant),
    pageFeeds.getFeedSpellings('comments', {}, 'rss', siteVariant),
    pageFeeds.getFeedSpellings('comments', {}, 'atom', siteVariant),
  ]
}

export const composeWordpressFeeds = (
  url: string,
  parsed: WordpressUrl,
): Array<DiscoverUriEntry | undefined> => {
  const pageFeeds = feeds.forUrl(url)

  if (!pageFeeds) {
    return []
  }

  if (parsed.kind === 'archive') {
    const key = parsed.hintKey.slice(hintPrefix.length)
    const params = { path: parsed.path }

    return [
      pageFeeds.getFeedSpellings(key, params, 'rss', siteVariant),
      pageFeeds.getFeedSpellings(key, params, 'atom', siteVariant),
      pageFeeds.getFeedSpellings(key, params, 'rdf', siteVariant),
      ...getSiteFeeds(pageFeeds),
    ]
  }

  if (parsed.kind === 'post') {
    const params = { path: parsed.path }

    return [
      pageFeeds.getFeedSpellings('post-comments', params, 'rss', siteVariant),
      pageFeeds.getFeedSpellings('post-comments', params, 'atom', siteVariant),
      ...getSiteFeeds(pageFeeds),
    ]
  }

  return getSiteFeeds(pageFeeds)
}

export const wordpressHandler: PlatformHandler = {
  match: (url, content) => {
    if (!parseWordpressUrl(url)) {
      return false
    }

    const platformFeedLink = findElement(content, (element) => {
      return (
        element.name === 'link' &&
        element.attribs.rel === 'alternate' &&
        element.attribs.href === platformFeedUrl
      )
    })

    return platformFeedLink === undefined
  },

  resolve: (url) => {
    const parsed = parseWordpressUrl(url)

    if (!parsed) {
      return []
    }

    return composeWordpressFeeds(url, parsed)
  },

  getFeedHint: (url) => {
    if (!getTenantSubdomain(url, domains)) {
      return
    }

    return getWordpressFeedHint(url)
  },
}
