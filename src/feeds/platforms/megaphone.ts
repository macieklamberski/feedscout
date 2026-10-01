import { isHostOf } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint } from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Generic covers episode (html).
// Handler needed for: playlist.

export type MegaphoneUrl = { kind: 'playlist'; showId: string } | { kind: 'episode' }

const playlistHosts = ['playlist.megaphone.fm']
const playerHosts = ['player.megaphone.fm']

const showIdRegex = /^[\w-]+$/
const episodeIdRegex = /^[A-Z]+\d+$/
const episodePathRegex = /^\/([^/]+)\/?$/
const feedUrlRegex = /feeds\.megaphone\.fm\/([\w-]+)/

export const parseMegaphoneUrl = (url: string): MegaphoneUrl | undefined => {
  const { pathname, searchParams } = new URL(url)

  // The playlist embed names its show by the feed id in the p parameter.
  if (isHostOf(url, playlistHosts)) {
    const showId = searchParams.get('p')

    if (!showId || !showIdRegex.test(showId)) {
      return
    }

    return { kind: 'playlist', showId }
  }

  // The episode player names its episode in the path or the e parameter.
  if (isHostOf(url, playerHosts)) {
    const episodeId = searchParams.get('e') ?? pathname.match(episodePathRegex)?.[1] ?? ''

    if (!episodeIdRegex.test(episodeId)) {
      return
    }

    return { kind: 'episode' }
  }
}

export const megaphoneHandler: PlatformHandler = {
  match: (url) => {
    return parseMegaphoneUrl(url) !== undefined
  },

  resolve: (url, content) => {
    const parsed = parseMegaphoneUrl(url)

    if (!parsed) {
      return []
    }

    // An episode id is not its show's id, so the show comes from the player's RSS link.
    const showId = parsed.kind === 'playlist' ? parsed.showId : content?.match(feedUrlRegex)?.[1]

    if (!showId) {
      return []
    }

    return [
      {
        uri: `https://feeds.megaphone.fm/${showId}`,
        hint: composeHint('megaphone:podcast'),
      },
    ]
  },
}
