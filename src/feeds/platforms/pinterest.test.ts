import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry } from '../../common/types.js'
import { discoverUrisFromPlatform } from '../../common/uris/platform/index.js'
import { defaultPlatformOptions } from '../defaults.js'
import type { PinterestUrl } from './pinterest.js'
import { parsePinterestUrl, pinterestHandler } from './pinterest.js'

describe('parsePinterestUrl', () => {
  it('should return the user for a profile page', () => {
    const expected: PinterestUrl = { kind: 'user', username: 'nasa' }

    expect(parsePinterestUrl('https://www.pinterest.com/nasa')).toEqual(expected)
  })

  it('should return the user for a trailing slash', () => {
    const expected: PinterestUrl = { kind: 'user', username: 'nasa' }

    expect(parsePinterestUrl('https://www.pinterest.com/nasa/')).toEqual(expected)
  })

  it('should return the user for the bare host', () => {
    const expected: PinterestUrl = { kind: 'user', username: 'nasa' }

    expect(parsePinterestUrl('https://pinterest.com/nasa')).toEqual(expected)
  })

  it('should return the user for a country label host', () => {
    const expected: PinterestUrl = { kind: 'user', username: 'nasa' }

    expect(parsePinterestUrl('https://uk.pinterest.com/nasa/')).toEqual(expected)
  })

  it('should return undefined for a country domain, which redirects to its label host', () => {
    expect(parsePinterestUrl('https://www.pinterest.co.uk/nasa/')).toBeUndefined()
    expect(parsePinterestUrl('https://pinterest.de/nasa/')).toBeUndefined()
  })

  it('should return undefined for a third-party site on another TLD', () => {
    expect(parsePinterestUrl('https://pinterest.ai/nasa')).toBeUndefined()
  })

  it('should return undefined for a subdomain longer than a country label', () => {
    expect(parsePinterestUrl('https://help.pinterest.com/nasa/')).toBeUndefined()
  })

  it('should return the tab for user subpages', () => {
    const expected: PinterestUrl = { kind: 'tab', username: 'nasa' }

    expect(parsePinterestUrl('https://www.pinterest.com/nasa/pins')).toEqual(expected)
    expect(parsePinterestUrl('https://www.pinterest.com/nasa/boards')).toEqual(expected)
    expect(parsePinterestUrl('https://www.pinterest.com/nasa/_saved')).toEqual(expected)
    expect(parsePinterestUrl('https://www.pinterest.com/nasa/_created')).toEqual(expected)
    expect(parsePinterestUrl('https://www.pinterest.com/nasa/followers')).toEqual(expected)
    expect(parsePinterestUrl('https://www.pinterest.com/nasa/following')).toEqual(expected)
  })

  it('should return the tab for a user subpage in any case', () => {
    const expected: PinterestUrl = { kind: 'tab', username: 'nasa' }

    expect(parsePinterestUrl('https://www.pinterest.com/nasa/Pins')).toEqual(expected)
  })

  it('should return the board for a board page', () => {
    const expected: PinterestUrl = { kind: 'board', username: 'nasa', board: 'mars' }

    expect(parsePinterestUrl('https://www.pinterest.com/nasa/mars')).toEqual(expected)
  })

  it('should return the board for a board with trailing slash', () => {
    const value = 'https://www.pinterest.com/nasa/space-exploration/'
    const expected: PinterestUrl = { kind: 'board', username: 'nasa', board: 'space-exploration' }

    expect(parsePinterestUrl(value)).toEqual(expected)
  })

  it('should return the board for a board section', () => {
    const value = 'https://www.pinterest.com/nasa/mars/rovers'
    const expected: PinterestUrl = { kind: 'board', username: 'nasa', board: 'mars' }

    expect(parsePinterestUrl(value)).toEqual(expected)
  })

  it('should return undefined for the homepage', () => {
    expect(parsePinterestUrl('https://www.pinterest.com/')).toBeUndefined()
  })

  it('should return undefined for a pin.it short link', () => {
    expect(parsePinterestUrl('https://pin.it/abc123')).toBeUndefined()
  })

  it('should return undefined for a dotted first segment', () => {
    expect(parsePinterestUrl('https://www.pinterest.com/robots.txt')).toBeUndefined()
  })

  it('should return undefined for another host', () => {
    expect(parsePinterestUrl('https://example.com/pinterest')).toBeUndefined()
  })

  it('should return undefined for an invalid URL', () => {
    expect(parsePinterestUrl('not-a-url')).toBeUndefined()
  })
})

