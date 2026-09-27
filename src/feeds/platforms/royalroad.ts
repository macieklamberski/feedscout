import { isHostOf } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

const hosts = ['royalroad.com', 'www.royalroad.com']

// A chapter URL sits under its fiction, so it carries the fiction id too.
const fictionIdRegex = /^\/fiction\/(\d+)(?:\/|$)/i

export const royalroadHandler: PlatformHandler = {
  match: (url) => {
    return isHostOf(url, hosts) && fictionIdRegex.test(new URL(url).pathname)
  },

  resolve: (url) => {
    const fictionId = new URL(url).pathname.match(fictionIdRegex)?.[1]

    if (!fictionId) {
      return []
    }

    // The fiction page advertises this URL. The chapter page links /fiction/syndication/{id},
    // which serves the same feed.
    return [
      {
        uri: `https://www.royalroad.com/syndication/${fictionId}`,
        hint: composeHint('royalroad:fiction'),
      },
    ]
  },
}
