import { pinterest } from 'feedintel'
import { getPathSegments, isAnyOf, isHostOf, isRegion, parseUrl } from 'trousse'
import { withHintLabel, withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { getTenantSubdomain } from '../../common/utils.js'

// Discoverability: Not discoverable without handler.
// Handler needed for: all shapes.

export type PinterestUrl =
  | { kind: 'user'; username: string }
  | { kind: 'tab'; username: string }
  | { kind: 'board'; username: string; board: string }

export const hosts = pinterest.hosts.exact
const domains = pinterest.hosts.tenants

// Profile tabs of a user, which name the user, not a board.
const userSubpaths = ['pins', 'boards', '_saved', '_created', 'followers', 'following']

const feeds = withHintLabels(pinterest.feeds)

// A country site such as pinterest.co.uk redirects to its label on pinterest.com, uk.pinterest.com,
// which serves the same profiles and boards.
const isPinterestHost = (parsedUrl: URL): boolean => {
  return isHostOf(parsedUrl, hosts) || isRegion(getTenantSubdomain(parsedUrl, domains) ?? '')
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

    if (parsed.kind === 'board') {
      const params = { username: parsed.username, board: parsed.board }

      return [feeds.getFeedEntry('pinterest:board', params)]
    }

    return [feeds.getFeedEntry('pinterest:pins', { username: parsed.username })]
  },

  getFeedHint: (url) => withHintLabel(pinterest.getFeedHint(url)),
}
