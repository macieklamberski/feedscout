import { getPathSegments, isAnyOf, isHostOf, parseUrl } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

export type HatenaAntennaUrl =
  | { kind: 'antenna'; username: string }
  | { kind: 'group'; username: string; groupId: string }

const hosts = ['a.hatena.ne.jp']

// The page links its feeds over http, and the same spelling dedupes against that link.
const feedOrigin = 'http://a.hatena.ne.jp'

// A Hatena ID: 3 to 32 characters, starting with a letter.
const usernameRegex = /^[a-zA-Z][\w-]{2,31}$/

// Site sections, not antennas.
const excludedPaths = [
  'category',
  'check',
  'config',
  'css',
  'edit',
  'help',
  'images',
  'include',
  'map',
  'relate',
  'rss',
  'search',
  'theme',
]

// The group nav with one group in bold, the one the page shows.
const selectedGroupRegex = /<p id="pager_group"[^>]*>(?:(?!<\/p>)[\s\S])*<b>/

export const parseHatenaAntennaUrl = (url: string): HatenaAntennaUrl | undefined => {
  const parsedUrl = parseUrl(url)

  if (!parsedUrl || !isHostOf(parsedUrl, hosts)) {
    return
  }

  const [username] = getPathSegments(parsedUrl)

  if (!username || !usernameRegex.test(username) || isAnyOf(username, excludedPaths)) {
    return
  }

  const groupId = parsedUrl.searchParams.get('gid')

  if (groupId) {
    return { kind: 'group', username, groupId }
  }

  // The simple view, the feed, the OPML and paged views belong to the whole antenna.
  return { kind: 'antenna', username }
}

export const hatenaAntennaHandler: PlatformHandler = {
  match: (url) => {
    return parseHatenaAntennaUrl(url) !== undefined
  },

  resolve: (url, content) => {
    let parsed = parseHatenaAntennaUrl(url)

    if (!parsed) {
      return []
    }

    // Hatena bolds the group the page shows in its group nav. A made-up group id leaves every group
    // a link and serves an empty feed, so the page falls back to the whole antenna.
    if (parsed.kind === 'group' && content !== undefined && !selectedGroupRegex.test(content)) {
      parsed = { kind: 'antenna', username: parsed.username }
    }

    const antennaUrl = `${feedOrigin}/${parsed.username}`

    if (parsed.kind === 'group') {
      const groupId = encodeURIComponent(parsed.groupId)

      return [
        { uri: `${antennaUrl}/rss?gid=${groupId}`, hint: composeHint('hatena-antenna:group') },
      ]
    }

    return [{ uri: `${antennaUrl}/rss`, hint: composeHint('hatena-antenna:antenna') }]
  },
}
