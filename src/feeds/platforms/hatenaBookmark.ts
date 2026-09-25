import { getAnyOf, isAnyOf, isHostOf, parseUrl } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

export type HatenaBookmarkUrl =
  | { kind: 'search' }
  | { kind: 'site' }
  | { kind: 'user'; username: string }

const hosts = ['b.hatena.ne.jp']

const listRegex = /^\/(hotentry|entrylist)(?:\/([a-z]+))?\/?$/i
const searchRegex = /^\/search\/(tag|text|title)\/?$/i
const siteRegex = /^\/site\/([^/].*)/i

// A Hatena ID: 3 to 32 characters, starting with a letter and ending with a letter or digit.
// The user feed at /{id}.rss carries the ID too.
const userRegex = /^\/([a-zA-Z][a-zA-Z0-9_-]{1,30}[a-zA-Z0-9])(?:\.rss)?(?:\/|$)/i

const bookmarkLists = ['hotentry', 'entrylist']

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

  const { pathname } = parsedUrl

  if (searchRegex.test(pathname)) {
    return { kind: 'search' }
  }

  if (siteRegex.test(pathname)) {
    return { kind: 'site' }
  }

  const username = pathname.match(userRegex)?.[1]

  if (!username || isAnyOf(username, excludedPaths)) {
    return
  }

  return { kind: 'user', username }
}

export const hatenaBookmarkHandler: PlatformHandler = {
  match: (url) => {
    return isHostOf(url, hosts)
  },

  resolve: (url) => {
    const { origin, pathname, searchParams } = new URL(url)
    const listMatch = pathname.match(listRegex)

    // Hot and new entry listings, site-wide or per category.
    if (listMatch?.[1]) {
      const [, rawList, category] = listMatch
      const list = getAnyOf(rawList, bookmarkLists)
      const isHot = list === 'hotentry'
      // Hatena's category slugs are lowercase and not listed anywhere to match against.
      const suffix = category ? `/${category.toLowerCase()}` : ''

      return [
        {
          uri: `${origin}/${list}${suffix}.rss`,
          hint: composeHint(isHot ? 'hatena-bookmark:hot' : 'hatena-bookmark:new'),
        },
      ]
    }

    const parsed = parseHatenaBookmarkUrl(url)

    // Search and per-site listings answer with RSS when `mode=rss` is set.
    searchParams.set('mode', 'rss')

    if (parsed?.kind === 'search') {
      const [, rawType] = pathname.match(searchRegex) ?? []
      const type = getAnyOf(rawType, searchTypes)

      return [
        {
          uri: `${origin}/search/${type}?${searchParams}`,
          hint: composeHint('hatena-bookmark:search'),
        },
      ]
    }

    if (parsed?.kind === 'site') {
      const [, site] = pathname.match(siteRegex) ?? []

      return [
        {
          uri: `${origin}/site/${site}?${searchParams}`,
          hint: composeHint('hatena-bookmark:site'),
        },
      ]
    }

    // User bookmarks: /{username} or /{username}/bookmark.
    if (parsed?.kind === 'user') {
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
