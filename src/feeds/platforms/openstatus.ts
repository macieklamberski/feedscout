import { openstatus } from 'feedintel'
import { parseUrl } from 'trousse'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { findElement, hasMetaContent } from '../../common/utils.js'

// Discoverability: Not discoverable without handler.
// Handler needed for: updates.

const previewImageUrl = 'https://www.openstatus.dev/api/og/page'

const feeds = withHintLabels(openstatus.feeds)

// A status page links its summary endpoint and takes its preview image from the hosted service.
export const isOpenstatusPage = (url: string, content: string | undefined): boolean => {
  if (!content) {
    return false
  }

  if (hasMetaContent(content, 'og:image', previewImageUrl)) {
    return true
  }

  const root = parseUrl(url)?.origin ?? ''
  const summaryLink = findElement(content, (element) => {
    if (element.name !== 'link') {
      return false
    }

    const href = parseUrl(element.attribs.href, url)?.href ?? ''

    return openstatus.pages.read(href, { root })?.key === 'summary'
  })

  return summaryLink !== undefined
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
      pageFeeds.getFeedEntry('updates', {}, 'rss'),
      pageFeeds.getFeedEntry('updates', {}, 'atom'),
    ]
  },

  getFeedHint: feeds.getFeedHint,
}
