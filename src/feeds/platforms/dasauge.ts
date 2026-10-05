import { getPathSegments, isHostOf } from 'trousse'
import type { DiscoverUriEntry } from '../../common/types.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

export type DasaugeUrl = { kind: 'profile'; username: string }

const hosts = [
  'dasauge.at',
  'dasauge.ch',
  'dasauge.co.uk',
  'dasauge.com',
  'dasauge.de',
  'dasauge.es',
]

const profileRegex = /^-(.+)$/

export const parseDasaugeUrl = (url: string): DasaugeUrl | undefined => {
  if (!isHostOf(url, hosts)) {
    return
  }

  const [segment] = getPathSegments(url)
  const username = segment?.match(profileRegex)?.[1]

  if (!username) {
    return
  }

  return { kind: 'profile', username }
}

export const dasaugeHandler: PlatformHandler = {
  match: (url) => {
    return parseDasaugeUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseDasaugeUrl(url)

    if (!parsed) {
      return []
    }

    const { origin } = new URL(url)
    const uris: Array<DiscoverUriEntry> = []

    // The feed answers only on the bare `?rss` query. `?rss=` and `?rss=1` serve the profile page.
    uris.push({ uri: `${origin}/-${parsed.username}/?rss`, hint: composeHint('dasauge:profile') })

    return uris
  },
}
