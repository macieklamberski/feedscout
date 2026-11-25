import { svbtle } from 'feedintel'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { hasMarker, hasMetaContent } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

const feeds = withHintLabels(svbtle.feeds)

export const isSvbtleHtml = (content: string): boolean => {
  return (
    hasMetaContent(content, 'generator', 'Svbtle.com') ||
    content.includes('https://lightning.svbtle.com/cargo/')
  )
}

export const svbtleHandler: PlatformHandler = {
  match: (url, content, headers) => {
    if (svbtle.pages.readUrl(url)?.key === 'platform') {
      return false
    }

    return hasMarker(content, headers, { html: isSvbtleHtml })
  },

  resolve: (url) => {
    const pageFeeds = feeds.forSite(url)

    if (!pageFeeds || svbtle.pages.readUrl(url)?.key === 'platform') {
      return []
    }

    return [pageFeeds.getFeedEntry('posts')]
  },

  getFeedHint: feeds.getFeedHint,
}
