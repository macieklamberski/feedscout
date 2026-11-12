import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry, DiscoverUriHint } from '../../common/types.js'
import { discoverUrisFromPlatform } from '../../common/uris/platform/index.js'
import { defaultPlatformOptions } from '../defaults.js'
import {
  type ChambermasterUrl,
  chambermasterHandler,
  isChambermasterHeaders,
  parseChambermasterUrl,
} from './chambermaster.js'

const chambermasterHeaders = new Headers({ 'x-source': 'cmdotnetJYPM06' })
const otherHeaders = new Headers({ 'x-powered-by': 'ASP.NET' })

describe('isChambermasterHeaders', () => {
  it('should return true for the cmdotnet source header', () => {
    expect(isChambermasterHeaders(chambermasterHeaders)).toBe(true)
  })

  it('should return false for another source header', () => {
    expect(isChambermasterHeaders(new Headers({ 'x-source': 'origin' }))).toBe(false)
  })

  it('should return false without the source header', () => {
    expect(isChambermasterHeaders(otherHeaders)).toBe(false)
  })
})

describe('parseChambermasterUrl', () => {
  it('should return the events page', () => {
    const expected: ChambermasterUrl = { kind: 'events' }

    expect(parseChambermasterUrl('https://business.example.com/events')).toEqual(expected)
  })

  it('should return the events page for an event', () => {
    const value = 'https://business.example.com/events/details/community-networking-mixer-30539'
    const expected: ChambermasterUrl = { kind: 'events' }

    expect(parseChambermasterUrl(value)).toEqual(expected)
  })

  it('should return the directory page', () => {
    const expected: ChambermasterUrl = { kind: 'directory' }

    expect(parseChambermasterUrl('https://business.example.com/list/searchalpha/a')).toEqual(
      expected,
    )
  })

  it('should return the jobs page', () => {
    const expected: ChambermasterUrl = { kind: 'jobs' }

    expect(parseChambermasterUrl('https://members.example.com/jobs')).toEqual(expected)
  })

  it('should return the hot deals page', () => {
    const expected: ChambermasterUrl = { kind: 'hotDeals' }

    expect(parseChambermasterUrl('https://members.example.com/hotdeals')).toEqual(expected)
  })

  it('should return the marketspace page', () => {
    const expected: ChambermasterUrl = { kind: 'marketSpace' }

    expect(parseChambermasterUrl('https://members.example.com/marketspace')).toEqual(expected)
  })

  it('should return the marketspace page for a marketplace item', () => {
    const value = 'https://business.example.com/marketplace/detail/165/a-listing'
    const expected: ChambermasterUrl = { kind: 'marketSpace' }

    expect(parseChambermasterUrl(value)).toEqual(expected)
  })

  it('should return the news page', () => {
    const expected: ChambermasterUrl = { kind: 'news' }

    expect(parseChambermasterUrl('https://members.example.com/news/details/new-logo')).toEqual(
      expected,
    )
  })

  it('should return the member to member deals page', () => {
    const expected: ChambermasterUrl = { kind: 'memberToMember' }

    expect(parseChambermasterUrl('https://www.example.com/MemberToMember/')).toEqual(expected)
  })

  it('should ignore the case of the section', () => {
    const expected: ChambermasterUrl = { kind: 'events' }

    expect(parseChambermasterUrl('https://business.example.com/Events/Calendar')).toEqual(expected)
  })

  it('should return undefined for the root', () => {
    expect(parseChambermasterUrl('https://www.example.com/')).toBeUndefined()
  })

  it('should return undefined for another page', () => {
    expect(parseChambermasterUrl('https://www.example.com/about')).toBeUndefined()
  })
})

