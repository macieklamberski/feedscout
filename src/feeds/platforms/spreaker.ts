import { isHostOf, parseUrl } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

export type SpreakerUrl = { kind: 'show'; showId: string }

const hosts = ['spreaker.com', 'www.spreaker.com']
const podcastRegex = /^\/podcast\/[\w-]+--(\d+)(?:\/|$)/i
// /show/{id} bare numeric form 301-redirects to the slug-suffixed canonical.
const showRegex = /^\/show\/(\d+)(?:\/|$)/i

export const parseSpreakerUrl = (url: string): SpreakerUrl | undefined => {
  const parsedUrl = parseUrl(url)

  if (!parsedUrl || !isHostOf(parsedUrl, hosts)) {
    return
  }

  const { pathname } = parsedUrl
  const showId = pathname.match(podcastRegex)?.[1] ?? pathname.match(showRegex)?.[1]

  if (!showId) {
    return
  }

  return { kind: 'show', showId }
}

export const spreakerHandler: PlatformHandler = {
  match: (url) => {
    return parseSpreakerUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseSpreakerUrl(url)

    if (!parsed) {
      return []
    }

    return [
      {
        uri: `https://www.spreaker.com/show/${parsed.showId}/episodes/feed`,
        hint: composeHint('spreaker:podcast'),
      },
    ]
  },
}
