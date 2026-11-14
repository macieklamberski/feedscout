import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry, DiscoverUriHint } from '../../common/types.js'
import { discoverUrisFromPlatform } from '../../common/uris/platform/index.js'
import { defaultPlatformOptions } from '../defaults.js'
import type { DevtoUrl } from './devto.js'
import { devtoHandler, parseDevtoUrl } from './devto.js'

describe('parseDevtoUrl', () => {
  it('should return the profile for a profile page', () => {
    const expected: DevtoUrl = { kind: 'profile', owner: 'some_user' }

    expect(parseDevtoUrl('https://dev.to/some_user')).toEqual(expected)
  })

  it('should return the profile for a profile page with a trailing slash', () => {
    const expected: DevtoUrl = { kind: 'profile', owner: 'alice' }

    expect(parseDevtoUrl('https://dev.to/alice/')).toEqual(expected)
  })

  it('should return the profile for the www host', () => {
    const expected: DevtoUrl = { kind: 'profile', owner: 'alice' }

    expect(parseDevtoUrl('https://www.dev.to/alice')).toEqual(expected)
  })

  it('should keep the name case', () => {
    const expected: DevtoUrl = { kind: 'profile', owner: 'Alice' }

    expect(parseDevtoUrl('https://dev.to/Alice')).toEqual(expected)
  })

  it('should return the tag for a tag page', () => {
    const expected: DevtoUrl = { kind: 'tag', tag: 'javascript' }

    expect(parseDevtoUrl('https://dev.to/t/javascript')).toEqual(expected)
  })

  it('should return the tag for a tag page with a capitalized t segment', () => {
    const expected: DevtoUrl = { kind: 'tag', tag: 'javascript' }

    expect(parseDevtoUrl('https://dev.to/T/javascript')).toEqual(expected)
  })

  it('should return the author profile for an article page', () => {
    const expected: DevtoUrl = { kind: 'profile', owner: 'alice' }

    expect(parseDevtoUrl('https://dev.to/alice/some-article-1n45')).toEqual(expected)
  })

  it('should return the organization profile for an article posted under it', () => {
    const expected: DevtoUrl = { kind: 'profile', owner: 'gde' }

    expect(parseDevtoUrl('https://dev.to/gde/production-rag-5g3')).toEqual(expected)
  })

  it('should return a hyphenated name', () => {
    const expected: DevtoUrl = { kind: 'profile', owner: 'maame-codes' }

    expect(parseDevtoUrl('https://dev.to/maame-codes')).toEqual(expected)
  })

  it('should return the home page', () => {
    const expected: DevtoUrl = { kind: 'home' }

    expect(parseDevtoUrl('https://dev.to/')).toEqual(expected)
  })

  it('should return the latest page', () => {
    const expected: DevtoUrl = { kind: 'latest' }

    expect(parseDevtoUrl('https://dev.to/Latest/')).toEqual(expected)
  })

  it('should return undefined for another host', () => {
    expect(parseDevtoUrl('https://example.com/alice')).toBeUndefined()
  })

  it('should return undefined for an invalid URL', () => {
    expect(parseDevtoUrl('not-a-url')).toBeUndefined()
  })
})

