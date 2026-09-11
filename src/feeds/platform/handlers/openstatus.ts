import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { composeHint } from '../../../common/utils.js'

// Discoverability: Not discoverable without handler.
//
// OpenStatus status pages link no feed. Incident feeds live at `/feed/rss` and
// `/feed/atom` on the page's own origin.
//
// Both markers are paths OpenStatus itself serves: the summary endpoint the
// page links as an alternate, and the origin of its generated preview image.
// A bare `openstatus.dev` search matches the project's own marketing site,
// its docs and its repository page, none of which is a status page.

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
