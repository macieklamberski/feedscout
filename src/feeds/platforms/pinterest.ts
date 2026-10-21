import { getPathSegments, isAnyOf, isHostOf, parseUrl } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint, getTenantSubdomain } from '../../common/utils.js'

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

  if (!username) {
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
      return [
        {
          uri: `https://www.pinterest.com/${parsed.username}/${parsed.board}.rss`,
          hint: composeHint('pinterest:board'),
        },
      ]
    }

    return [
      {
        uri: `https://www.pinterest.com/${parsed.username}/feed.rss`,
        hint: composeHint('pinterest:pins'),
      },
    ]
  },
}
