import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { composeHint } from '../../../common/utils.js'

// Discoverability: Not discoverable without handler.
// Handler needed for: all shapes.

const pageMarkers = ['/api/status/summary.json', 'www.openstatus.dev/api/og/page']

export const isOpenstatusHtml = (content: string): boolean => {
  return pageMarkers.some((marker) => content.includes(marker))
}

export const openstatusHandler: PlatformHandler = {
  match: (url, content) => {
    return URL.canParse(url) && Boolean(content) && isOpenstatusHtml(content ?? '')
  },

  resolve: (url) => {
    try {
      const { origin } = new URL(url)

      return [
        { uri: `${origin}/feed/rss`, hint: composeHint('openstatus:updates-rss') },
        { uri: `${origin}/feed/atom`, hint: composeHint('openstatus:updates-atom') },
      ]
    } catch {}

    return []
  },
}
