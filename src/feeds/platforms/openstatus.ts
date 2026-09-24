import { parseUrl } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint } from '../../common/utils.js'

// Discoverability: Not discoverable without handler.
// Handler needed for: all shapes.

const pageMarkers = ['/api/status/summary.json', 'www.openstatus.dev/api/og/page']

export const isOpenstatusHtml = (content: string): boolean => {
  return pageMarkers.some((marker) => content.includes(marker))
}

export const openstatusHandler: PlatformHandler = {
  match: (url, content) => {
    return Boolean(parseUrl(url)) && Boolean(content) && isOpenstatusHtml(content ?? '')
  },

  resolve: (url) => {
    const parsedUrl = parseUrl(url)

    if (!parsedUrl) {
      return []
    }

    const { origin } = parsedUrl

    return [
      { uri: `${origin}/feed/rss`, hint: composeHint('openstatus:updates', 'rss') },
      { uri: `${origin}/feed/atom`, hint: composeHint('openstatus:updates', 'atom') },
    ]
  },
}
