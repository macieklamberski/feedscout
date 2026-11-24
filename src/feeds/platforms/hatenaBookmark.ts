import { hatenaBookmark } from 'feedintel'
import { composeQuery, decodeSegment, getAnyOf, getQueryParam, isHostOf, parseUrl } from 'trousse'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'

// Discoverability: Partially discoverable without handler.
// Generic finds: bookmarks, hot-category, new-category.
// Handler needed for: hot, new, search, site.

export type HatenaBookmarkUrl =
  | { kind: 'hotentry'; category?: string }
  | { kind: 'entrylist'; category?: string }
  | { kind: 'search'; query: string; params: Record<string, string> }
  | { kind: 'site'; site: string; sort?: string }
  | { kind: 'user'; username: string; tag?: string }
  | { kind: 'home' }

const hosts = hatenaBookmark.hosts.exact

const listRegex = /^\/(hotentry|entrylist)(?:\/([a-z]+))?\/?$/i
const queryRegex = /^\/q(?:\/(.*))?$/i
const searchRegex = /^\/search\/(tag|text|title)\/?$/i
const siteRegex = /^\/site\/([^/].*?)\/*$/i

// A Hatena ID starts with a letter. The user feed at /{id}.rss carries the ID too.
const userRegex = /^\/([a-z][\w-]*?)(?:\.rss)?(?:\/|$)/i

const bookmarkLists = ['hotentry', 'entrylist']

// The `all` category is the whole list, which its page links as the bare feed.
const categories = [
  'economics',
  'entertainment',
  'fun',
  'game',
  'general',
  'it',
  'knowledge',
  'life',
  'social',
]

const searchTypes = ['tag', 'text', 'title']

// The filters the search page carries into its own feed link. It drops `page` and anything else.
const searchFilters = ['target', 'sort', 'users', 'date_range', 'safe']

const feeds = withHintLabels(hatenaBookmark.feeds)

const copySearchFilters = (
  from: URLSearchParams,
  to: Record<string, string>,
): Record<string, string> => {
  for (const filter of searchFilters) {
    const value = getQueryParam(from, filter)

    if (value) {
      to[filter] = value
    }
  }

  return to
}

export const parseHatenaBookmarkUrl = (url: string): HatenaBookmarkUrl | undefined => {
  const parsedUrl = parseUrl(url)

  if (!parsedUrl || !isHostOf(parsedUrl, hosts)) {
    return
  }

  const { pathname, searchParams } = parsedUrl
  const listMatch = pathname.match(listRegex)

  // Hot and new entry listings, site-wide or per category. An unknown category falls back to
  // the whole list.
  if (listMatch) {
    const list = getAnyOf(listMatch[1], bookmarkLists)
    const category = getAnyOf(listMatch[2], categories)

    return list === 'hotentry' ? { kind: 'hotentry', category } : { kind: 'entrylist', category }
  }

  const queryMatch = pathname.match(queryRegex)

  // The search route without a query lands on the home page.
  if (queryMatch) {
    const query = decodeSegment(queryMatch[1])

    if (!query) {
      return { kind: 'home' }
    }

    return { kind: 'search', query, params: copySearchFilters(searchParams, {}) }
  }

  const searchType = getAnyOf(pathname.match(searchRegex)?.[1], searchTypes)

  // The old search path answers 301 to /q/{query}, with `target` set for a text or title search.
  // Without a query it lands on the home page.
  if (searchType) {
    const legacyQuery = getQueryParam(searchParams, 'q')

    if (!legacyQuery) {
      return { kind: 'home' }
    }

    const target: Record<string, string> = searchType === 'tag' ? {} : { target: searchType }

    return { kind: 'search', query: legacyQuery, params: copySearchFilters(searchParams, target) }
  }

  const site = pathname.match(siteRegex)?.[1]

  // The site page keeps only its sort order in its own feed link.
  if (site) {
    return { kind: 'site', site, sort: getQueryParam(searchParams, 'sort') }
  }

  const username = pathname.match(userRegex)?.[1]

  if (!username) {
    return { kind: 'home' }
  }

  // A user page filtered by tag links the feed of that tag.
  return { kind: 'user', username, tag: getQueryParam(searchParams, 'tag') }
}

export const hatenaBookmarkHandler: PlatformHandler = {
  match: (url) => {
    return parseHatenaBookmarkUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseHatenaBookmarkUrl(url)

    if (!parsed) {
      return []
    }

    // The hot and new entry lists need no value from the page, so every page builds them after its
    // own feeds.
    if (parsed.kind === 'hotentry') {
      const { category } = parsed

      if (!category) {
        return [feeds.getFeedEntry('hot'), feeds.getFeedEntry('new')]
      }

      return [
        feeds.getFeedEntry('hot-category', { category }),
        feeds.getFeedEntry('hot'),
        feeds.getFeedEntry('new'),
      ]
    }

    if (parsed.kind === 'entrylist') {
      const { category } = parsed

      if (!category) {
        return [feeds.getFeedEntry('new'), feeds.getFeedEntry('hot')]
      }

      return [
        feeds.getFeedEntry('new-category', { category }),
        feeds.getFeedEntry('hot'),
        feeds.getFeedEntry('new'),
      ]
    }

    // Search and per-site listings answer with RSS when `mode=rss` is set.
    if (parsed.kind === 'search') {
      return [
        feeds.getFeedEntry('search', {
          query: parsed.query,
          filters: composeQuery(parsed.params),
        }),
        feeds.getFeedEntry('hot'),
        feeds.getFeedEntry('new'),
      ]
    }

    if (parsed.kind === 'site') {
      return [
        feeds.getFeedEntry('site', { site: parsed.site, sort: parsed.sort }),
        feeds.getFeedEntry('hot'),
        feeds.getFeedEntry('new'),
      ]
    }

    // User bookmarks: /{username} or /{username}/bookmark, with an optional tag.
    if (parsed.kind === 'user') {
      const { username, tag } = parsed

      if (tag) {
        return [
          feeds.getFeedEntry('user-tag', { username, tag }),
          feeds.getFeedEntry('hot'),
          feeds.getFeedEntry('new'),
        ]
      }

      return [
        feeds.getFeedEntry('bookmarks', { username }),
        feeds.getFeedEntry('hot'),
        feeds.getFeedEntry('new'),
      ]
    }

    return [feeds.getFeedEntry('hot'), feeds.getFeedEntry('new')]
  },

  getFeedHint: feeds.getFeedHint,
}
