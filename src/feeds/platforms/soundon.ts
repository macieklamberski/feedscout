import { isHostOf } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint } from '../../common/utils.js'

// Discoverability: Not discoverable without handler.
// Handler needed for: all shapes.

const hosts = ['player.soundon.fm']

const idRegex = /^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i
const podcastRegex = /^\/p\/([^/]+)(?:\/|$)/i
const embedRegex = /^\/embed\/?$/i

const getPodcastId = (url: string): string | undefined => {
  const { pathname, searchParams } = new URL(url)
  const id = embedRegex.test(pathname)
    ? searchParams.get('podcast')
    : pathname.match(podcastRegex)?.[1]

  if (!id || !idRegex.test(id)) {
    return
  }

  return id
}

export const soundonHandler: PlatformHandler = {
  match: (url) => {
    return isHostOf(url, hosts) && !!getPodcastId(url)
  },

  resolve: (url) => {
    const id = getPodcastId(url)

    if (!id) {
      return []
    }

    return [
      {
        uri: `https://feeds.soundon.fm/podcasts/${id}.xml`,
        hint: composeHint('soundon:podcast'),
      },
    ]
  },
}
