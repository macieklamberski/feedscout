import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { getBrandDomainRegex, getTenantSubdomain } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

export type OverblogUrl = { kind: 'blog' }

const domains = [getBrandDomainRegex('over-blog'), getBrandDomainRegex('overblog'), 'over.blog']

const feeds = definePlatformFeeds([{ key: 'overblog:posts', template: '{scheme}://{host}/rss' }], {
  domains,
})

export const parseOverblogUrl = (url: string): OverblogUrl | undefined => {
  if (!getTenantSubdomain(url, domains)) {
    return
  }

  return { kind: 'blog' }
}

export const overblogHandler: PlatformHandler = {
  match: (url) => {
    return parseOverblogUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseOverblogUrl(url)
    const page = feeds.forUrl(url)

    if (!parsed || !page) {
      return []
    }

    return [page.getFeedEntry('overblog:posts')]
  },

  getFeedHint: feeds.getFeedHint,
}
