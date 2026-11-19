import { statuspage } from 'feedintel'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { hasMarker } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

const feeds = withHintLabels(statuspage.feeds)

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
    const page = feeds.forUrl(url)

    if (!page) {
      return []
    }

    return [page.getFeedEntry('history', {}, 'rss'), page.getFeedEntry('history', {}, 'atom')]
  },

  getFeedHint: feeds.getFeedHint,
}
