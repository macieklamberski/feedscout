import { parseUrl } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint, findElement, hasMetaContent, isRootOfPage } from '../../common/utils.js'

// Discoverability: Not discoverable without handler.
// Handler needed for: all shapes.

const previewImageUrl = 'https://www.openstatus.dev/api/og/page'

const summaryHrefRegex = /^(?:https?:\/\/[^/]+)?\/api\/status\/summary\.json$/

// A status page links its summary endpoint and takes its preview image from the hosted service.
export const isOpenstatusPage = (url: string, content: string | undefined): boolean => {
  if (!content) {
    return false
  }

  if (hasMetaContent(content, 'og:image', previewImageUrl)) {
    return true
  }

  const summaryLink = findElement(content, (element) => {
    return element.name === 'link' && summaryHrefRegex.test(element.attribs.href ?? '')
  })
  const summaryUrl = summaryLink?.attribs.href ? parseUrl(summaryLink.attribs.href, url) : undefined

  if (!summaryUrl) {
    return false
  }

  return isRootOfPage(summaryUrl.origin, url)
}

export const openstatusHandler: PlatformHandler = {
  match: (url, content) => {
    return isOpenstatusPage(url, content)
  },

  resolve: (url) => {
    const { origin } = new URL(url)

    return [
      { uri: `${origin}/feed/rss`, hint: composeHint('openstatus:updates', 'rss') },
      { uri: `${origin}/feed/atom`, hint: composeHint('openstatus:updates', 'atom') },
    ]
  },
}
