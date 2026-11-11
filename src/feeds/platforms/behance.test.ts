import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry } from '../../common/types.js'
import { discoverUrisFromPlatform } from '../../common/uris/platform/index.js'
import { defaultPlatformOptions } from '../defaults.js'
import type { BehanceUrl } from './behance.js'
import { behanceHandler, parseBehanceUrl } from './behance.js'

describe('parseBehanceUrl', () => {
  it('should return the username for a profile page', () => {
    const expected: BehanceUrl = { kind: 'profile', username: 'johndoe' }

    expect(parseBehanceUrl('https://www.behance.net/johndoe')).toEqual(expected)
  })

  it('should return the username for a profile page with a trailing slash', () => {
    const expected: BehanceUrl = { kind: 'profile', username: 'johndoe' }

    expect(parseBehanceUrl('https://www.behance.net/johndoe/')).toEqual(expected)
  })

  it('should return the username for the appreciated page', () => {
    const expected: BehanceUrl = { kind: 'profile', username: 'johndoe' }

    expect(parseBehanceUrl('https://www.behance.net/johndoe/appreciated')).toEqual(expected)
  })

  it('should return the username for the appreciated page with a capitalized appreciated segment', () => {
    const expected: BehanceUrl = { kind: 'profile', username: 'johndoe' }

    expect(parseBehanceUrl('https://www.behance.net/johndoe/Appreciated')).toEqual(expected)
  })

  it('should return the username for the host without www', () => {
    const expected: BehanceUrl = { kind: 'profile', username: 'johndoe' }

    expect(parseBehanceUrl('https://behance.net/johndoe')).toEqual(expected)
  })

  it('should keep the username case', () => {
    const expected: BehanceUrl = { kind: 'profile', username: 'JohnDoe' }

    expect(parseBehanceUrl('https://www.behance.net/JohnDoe')).toEqual(expected)
  })

  it('should read a profile tab as the profile', () => {
    const expected: BehanceUrl = { kind: 'profile', username: 'johndoe' }

    expect(parseBehanceUrl('https://www.behance.net/johndoe/projects')).toEqual(expected)
  })

  it('should read a profile tab in any case as the profile', () => {
    const expected: BehanceUrl = { kind: 'profile', username: 'johndoe' }

    expect(parseBehanceUrl('https://www.behance.net/johndoe/Moodboards/')).toEqual(expected)
  })

  it('should read a two-segment path that is not a profile tab as the home page', () => {
    const expected: BehanceUrl = { kind: 'home' }

    expect(parseBehanceUrl('https://www.behance.net/johndoe/unknown')).toEqual(expected)
  })

  it('should read a search page as the home page', () => {
    const expected: BehanceUrl = { kind: 'home' }

    expect(parseBehanceUrl('https://www.behance.net/search/projects?search=logo')).toEqual(expected)
  })

  it('should read a gallery page as the home page', () => {
    const expected: BehanceUrl = { kind: 'home' }

    expect(parseBehanceUrl('https://www.behance.net/gallery/123456/Brand-Identity')).toEqual(
      expected,
    )
  })

  it('should return the home page', () => {
    const expected: BehanceUrl = { kind: 'home' }

    expect(parseBehanceUrl('https://www.behance.net/')).toEqual(expected)
  })

  it('should return the home page for the galleries page', () => {
    const expected: BehanceUrl = { kind: 'home' }

    expect(parseBehanceUrl('https://www.behance.net/Galleries/')).toEqual(expected)
  })

  it('should read the bare feeds path as a profile, as Behance has no feed there', () => {
    const value = 'https://www.behance.net/feeds'
    const expected: BehanceUrl = { kind: 'profile', username: 'feeds' }

    expect(parseBehanceUrl(value)).toEqual(expected)
  })

  it('should return undefined for another host', () => {
    expect(parseBehanceUrl('https://example.com/johndoe')).toBeUndefined()
  })

  it('should return undefined for an invalid URL', () => {
    expect(parseBehanceUrl('not-a-url')).toBeUndefined()
  })
})

