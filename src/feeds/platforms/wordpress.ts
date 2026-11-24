import { wordpress } from 'feedintel'
import type { DiscoverUriEntry } from '../../common/types.js'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { findElement } from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Generic finds: author, category, comments, post-comments, posts, tag.
// Handler adds formats for: author (rdf), category (atom, rdf), comments (atom), post-comments (atom), posts (atom, rdf), tag (atom, rdf).

export type WordpressUrl =
  | { kind: 'archive'; path: string; hintKey: string }
  | { kind: 'post'; path: string }
  | { kind: 'home' }

// A nested category's path holds every parent slug and ends at WordPress's endpoint words.
const categoryRegex = /^\/category\/(.+?)(?:\/(?:feed|rdf|rss|rss2|atom|embed|page)(?:\/|$)|\/?$)/i
const tagRegex = /^\/tag\/([^/]+)/i
const authorRegex = /^\/author\/([^/]+)/i
// WordPress moves the date archives under /date/ when the post id is among the first three tags
// of the permalink, as in hypotheses.org's /{id} posts.
const yearRegex = /^(?:\/date)?\/(\d{4})\/?$/i
const yearMonthRegex = /^(?:\/date)?\/(\d{4})\/(\d{2})\/?$/i
const dayRegex = /^(?:\/date)?\/(\d{4})\/(\d{2})\/(\d{2})\/?$/i
const trailingSlashRegex = /\/$/
const feedSegmentRegex = /\/feed(?:\/|$)/i
const paginationRegex = /\/page\/\d+\/?$/i
// WordPress's rewrite endpoints under a post: its AMP and embed views, trackback and comment pages.
// The word right after a bare archive route is its slug: /tag/embed/ is the tag named embed.
const postEndpointRegex =
  /(?<=[^/])(?<!^\/(?:category|tag|author))\/(?:amp|embed|trackback|comment-page-\d+)\/?$/i
// suffixes: WordPress's own scripts and folders, the search results, and an archive route
// without its slug.
const reservedPathRegex =
  /^\/(?:wp-(?:admin|content|includes|json)|[^/]*\.(?:php|xml)|search|category|tag|author)(?:\/|$)/i

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

// The page a WordPress URL shows, read from the path, so a WP Engine site reads the same.
export const parseWordpressPage = (url: string): WordpressUrl => {
  const { origin, pathname: fullPathname } = new URL(url)
  // A paginated listing, `/page/2/` or `/2024/05/page/2/`, is the listing itself.
  const pathname = fullPathname.replace(paginationRegex, '').replace(postEndpointRegex, '')

  if (wordpress.pages.read(`${origin}${pathname}`)?.key === 'post') {
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
  if (wordpress.pages.read(url) === undefined) {
    return
  }

  return parseWordpressPage(url)
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
        wordpress.pages.read(element.attribs.href ?? '')?.key === 'platform-feed'
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

  getFeedHint: feeds.getFeedHint,
}
