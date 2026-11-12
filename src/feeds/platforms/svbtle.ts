import { isHostOf } from 'trousse'
import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { getTenantSubdomain, hasMarker, hasMetaContent } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

// `www.svbtle.com/feed` answers 200 with an HTML page, and `svbtle.com/{user}/feed` does not exist.
const platformHosts = ['svbtle.com', 'www.svbtle.com']
const domains = ['svbtle.com']

// A blog on a custom domain is known only by its marker, so its feed is built here but claimed
// only on Svbtle's own domain.
const feeds = definePlatformFeeds([{ key: 'svbtle:posts', template: '{scheme}://{host}/feed' }], {
  domains,
})

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

    return [pageFeeds.getFeedEntry('svbtle:posts')]
  },

  // The table reads any host under the domain, so the platform hosts, whose `/feed` is a page,
  // are refused first.
  getFeedHint: (url) => {
    if (!getTenantSubdomain(url, domains)) {
      return
    }

    return feeds.getFeedHint(url)
  },
}
