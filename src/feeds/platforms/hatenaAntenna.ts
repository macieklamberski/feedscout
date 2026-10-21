import { getPathSegments, isHostOf, parseUrl } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import {
  composeHint,
  findDescendant,
  findElement,
  letterThenWordOrHyphenRegex,
} from '../../common/utils.js'

// Discoverability: Discoverable without handler.

export type HatenaAntennaUrl =
  | { kind: 'antenna'; username: string }
  | { kind: 'group'; username: string; groupId: string }

const hosts = ['a.hatena.ne.jp']

// The page links its feeds over http, and the same spelling dedupes against that link.
const feedOrigin = 'http://a.hatena.ne.jp'

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
    if (parsed.kind === 'group' && content !== undefined && !hasSelectedGroup(content)) {
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
