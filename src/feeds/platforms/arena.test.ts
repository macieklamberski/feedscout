import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry, DiscoverUriHint } from '../../common/types.js'
import { discoverUrisFromPlatform } from '../../common/uris/platform/index.js'
import { defaultPlatformOptions } from '../defaults.js'
import type { ArenaUrl } from './arena.js'
import { arenaHandler, parseArenaUrl } from './arena.js'

describe('parseArenaUrl', () => {
  const profileViewValues: Array<string> = [
    'https://www.are.na/meg-miller/followers',
    'https://www.are.na/meg-miller/Following',
    'https://www.are.na/meg-miller/channels',
    'https://www.are.na/meg-miller/blocks',
    'https://www.are.na/meg-miller/table',
  ]

  it.each(profileViewValues)('should return the profile for the profile view %s', (value) => {
    const expected: ArenaUrl = { kind: 'profile', username: 'meg-miller' }

    expect(parseArenaUrl(value)).toEqual(expected)
  })

  it('should return the profile for a profile page', () => {
    const expected: ArenaUrl = { kind: 'profile', username: 'charles-broskoski' }

    expect(parseArenaUrl('https://www.are.na/charles-broskoski')).toEqual(expected)
  })

  it('should return the profile for the host without www', () => {
    const expected: ArenaUrl = { kind: 'profile', username: 'charles-broskoski' }

    expect(parseArenaUrl('https://are.na/charles-broskoski')).toEqual(expected)
  })

  it('should return the channel for a channel page', () => {
    const expected: ArenaUrl = {
      kind: 'channel',
      username: 'meg-miller',
      channel: 'good-sign-offs',
    }

    expect(parseArenaUrl('https://www.are.na/meg-miller/good-sign-offs')).toEqual(expected)
  })

  it('should return the channel for a channel subpage', () => {
    const expected: ArenaUrl = {
      kind: 'channel',
      username: 'meg-miller',
      channel: 'good-sign-offs',
    }

    expect(parseArenaUrl('https://www.are.na/meg-miller/good-sign-offs/table')).toEqual(expected)
  })

  it('should return the profile for the profile feed URL', () => {
    const expected: ArenaUrl = { kind: 'profile', username: 'meg-miller' }

    expect(parseArenaUrl('https://www.are.na/meg-miller/feed/rss')).toEqual(expected)
  })

  it('should return the profile for the profile feed URL with a capitalized feed segment', () => {
    const expected: ArenaUrl = { kind: 'profile', username: 'meg-miller' }

    expect(parseArenaUrl('https://www.are.na/meg-miller/Feed/rss')).toEqual(expected)
  })

  it('should return the editorial section', () => {
    const expected: ArenaUrl = { kind: 'editorial' }

    expect(parseArenaUrl('https://www.are.na/editorial')).toEqual(expected)
  })

  it('should return the editorial section for an editorial article', () => {
    const expected: ArenaUrl = { kind: 'editorial' }

    expect(parseArenaUrl('https://www.are.na/Editorial/learning-to-float')).toEqual(expected)
  })

  it('should return undefined for the homepage', () => {
    expect(parseArenaUrl('https://www.are.na')).toBeUndefined()
    expect(parseArenaUrl('https://www.are.na/')).toBeUndefined()
  })

  it('should return undefined for another host', () => {
    expect(parseArenaUrl('https://example.com/charles-broskoski')).toBeUndefined()
  })

  it('should return undefined for an invalid URL', () => {
    expect(parseArenaUrl('not-a-url')).toBeUndefined()
  })
})

