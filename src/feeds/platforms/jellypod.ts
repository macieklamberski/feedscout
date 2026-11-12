import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { getTenantSubdomain } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

export type JellypodUrl = { kind: 'show' }

const domains = ['jellypod.com']

const feeds = definePlatformFeeds([
  { key: 'jellypod:podcast', template: 'https://{show}.jellypod.com/rss' },
])

export const parseJellypodUrl = (url: string): JellypodUrl | undefined => {
  if (!getTenantSubdomain(url, domains)) {
    return
  }

  return { kind: 'show' }
}

export const jellypodHandler: PlatformHandler = {
  match: (url) => {
    return parseJellypodUrl(url) !== undefined
  },

  resolve: (url) => {
    const show = getTenantSubdomain(url, domains)

    if (!show) {
      return []
    }

    return [feeds.getFeedEntry('jellypod:podcast', { show })]
  },

  // The table ignores `www`, so it would read `www.{show}.jellypod.com`, a host the page parser
  // refuses, as a show.
  getFeedKey: (url) => {
    if (!parseJellypodUrl(url)) {
      return
    }

    return feeds.getFeedKey(url)
  },
}
