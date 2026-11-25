import { nethouse } from 'feedintel'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { hasMarker } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

const feeds = withHintLabels(nethouse.feeds)

export const isNethouseHeaders = (headers: Headers): boolean => {
  return headers.get('x-generator') === 'nethouse'
}

export const nethouseHandler: PlatformHandler = {
  match: (url, content, headers) => {
    const page = nethouse.pages.readUrl(url)

    if (page) {
      return page.key === 'site'
    }

    return hasMarker(content, headers, { headers: isNethouseHeaders })
  },

  resolve: (url) => {
    const page = feeds.forSite(url)

    if (!page) {
      return []
    }

    // A site with a section turned off answers its feed with 404.
    return [page.getFeedEntry('news'), page.getFeedEntry('articles')]
  },

  getFeedHint: feeds.getFeedHint,
}
