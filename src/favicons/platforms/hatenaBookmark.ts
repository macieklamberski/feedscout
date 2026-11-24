import { decodeSegment, getAnyOf, getQueryParam, isHostOf, parseUrl } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { isSuccessfulStatus } from '../../common/utils.js'
import type { FaviconEnricher } from '../types.js'
import { createStatusError } from '../utils.js'

const platform = 'hatenaBookmark'

export type HatenaBookmarkUrl =
  | { kind: 'hotentry'; category?: string }
  | { kind: 'entrylist'; category?: string }
  | { kind: 'search'; query: string; params: Record<string, string> }
  | { kind: 'site'; site: string; sort?: string }
  | { kind: 'user'; username: string; tag?: string }
  | { kind: 'home' }

const hosts = ['b.hatena.ne.jp']

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

// The CDN redirects a user without an icon, or an unknown ID, to a generic image under this path.
const defaultImagePath = '/default_profile_images/'

export const hatenaBookmarkHandler: PlatformHandler = {
  match: (url) => {
    return parseHatenaBookmarkUrl(url)?.kind === 'user'
  },

  resolve: (url) => {
    const parsed = parseHatenaBookmarkUrl(url)

    if (parsed?.kind !== 'user') {
      return []
    }

    return [{ platform, id: parsed.username, url }]
  },
}

// The avatar address looks the same for every ID, so only the redirect a HEAD request follows
// tells a real icon from the default one.
export const hatenaBookmarkEnricher: FaviconEnricher = async (ref, context) => {
  if (ref.platform !== platform) {
    return
  }

  const avatarUrl = `https://cdn.profile-image.st-hatena.com/users/${ref.id}/profile_256x256.png`
  const response = await context.fetchFn(avatarUrl, { method: 'HEAD' })

  if (response.status === 404 || response.url.includes(defaultImagePath)) {
    return []
  }

  if (!isSuccessfulStatus(response.status)) {
    throw createStatusError(response)
  }

  return [avatarUrl]
}
