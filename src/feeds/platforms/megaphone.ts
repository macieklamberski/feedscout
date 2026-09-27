import { isHostOf } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint } from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Generic covers episode (html).
// Handler needed for: playlist.

const playlistHosts = ['playlist.megaphone.fm']
const playerHosts = ['player.megaphone.fm']

const showIdRegex = /^[\w-]+$/
const episodeIdRegex = /^[A-Z]+\d+$/
const episodePathRegex = /^\/([^/]+)\/?$/
const feedUrlRegex = /feeds\.megaphone\.fm\/([\w-]+)/

// The playlist embed names its show by the feed id in the p parameter.
const getPlaylistShowId = (url: string): string | undefined => {
  if (!isHostOf(url, playlistHosts)) {
    return
  }

  const showId = new URL(url).searchParams.get('p')

  if (!showId || !showIdRegex.test(showId)) {
    return
  }

  return showId
}

// The episode player names its episode in the path or the e parameter.
const isEpisodePlayer = (url: string): boolean => {
  if (!isHostOf(url, playerHosts)) {
    return false
  }

  const { pathname, searchParams } = new URL(url)
  const episodeId = searchParams.get('e') ?? pathname.match(episodePathRegex)?.[1] ?? ''

  return episodeIdRegex.test(episodeId)
}

export const megaphoneHandler: PlatformHandler = {
  match: (url) => {
    return Boolean(getPlaylistShowId(url)) || isEpisodePlayer(url)
  },

  resolve: (url, content) => {
    // An episode id is not its show's id, so the show comes from the player's RSS link.
    const showId = getPlaylistShowId(url) ?? content?.match(feedUrlRegex)?.[1]

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
