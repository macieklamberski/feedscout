import { isHostOf } from 'trousse'
import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { getTenantSubdomain } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

export type PodbeanUrl = { kind: 'podcast'; show: string }

const domains = ['podbean.com']
// The feed host serves every show by path, so it names no show.
const feedHosts = ['feed.podbean.com']

const feeds = definePlatformFeeds(
  [
    { key: 'podbean:podcast', template: 'https://feed.podbean.com/{show}/feed.xml' },
    // The feed host's S3 bucket serves the same feed. S3 is shared, so the bucket segment is
    // literal.
    {
      key: 'podbean:podcast',
      template: 'https://s3.amazonaws.com/feed.podbean.com/{show}/feed.xml',
    },
    // The show's old feed path, which redirects to the feed host.
    { key: 'podbean:podcast', template: '{scheme}://{host}/feed.xml' },
  ],
  { domains },
)

export const parsePodbeanUrl = (url: string): PodbeanUrl | undefined => {
  const show = getTenantSubdomain(url, domains)

  if (!show || isHostOf(url, feedHosts)) {
    return
  }

  return { kind: 'podcast', show }
}

export const podbeanHandler: PlatformHandler = {
  match: (url) => {
    return parsePodbeanUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parsePodbeanUrl(url)

    if (!parsed) {
      return []
    }

    return [feeds.getFeedEntry('podbean:podcast', { show: parsed.show })]
  },

  getFeedHint: feeds.getFeedHint,
}
