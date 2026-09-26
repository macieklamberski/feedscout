import { describe, expect, it } from 'bun:test'
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
})
