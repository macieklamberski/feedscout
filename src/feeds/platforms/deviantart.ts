import { decodeSegment, isHostOf, parseUrl } from 'trousse'
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
  | { kind: 'dailyDeviations' }

const hosts = ['deviantart.com', 'www.deviantart.com']
const feedBaseUrl = 'https://backend.deviantart.com/rss.xml'

const tagRegex = /^\/tag\/([^/]+)/i
const userRegex = /^\/([a-zA-Z0-9_-]+)(?:\/|$)/i
const favouritesRegex = /^\/[^/]+\/favourites\/?$/i
const folderRegex = /^\/[^/]+\/gallery\/(\d+)(?:\/|$)/i
const journalRegex = /^\/[^/]+\/journal(?:\/|$)/i
const dailyDeviationsRegex = /^\/daily-deviations\/?$/i

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

    // Site-wide curated feeds.
    if (parsed.kind === 'dailyDeviations') {
      return [
        {
          uri: `${feedBaseUrl}?${new URLSearchParams({ q: 'special:dd' })}`,
          hint: composeHint('deviantart:daily-deviations'),
        },
      ]
    }

    if (parsed.kind === 'tag') {
      return [
        {
          uri: `${feedBaseUrl}?${new URLSearchParams({ type: 'deviation', q: `tag:${parsed.tag}` })}`,
          hint: composeHint('deviantart:tag'),
        },
      ]
    }

    if (parsed.kind === 'favourites') {
      return [
        {
          uri: `${feedBaseUrl}?${new URLSearchParams({ type: 'deviation', q: `favby:${parsed.username}` })}`,
          hint: composeHint('deviantart:favorites'),
        },
      ]
    }

    if (parsed.kind === 'folder') {
      const query = `gallery:${parsed.username}/${parsed.folderId}`

      return [
        {
          uri: `${feedBaseUrl}?${new URLSearchParams({ type: 'deviation', q: query })}`,
          hint: composeHint('deviantart:gallery'),
        },
      ]
    }

    if (parsed.kind === 'journal') {
      return [
        {
          uri: `${feedBaseUrl}?${new URLSearchParams({ q: `journal:${parsed.username}` })}`,
          hint: composeHint('deviantart:journal'),
        },
      ]
    }

    const query = `by:${parsed.username} sort:time meta:all`

    return [
      {
        uri: `${feedBaseUrl}?${new URLSearchParams({ type: 'deviation', q: query })}`,
        hint: composeHint('deviantart:deviations'),
      },
    ]
  },
}
