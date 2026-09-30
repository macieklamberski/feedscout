import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint, hasMarker } from '../../common/utils.js'

// Discoverability: Not discoverable without handler.
// Handler needed for: all shapes.

const pageMarkers = ['/api/status/summary.json', 'www.openstatus.dev/api/og/page']

export const isOpenstatusHtml = (content: string): boolean => {
  return pageMarkers.some((marker) => content.includes(marker))
}

export const openstatusHandler: PlatformHandler = {
  match: (_url, content, headers) => {
    return hasMarker(content, headers, { html: isOpenstatusHtml })
  },

  resolve: (url) => {
    const { origin } = new URL(url)

    return [
      { uri: `${origin}/feed/rss`, hint: composeHint('openstatus:updates', 'rss') },
      { uri: `${origin}/feed/atom`, hint: composeHint('openstatus:updates', 'atom') },
    ]
  },
}
