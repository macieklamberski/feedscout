import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry, DiscoverUriHint } from '../../common/types.js'
import { discoverUrisFromPlatform } from '../../common/uris/platform/index.js'
import { defaultPlatformOptions } from '../defaults.js'
import type { FlipboardUrl } from './flipboard.js'
import { flipboardHandler, parseFlipboardUrl } from './flipboard.js'

describe('parseFlipboardUrl', () => {
  it('should return the profile for a profile page', () => {
    const expected: FlipboardUrl = { kind: 'profile', username: 'example' }

    expect(parseFlipboardUrl('https://flipboard.com/@example')).toEqual(expected)
  })

  it('should return the profile for a trailing slash', () => {
    const expected: FlipboardUrl = { kind: 'profile', username: 'example' }

    expect(parseFlipboardUrl('https://flipboard.com/@example/')).toEqual(expected)
  })

  it('should return the profile for the www host', () => {
    const expected: FlipboardUrl = { kind: 'profile', username: 'example' }

    expect(parseFlipboardUrl('https://www.flipboard.com/@example')).toEqual(expected)
  })

  it('should keep the case of the username', () => {
    const expected: FlipboardUrl = { kind: 'profile', username: 'ExampleNews' }

    expect(parseFlipboardUrl('https://flipboard.com/@ExampleNews')).toEqual(expected)
  })

  it('should return the profile for profile tabs', () => {
    const expected: FlipboardUrl = { kind: 'profile', username: 'example' }

    expect(parseFlipboardUrl('https://flipboard.com/@example/followers')).toEqual(expected)
    expect(parseFlipboardUrl('https://flipboard.com/@example/following')).toEqual(expected)
    expect(parseFlipboardUrl('https://flipboard.com/@example/magazines')).toEqual(expected)
  })

  it('should return the profile for a profile tab in any case', () => {
    const expected: FlipboardUrl = { kind: 'profile', username: 'example' }

    expect(parseFlipboardUrl('https://flipboard.com/@example/Followers')).toEqual(expected)
  })

  it('should return the magazine for a magazine page', () => {
    const value = 'https://flipboard.com/@example/business-arsskhdiz'
    const expected: FlipboardUrl = {
      kind: 'magazine',
      username: 'example',
      magazine: 'business-arsskhdiz',
    }

    expect(parseFlipboardUrl(value)).toEqual(expected)
  })

  it('should return the magazine for a storyboard page', () => {
    const value = 'https://flipboard.com/@example/the-fight-against-racism-1hgl9qashpnbq7av'
    const expected: FlipboardUrl = {
      kind: 'magazine',
      username: 'example',
      magazine: 'the-fight-against-racism-1hgl9qashpnbq7av',
    }

    expect(parseFlipboardUrl(value)).toEqual(expected)
  })

  it('should return the topic for a topic page', () => {
    const expected: FlipboardUrl = { kind: 'topic', topic: 'technology' }

    expect(parseFlipboardUrl('https://flipboard.com/topic/technology')).toEqual(expected)
  })

  it('should return the topic for a topic route in any case', () => {
    const expected: FlipboardUrl = { kind: 'topic', topic: 'technology' }

    expect(parseFlipboardUrl('https://flipboard.com/Topic/technology')).toEqual(expected)
  })

  it('should return undefined for the topic route without a topic', () => {
    expect(parseFlipboardUrl('https://flipboard.com/topic')).toBeUndefined()
  })

  it('should return undefined for an article page', () => {
    const value = 'https://flipboard.com/@example/business-arsskhdiz/a-lx3ygqVrTUGLodLkg_7x2g'

    expect(parseFlipboardUrl(value)).toBeUndefined()
  })

  it('should return undefined for a path without an @ handle', () => {
    expect(parseFlipboardUrl('https://flipboard.com/explore')).toBeUndefined()
    expect(parseFlipboardUrl('https://flipboard.com/section/technology')).toBeUndefined()
    expect(parseFlipboardUrl('https://flipboard.com/signup')).toBeUndefined()
  })

  it('should return undefined for a bare @', () => {
    expect(parseFlipboardUrl('https://flipboard.com/@')).toBeUndefined()
  })

  it('should return undefined for the homepage', () => {
    expect(parseFlipboardUrl('https://flipboard.com/')).toBeUndefined()
  })

  it('should return undefined for another host', () => {
    expect(parseFlipboardUrl('https://example.com/@example')).toBeUndefined()
  })
})

