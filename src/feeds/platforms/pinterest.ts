import { getPathSegments, isAnyOf, isHostOf, parseUrl } from 'trousse'
import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { getTenantSubdomain } from '../../common/utils.js'

// Discoverability: Not discoverable without handler.
// Handler needed for: all shapes.

export type PinterestUrl =
  | { kind: 'user'; username: string }
  | { kind: 'tab'; username: string }
  | { kind: 'board'; username: string; board: string }

export const hosts = ['pinterest.com', 'www.pinterest.com']
const domains = ['pinterest.com']

// A country site such as pinterest.co.uk redirects to its label on pinterest.com, uk.pinterest.com,
// which serves the same profiles and boards.
// length: keeps service hosts such as help out
const countryLabelRegex = /^[a-z]{2}$/

// Profile tabs of a user, which name the user, not a board.
const userSubpaths = ['pins', 'boards', '_saved', '_created', 'followers', 'following']

const feeds = definePlatformFeeds(
  [
    // Before the board row, so a pins feed never reads as a board named feed.
    { key: 'pinterest:pins', template: 'https://{host}/{username}/feed.rss' },
    { key: 'pinterest:board', template: 'https://{host}/{username}/{board}.rss' },
  ],
  { hosts, domains },
)

const isPinterestHost = (parsedUrl: URL): boolean => {
  if (isHostOf(parsedUrl, hosts)) {
    return true
  }

  return countryLabelRegex.test(getTenantSubdomain(parsedUrl, domains) ?? '')
}

export const parsePinterestUrl = (url: string): PinterestUrl | undefined => {
  const parsedUrl = parseUrl(url)

  if (!parsedUrl || !isPinterestHost(parsedUrl)) {
    return
  }

  const [username, board] = getPathSegments(parsedUrl)

  // Pinterest names carry no dots, so a dotted segment such as robots.txt is a file of the site.
  if (!username || username.includes('.')) {
    return
  }

  if (!board) {
    return { kind: 'user', username }
  }

  if (isAnyOf(board, userSubpaths)) {
    return { kind: 'tab', username }
  }

  return { kind: 'board', username, board }
}

export const pinterestHandler: PlatformHandler = {
  match: (url) => {
    return parsePinterestUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parsePinterestUrl(url)

    if (!parsed) {
      return []
    }

    const host = 'www.pinterest.com'

    if (parsed.kind === 'board') {
      const params = { host, username: parsed.username, board: parsed.board }

      return [feeds.getFeedEntry('pinterest:board', params)]
    }

    return [feeds.getFeedEntry('pinterest:pins', { host, username: parsed.username })]
  },

  // Country label hosts serve the same feeds, other subdomains such as help do not.
  getFeedKey: (url) => {
    const parsedUrl = parseUrl(url)

    if (!parsedUrl || !isPinterestHost(parsedUrl)) {
      return
    }

    return feeds.getFeedKey(url)
  },
}