describe('chambermasterHandler', () => {
  describe('match', () => {
    it('should match a ChamberMaster page', () => {
      const value = 'https://business.example.com/events'

      expect(chambermasterHandler.match(value, '', chambermasterHeaders)).toBe(true)
    })

    it('should not match without headers', () => {
      expect(chambermasterHandler.match('https://business.example.com/events', '')).toBe(false)
    })

    it('should not match another server', () => {
      const value = 'https://business.example.com/events'

      expect(chambermasterHandler.match(value, '', otherHeaders)).toBe(false)
    })

    it('should not match a page without feeds', () => {
      const value = 'https://www.example.com/about'

      expect(chambermasterHandler.match(value, '', chambermasterHeaders)).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return empty array for a page without feeds', () => {
      expect(chambermasterHandler.resolve('https://www.example.com/about')).toEqual([])
    })

    it('should return the event feeds for the events page', () => {
      const value = 'https://business.example.com/events/calendar'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://business.example.com/Feed/rss/UpcomingEvents.rss',
          hint: { key: 'chambermaster:upcoming-events', label: 'Upcoming events' },
        },
        {
          uri: 'https://business.example.com/Feed/rss/NewEvents.rss',
          hint: { key: 'chambermaster:new-events', label: 'New events' },
        },
        {
          uri: 'https://business.example.com/Feed/rss/FeaturedEvents.rss',
          hint: { key: 'chambermaster:featured-events', label: 'Featured events' },
        },
      ]

      expect(chambermasterHandler.resolve(value)).toEqual(expected)
    })

    it('should return the event feeds over http on a memberzone.com subdomain', () => {
      const value = 'https://examplechamber.memberzone.com/events'
      const expected = [
        {
          uri: 'http://examplechamber.memberzone.com/Feed/rss/UpcomingEvents.rss',
          hint: { key: 'chambermaster:upcoming-events', label: 'Upcoming events' },
        },
        {
          uri: 'http://examplechamber.memberzone.com/Feed/rss/NewEvents.rss',
          hint: { key: 'chambermaster:new-events', label: 'New events' },
        },
        {
          uri: 'http://examplechamber.memberzone.com/Feed/rss/FeaturedEvents.rss',
          hint: { key: 'chambermaster:featured-events', label: 'Featured events' },
        },
      ]

      expect(chambermasterHandler.resolve(value)).toEqual(expected)
    })

    it('should return the member feeds over http on a chambermaster.com subdomain', () => {
      const value = 'https://examplechamber.chambermaster.com/list/searchalpha/a'
      const expected = [
        {
          uri: 'http://examplechamber.chambermaster.com/Feed/rss/NewMembers.rss',
          hint: { key: 'chambermaster:new-members', label: 'New members' },
        },
        {
          uri: 'http://examplechamber.chambermaster.com/Feed/rss/FeaturedMembers.rss',
          hint: { key: 'chambermaster:featured-members', label: 'Featured members' },
        },
      ]

      expect(chambermasterHandler.resolve(value)).toEqual(expected)
    })

    it('should keep the page origin on a gochambermaster.com preview host', () => {
      const value = 'https://examplechamber.preview.gochambermaster.com/jobs'
      const expected = [
        {
          uri: 'https://examplechamber.preview.gochambermaster.com/Feed/rss/NewJobs.rss',
          hint: { key: 'chambermaster:new-jobs', label: 'New jobs' },
        },
      ]

      expect(chambermasterHandler.resolve(value)).toEqual(expected)
    })

    it('should return the member feeds for the directory page', () => {
      const value = 'https://business.example.com/list'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://business.example.com/Feed/rss/NewMembers.rss',
          hint: { key: 'chambermaster:new-members', label: 'New members' },
        },
        {
          uri: 'https://business.example.com/Feed/rss/FeaturedMembers.rss',
          hint: { key: 'chambermaster:featured-members', label: 'Featured members' },
        },
      ]

      expect(chambermasterHandler.resolve(value)).toEqual(expected)
    })

    it('should return the jobs feed for the jobs page', () => {
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://members.example.com/Feed/rss/NewJobs.rss',
          hint: { key: 'chambermaster:new-jobs', label: 'New jobs' },
        },
      ]

      expect(chambermasterHandler.resolve('https://members.example.com/jobs')).toEqual(expected)
    })

    it('should return the coupons feed for the hot deals page', () => {
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://members.example.com/Feed/rss/NewCoupons.rss',
          hint: { key: 'chambermaster:new-coupons', label: 'New coupons' },
        },
      ]

      expect(chambermasterHandler.resolve('https://members.example.com/hotdeals')).toEqual(expected)
    })

    it('should return the market items feed for the marketspace page', () => {
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://members.example.com/Feed/rss/NewMarketItems.rss',
          hint: { key: 'chambermaster:new-market-items', label: 'New marketplace items' },
        },
      ]

      expect(chambermasterHandler.resolve('https://members.example.com/marketspace')).toEqual(
        expected,
      )
    })

    it('should return the news releases feed for the news page', () => {
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://members.example.com/Feed/rss/NewsReleases.rss',
          hint: { key: 'chambermaster:news-releases', label: 'News releases' },
        },
      ]

      expect(chambermasterHandler.resolve('https://members.example.com/news')).toEqual(expected)
    })

    it('should return the deals feed for the member to member deals page', () => {
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://www.example.com/Feed/rss/NewM2MDeals.rss',
          hint: { key: 'chambermaster:new-m2m-deals', label: 'New member to member deals' },
        },
      ]

      expect(chambermasterHandler.resolve('https://www.example.com/MemberToMember/')).toEqual(
        expected,
      )
    })
  })

  describe('getFeedHint', () => {
    const feedUrls: Array<[string, DiscoverUriHint]> = [
      [
        'http://examplechamber.chambermaster.com/Feed/rss/UpcomingEvents.rss',
        { key: 'chambermaster:upcoming-events', label: 'Upcoming events' },
      ],
      [
        'http://examplechamber.chambermaster.com/Feed/rss/NewEvents.rss',
        { key: 'chambermaster:new-events', label: 'New events' },
      ],
      [
        'http://examplechamber.chambermaster.com/Feed/rss/FeaturedEvents.rss',
        { key: 'chambermaster:featured-events', label: 'Featured events' },
      ],
      [
        'http://examplechamber.chambermaster.com/Feed/rss/NewMembers.rss',
        { key: 'chambermaster:new-members', label: 'New members' },
      ],
      [
        'http://examplechamber.chambermaster.com/Feed/rss/FeaturedMembers.rss',
        { key: 'chambermaster:featured-members', label: 'Featured members' },
      ],
      [
        'http://examplechamber.memberzone.com/Feed/rss/NewJobs.rss',
        { key: 'chambermaster:new-jobs', label: 'New jobs' },
      ],
      [
        'http://examplechamber.memberzone.com/Feed/rss/NewCoupons.rss',
        { key: 'chambermaster:new-coupons', label: 'New coupons' },
      ],
      [
        'http://examplechamber.chambermaster.com/Feed/Rss/NewMarketItems.rss',
        { key: 'chambermaster:new-market-items', label: 'New marketplace items' },
      ],
      [
        'http://examplechamber.memberzone.com/Feed/rss/NewsReleases.rss',
        { key: 'chambermaster:news-releases', label: 'News releases' },
      ],
      [
        'http://examplechamber.memberzone.com/Feed/rss/NewM2MDeals.rss',
        { key: 'chambermaster:new-m2m-deals', label: 'New member to member deals' },
      ],
      [
        'https://examplechamber.chambermaster.com/store/newproducts/rss',
        { key: 'chambermaster:new-products', label: 'New products' },
      ],
      [
        'http://examplechamber.chambermaster.com/feed/rss/UpcomingEvents.rss',
        { key: 'chambermaster:upcoming-events', label: 'Upcoming events' },
      ],
      [
        'https://examplechamber.memberzone.com/Feed/rss/UpcomingEvents.rss',
        { key: 'chambermaster:upcoming-events', label: 'Upcoming events' },
      ],
      [
        'https://examplechamber.preview.gochambermaster.com/Feed/rss/UpcomingEvents.rss',
        { key: 'chambermaster:upcoming-events', label: 'Upcoming events' },
      ],
      [
        'http://exampledev.gochambermaster.com/Feed/rss/FeaturedEvents.rss',
        { key: 'chambermaster:featured-events', label: 'Featured events' },
      ],
    ]

    it.each(feedUrls)('should return the hint for %s', (value, expected) => {
      expect(chambermasterHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return undefined for a page on a chamber subdomain', () => {
      const value = 'http://examplechamber.chambermaster.com/events'

      expect(chambermasterHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for another feed name', () => {
      const value = 'http://examplechamber.chambermaster.com/Feed/rss/Other.rss'

      expect(chambermasterHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for a feed on the apex', () => {
      const value = 'http://chambermaster.com/Feed/rss/UpcomingEvents.rss'

      expect(chambermasterHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for a feed on www', () => {
      const value = 'http://www.memberzone.com/Feed/rss/UpcomingEvents.rss'

      expect(chambermasterHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for a feed on a nested chamber subdomain', () => {
      const value = 'http://www.examplechamber.memberzone.com/Feed/rss/UpcomingEvents.rss'

      expect(chambermasterHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for a feed on the preview apex', () => {
      const value = 'https://gochambermaster.com/Feed/rss/UpcomingEvents.rss'

      expect(chambermasterHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for a feed on the preview www host', () => {
      const value = 'http://www.gochambermaster.com/Feed/rss/UpcomingEvents.rss'

      expect(chambermasterHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for a feed on a custom domain', () => {
      const value = 'https://business.example.com/Feed/rss/UpcomingEvents.rss'

      expect(chambermasterHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for a store products feed on a custom domain', () => {
      const value = 'https://business.example.com/store/newproducts/rss'

      expect(chambermasterHandler.getFeedHint?.(value)).toBeUndefined()
    })
  })

  describe('own feeds through the Platform method', () => {
    const ownFeeds: Array<[string, DiscoverUriEntry['hint']]> = [
      [
        'http://examplechamber.chambermaster.com/Feed/rss/FeaturedEvents.rss',
        { key: 'chambermaster:featured-events', label: 'Featured events' },
      ],
      [
        'http://examplechamber.chambermaster.com/feed/rss/UpcomingEvents.rss',
        { key: 'chambermaster:upcoming-events', label: 'Upcoming events' },
      ],
      [
        'http://examplechamber.chambermaster.com/Feed/Rss/NewMarketItems.rss',
        { key: 'chambermaster:new-market-items', label: 'New marketplace items' },
      ],
      [
        'http://examplechamber.memberzone.com/Feed/rss/NewMembers.rss',
        { key: 'chambermaster:new-members', label: 'New members' },
      ],
      [
        'https://examplechamber.preview.gochambermaster.com/Feed/rss/NewJobs.rss',
        { key: 'chambermaster:new-jobs', label: 'New jobs' },
      ],
      [
        'http://examplechamber.chambermaster.com/store/newproducts/rss',
        { key: 'chambermaster:new-products', label: 'New products' },
      ],
    ]

    it.each(ownFeeds)('should return %s as itself', async (value, hint) => {
      const result = await discoverUrisFromPlatform(undefined, undefined, {
        ...defaultPlatformOptions,
        handlers: [chambermasterHandler],
        baseUrl: value,
      })
      const expected: Array<DiscoverUriEntry> = [{ uri: value, hint }]

      expect(result).toEqual(expected)
    })
  })
})