describe('arenaHandler', () => {
  describe('match', () => {
    it('should match an Are.na profile URL', () => {
      expect(arenaHandler.match('https://are.na/meg-miller')).toBe(true)
    })

    it('should not match other hosts', () => {
      expect(arenaHandler.match('https://example.com')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return feed URL for user profile', () => {
      const value = 'https://www.are.na/charles-broskoski'
      const expected = [
        {
          uri: 'https://www.are.na/charles-broskoski/feed/rss',
          hint: { key: 'arena:profile', label: 'Profile' },
        },
      ]

      expect(arenaHandler.resolve(value)).toEqual(expected)
    })

    it('should return feed URL for channel', () => {
      const value = 'https://www.are.na/meg-miller/good-sign-offs'
      const expected = [
        {
          uri: 'https://www.are.na/meg-miller/good-sign-offs/feed/rss',
          hint: { key: 'arena:channel', label: 'Channel' },
        },
      ]

      expect(arenaHandler.resolve(value)).toEqual(expected)
    })

    it('should return editorial feed for the editorial section', () => {
      const value = 'https://www.are.na/editorial'
      const expected = [
        {
          uri: 'https://www.are.na/editorial/feed/rss',
          hint: { key: 'arena:editorial', label: 'Editorial' },
        },
      ]

      expect(arenaHandler.resolve(value)).toEqual(expected)
    })

    it('should return editorial feed for the editorial section with a capitalized editorial segment', () => {
      const value = 'https://www.are.na/Editorial'
      const expected = [
        {
          uri: 'https://www.are.na/editorial/feed/rss',
          hint: { key: 'arena:editorial', label: 'Editorial' },
        },
      ]

      expect(arenaHandler.resolve(value)).toEqual(expected)
    })

    it('should return editorial feed for an editorial article', () => {
      const value = 'https://www.are.na/editorial/learning-to-float'
      const expected = [
        {
          uri: 'https://www.are.na/editorial/feed/rss',
          hint: { key: 'arena:editorial', label: 'Editorial' },
        },
      ]

      expect(arenaHandler.resolve(value)).toEqual(expected)
    })

    it('should return no feeds for the homepage', () => {
      const value = 'https://www.are.na/'
      const expected: Array<DiscoverUriEntry> = []

      expect(arenaHandler.resolve(value)).toEqual(expected)
    })
  })

  describe('getFeedHint', () => {
    it('should return the profile key for a profile feed', () => {
      const value = 'https://www.are.na/alice/feed/rss'
      const expected: DiscoverUriHint = { key: 'arena:profile', label: 'Profile' }

      expect(arenaHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the channel key for a channel feed', () => {
      const value = 'https://www.are.na/carol/typefaces-x1y2z3a4b5/feed/rss'
      const expected: DiscoverUriHint = { key: 'arena:channel', label: 'Channel' }

      expect(arenaHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the editorial key for the editorial feed', () => {
      const value = 'https://www.are.na/editorial/feed/rss'
      const expected: DiscoverUriHint = { key: 'arena:editorial', label: 'Editorial' }

      expect(arenaHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the editorial key for the editorial feed with a capitalized route', () => {
      const value = 'https://www.are.na/Editorial/Feed/RSS'
      const expected: DiscoverUriHint = { key: 'arena:editorial', label: 'Editorial' }

      expect(arenaHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the profile key for a profile feed on the host without www', () => {
      const value = 'https://are.na/alice/feed/rss'
      const expected: DiscoverUriHint = { key: 'arena:profile', label: 'Profile' }

      expect(arenaHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the channel key for a channel feed over http with a trailing slash', () => {
      const value = 'http://www.are.na/bob/reading-notes/feed/rss/'
      const expected: DiscoverUriHint = { key: 'arena:channel', label: 'Channel' }

      expect(arenaHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return undefined for a profile page', () => {
      const value = 'https://www.are.na/alice'

      expect(arenaHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for a channel page', () => {
      const value = 'https://www.are.na/bob/reading-notes'

      expect(arenaHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for an editorial article', () => {
      const value = 'https://www.are.na/editorial/learning-to-float'

      expect(arenaHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for another host', () => {
      const value = 'https://example.com/alice/feed/rss'

      expect(arenaHandler.getFeedHint?.(value)).toBeUndefined()
    })
  })

  describe('own feeds through the Platform method', () => {
    const ownFeeds: Array<[string, DiscoverUriHint]> = [
      ['https://www.are.na/alice/feed/rss', { key: 'arena:profile', label: 'Profile' }],
      ['https://www.are.na/bob/reading-notes/feed/rss', { key: 'arena:channel', label: 'Channel' }],
      ['https://www.are.na/editorial/feed/rss', { key: 'arena:editorial', label: 'Editorial' }],
      ['http://are.na/jane-artist/feed/rss/', { key: 'arena:profile', label: 'Profile' }],
      [
        'https://are.na/jane-artist/reading-list/feed/rss/',
        { key: 'arena:channel', label: 'Channel' },
      ],
      ['http://are.na/editorial/feed/rss/', { key: 'arena:editorial', label: 'Editorial' }],
    ]

    it.each(ownFeeds)('should return %s as itself', async (value, hint) => {
      const result = await discoverUrisFromPlatform(undefined, undefined, {
        ...defaultPlatformOptions,
        handlers: [arenaHandler],
        baseUrl: value,
      })
      const expected: Array<DiscoverUriEntry> = [{ uri: value, hint }]

      expect(result).toEqual(expected)
    })
  })
})
