import { getPathSegments, isAnyOf, isHostOf, parseUrl } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint } from '../../common/utils.js'

// Discoverability: Not discoverable without handler.
// Handler needed for: all shapes.

export type PinterestUrl =
  | { kind: 'user'; username: string }
  | { kind: 'board'; username: string; board: string }

export const hosts = ['pinterest.com', 'www.pinterest.com']

const excludedPaths = [
  '_',
  'about',
  'ads',
  'business',
  'careers',
  'categories',
  'convert',
  'developers',
  'explore',
  'help',
  'homefeed',
  'idea-pin-builder',
  'ideas',
  'login',
  'logout',
  'me',
  'messages',
  'news_hub',
  'oauth',
  'password',
  'pin',
  'pin-builder',
  'pin-creation-tool',
  'privacy',
  'resource',
  'search',
  'settings',
  'shopping',
  'signup',
  'terms',
  'today',
  'topics',
  'videos',
]

// Reserved sub-routes of a user are not boards.
const userSubpaths = ['pins', 'boards', '_saved', '_created', 'followers', 'following']

export const parsePinterestUrl = (url: string): PinterestUrl | undefined => {
  const parsedUrl = parseUrl(url)

  if (!parsedUrl || !isHostOf(parsedUrl, hosts)) {
    return
  }

  const [username, board] = getPathSegments(parsedUrl)

  if (!username || isAnyOf(username, excludedPaths)) {
    return
  }

  if (board && !isAnyOf(board, userSubpaths)) {
    return { kind: 'board', username, board }
  }

  return { kind: 'user', username }
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
