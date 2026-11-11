import { decodeSegment, isHostOf, parseUrl } from 'trousse'
import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'

// Discoverability: Not discoverable without handler.
// Handler needed for: all shapes.

export type DeviantartUrl =
  | { kind: 'tag'; tag: string }
  | { kind: 'favourites'; username: string }
  | { kind: 'folder'; username: string; folderId: string }
  | { kind: 'journal'; username: string }
  | { kind: 'profile'; username: string }
  | { kind: 'dailyDeviations' }

const hosts = ['deviantart.com', 'www.deviantart.com']

const tagRegex = /^\/tag\/([^/]+)/i
const userRegex = /^\/([a-zA-Z0-9_-]+)(?:\/|$)/i
const favouritesRegex = /^\/[^/]+\/favourites\/?$/i
const folderRegex = /^\/[^/]+\/gallery\/(\d+)(?:\/|$)/i
const journalRegex = /^\/[^/]+\/journal(?:\/|$)/i
const dailyDeviationsRegex = /^\/daily-deviations\/?$/i

const feeds = definePlatformFeeds([
  {
    key: 'deviantart:deviations',
    template:
      'https://backend.deviantart.com/rss.xml?type=deviation&q=by:{username} sort:time meta:all',
  },
  {
    key: 'deviantart:gallery',
    template:
      'https://backend.deviantart.com/rss.xml?type=deviation&q=gallery:{username}/{folderId}',
  },
  {
    key: 'deviantart:favorites',
    template: 'https://backend.deviantart.com/rss.xml?type=deviation&q=favby:{username}',
  },
  {
    key: 'deviantart:tag',
    template: 'https://backend.deviantart.com/rss.xml?type=deviation&q=tag:{tag}',
  },
  {
    key: 'deviantart:journal',
    template: 'https://backend.deviantart.com/rss.xml?q=journal:{username}',
  },
  {
    key: 'deviantart:daily-deviations',
    template: 'https://backend.deviantart.com/rss.xml?q=special:dd',
  },
])

export const parseDeviantartUrl = (url: string): DeviantartUrl | undefined => {
  const parsedUrl = parseUrl(url)

  if (!parsedUrl || !isHostOf(parsedUrl, hosts)) {
    return
  }

  const { pathname } = parsedUrl

  if (dailyDeviationsRegex.test(pathname)) {
    return { kind: 'dailyDeviations' }
  }

  const tag = pathname.match(tagRegex)?.[1]

  if (tag) {
    return { kind: 'tag', tag: decodeSegment(tag) ?? tag }
  }

  const username = pathname.match(userRegex)?.[1]

  if (!username) {
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
    return parseDeviantartUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseDeviantartUrl(url)

    if (!parsed) {
      return []
    }

    if (parsed.kind === 'dailyDeviations') {
      return [feeds.getFeedEntry('deviantart:daily-deviations')]
    }

    if (parsed.kind === 'tag') {
      return [feeds.getFeedEntry('deviantart:tag', { tag: parsed.tag })]
    }

    if (parsed.kind === 'favourites') {
      return [feeds.getFeedEntry('deviantart:favorites', { username: parsed.username })]
    }

    if (parsed.kind === 'folder') {
      const params = { username: parsed.username, folderId: parsed.folderId }

      return [feeds.getFeedEntry('deviantart:gallery', params)]
    }

    if (parsed.kind === 'journal') {
      return [feeds.getFeedEntry('deviantart:journal', { username: parsed.username })]
    }

    return [feeds.getFeedEntry('deviantart:deviations', { username: parsed.username })]
  },

  getFeedKey: feeds.getFeedKey,
}
