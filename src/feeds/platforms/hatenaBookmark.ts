import { getAnyOf, isAnyOf, isHostOf, parseUrl } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

export type HatenaBookmarkUrl =
  | { kind: 'hotentry'; category?: string }
  | { kind: 'entrylist'; category?: string }
  | { kind: 'search'; searchType: string; params: string }
  | { kind: 'site'; site: string; params: string }
  | { kind: 'user'; username: string }
  | { kind: 'home' }

const hosts = ['b.hatena.ne.jp']

const listRegex = /^\/(hotentry|entrylist)(?:\/([a-z]+))?\/?$/i
const searchRegex = /^\/search\/(tag|text|title)\/?$/i
const siteRegex = /^\/site\/([^/].*)/i

// A Hatena ID: 3 to 32 characters, starting with a letter and ending with a letter or digit.
// The user feed at /{id}.rss carries the ID too.
const userRegex = /^\/([a-zA-Z][a-zA-Z0-9_-]{1,30}[a-zA-Z0-9])(?:\.rss)?(?:\/|$)/i

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

// Reserved first segments that are site sections, not usernames.
const excludedPaths = [
  'articles',
  'config',
  'entry',
  'entrylist',
  'guide',
  'help',
  'hotentry',
  'images',
  'login',
  'my',
  'q',
  'register',
  'search',
  'site',
]

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

  const params = searchParams.toString()
  const searchType = getAnyOf(pathname.match(searchRegex)?.[1], searchTypes)

  if (searchType) {
    return { kind: 'search', searchType, params }
  }

  const site = pathname.match(siteRegex)?.[1]

  if (site) {
    return { kind: 'site', site, params }
  }

  const username = pathname.match(userRegex)?.[1]

  if (!username || isAnyOf(username, excludedPaths)) {
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
          uri: `${origin}/search/${parsed.searchType}?${searchParams}`,
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
