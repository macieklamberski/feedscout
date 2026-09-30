import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint, hasMarker } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

export const isStatuspageHtml = (content: string): boolean => {
  return content.includes('dka575ofm4ao0.cloudfront.net/packs/')
}

export const isStatuspageHeaders = (headers: Headers): boolean => {
  return headers.has('x-statuspage-version')
}

export const statuspageHandler: PlatformHandler = {
  match: (_url, content, headers) => {
    return hasMarker(content, headers, { html: isStatuspageHtml, headers: isStatuspageHeaders })
  },

  // Every page of a status page, an incident included, advertises the page's incident history.
  resolve: (url) => {
    const { origin } = new URL(url)

    return [
      { uri: `${origin}/history.rss`, hint: composeHint('statuspage:history', 'rss') },
      { uri: `${origin}/history.atom`, hint: composeHint('statuspage:history', 'atom') },
    ]
  },
}
