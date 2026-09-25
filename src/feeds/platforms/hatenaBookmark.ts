import { isAnyOf, isHostOf, parseUrl } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

export type HatenaBookmarkUrl =
  | { kind: 'search' }
  | { kind: 'site' }
  | { kind: 'user'; username: string }

const hosts = ['b.hatena.ne.jp']
const listRegex = /^\/(hotentry|entrylist)(?:\/([a-z]+))?\/?$/
const searchRegex = /^\/search\/(tag|text|title)\/?$/
const siteRegex = /^\/site\/[^/]+/
// Search and per-site listings answer with RSS when `mode=rss` is set.
const rssModeKinds = ['search', 'site']
// A Hatena ID: 3 to 32 characters, starting with a letter and ending with a letter or digit.
// The user feed at /{id}.rss carries the ID too.
const userRegex = /^\/([a-zA-Z][a-zA-Z0-9_-]{1,30}[a-zA-Z0-9])(?:\.rss)?(?:\/|$)/

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
      const [, list, category] = listMatch
      const isHot = list === 'hotentry'
      const suffix = category ? `/${category}` : ''

      return [
        {
          uri: `${origin}/${list}${suffix}.rss`,
          hint: composeHint(isHot ? 'hatena-bookmark:hot' : 'hatena-bookmark:new'),
        },
      ]
    }

    const parsed = parseHatenaBookmarkUrl(url)

    if (parsed && rssModeKinds.includes(parsed.kind)) {
      searchParams.set('mode', 'rss')

      return [
        {
          uri: `${origin}${pathname}?${searchParams}`,
          hint: composeHint(
            parsed.kind === 'site' ? 'hatena-bookmark:site' : 'hatena-bookmark:search',
          ),
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