describe('flipboardHandler', () => {
  describe('match', () => {
    it('should match a Flipboard profile URL', () => {
      expect(flipboardHandler.match('https://flipboard.com/@example')).toBe(true)
    })

    it('should not match a Flipboard page without a feed', () => {
      expect(flipboardHandler.match('https://flipboard.com/explore')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return the profile feed for a profile page', () => {
      const value = 'https://flipboard.com/@example'
      const expected = [
        {
          uri: 'https://flipboard.com/@example.rss',
          hint: { key: 'flipboard:profile', label: 'Profile' },
        },
      ]

      expect(flipboardHandler.resolve(value)).toEqual(expected)
    })

    it('should return the magazine feed for a magazine page', () => {
      const value = 'https://flipboard.com/@example/business-arsskhdiz'
      const expected = [
        {
          uri: 'https://flipboard.com/@example/business-arsskhdiz.rss',
          hint: { key: 'flipboard:magazine', label: 'Magazine' },
        },
      ]

      expect(flipboardHandler.resolve(value)).toEqual(expected)
    })

    it('should return the topic feed for a topic page', () => {
      const value = 'https://flipboard.com/topic/technology'
      const expected = [
        {
          uri: 'https://flipboard.com/topic/technology.rss',
          hint: { key: 'flipboard:topic', label: 'Topic' },
        },
      ]

      expect(flipboardHandler.resolve(value)).toEqual(expected)
    })

    it('should return empty array for an article page', () => {
      const value = 'https://flipboard.com/@example/business-arsskhdiz/a-lx3ygqVrTUGLodLkg_7x2g'

      expect(flipboardHandler.resolve(value)).toEqual([])
    })
  })

  describe('getFeedHint', () => {
    it('should return the profile hint for a profile feed', () => {
      const value = 'https://flipboard.com/@BobWrites.rss'
      const expected: DiscoverUriHint = { key: 'flipboard:profile', label: 'Profile' }

      expect(flipboardHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the profile hint for a profile feed on the www host', () => {
      const value = 'https://www.flipboard.com/@AliceDrives.rss'
      const expected: DiscoverUriHint = { key: 'flipboard:profile', label: 'Profile' }

      expect(flipboardHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the profile hint for a profile feed over http', () => {
      const value = 'http://flipboard.com/@AliceDrives.rss'
      const expected: DiscoverUriHint = { key: 'flipboard:profile', label: 'Profile' }

      expect(flipboardHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the magazine hint for a magazine feed', () => {
      const value =
        'https://flipboard.com/@davesaves/the-most-affordable-places-to-retire-that-have-great-weather-too-tjt3fnf55qlfnd84.rss'
      const expected: DiscoverUriHint = { key: 'flipboard:magazine', label: 'Magazine' }

      expect(flipboardHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the magazine hint for a magazine feed with an encoded slug', () => {
      const value =
        'https://flipboard.com/@carol3abc/construcci%C3%B3n-en-espa%C3%B1a-noviembre-23-7c2jllgiz.rss'
      const expected: DiscoverUriHint = { key: 'flipboard:magazine', label: 'Magazine' }

      expect(flipboardHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the topic hint for a topic feed', () => {
      const value = 'https://flipboard.com/topic/africanculture.rss'
      const expected: DiscoverUriHint = { key: 'flipboard:topic', label: 'Topic' }

      expect(flipboardHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the topic hint for a topic feed with a capitalized route', () => {
      const value = 'https://flipboard.com/Topic/aiart.rss'
      const expected: DiscoverUriHint = { key: 'flipboard:topic', label: 'Topic' }

      expect(flipboardHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return undefined for a profile page', () => {
      const value = 'https://flipboard.com/@BobWrites'

      expect(flipboardHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for a magazine page', () => {
      const value = 'https://flipboard.com/@erincooks/pizza-ah07s77kz'

      expect(flipboardHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for a topic page', () => {
      const value = 'https://flipboard.com/topic/africanculture'

      expect(flipboardHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for an article page', () => {
      const value = 'https://flipboard.com/@erincooks/pizza-ah07s77kz/a-lx3ygqVrTUGLodLkg_7x2g'

      expect(flipboardHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for a feed on another host', () => {
      const value = 'https://example.com/@BobWrites.rss'

      expect(flipboardHandler.getFeedHint?.(value)).toBeUndefined()
    })
  })

  describe('own feeds through the Platform method', () => {
    const ownFeeds: Array<[string, DiscoverUriHint]> = [
      ['https://flipboard.com/@BobWrites.rss', { key: 'flipboard:profile', label: 'Profile' }],
      [
        'https://flipboard.com/@carol3abc/construcci%C3%B3n-en-espa%C3%B1a-noviembre-23-7c2jllgiz.rss',
        { key: 'flipboard:magazine', label: 'Magazine' },
      ],
      [
        'https://flipboard.com/topic/africanculture.rss',
        { key: 'flipboard:topic', label: 'Topic' },
      ],
    ]

    it.each(ownFeeds)('should return %s as itself', async (value, hint) => {
      const result = await discoverUrisFromPlatform(undefined, undefined, {
        ...defaultPlatformOptions,
        handlers: [flipboardHandler],
        baseUrl: value,
      })
      const expected: Array<DiscoverUriEntry> = [{ uri: value, hint }]

      expect(result).toEqual(expected)
    })
  })
})