describe('pinterestHandler', () => {
  describe('match', () => {
    it('should match a Pinterest URL', () => {
      expect(pinterestHandler.match('https://www.pinterest.com/nasa')).toBe(true)
    })

    it('should not match another host', () => {
      expect(pinterestHandler.match('https://example.com/pinterest')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return user feed for profile page', () => {
      const value = 'https://www.pinterest.com/nasa'
      const expected = [
        {
          uri: 'https://www.pinterest.com/nasa/feed.rss',
          hint: { key: 'pinterest:pins', label: 'Pins' },
        },
      ]

      expect(pinterestHandler.resolve(value)).toEqual(expected)
    })

    it('should return board feed for /{user}/{board}', () => {
      const value = 'https://www.pinterest.com/nasa/mars'
      const expected = [
        {
          uri: 'https://www.pinterest.com/nasa/mars.rss',
          hint: { key: 'pinterest:board', label: 'Board' },
        },
      ]

      expect(pinterestHandler.resolve(value)).toEqual(expected)
    })

    it('should return user feed for pins page', () => {
      const value = 'https://www.pinterest.com/nasa/pins'
      const expected = [
        {
          uri: 'https://www.pinterest.com/nasa/feed.rss',
          hint: { key: 'pinterest:pins', label: 'Pins' },
        },
      ]

      expect(pinterestHandler.resolve(value)).toEqual(expected)
    })

    it('should return the user feed on www for a country label host', () => {
      const value = 'https://uk.pinterest.com/nasa/'
      const expected = [
        {
          uri: 'https://www.pinterest.com/nasa/feed.rss',
          hint: { key: 'pinterest:pins', label: 'Pins' },
        },
      ]

      expect(pinterestHandler.resolve(value)).toEqual(expected)
    })

    it('should return empty array for homepage', () => {
      const value = 'https://www.pinterest.com/'

      expect(pinterestHandler.resolve(value)).toEqual([])
    })
  })

  describe('getFeedKey', () => {
    it('should return the pins key for a pins feed', () => {
      const value = 'https://www.pinterest.com/videodred/feed.rss'
      const expected = 'pinterest:pins'

      expect(pinterestHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return the board key for a board feed', () => {
      const value =
        'https://www.pinterest.com/VisitStA/tour-st-augustine-from-water-land-and-air.rss'
      const expected = 'pinterest:board'

      expect(pinterestHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return the board key for a percent-encoded board feed', () => {
      const value = 'https://www.pinterest.com/nasa/caf%C3%A9.rss'
      const expected = 'pinterest:board'

      expect(pinterestHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return the pins key for a pins feed on the bare host', () => {
      const value = 'https://pinterest.com/videodred/feed.rss'
      const expected = 'pinterest:pins'

      expect(pinterestHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return the pins key for a pins feed on a country label host', () => {
      const value = 'https://uk.pinterest.com/pinterest/feed.rss'
      const expected = 'pinterest:pins'

      expect(pinterestHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return the board key for a board feed on a country label host', () => {
      const value = 'https://uk.pinterest.com/nasa/hubble-space-telescope.rss'
      const expected = 'pinterest:board'

      expect(pinterestHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return undefined for a feed on a subdomain longer than a country label', () => {
      const value = 'https://help.pinterest.com/pinterest/feed.rss'

      expect(pinterestHandler.getFeedKey?.(value)).toBeUndefined()
    })

    it('should return undefined for a feed on a country domain', () => {
      const value = 'https://www.pinterest.co.uk/pinterest/feed.rss'

      expect(pinterestHandler.getFeedKey?.(value)).toBeUndefined()
    })

    it('should return undefined for a board page', () => {
      const value = 'https://www.pinterest.com/nasa/mars'

      expect(pinterestHandler.getFeedKey?.(value)).toBeUndefined()
    })

    it('should return undefined for a profile page', () => {
      const value = 'https://www.pinterest.com/videodred/'

      expect(pinterestHandler.getFeedKey?.(value)).toBeUndefined()
    })
  })
})

describe('discoverUrisFromPlatform', () => {
  const ownFeeds: Array<[string, string, string]> = [
    ['https://www.pinterest.com/videodred/feed.rss', 'pinterest:pins', 'Pins'],
    [
      'https://www.pinterest.com/VisitStA/tour-st-augustine-from-water-land-and-air.rss',
      'pinterest:board',
      'Board',
    ],
    ['https://uk.pinterest.com/pinterest/feed.rss', 'pinterest:pins', 'Pins'],
    ['https://uk.pinterest.com/nasa/hubble-space-telescope.rss', 'pinterest:board', 'Board'],
  ]

  it.each(ownFeeds)('should return %s itself as %s', async (value, key, label) => {
    const options = {
      ...defaultPlatformOptions,
      handlers: [pinterestHandler],
      baseUrl: value,
    }
    const expected: Array<DiscoverUriEntry> = [{ uri: value, hint: { key, label } }]

    expect(await discoverUrisFromPlatform(undefined, undefined, options)).toEqual(expected)
  })
})
