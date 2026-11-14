import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { getTenantSubdomain } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

export type JellypodUrl = { kind: 'show' }

const domains = ['jellypod.com']

const feeds = definePlatformFeeds(
  [{ key: 'jellypod:podcast', template: '{scheme}://{host}/rss' }],
  {
    domains,
  },
)

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
    const page = feeds.forUrl(url)

    if (!page || !parseJellypodUrl(url)) {
      return []
    }

    return [page.getFeedEntry('jellypod:podcast')]
  },

  getFeedHint: feeds.getFeedHint,
}
