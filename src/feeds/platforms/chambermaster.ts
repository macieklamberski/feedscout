import { getPathSegments, isAnyOf, isSubdomainOf } from 'trousse'
import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { hasMarker } from '../../common/utils.js'

// Discoverability: Not discoverable without handler.
// Handler needed for: all shapes.

export type ChambermasterUrl = {
  kind: 'events' | 'directory' | 'jobs' | 'hotDeals' | 'marketSpace' | 'news' | 'memberToMember'
}

// A chamber's feeds on its chambermaster.com or memberzone.com subdomain redirect to the sign-in
// page over http and https alike, so the table only claims them there.
const domains = ['chambermaster.com', 'memberzone.com']
// A preview host keeps the page's own scheme, and serves the feeds over both. It is one label
// under gochambermaster.com or under its preview subdomain.
const previewDomains = ['gochambermaster.com', 'preview.gochambermaster.com']

// A custom domain is known only by its marker, so its feeds are built here but not claimed.
const feeds = definePlatformFeeds(
  [
    {
      key: 'chambermaster:upcoming-events',
      template: '{scheme}://{host}/Feed/rss/UpcomingEvents.rss',
    },
    { key: 'chambermaster:new-events', template: '{scheme}://{host}/Feed/rss/NewEvents.rss' },
    {
      key: 'chambermaster:featured-events',
      template: '{scheme}://{host}/Feed/rss/FeaturedEvents.rss',
    },
    { key: 'chambermaster:new-members', template: '{scheme}://{host}/Feed/rss/NewMembers.rss' },
    {
      key: 'chambermaster:featured-members',
      template: '{scheme}://{host}/Feed/rss/FeaturedMembers.rss',
    },
    { key: 'chambermaster:new-jobs', template: '{scheme}://{host}/Feed/rss/NewJobs.rss' },
    { key: 'chambermaster:new-coupons', template: '{scheme}://{host}/Feed/rss/NewCoupons.rss' },
    {
      key: 'chambermaster:new-market-items',
      template: '{scheme}://{host}/Feed/rss/NewMarketItems.rss',
    },
    { key: 'chambermaster:news-releases', template: '{scheme}://{host}/Feed/rss/NewsReleases.rss' },
    { key: 'chambermaster:new-m2m-deals', template: '{scheme}://{host}/Feed/rss/NewM2MDeals.rss' },
    // The page parser reads no store page, so this row only claims.
    { key: 'chambermaster:new-products', template: '{scheme}://{host}/store/newproducts/rss' },
  ],
  { domains: [...domains, ...previewDomains] },
)

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

    return parseChambermasterUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseChambermasterUrl(url)
    const pageFeeds = feeds.forUrl(url)

    if (!parsed || !pageFeeds || isSubdomainOf(url, domains)) {
      return []
    }

    const feedEntry = (key: string) => pageFeeds.getFeedEntry(key)

    if (parsed.kind === 'events') {
      return [
        feedEntry('chambermaster:upcoming-events'),
        feedEntry('chambermaster:new-events'),
        feedEntry('chambermaster:featured-events'),
      ]
    }

    if (parsed.kind === 'directory') {
      return [feedEntry('chambermaster:new-members'), feedEntry('chambermaster:featured-members')]
    }

    if (parsed.kind === 'jobs') {
      return [feedEntry('chambermaster:new-jobs')]
    }

    if (parsed.kind === 'hotDeals') {
      return [feedEntry('chambermaster:new-coupons')]
    }

    if (parsed.kind === 'marketSpace') {
      return [feedEntry('chambermaster:new-market-items')]
    }

    if (parsed.kind === 'news') {
      return [feedEntry('chambermaster:news-releases')]
    }

    return [feedEntry('chambermaster:new-m2m-deals')]
  },

  // The table claims only one tenant label under the domains, so the apex and www, whose feeds
  // answer 404 or 500 or a page, get no hint. A preview host can nest, as in `example.preview`.
  getFeedHint: feeds.getFeedHint,
}
