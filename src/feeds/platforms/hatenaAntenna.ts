import { getPathSegments, getQueryParam, isAnyOf, isHostOf, parseUrl } from 'trousse'
import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { findDescendant, findElement, letterThenWordOrHyphenRegex } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

export type HatenaAntennaUrl =
  | { kind: 'antenna'; username: string }
  | { kind: 'group'; username: string; groupId: string }
export type HatenaAntennaPage = HatenaAntennaUrl

const hosts = ['a.hatena.ne.jp']

// The page links its feeds over http, and the same spelling dedupes against that link.
const feeds = definePlatformFeeds([
  { key: 'hatena-antenna:group', template: 'http://a.hatena.ne.jp/{username}/rss?gid={groupId}' },
  { key: 'hatena-antenna:antenna', template: 'http://a.hatena.ne.jp/{username}/rss' },
])

// Site routes in the user position, which redirect their rss path to the home page.
const routeWords = ['include', 'category']

// The group nav with one group in bold, the one the page shows.
const hasSelectedGroup = (content: string): boolean => {
  const pager = findElement(content, (element) => {
    return element.name === 'p' && element.attribs.id === 'pager_group'
  })

  if (!pager) {
    return false
  }

  return findDescendant(pager, (element) => element.name === 'b') !== undefined
}

export const parseHatenaAntennaUrl = (url: string): HatenaAntennaUrl | undefined => {
  const parsedUrl = parseUrl(url)

  if (!parsedUrl || !isHostOf(parsedUrl, hosts)) {
    return
  }

  const [username] = getPathSegments(parsedUrl)

  // A Hatena ID starts with a letter.
  if (!username || !letterThenWordOrHyphenRegex.test(username)) {
    return
  }

  const groupId = getQueryParam(parsedUrl.searchParams, 'gid')

  if (groupId) {
    return { kind: 'group', username, groupId }
  }

  // The simple view, the feed, the OPML and paged views belong to the whole antenna.
  return { kind: 'antenna', username }
}

export const getHatenaAntennaPage = (
  url: string,
  content: string | undefined,
): HatenaAntennaPage | undefined => {
  const parsed = parseHatenaAntennaUrl(url)

  if (!parsed) {
    return
  }

  // Hatena bolds the group the page shows in its group nav. A made-up group id leaves every group
  // a link and serves an empty feed, so the page falls back to the whole antenna.
  if (parsed.kind === 'group' && content !== undefined && !hasSelectedGroup(content)) {
    return { kind: 'antenna', username: parsed.username }
  }

  return parsed
}

export const hatenaAntennaHandler: PlatformHandler = {
  match: (url) => {
    return parseHatenaAntennaUrl(url) !== undefined
  },

  resolve: (url, content) => {
    const page = getHatenaAntennaPage(url, content)

    if (!page) {
      return []
    }

    if (page.kind === 'group') {
      return [
        feeds.getFeedEntry('hatena-antenna:group', {
          username: page.username,
          groupId: page.groupId,
        }),
      ]
    }

    return [feeds.getFeedEntry('hatena-antenna:antenna', { username: page.username })]
  },

  // The table reads any first segment as a user, so the page parser refuses a segment that is no
  // Hatena ID, such as a file of the site, and the route words are refused here.
  getFeedKey: (url) => {
    const parsed = parseHatenaAntennaUrl(url)

    if (!parsed || isAnyOf(parsed.username, routeWords)) {
      return
    }

    return feeds.getFeedKey(url)
  },
}
