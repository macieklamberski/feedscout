import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry, DiscoverUriHint } from '../../common/types.js'
import { discoverUrisFromPlatform } from '../../common/uris/platform/index.js'
import { defaultPlatformOptions } from '../defaults.js'
import type { ZennUrl } from './zenn.js'
import { parseZennUrl, zennHandler } from './zenn.js'

describe('parseZennUrl', () => {
  it('should return the user for a profile page', () => {
    const expected: ZennUrl = { kind: 'user', username: 'catnose99' }

    expect(parseZennUrl('https://zenn.dev/catnose99')).toEqual(expected)
  })

  it('should return the post for an article page', () => {
    const expected: ZennUrl = { kind: 'post', username: 'catnose99' }

    expect(parseZennUrl('https://zenn.dev/catnose99/articles/some-article')).toEqual(expected)
  })

  it('should return the user for the www host', () => {
    const expected: ZennUrl = { kind: 'user', username: 'catnose99' }

    expect(parseZennUrl('https://www.zenn.dev/catnose99')).toEqual(expected)
  })

  it('should return the topic for a topic page', () => {
    const expected: ZennUrl = { kind: 'topic', topic: 'react' }

    expect(parseZennUrl('https://zenn.dev/topics/react')).toEqual(expected)
  })

  it('should return the topic for a topic page with a capitalized topics segment', () => {
    const expected: ZennUrl = { kind: 'topic', topic: 'react' }

    expect(parseZennUrl('https://zenn.dev/Topics/react')).toEqual(expected)
  })

  it('should return the topic for a topic feed URL', () => {
    const expected: ZennUrl = { kind: 'topic', topic: 'react' }

    expect(parseZennUrl('https://zenn.dev/topics/react/feed')).toEqual(expected)
  })

  it('should return the publication for a short publication page', () => {
    const expected: ZennUrl = { kind: 'publication', publication: 'team_zenn' }

    expect(parseZennUrl('https://zenn.dev/p/team_zenn')).toEqual(expected)
  })

  it('should return the publication for a short publication page with a capitalized p segment', () => {
    const expected: ZennUrl = { kind: 'publication', publication: 'team_zenn' }

    expect(parseZennUrl('https://zenn.dev/P/team_zenn')).toEqual(expected)
  })

  it('should return the home page for the root', () => {
    const expected: ZennUrl = { kind: 'home' }

    expect(parseZennUrl('https://zenn.dev/')).toEqual(expected)
  })

  it('should return undefined for another host', () => {
    expect(parseZennUrl('https://example.com/catnose99')).toBeUndefined()
  })

  it('should return undefined for an invalid URL', () => {
    expect(parseZennUrl('not-a-url')).toBeUndefined()
  })
})

