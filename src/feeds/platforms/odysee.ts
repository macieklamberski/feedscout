import { decodeSegment, isHostOf, parseUrl } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint } from '../../common/utils.js'

// Discoverability: Not discoverable without handler.
// Handler needed for: all shapes.

export type OdyseeUrl = { kind: 'channel'; name: string; claimId?: string }

export const hosts = ['odysee.com', 'www.odysee.com']
const channelRegex = /^\/@([^/:]+)(?::([a-f0-9]+))?/i

export const parseOdyseeUrl = (url: string): OdyseeUrl | undefined => {
  const parsedUrl = parseUrl(url)

  if (!parsedUrl || !isHostOf(parsedUrl, hosts)) {
    return
  }

  const match = parsedUrl.pathname.match(channelRegex)

  if (!match?.[1]) {
    return
  }

  const name = decodeSegment(match[1])

  if (!name) {
    return
  }

  return { kind: 'channel', name, claimId: match[2] }
}

export const odyseeHandler: PlatformHandler = {
  match: (url) => {
    return isHostOf(url, hosts)
  },

  resolve: (url) => {
    const parsed = parseOdyseeUrl(url)

    // The feed answers "Invalid URL" for a channel without its claim ID.
    if (!parsed?.claimId) {
      return []
    }

    return [
      {
        uri: `https://odysee.com/$/rss/@${encodeURIComponent(parsed.name)}:${parsed.claimId}`,
        hint: composeHint('odysee:videos'),
      },
    ]
  },
}
