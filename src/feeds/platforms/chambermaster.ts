import { getPathSegments, isAnyOf } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint, hasMarker } from '../../common/utils.js'

// Discoverability: Not discoverable without handler.
// Handler needed for: all shapes.

export type ChambermasterUrl = {
  kind: 'events' | 'directory' | 'jobs' | 'hotDeals' | 'marketSpace' | 'news' | 'memberToMember'
}

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

    if (!parsed) {
      return []
    }

    const { origin } = new URL(url)
    const feedUrl = (name: string) => `${origin}/Feed/rss/${name}.rss`

    if (parsed.kind === 'events') {
      return [
        { uri: feedUrl('UpcomingEvents'), hint: composeHint('chambermaster:upcoming-events') },
        { uri: feedUrl('NewEvents'), hint: composeHint('chambermaster:new-events') },
        { uri: feedUrl('FeaturedEvents'), hint: composeHint('chambermaster:featured-events') },
      ]
    }

    if (parsed.kind === 'directory') {
      return [
        { uri: feedUrl('NewMembers'), hint: composeHint('chambermaster:new-members') },
        { uri: feedUrl('FeaturedMembers'), hint: composeHint('chambermaster:featured-members') },
      ]
    }

    if (parsed.kind === 'jobs') {
      return [{ uri: feedUrl('NewJobs'), hint: composeHint('chambermaster:new-jobs') }]
    }

    if (parsed.kind === 'hotDeals') {
      return [{ uri: feedUrl('NewCoupons'), hint: composeHint('chambermaster:new-coupons') }]
    }

    if (parsed.kind === 'marketSpace') {
      return [
        { uri: feedUrl('NewMarketItems'), hint: composeHint('chambermaster:new-market-items') },
      ]
    }

    if (parsed.kind === 'news') {
      return [{ uri: feedUrl('NewsReleases'), hint: composeHint('chambermaster:news-releases') }]
    }

    return [{ uri: feedUrl('NewM2MDeals'), hint: composeHint('chambermaster:new-m2m-deals') }]
  },
}
