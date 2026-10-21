import { decodeSegment, isHostOf, parseUrl } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint, hexRegex } from '../../common/utils.js'

// Discoverability: Not discoverable without handler.
// Handler needed for: all shapes.

export type OdyseeUrl = { kind: 'channel'; name: string; claimId?: string }

export const hosts = ['odysee.com', 'www.odysee.com']
const channelRegex = /^\/@(?<name>[^/:]+)(?::(?<claimId>[^/]+))?/

export const parseOdyseeUrl = (url: string): OdyseeUrl | undefined => {
  const parsedUrl = parseUrl(url)

  if (!parsedUrl || !isHostOf(parsedUrl, hosts)) {
    return
  }

  const groups = parsedUrl.pathname.match(channelRegex)?.groups

  if (!groups?.name) {
    return
  }

  const name = decodeSegment(groups.name)

  if (!name) {
    return
  }

  const { claimId } = groups

  if (claimId !== undefined && !hexRegex.test(claimId)) {
    return
  }

  return { kind: 'channel', name, claimId }
}

export const odyseeHandler: PlatformHandler = {
  // The feed answers "Invalid URL" for a channel without its claim ID.
  match: (url) => {
    return parseOdyseeUrl(url)?.claimId !== undefined
  },

  resolve: (url) => {
    const parsed = parseOdyseeUrl(url)

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