describe('zennHandler', () => {
  describe('match', () => {
    it('should match a zenn.dev URL', () => {
      expect(zennHandler.match('https://zenn.dev')).toBe(true)
    })

    it('should not match another host', () => {
      expect(zennHandler.match('https://example.com')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return feed URL for user', () => {
      const value = 'https://zenn.dev/catnose99'
      const expected = [
        {
          uri: 'https://zenn.dev/catnose99/feed',
          hint: { key: 'zenn:posts', label: 'Posts' },
        },
      ]

      expect(zennHandler.resolve(value)).toEqual(expected)
    })

    it('should return the user feed URL for an article page', () => {
      const value = 'https://zenn.dev/catnose99/articles/some-article'
      const expected = [
        {
          uri: 'https://zenn.dev/catnose99/feed',
          hint: { key: 'zenn:posts', label: 'Posts' },
        },
      ]

      expect(zennHandler.resolve(value)).toEqual(expected)
    })

    it('should return feed URL for topic page', () => {
      const value = 'https://zenn.dev/topics/react'
      const expected = [
        {
          uri: 'https://zenn.dev/topics/react/feed',
          hint: { key: 'zenn:topic', label: 'Topic' },
        },
      ]

      expect(zennHandler.resolve(value)).toEqual(expected)
    })

    it('should return feed URL for short publication page', () => {
      const value = 'https://zenn.dev/p/team_zenn'
      const expected = [
        {
          uri: 'https://zenn.dev/p/team_zenn/feed',
          hint: { key: 'zenn:publication', label: 'Publication' },
        },
      ]

      expect(zennHandler.resolve(value)).toEqual(expected)
    })

    it('should return trending feed for root path', () => {
      const value = 'https://zenn.dev/'
      const expected = [
        {
          uri: 'https://zenn.dev/feed',
          hint: { key: 'zenn:trending', label: 'Trending' },
        },
      ]

      expect(zennHandler.resolve(value)).toEqual(expected)
    })
  })

  describe('getFeedHint', () => {
    it('should return the trending hint for the trending feed', () => {
      const value = 'https://zenn.dev/feed'
      const expected: DiscoverUriHint = { key: 'zenn:trending', label: 'Trending' }

      expect(zennHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the trending hint for the trending feed with a trailing slash', () => {
      const value = 'https://zenn.dev/feed/'
      const expected: DiscoverUriHint = { key: 'zenn:trending', label: 'Trending' }

      expect(zennHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the trending hint for the trending feed over http', () => {
      const value = 'http://zenn.dev/feed'
      const expected: DiscoverUriHint = { key: 'zenn:trending', label: 'Trending' }

      expect(zennHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the posts hint for a user feed', () => {
      const value = 'https://zenn.dev/catnose99/feed'
      const expected: DiscoverUriHint = { key: 'zenn:posts', label: 'Posts' }

      expect(zennHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the posts hint for a user feed with all posts', () => {
      const value = 'https://zenn.dev/alice/feed?all=1'
      const expected: DiscoverUriHint = { key: 'zenn:posts', label: 'Posts' }

      expect(zennHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the topic hint for a topic feed', () => {
      const value = 'https://zenn.dev/topics/react/feed'
      const expected: DiscoverUriHint = { key: 'zenn:topic', label: 'Topic' }

      expect(zennHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the publication hint for a publication feed', () => {
      const value = 'https://zenn.dev/p/team_zenn/feed'
      const expected: DiscoverUriHint = { key: 'zenn:publication', label: 'Publication' }

      expect(zennHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return undefined for the page of a topic named feed', () => {
      const value = 'https://zenn.dev/topics/feed'

      expect(zennHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for the page of a publication named feed', () => {
      const value = 'https://zenn.dev/p/feed'

      expect(zennHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for a user page', () => {
      const value = 'https://zenn.dev/catnose99'

      expect(zennHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for a topic page', () => {
      const value = 'https://zenn.dev/topics/react'

      expect(zennHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for a feed path on another host', () => {
      const value = 'https://example.com/catnose99/feed'

      expect(zennHandler.getFeedHint?.(value)).toBeUndefined()
    })
  })

  describe('own feeds through the Platform method', () => {
    const ownFeeds: Array<[string, DiscoverUriHint]> = [
      ['https://zenn.dev/feed', { key: 'zenn:trending', label: 'Trending' }],
      ['https://zenn.dev/catnose99/feed', { key: 'zenn:posts', label: 'Posts' }],
      ['https://zenn.dev/topics/react/feed', { key: 'zenn:topic', label: 'Topic' }],
      ['https://zenn.dev/p/team_zenn/feed', { key: 'zenn:publication', label: 'Publication' }],
    ]

    it.each(ownFeeds)('should return %s as itself', async (value, hint) => {
      const result = await discoverUrisFromPlatform(undefined, undefined, {
        ...defaultPlatformOptions,
        handlers: [zennHandler],
        baseUrl: value,
      })
      const expected: Array<DiscoverUriEntry> = [{ uri: value, hint }]

      expect(result).toEqual(expected)
    })
  })
})