describe('behanceHandler', () => {
  describe('match', () => {
    it('should match a Behance profile URL', () => {
      expect(behanceHandler.match('https://www.behance.net/johndoe')).toBe(true)
    })

    it('should not match other hosts', () => {
      expect(behanceHandler.match('https://example.com/behance')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return feed for user profile', () => {
      const value = 'https://www.behance.net/johndoe'
      const expected = [
        {
          uri: 'https://www.behance.net/feeds/user?username=johndoe',
          hint: { key: 'behance:portfolio', label: 'Portfolio' },
        },
      ]

      expect(behanceHandler.resolve(value)).toEqual(expected)
    })

    it('should return featured projects feed for homepage', () => {
      const value = 'https://www.behance.net/'
      const expected = [
        {
          uri: 'https://www.behance.net/feeds/projects',
          hint: { key: 'behance:projects', label: 'Featured projects' },
        },
      ]

      expect(behanceHandler.resolve(value)).toEqual(expected)
    })

    it('should return featured projects feed for /galleries', () => {
      const value = 'https://www.behance.net/galleries'
      const expected = [
        {
          uri: 'https://www.behance.net/feeds/projects',
          hint: { key: 'behance:projects', label: 'Featured projects' },
        },
      ]

      expect(behanceHandler.resolve(value)).toEqual(expected)
    })

    it('should return featured projects feed for /galleries with a capitalized galleries segment', () => {
      const value = 'https://www.behance.net/Galleries'
      const expected = [
        {
          uri: 'https://www.behance.net/feeds/projects',
          hint: { key: 'behance:projects', label: 'Featured projects' },
        },
      ]

      expect(behanceHandler.resolve(value)).toEqual(expected)
    })

    it('should return featured projects feed for /galleries with trailing slash', () => {
      const value = 'https://www.behance.net/galleries/'
      const expected = [
        {
          uri: 'https://www.behance.net/feeds/projects',
          hint: { key: 'behance:projects', label: 'Featured projects' },
        },
      ]

      expect(behanceHandler.resolve(value)).toEqual(expected)
    })
  })

  describe('getFeedKey', () => {
    it('should return the portfolio key for a portfolio feed', () => {
      const value = 'https://www.behance.net/feeds/user?username=almostblack'
      const expected = 'behance:portfolio'

      expect(behanceHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return the portfolio key for a portfolio feed without www', () => {
      const value = 'https://behance.net/feeds/user?username=angshnitul925b'
      const expected = 'behance:portfolio'

      expect(behanceHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return the portfolio key for a portfolio feed over http', () => {
      const value = 'http://www.behance.net/feeds/user?username=almostblack'
      const expected = 'behance:portfolio'

      expect(behanceHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return the portfolio key for a portfolio feed with another parameter', () => {
      const value = 'https://www.behance.net/feeds/user?username=almostblack&content=appreciated'
      const expected = 'behance:portfolio'

      expect(behanceHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return the projects key for the projects feed', () => {
      const value = 'https://www.behance.net/feeds/projects'
      const expected = 'behance:projects'

      expect(behanceHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return undefined for a user feed without a username', () => {
      const value = 'https://www.behance.net/feeds/user'

      expect(behanceHandler.getFeedKey?.(value)).toBeUndefined()
    })

    it('should return undefined for the bare feeds path', () => {
      const value = 'https://www.behance.net/feeds'

      expect(behanceHandler.getFeedKey?.(value)).toBeUndefined()
    })

    it('should return undefined for a profile page', () => {
      const value = 'https://www.behance.net/almostblack'

      expect(behanceHandler.getFeedKey?.(value)).toBeUndefined()
    })

    it('should return undefined for the feed path on another host', () => {
      const value = 'https://example.com/feeds/projects'

      expect(behanceHandler.getFeedKey?.(value)).toBeUndefined()
    })
  })
})

describe('discoverUrisFromPlatform', () => {
  const ownFeeds: Array<[string, string, string]> = [
    ['https://www.behance.net/feeds/user?username=almostblack', 'behance:portfolio', 'Portfolio'],
    ['https://behance.net/feeds/user?username=angshnitul925b', 'behance:portfolio', 'Portfolio'],
    ['https://www.behance.net/feeds/projects', 'behance:projects', 'Featured projects'],
  ]

  it.each(ownFeeds)('should return %s itself as %s', async (value, key, label) => {
    const options = {
      ...defaultPlatformOptions,
      handlers: [behanceHandler],
      baseUrl: value,
    }
    const expected: Array<DiscoverUriEntry> = [{ uri: value, hint: { key, label } }]

    expect(await discoverUrisFromPlatform(undefined, undefined, options)).toEqual(expected)
  })

  it('should read the bare feeds path as a profile page', async () => {
    const value = 'https://www.behance.net/feeds'
    const options = {
      ...defaultPlatformOptions,
      handlers: [behanceHandler],
      baseUrl: value,
    }
    const expected: Array<DiscoverUriEntry> = [
      {
        uri: 'https://www.behance.net/feeds/user?username=feeds',
        hint: { key: 'behance:portfolio', label: 'Portfolio' },
      },
    ]

    expect(await discoverUrisFromPlatform(undefined, undefined, options)).toEqual(expected)
  })
})
