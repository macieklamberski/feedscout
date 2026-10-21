import { decodeSegment, getAnyOf, isHostOf, parseUrl } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint } from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Generic covers category, home, newEntriesCategory, user (html).
// Handler needed for: search, site.

export type HatenaBookmarkUrl =
  | { kind: 'hotentry'; category?: string }
  | { kind: 'entrylist'; category?: string }
  | { kind: 'search'; query: string; params: string }
  | { kind: 'site'; site: string; params: string }
  | { kind: 'user'; username: string }
  | { kind: 'home' }

const hosts = ['b.hatena.ne.jp']

const listRegex = /^\/(hotentry|entrylist)(?:\/([a-z]+))?\/?$/i
const queryRegex = /^\/q(?:\/(.*))?$/i
const searchRegex = /^\/search\/(tag|text|title)\/?$/i
const siteRegex = /^\/site\/([^/].*)/i

// A Hatena ID starts with a letter. The user feed at /{id}.rss carries the ID too.
const userRegex = /^\/([a-z][\w-]*?)(?:\.rss)?(?:\/|$)/i

const bookmarkLists = ['hotentry', 'entrylist']

const categories = [
  'all',
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

const copySearchFilters = (from: URLSearchParams, to: URLSearchParams): string => {
  for (const filter of searchFilters) {
    const value = from.get(filter)

    if (value) {
      to.set(filter, value)
    }
  }

  return to.toString()
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

    return { kind: 'search', query, params: copySearchFilters(searchParams, new URLSearchParams()) }
  }

  const searchType = getAnyOf(pathname.match(searchRegex)?.[1], searchTypes)

  // The old search path answers 301 to /q/{query}, with `target` set for a text or title search.
  // Without a query it lands on the home page.
  if (searchType) {
    const legacyQuery = searchParams.get('q')

    if (!legacyQuery) {
      return { kind: 'home' }
    }

    const target = new URLSearchParams(searchType === 'tag' ? {} : { target: searchType })

    return { kind: 'search', query: legacyQuery, params: copySearchFilters(searchParams, target) }
  }

  const site = pathname.match(siteRegex)?.[1]

  // The site page keeps only its sort order in its own feed link.
  if (site) {
    const sort = searchParams.get('sort')
    const params = new URLSearchParams(sort ? { sort } : {}).toString()

    return { kind: 'site', site, params }
  }

  const username = pathname.match(userRegex)?.[1]

  if (!username) {
    return { kind: 'home' }
  }

  return { kind: 'user', username }
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

    const { origin } = new URL(url)

    if (parsed.kind === 'hotentry') {
      const suffix = parsed.category ? `/${parsed.category}` : ''

      return [{ uri: `${origin}/hotentry${suffix}.rss`, hint: composeHint('hatena-bookmark:hot') }]
    }

    if (parsed.kind === 'entrylist') {
      const suffix = parsed.category ? `/${parsed.category}` : ''

      return [{ uri: `${origin}/entrylist${suffix}.rss`, hint: composeHint('hatena-bookmark:new') }]
    }

    if (parsed.kind === 'search') {
      // Search and per-site listings answer with RSS when `mode=rss` is set.
      const searchParams = new URLSearchParams(parsed.params)
      searchParams.set('mode', 'rss')

      return [
        {
          uri: `${origin}/q/${encodeURIComponent(parsed.query)}?${searchParams}`,
          hint: composeHint('hatena-bookmark:search'),
        },
      ]
    }

    if (parsed.kind === 'site') {
      const searchParams = new URLSearchParams(parsed.params)
      searchParams.set('mode', 'rss')

      return [
        {
          uri: `${origin}/site/${parsed.site}?${searchParams}`,
          hint: composeHint('hatena-bookmark:site'),
        },
      ]
    }

    // User bookmarks: /{username} or /{username}/bookmark.
    if (parsed.kind === 'user') {
      return [
        {
          uri: `${origin}/${parsed.username}/bookmark.rss`,
          hint: composeHint('hatena-bookmark:bookmarks'),
        },
      ]
    }

    return [
      {
        uri: `${origin}/hotentry.rss`,
        hint: composeHint('hatena-bookmark:hot'),
      },
    ]
  },
}
