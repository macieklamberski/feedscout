import { chambermaster } from 'feedintel'
import { getPathSegments, isAnyOf, isSubdomainOf } from 'trousse'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { hasMarker } from '../../common/utils.js'

// Discoverability: Not discoverable without handler.
// Handler needed for: all shapes.

export type ChambermasterUrl = {
  kind: 'events' | 'directory' | 'jobs' | 'hotDeals' | 'marketSpace' | 'news' | 'memberToMember'
}

// A chamber's feeds on its chambermaster.com or memberzone.com subdomain redirect to the sign-in
// page over http and https alike, so the table only claims them there.
const domains = chambermaster.tenantDomains

const feeds = withHintLabels(chambermaster.feeds)

// The value names the server, as in `cmdotnetJYPM06`, so only the prefix is fixed.
export const isChambermasterHeaders = (headers: Headers): boolean => {
  return (headers.get('x-source') ?? '').startsWith('cmdotnet')
}

export const parseChambermasterUrl = (url: string): ChambermasterUrl | undefined => {
  const [section] = getPathSegments(url)

  if (isAnyOf(section, 'events')) {
    return { kind: 'events' }
  }

  if (isAnyOf(section, 'list')) {
    return { kind: 'directory' }
  }

  if (isAnyOf(section, 'jobs')) {
    return { kind: 'jobs' }
  }

  if (isAnyOf(section, 'hotdeals')) {
    return { kind: 'hotDeals' }
  }

  // The market items feed links its items under /marketplace, which renders the same listing.
  if (isAnyOf(section, ['marketspace', 'marketplace'])) {
    return { kind: 'marketSpace' }
  }

  if (isAnyOf(section, 'news')) {
    return { kind: 'news' }
  }

  if (isAnyOf(section, 'membertomember')) {
    return { kind: 'memberToMember' }
  }
}

export const chambermasterHandler: PlatformHandler = {
  match: (url, content, headers) => {
    if (!hasMarker(content, headers, { headers: isChambermasterHeaders })) {
      return false
    }

    // A platform subdomain gets no feeds, so its page goes on to the other methods.
    if (isSubdomainOf(url, domains)) {
      return false
    }

    return parseChambermasterUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseChambermasterUrl(url)
    const pageFeeds = feeds.forUrl(url)

    if (!parsed || !pageFeeds) {
      return []
    }

    const feedEntry = (key: Parameters<typeof feeds.getFeedEntry>[0]) => pageFeeds.getFeedEntry(key)

    // The chamber's lists need no value from the page, so every page builds them after its own
    // feeds.
    if (parsed.kind === 'events') {
      return [
        feedEntry('chambermaster:upcoming-events'),
        feedEntry('chambermaster:new-events'),
        feedEntry('chambermaster:featured-events'),
        feedEntry('chambermaster:new-members'),
        feedEntry('chambermaster:featured-members'),
        feedEntry('chambermaster:new-jobs'),
        feedEntry('chambermaster:new-coupons'),
        feedEntry('chambermaster:new-market-items'),
        feedEntry('chambermaster:news-releases'),
        feedEntry('chambermaster:new-m2m-deals'),
      ]
    }

    if (parsed.kind === 'directory') {
      return [
        feedEntry('chambermaster:new-members'),
        feedEntry('chambermaster:featured-members'),
        feedEntry('chambermaster:upcoming-events'),
        feedEntry('chambermaster:new-events'),
        feedEntry('chambermaster:featured-events'),
        feedEntry('chambermaster:new-jobs'),
        feedEntry('chambermaster:new-coupons'),
        feedEntry('chambermaster:new-market-items'),
        feedEntry('chambermaster:news-releases'),
        feedEntry('chambermaster:new-m2m-deals'),
      ]
    }

    if (parsed.kind === 'jobs') {
      return [
        feedEntry('chambermaster:new-jobs'),
        feedEntry('chambermaster:upcoming-events'),
        feedEntry('chambermaster:new-events'),
        feedEntry('chambermaster:featured-events'),
        feedEntry('chambermaster:new-members'),
        feedEntry('chambermaster:featured-members'),
        feedEntry('chambermaster:new-coupons'),
        feedEntry('chambermaster:new-market-items'),
        feedEntry('chambermaster:news-releases'),
        feedEntry('chambermaster:new-m2m-deals'),
      ]
    }

    if (parsed.kind === 'hotDeals') {
      return [
        feedEntry('chambermaster:new-coupons'),
        feedEntry('chambermaster:upcoming-events'),
        feedEntry('chambermaster:new-events'),
        feedEntry('chambermaster:featured-events'),
        feedEntry('chambermaster:new-members'),
        feedEntry('chambermaster:featured-members'),
        feedEntry('chambermaster:new-jobs'),
        feedEntry('chambermaster:new-market-items'),
        feedEntry('chambermaster:news-releases'),
        feedEntry('chambermaster:new-m2m-deals'),
      ]
    }

    if (parsed.kind === 'marketSpace') {
      return [
        feedEntry('chambermaster:new-market-items'),
        feedEntry('chambermaster:upcoming-events'),
        feedEntry('chambermaster:new-events'),
        feedEntry('chambermaster:featured-events'),
        feedEntry('chambermaster:new-members'),
        feedEntry('chambermaster:featured-members'),
        feedEntry('chambermaster:new-jobs'),
        feedEntry('chambermaster:new-coupons'),
        feedEntry('chambermaster:news-releases'),
        feedEntry('chambermaster:new-m2m-deals'),
      ]
    }

    if (parsed.kind === 'news') {
      return [
        feedEntry('chambermaster:news-releases'),
        feedEntry('chambermaster:upcoming-events'),
        feedEntry('chambermaster:new-events'),
        feedEntry('chambermaster:featured-events'),
        feedEntry('chambermaster:new-members'),
        feedEntry('chambermaster:featured-members'),
        feedEntry('chambermaster:new-jobs'),
        feedEntry('chambermaster:new-coupons'),
        feedEntry('chambermaster:new-market-items'),
        feedEntry('chambermaster:new-m2m-deals'),
      ]
    }

    return [
      feedEntry('chambermaster:new-m2m-deals'),
      feedEntry('chambermaster:upcoming-events'),
      feedEntry('chambermaster:new-events'),
      feedEntry('chambermaster:featured-events'),
      feedEntry('chambermaster:new-members'),
      feedEntry('chambermaster:featured-members'),
      feedEntry('chambermaster:new-jobs'),
      feedEntry('chambermaster:new-coupons'),
      feedEntry('chambermaster:new-market-items'),
      feedEntry('chambermaster:news-releases'),
    ]
  },

  // The table claims only one tenant label under the domains, so the apex and www, whose feeds
  // answer 404 or 500 or a page, get no hint. A preview host can nest, as in `example.preview`.
  getFeedHint: feeds.getFeedHint,
}
