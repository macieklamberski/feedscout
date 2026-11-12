import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { getTenantSubdomain } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

export type PostachioUrl = { kind: 'site'; subdomain: string }

const domains = ['postach.io']

const feeds = definePlatformFeeds(
  [
    { key: 'postachio:posts', template: '{scheme}://{host}/feed.xml' },
    { key: 'postachio:posts', template: '{scheme}://{host}/feed' },
  ],
  { domains },
)

export const parsePostachioUrl = (url: string): PostachioUrl | undefined => {
  const subdomain = getTenantSubdomain(url, domains)

  if (!subdomain) {
    return
  }

  return { kind: 'site', subdomain }
}

export const postachioHandler: PlatformHandler = {
  match: (url) => {
    return parsePostachioUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parsePostachioUrl(url)
    const page = feeds.forUrl(url)

    if (!parsed || !page) {
      return []
    }

    return [page.getFeedEntry('postachio:posts')]
  },

  getFeedHint: feeds.getFeedHint,
}
