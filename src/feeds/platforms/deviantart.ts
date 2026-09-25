import { decodeSegment, isAnyOf, isHostOf, parseUrl } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint } from '../../common/utils.js'

// Discoverability: Not discoverable without handler.
// Handler needed for: all shapes.

export type DeviantartUrl =
  | { kind: 'tag'; tag: string }
  | { kind: 'favourites'; username: string }
  | { kind: 'folder'; username: string; folderId: string }
  | { kind: 'journal'; username: string }
  | { kind: 'profile'; username: string }

const tagRegex = /^\/tag\/([^/]+)/
const userRegex = /^\/([a-zA-Z0-9_-]+)(?:\/|$)/
const favouritesRegex = /^\/[^/]+\/favourites\/?$/
const folderRegex = /^\/[^/]+\/gallery\/(\d+)(?:\/|$)/
const journalRegex = /^\/[^/]+\/journal(?:\/|$)/

const hosts = ['deviantart.com', 'www.deviantart.com']
const feedBaseUrl = 'https://backend.deviantart.com/rss.xml'
const excludedPaths = [
  'about',
  'core-membership',
  'daily-deviations',
  'developers',
  'join',
  'notifications',
  'popular',
  'search',
  'settings',
  'shop',
  'submit',
  'tag',
  'team',
  'topic',
  'watch',
]

export const parseDeviantartUrl = (url: string): DeviantartUrl | undefined => {
  const parsedUrl = parseUrl(url)

  if (!parsedUrl || !isHostOf(parsedUrl, hosts)) {
    return
  }

  const { pathname } = parsedUrl
  const tag = pathname.match(tagRegex)?.[1]

  if (tag) {
    return { kind: 'tag', tag: decodeSegment(tag) ?? tag }
  }

  const username = pathname.match(userRegex)?.[1]

  if (!username || isAnyOf(username, excludedPaths)) {
    return
  }

  if (favouritesRegex.test(pathname)) {
    return { kind: 'favourites', username }
  }

  const folderId = pathname.match(folderRegex)?.[1]

  if (folderId) {
    return { kind: 'folder', username, folderId }
  }

  if (journalRegex.test(pathname)) {
    return { kind: 'journal', username }
  }

  return { kind: 'profile', username }
}

export const deviantartHandler: PlatformHandler = {
  match: (url) => {
    return isHostOf(url, hosts)
  },

  resolve: (url) => {
    const { pathname } = new URL(url)

    // Site-wide curated feeds.
    if (pathname === '/daily-deviations' || pathname === '/daily-deviations/') {
      return [
        {
          uri: `${feedBaseUrl}?q=${encodeURIComponent('special:dd')}`,
          hint: composeHint('deviantart:daily-deviations'),
        },
      ]
    }

    if (pathname === '/popular' || pathname === '/popular/') {
      return [
        {
          uri: `${feedBaseUrl}?type=deviation&q=${encodeURIComponent('boost:popular')}`,
          hint: composeHint('deviantart:popular'),
        },
      ]
    }

    const parsed = parseDeviantartUrl(url)

    if (parsed?.kind === 'tag') {
      return [
        {
          uri: `${feedBaseUrl}?type=deviation&q=${encodeURIComponent(`tag:${parsed.tag}`)}`,
          hint: composeHint('deviantart:tag'),
        },
      ]
    }

    if (parsed?.kind === 'favourites') {
      return [
        {
          uri: `${feedBaseUrl}?type=deviation&q=${encodeURIComponent(`favby:${parsed.username}`)}`,
          hint: composeHint('deviantart:favorites'),
        },
      ]
    }

    if (parsed?.kind === 'folder') {
      const query = `gallery:${parsed.username}/${parsed.folderId}`

      return [
        {
          uri: `${feedBaseUrl}?type=deviation&q=${encodeURIComponent(query)}`,
          hint: composeHint('deviantart:gallery'),
        },
      ]
    }

    if (parsed?.kind === 'journal') {
      return [
        {
          uri: `${feedBaseUrl}?q=${encodeURIComponent(`journal:${parsed.username}`)}`,
          hint: composeHint('deviantart:journal'),
        },
      ]
    }

    if (parsed?.kind !== 'profile') {
      return []
    }

    const query = `by:${parsed.username} sort:time meta:all`

    return [
      {
        uri: `${feedBaseUrl}?type=deviation&q=${encodeURIComponent(query)}`,
        hint: composeHint('deviantart:deviations'),
      },
    ]
  },
}
