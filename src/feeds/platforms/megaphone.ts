import { getQueryParam, isHostOf } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint, wordOrHyphenRegex } from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Generic covers episode (html).
// Handler needed for: playlist.

export type MegaphoneUrl = { kind: 'playlist'; showId: string } | { kind: 'episode' }
export type MegaphonePage = { kind: 'playlist' | 'episode'; showId: string }

const playlistHosts = ['playlist.megaphone.fm']
const playerHosts = ['player.megaphone.fm']

const episodeIdRegex = /^[A-Z]+\d+$/
const episodePathRegex = /^\/([^/]+)\/?$/
const feedUrlRegex = /feeds\.megaphone\.fm\/([\w-]+)/

export const parseMegaphoneUrl = (url: string): MegaphoneUrl | undefined => {
  const { pathname, searchParams } = new URL(url)

  // The playlist embed names its show by the feed id in the p parameter.
  if (isHostOf(url, playlistHosts)) {
    const showId = getQueryParam(searchParams, 'p')

    if (!showId || !wordOrHyphenRegex.test(showId)) {
      return
    }

    return { kind: 'playlist', showId }
  }

  // The episode player names its episode in the path or the e parameter.
  if (isHostOf(url, playerHosts)) {
    const episodeId =
      getQueryParam(searchParams, 'e') ?? pathname.match(episodePathRegex)?.[1] ?? ''

    if (!episodeIdRegex.test(episodeId)) {
      return
    }

    return { kind: 'episode' }
  }
}

export const getMegaphonePage = (
  url: string,
  content: string | undefined,
): MegaphonePage | undefined => {
  const parsed = parseMegaphoneUrl(url)

  if (!parsed) {
    return
  }

  if (parsed.kind === 'playlist') {
    return parsed
  }

  // An episode id is not its show's id, so the show comes from the player's RSS link.
  const showId = content?.match(feedUrlRegex)?.[1]

  if (!showId) {
    return
  }

  return { kind: 'episode', showId }
}

export const megaphoneHandler: PlatformHandler = {
  match: (url) => {
    return parseMegaphoneUrl(url) !== undefined
  },

  resolve: (url, content) => {
    const page = getMegaphonePage(url, content)

    if (!page) {
      return []
    }

    return [
      {
        uri: `https://feeds.megaphone.fm/${page.showId}`,
        hint: composeHint('megaphone:podcast'),
      },
    ]
  },
}
