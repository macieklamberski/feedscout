import { getQueryParam, isHostOf, parseUrl } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint, hexOrHyphenRegex } from '../../common/utils.js'

// Discoverability: Not discoverable without handler.
// Handler needed for: all shapes.

export type SoundonUrl = { kind: 'podcast'; podcastId: string }

const hosts = ['player.soundon.fm']

const podcastRegex = /^\/p\/([^/]+)(?:\/|$)/i
const embedRegex = /^\/embed\/?$/i

export const parseSoundonUrl = (url: string): SoundonUrl | undefined => {
  const parsedUrl = parseUrl(url)

  if (!parsedUrl || !isHostOf(parsedUrl, hosts)) {
    return
  }

  const { pathname, searchParams } = parsedUrl
  const podcastId = embedRegex.test(pathname)
    ? getQueryParam(searchParams, 'podcast')
    : pathname.match(podcastRegex)?.[1]

  if (!podcastId || !hexOrHyphenRegex.test(podcastId)) {
    return
  }

  return { kind: 'podcast', podcastId }
}

export const soundonHandler: PlatformHandler = {
  match: (url) => {
    return parseSoundonUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseSoundonUrl(url)

    if (!parsed) {
      return []
    }

    return [
      {
        uri: `https://feeds.soundon.fm/podcasts/${parsed.podcastId}.xml`,
        hint: composeHint('soundon:podcast'),
      },
    ]
  },
}
