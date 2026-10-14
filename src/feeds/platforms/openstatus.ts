import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint, findElement, hasMarker, hasMetaContent } from '../../common/utils.js'

// Discoverability: Not discoverable without handler.
// Handler needed for: all shapes.

const previewImageUrl = 'https://www.openstatus.dev/api/og/page'

const summaryHrefRegex = /^(?:https?:\/\/[^/]+)?\/api\/status\/summary\.json$/

// A status page links its summary endpoint and takes its preview image from the hosted service.
export const isOpenstatusHtml = (content: string): boolean => {
  if (hasMetaContent(content, 'og:image', previewImageUrl)) {
    return true
  }

  const summaryLink = findElement(content, (element) => {
    return element.name === 'link' && summaryHrefRegex.test(element.attribs.href ?? '')
  })

  return summaryLink !== undefined
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
