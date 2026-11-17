import { openstatus } from 'feedintel'
import { parseUrl } from 'trousse'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { findElement, hasMetaContent, isRootOfPage } from '../../common/utils.js'

// Discoverability: Not discoverable without handler.
// Handler needed for: updates.

const previewImageUrl = 'https://www.openstatus.dev/api/og/page'

const summaryHrefRegex = /^(?:https?:\/\/[^/]+)?\/api\/status\/summary\.json$/i

const feeds = withHintLabels(openstatus.feeds)

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
    const pageFeeds = feeds.forUrl(url)

    if (!pageFeeds) {
      return []
    }

    return [
      pageFeeds.getFeedEntry('openstatus:updates', {}, 'rss'),
      pageFeeds.getFeedEntry('openstatus:updates', {}, 'atom'),
    ]
  },

  getFeedHint: feeds.getFeedHint,
}
