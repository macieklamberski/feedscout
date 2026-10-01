import type { DiscoverUriEntry } from '../../common/types.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint, getCookieNames, hasMarker, hasMetaContent } from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Generic covers topics (html), partly covers node.

const nodePathRegex = /\/topics\/node(\d+)(?:\/|$)/i

export const isHomelandHtml = (content: string): boolean => {
  return hasMetaContent(content, 'generator', 'Homeland')
}

export const isHomelandHeaders = (headers: Headers): boolean => {
  return getCookieNames(headers).includes('_homeland_session')
}

export const homelandHandler: PlatformHandler = {
  match: (_url, content, headers) => {
    return hasMarker(content, headers, { html: isHomelandHtml, headers: isHomelandHeaders })
  },

  resolve: (url) => {
    const { origin, pathname } = new URL(url)
    const node = pathname.match(nodePathRegex)?.[1]
    const uris: Array<DiscoverUriEntry> = []

    if (node) {
      uris.push({
        uri: `${origin}/topics/node${node}/feed`,
        hint: composeHint('homeland:node'),
      })
    }

    uris.push({ uri: `${origin}/topics/feed`, hint: composeHint('homeland:topics') })

    return uris
  },
}
