import { chambermaster } from 'feedintel'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { hasMarker } from '../../common/utils.js'

// Discoverability: Not discoverable without handler.
// Handler needed for: featured-events, featured-members, new-coupons, new-events, new-jobs, new-m2m-deals, new-market-items, new-members, news-releases, upcoming-events.

export type ChambermasterUrl = {
  kind: 'events' | 'directory' | 'jobs' | 'hotDeals' | 'marketSpace' | 'news' | 'memberToMember'
}

const kinds: Array<ChambermasterUrl['kind']> = [
  'events',
  'directory',
  'jobs',
  'hotDeals',
  'marketSpace',
  'news',
  'memberToMember',
]

const feeds = withHintLabels(chambermaster.feeds)

// The value names the server, as in `cmdotnetJYPM06`, so only the prefix is fixed.
export const isChambermasterHeaders = (headers: Headers): boolean => {
  return (headers.get('x-source') ?? '').startsWith('cmdotnet')
}

export const parseChambermasterUrl = (url: string): ChambermasterUrl | undefined => {
  const page = chambermaster.pages.readUrl(url, { isAnyHost: true })
  const kind = kinds.find((kind) => kind === page?.key)

  if (!kind) {
    return
  }

  return { kind }
}

export const chambermasterHandler: PlatformHandler = {
  match: (url, content, headers) => {
    if (!hasMarker(content, headers, { headers: isChambermasterHeaders })) {
      return false
    }

    return parseChambermasterUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseChambermasterUrl(url)
    const pageFeeds = feeds.forSite(url)

    if (!parsed || !pageFeeds) {
      return []
    }

    // The chamber's lists need no value from the page, so every page builds them after its own
    // feeds.
    if (parsed.kind === 'events') {
      return [
        pageFeeds.getFeedEntry('upcoming-events'),
        pageFeeds.getFeedEntry('new-events'),
        pageFeeds.getFeedEntry('featured-events'),
        pageFeeds.getFeedEntry('new-members'),
        pageFeeds.getFeedEntry('featured-members'),
        pageFeeds.getFeedEntry('new-jobs'),
        pageFeeds.getFeedEntry('new-coupons'),
        pageFeeds.getFeedEntry('new-market-items'),
        pageFeeds.getFeedEntry('news-releases'),
        pageFeeds.getFeedEntry('new-m2m-deals'),
      ]
    }

    if (parsed.kind === 'directory') {
      return [
        pageFeeds.getFeedEntry('new-members'),
        pageFeeds.getFeedEntry('featured-members'),
        pageFeeds.getFeedEntry('upcoming-events'),
        pageFeeds.getFeedEntry('new-events'),
        pageFeeds.getFeedEntry('featured-events'),
        pageFeeds.getFeedEntry('new-jobs'),
        pageFeeds.getFeedEntry('new-coupons'),
        pageFeeds.getFeedEntry('new-market-items'),
        pageFeeds.getFeedEntry('news-releases'),
        pageFeeds.getFeedEntry('new-m2m-deals'),
      ]
    }

    if (parsed.kind === 'jobs') {
      return [
        pageFeeds.getFeedEntry('new-jobs'),
        pageFeeds.getFeedEntry('upcoming-events'),
        pageFeeds.getFeedEntry('new-events'),
        pageFeeds.getFeedEntry('featured-events'),
        pageFeeds.getFeedEntry('new-members'),
        pageFeeds.getFeedEntry('featured-members'),
        pageFeeds.getFeedEntry('new-coupons'),
        pageFeeds.getFeedEntry('new-market-items'),
        pageFeeds.getFeedEntry('news-releases'),
        pageFeeds.getFeedEntry('new-m2m-deals'),
      ]
    }

    if (parsed.kind === 'hotDeals') {
      return [
        pageFeeds.getFeedEntry('new-coupons'),
        pageFeeds.getFeedEntry('upcoming-events'),
        pageFeeds.getFeedEntry('new-events'),
        pageFeeds.getFeedEntry('featured-events'),
        pageFeeds.getFeedEntry('new-members'),
        pageFeeds.getFeedEntry('featured-members'),
        pageFeeds.getFeedEntry('new-jobs'),
        pageFeeds.getFeedEntry('new-market-items'),
        pageFeeds.getFeedEntry('news-releases'),
        pageFeeds.getFeedEntry('new-m2m-deals'),
      ]
    }

    if (parsed.kind === 'marketSpace') {
      return [
        pageFeeds.getFeedEntry('new-market-items'),
        pageFeeds.getFeedEntry('upcoming-events'),
        pageFeeds.getFeedEntry('new-events'),
        pageFeeds.getFeedEntry('featured-events'),
        pageFeeds.getFeedEntry('new-members'),
        pageFeeds.getFeedEntry('featured-members'),
        pageFeeds.getFeedEntry('new-jobs'),
        pageFeeds.getFeedEntry('new-coupons'),
        pageFeeds.getFeedEntry('news-releases'),
        pageFeeds.getFeedEntry('new-m2m-deals'),
      ]
    }

    if (parsed.kind === 'news') {
      return [
        pageFeeds.getFeedEntry('news-releases'),
        pageFeeds.getFeedEntry('upcoming-events'),
        pageFeeds.getFeedEntry('new-events'),
        pageFeeds.getFeedEntry('featured-events'),
        pageFeeds.getFeedEntry('new-members'),
        pageFeeds.getFeedEntry('featured-members'),
        pageFeeds.getFeedEntry('new-jobs'),
        pageFeeds.getFeedEntry('new-coupons'),
        pageFeeds.getFeedEntry('new-market-items'),
        pageFeeds.getFeedEntry('new-m2m-deals'),
      ]
    }

    return [
      pageFeeds.getFeedEntry('new-m2m-deals'),
      pageFeeds.getFeedEntry('upcoming-events'),
      pageFeeds.getFeedEntry('new-events'),
      pageFeeds.getFeedEntry('featured-events'),
      pageFeeds.getFeedEntry('new-members'),
      pageFeeds.getFeedEntry('featured-members'),
      pageFeeds.getFeedEntry('new-jobs'),
      pageFeeds.getFeedEntry('new-coupons'),
      pageFeeds.getFeedEntry('new-market-items'),
      pageFeeds.getFeedEntry('news-releases'),
    ]
  },

  // The table claims only one tenant label under the domains, so the apex and www, whose feeds
  // answer 404 or 500 or a page, get no hint. A preview host can nest, as in `example.preview`.
  getFeedHint: feeds.getFeedHint,
}
