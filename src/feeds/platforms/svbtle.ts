import { svbtle } from 'feedintel'
import { isHostOf } from 'trousse'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { hasMarker, hasMetaContent } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

// `www.svbtle.com/feed` answers 200 with an HTML page, and `svbtle.com/{user}/feed` does not exist.
const platformHosts = ['svbtle.com', 'www.svbtle.com']
const feeds = withHintLabels(svbtle.feeds)

export const isSvbtleHtml = (content: string): boolean => {
  return (
    hasMetaContent(content, 'generator', 'Svbtle.com') ||
    content.includes('https://lightning.svbtle.com/cargo/')
  )
}

export const svbtleHandler: PlatformHandler = {
  match: (url, content, headers) => {
    if (isHostOf(url, platformHosts)) {
      return false
    }

    return hasMarker(content, headers, { html: isSvbtleHtml })
  },

  resolve: (url) => {
    const pageFeeds = feeds.forUrl(url)

    if (!pageFeeds || isHostOf(url, platformHosts)) {
      return []
    }

    return [pageFeeds.getFeedEntry('posts')]
  },

  getFeedHint: feeds.getFeedHint,
}
