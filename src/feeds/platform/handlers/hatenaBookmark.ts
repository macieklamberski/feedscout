import { isAnyOf, isHostOf } from 'trousse'
import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { composeHint } from '../../../common/utils.js'

// Discoverability: Discoverable without handler.
//
// Hatena Bookmark links an RSS 1.0 feed from every listing page, so generic
// discovery finds these already. The handler resolves them from the URL
// alone, without fetching the page first, and keeps the search and site
// feeds free of the UI defaults the page-level link bakes in.

const hosts = ['b.hatena.ne.jp']
const listRegex = /^\/(hotentry|entrylist)(?:\/([a-z]+))?\/?$/
const searchRegex = /^\/search\/(tag|text|title)\/?$/
const siteRegex = /^\/site\/[^/]+/
const userRegex = /^\/([a-zA-Z0-9_-]+)/

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

export const hatenaBookmarkHandler: PlatformHandler = {
  match: (url) => {
    return isHostOf(url, hosts)
  },

  resolve: (url) => {
    const { origin, pathname, searchParams } = new URL(url)

    // Hot and new entry listings, site-wide or per category.
    const listMatch = pathname.match(listRegex)

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

    // Search and per-site listings answer with RSS when `mode=rss` is set.
    if (searchRegex.test(pathname) || siteRegex.test(pathname)) {
      searchParams.set('mode', 'rss')

      return [
        {
          uri: `${origin}${pathname}?${searchParams}`,
          hint: composeHint(
            siteRegex.test(pathname) ? 'hatena-bookmark:site' : 'hatena-bookmark:search',
          ),
        },
      ]
    }

    // User bookmarks: /{user} or /{user}/bookmark.
    const userMatch = pathname.match(userRegex)

    if (userMatch?.[1] && !isAnyOf(userMatch[1], excludedPaths)) {
      return [
        {
          uri: `${origin}/${userMatch[1]}/bookmark.rss`,
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
