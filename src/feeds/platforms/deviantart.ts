import { deviantart } from 'feedintel'
import { decodeSegment, isHostOf, parseUrl } from 'trousse'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'

// Discoverability: Not discoverable without handler.
// Handler needed for: deviations, favorites, gallery.

export type DeviantartUrl =
  | { kind: 'tag'; tag: string }
  | { kind: 'favourites'; username: string }
  | { kind: 'folder'; username: string; folderId: string }
  | { kind: 'journal'; username: string }
  | { kind: 'profile'; username: string }
  | { kind: 'dailyDeviations' }

const hosts = deviantart.hosts.exact

const tagRegex = /^\/tag\/([^/]+)/i
const userRegex = /^\/([a-zA-Z0-9_-]+)(?:\/|$)/i
const favouritesRegex = /^\/[^/]+\/favourites\/?$/i
const folderRegex = /^\/[^/]+\/gallery\/(\d+)(?:\/|$)/i
const journalRegex = /^\/[^/]+\/journal(?:\/|$)/i
const dailyDeviationsRegex = /^\/daily-deviations\/?$/i

const feeds = withHintLabels(deviantart.feeds)

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

    if (parsed.kind === 'dailyDeviations' || parsed.kind === 'tag') {
      return []
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

  getFeedHint: feeds.getFeedHint,
}