describe('devtoHandler', () => {
  describe('match', () => {
    it('should return true for a dev.to URL', () => {
      expect(devtoHandler.match('https://dev.to/thepracticaldev')).toBe(true)
    })

    it('should return false for another host', () => {
      expect(devtoHandler.match('https://example.com/thepracticaldev')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return RSS feed URL for user profile', () => {
      const value = 'https://dev.to/thepracticaldev'
      const expected = [
        {
          uri: 'https://dev.to/feed/thepracticaldev',
          hint: { key: 'devto:posts', label: 'Posts' },
        },
      ]

      expect(devtoHandler.resolve(value)).toEqual(expected)
    })

    it('should return RSS feed URL for tag page', () => {
      const value = 'https://dev.to/t/javascript'
      const expected = [
        {
          uri: 'https://dev.to/feed/tag/javascript',
          hint: { key: 'devto:tag', label: 'Tag' },
        },
      ]

      expect(devtoHandler.resolve(value)).toEqual(expected)
    })

    it('should return community feed for homepage', () => {
      const value = 'https://dev.to/'
      const expected = [
        { uri: 'https://dev.to/feed', hint: { key: 'devto:community', label: 'Community' } },
      ]

      expect(devtoHandler.resolve(value)).toEqual(expected)
    })

    it('should return latest feed for /latest', () => {
      const value = 'https://dev.to/latest'
      const expected = [
        { uri: 'https://dev.to/feed/latest', hint: { key: 'devto:latest', label: 'Latest' } },
        { uri: 'https://dev.to/feed', hint: { key: 'devto:community', label: 'Community' } },
      ]

      expect(devtoHandler.resolve(value)).toEqual(expected)
    })

    it('should return latest feed for /latest with a capitalized latest segment', () => {
      const value = 'https://dev.to/Latest'
      const expected = [
        { uri: 'https://dev.to/feed/latest', hint: { key: 'devto:latest', label: 'Latest' } },
        { uri: 'https://dev.to/feed', hint: { key: 'devto:community', label: 'Community' } },
      ]

      expect(devtoHandler.resolve(value)).toEqual(expected)
    })

    it('should return latest feed for /latest with trailing slash', () => {
      const value = 'https://dev.to/latest/'
      const expected = [
        { uri: 'https://dev.to/feed/latest', hint: { key: 'devto:latest', label: 'Latest' } },
        { uri: 'https://dev.to/feed', hint: { key: 'devto:community', label: 'Community' } },
      ]

      expect(devtoHandler.resolve(value)).toEqual(expected)
    })
  })

  describe('getFeedHint', () => {
    it('should return the posts hint for a user feed', () => {
      const value = 'https://dev.to/feed/antonfrattaroli'
      const expected: DiscoverUriHint = { key: 'devto:posts', label: 'Posts' }

      expect(devtoHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the posts hint for a feed with a trailing slash', () => {
      const value = 'https://dev.to/feed/barbaraulowee/'
      const expected: DiscoverUriHint = { key: 'devto:posts', label: 'Posts' }

      expect(devtoHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the posts hint for a feed on the www host', () => {
      const value = 'https://www.dev.to/feed/antonfrattaroli'
      const expected: DiscoverUriHint = { key: 'devto:posts', label: 'Posts' }

      expect(devtoHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the posts hint for a feed over http', () => {
      const value = 'http://dev.to/feed/antonfrattaroli'
      const expected: DiscoverUriHint = { key: 'devto:posts', label: 'Posts' }

      expect(devtoHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the tag hint for a tag feed', () => {
      const value = 'https://dev.to/feed/tag/log4j2'
      const expected: DiscoverUriHint = { key: 'devto:tag', label: 'Tag' }

      expect(devtoHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the tag hint for a tag feed with a capitalized route', () => {
      const value = 'https://dev.to/Feed/Tag/hash'
      const expected: DiscoverUriHint = { key: 'devto:tag', label: 'Tag' }

      expect(devtoHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the latest hint for the latest feed', () => {
      const value = 'https://dev.to/feed/latest'
      const expected: DiscoverUriHint = { key: 'devto:latest', label: 'Latest' }

      expect(devtoHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the community hint for the community feed', () => {
      const value = 'https://dev.to/feed'
      const expected: DiscoverUriHint = { key: 'devto:community', label: 'Community' }

      expect(devtoHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the community hint for the community feed at rss', () => {
      const value = 'https://dev.to/rss'
      const expected: DiscoverUriHint = { key: 'devto:community', label: 'Community' }

      expect(devtoHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return undefined for a profile page', () => {
      const value = 'https://dev.to/antonfrattaroli'

      expect(devtoHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for an article page', () => {
      const value = 'https://dev.to/antonfrattaroli/some-article-1n45'

      expect(devtoHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for a tag page', () => {
      const value = 'https://dev.to/t/log4j2'

      expect(devtoHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for another host', () => {
      const value = 'https://example.com/feed/antonfrattaroli'

      expect(devtoHandler.getFeedHint?.(value)).toBeUndefined()
    })
  })

  describe('own feeds through the Platform method', () => {
    const ownFeeds: Array<[string, DiscoverUriHint]> = [
      ['https://dev.to/feed/antonfrattaroli', { key: 'devto:posts', label: 'Posts' }],
      ['https://dev.to/feed/tag/log4j2', { key: 'devto:tag', label: 'Tag' }],
      ['https://dev.to/feed/latest', { key: 'devto:latest', label: 'Latest' }],
      ['https://dev.to/feed', { key: 'devto:community', label: 'Community' }],
      ['https://dev.to/rss', { key: 'devto:community', label: 'Community' }],
    ]

    it.each(ownFeeds)('should return %s as itself', async (value, hint) => {
      const result = await discoverUrisFromPlatform(undefined, undefined, {
        ...defaultPlatformOptions,
        handlers: [devtoHandler],
        baseUrl: value,
      })
      const expected: Array<DiscoverUriEntry> = [{ uri: value, hint }]

      expect(result).toEqual(expected)
    })
  })
})
