import { isHostOf, parseUrl } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

export type RoyalroadUrl = { kind: 'fiction'; fictionId: string }

const hosts = ['royalroad.com', 'www.royalroad.com']

// A chapter URL sits under its fiction, so it carries the fiction id too.
const fictionIdRegex = /^\/fiction\/(\d+)(?:\/|$)/i

export const parseRoyalroadUrl = (url: string): RoyalroadUrl | undefined => {
  const parsedUrl = parseUrl(url)

  if (!parsedUrl || !isHostOf(parsedUrl, hosts)) {
    return
  }

  const fictionId = parsedUrl.pathname.match(fictionIdRegex)?.[1]

  if (!fictionId) {
    return
  }

  return { kind: 'fiction', fictionId }
}

export const royalroadHandler: PlatformHandler = {
  match: (url) => {
    return parseRoyalroadUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseRoyalroadUrl(url)

    if (!parsed) {
      return []
    }

    // The fiction page advertises this URL. The chapter page links /fiction/syndication/{id},
    // which serves the same feed.
    return [
      {
        uri: `https://www.royalroad.com/syndication/${parsed.fictionId}`,
        hint: composeHint('royalroad:fiction'),
      },
    ]
  },
}
