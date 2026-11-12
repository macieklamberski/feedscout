import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry, DiscoverUriHint } from '../../common/types.js'
import { discoverUrisFromPlatform } from '../../common/uris/platform/index.js'
import { defaultPlatformOptions } from '../defaults.js'
import type { BlueskyUrl } from './bluesky.js'
import { blueskyHandler, parseBlueskyUrl } from './bluesky.js'

describe('parseBlueskyUrl', () => {
  it('should return the handle for a profile page', () => {
    const expected: BlueskyUrl = { kind: 'profile', handle: 'user.bsky.social' }

    expect(parseBlueskyUrl('https://bsky.app/profile/user.bsky.social')).toEqual(expected)
  })

  it('should return a custom domain handle', () => {
    const expected: BlueskyUrl = { kind: 'profile', handle: 'example.com' }

    expect(parseBlueskyUrl('https://bsky.app/profile/example.com')).toEqual(expected)
  })

  it('should return a DID handle', () => {
    const expected: BlueskyUrl = { kind: 'profile', handle: 'did:plc:z72i7hdynmk6r22z27h6tvur' }

    expect(parseBlueskyUrl('https://bsky.app/profile/did:plc:z72i7hdynmk6r22z27h6tvur')).toEqual(
      expected,
    )
  })

  it('should return the handle for a post page', () => {
    const expected: BlueskyUrl = { kind: 'profile', handle: 'user.bsky.social' }

    expect(parseBlueskyUrl('https://bsky.app/profile/user.bsky.social/post/123')).toEqual(expected)
  })

  it('should return the handle for a profile subpage', () => {
    const expected: BlueskyUrl = { kind: 'profile', handle: 'user.bsky.social' }

    expect(parseBlueskyUrl('https://bsky.app/profile/user.bsky.social/followers')).toEqual(expected)
  })

  it('should return the handle for the www host', () => {
    const expected: BlueskyUrl = { kind: 'profile', handle: 'user.bsky.social' }

    expect(parseBlueskyUrl('https://www.bsky.app/profile/user.bsky.social')).toEqual(expected)
  })

  it('should return undefined for a profile path without a handle', () => {
    expect(parseBlueskyUrl('https://bsky.app/profile')).toBeUndefined()
    expect(parseBlueskyUrl('https://bsky.app/profile/')).toBeUndefined()
  })

  it('should return the profile for a capitalized profile prefix', () => {
    const expected: BlueskyUrl = { kind: 'profile', handle: 'user.bsky.social' }

    expect(parseBlueskyUrl('https://bsky.app/Profile/user.bsky.social')).toEqual(expected)
  })

  it('should return undefined for non-profile paths', () => {
    expect(parseBlueskyUrl('https://bsky.app/about')).toBeUndefined()
    expect(parseBlueskyUrl('https://bsky.app/settings')).toBeUndefined()
  })

  it('should return undefined for the homepage', () => {
    expect(parseBlueskyUrl('https://bsky.app/')).toBeUndefined()
  })

  it('should return undefined for another host', () => {
    expect(parseBlueskyUrl('https://example.com/profile/user')).toBeUndefined()
  })

  it('should return undefined for an invalid URL', () => {
    expect(parseBlueskyUrl('not-a-url')).toBeUndefined()
  })
})

describe('blueskyHandler', () => {
  describe('match', () => {
    it('should match any Bluesky URL', () => {
      expect(blueskyHandler.match('https://bsky.app/profile/user.bsky.social')).toBe(true)
    })

    it('should not match other hosts', () => {
      expect(blueskyHandler.match('https://example.com/user')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return native RSS feed URL for profile', () => {
      const value = 'https://bsky.app/profile/user.bsky.social'
      const expected = [
        {
          uri: 'https://bsky.app/profile/user.bsky.social/rss',
          hint: { key: 'bluesky:posts', label: 'Posts' },
        },
      ]

      expect(blueskyHandler.resolve(value)).toEqual(expected)
    })

    it('should return empty array when the URL names no profile', () => {
      expect(blueskyHandler.resolve('https://bsky.app/about')).toEqual([])
    })
  })

  describe('getFeedKey', () => {
    it('should return the posts key for a feed under a handle', () => {
      const value = 'https://bsky.app/profile/astrea.cc/rss'
      const expected = 'bluesky:posts'

      expect(blueskyHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return the posts key for a feed under a DID', () => {
      const value = 'https://bsky.app/profile/did:plc:5qmh4a6gwsozualtmtmzi5ja/rss'
      const expected = 'bluesky:posts'

      expect(blueskyHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return the posts key for a feed on web-cdn.bsky.app', () => {
      const value = 'https://web-cdn.bsky.app/profile/did:plc:5qmh4a6gwsozualtmtmzi5ja/rss'
      const expected = 'bluesky:posts'

      expect(blueskyHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return the posts key for a handle with percent-encoded spaces', () => {
      const value = 'https://bsky.app/profile/scienceslam.de%20%20/rss'
      const expected = 'bluesky:posts'

      expect(blueskyHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return undefined for a profile page', () => {
      const value = 'https://bsky.app/profile/astrea.cc'

      expect(blueskyHandler.getFeedKey?.(value)).toBeUndefined()
    })

    it('should return undefined for a post page', () => {
      const value = 'https://bsky.app/profile/astrea.cc/post/3mys5hihpoc2v'

      expect(blueskyHandler.getFeedKey?.(value)).toBeUndefined()
    })

    it('should return undefined for another host', () => {
      const value = 'https://example.com/profile/astrea.cc/rss'

      expect(blueskyHandler.getFeedKey?.(value)).toBeUndefined()
    })
  })

  describe('own feeds through the Platform method', () => {
    const ownFeeds: Array<[string, DiscoverUriHint]> = [
      ['https://bsky.app/profile/astrea.cc/rss', { key: 'bluesky:posts', label: 'Posts' }],
      [
        'https://bsky.app/profile/did:plc:5qmh4a6gwsozualtmtmzi5ja/rss',
        { key: 'bluesky:posts', label: 'Posts' },
      ],
      [
        'https://web-cdn.bsky.app/profile/did:plc:5qmh4a6gwsozualtmtmzi5ja/rss',
        { key: 'bluesky:posts', label: 'Posts' },
      ],
      [
        'https://bsky.app/profile/scienceslam.de%20%20/rss',
        { key: 'bluesky:posts', label: 'Posts' },
      ],
    ]

    it.each(ownFeeds)('should return %s as itself', async (value, hint) => {
      const result = await discoverUrisFromPlatform(undefined, undefined, {
        ...defaultPlatformOptions,
        handlers: [blueskyHandler],
        baseUrl: value,
      })
      const expected: Array<DiscoverUriEntry> = [{ uri: value, hint }]

      expect(result).toEqual(expected)
    })
  })
})
