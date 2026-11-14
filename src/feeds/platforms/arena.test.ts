import { describe, expect, it } from 'bun:test'
import type { ArenaUrl } from './arena.js'
import { arenaHandler, parseArenaUrl } from './arena.js'

describe('parseArenaUrl', () => {
  const profileViewValues: Array<string> = [
    'https://www.are.na/bob-jones/followers',
    'https://www.are.na/bob-jones/Following',
    'https://www.are.na/bob-jones/channels',
    'https://www.are.na/bob-jones/blocks',
    'https://www.are.na/bob-jones/table',
  ]

  it.each(profileViewValues)('should return the profile for the profile view %s', (value) => {
    const expected: ArenaUrl = { kind: 'profile', username: 'bob-jones' }

    expect(parseArenaUrl(value)).toEqual(expected)
  })

  it('should return the profile for a profile page', () => {
    const expected: ArenaUrl = { kind: 'profile', username: 'alice-smith' }

    expect(parseArenaUrl('https://www.are.na/alice-smith')).toEqual(expected)
  })

  it('should return the profile for the host without www', () => {
    const expected: ArenaUrl = { kind: 'profile', username: 'alice-smith' }

    expect(parseArenaUrl('https://are.na/alice-smith')).toEqual(expected)
  })

  it('should return the channel for a channel page', () => {
    const expected: ArenaUrl = {
      kind: 'channel',
      username: 'bob-jones',
      channel: 'good-sign-offs',
    }

    expect(parseArenaUrl('https://www.are.na/bob-jones/good-sign-offs')).toEqual(expected)
  })

  it('should return the channel for a channel subpage', () => {
    const expected: ArenaUrl = {
      kind: 'channel',
      username: 'bob-jones',
      channel: 'good-sign-offs',
    }

    expect(parseArenaUrl('https://www.are.na/bob-jones/good-sign-offs/table')).toEqual(expected)
  })

  it('should return the profile for the profile feed URL', () => {
    const expected: ArenaUrl = { kind: 'profile', username: 'bob-jones' }

    expect(parseArenaUrl('https://www.are.na/bob-jones/feed/rss')).toEqual(expected)
  })

  it('should return the profile for the profile feed URL with a capitalized feed segment', () => {
    const expected: ArenaUrl = { kind: 'profile', username: 'bob-jones' }

    expect(parseArenaUrl('https://www.are.na/bob-jones/Feed/rss')).toEqual(expected)
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
    expect(parseArenaUrl('https://example.com/alice-smith')).toBeUndefined()
  })

  it('should return undefined for an invalid URL', () => {
    expect(parseArenaUrl('not-a-url')).toBeUndefined()
  })
})

describe('arenaHandler', () => {
  describe('match', () => {
    it('should match an Are.na profile URL', () => {
      expect(arenaHandler.match('https://are.na/bob-jones')).toBe(true)
    })

    it('should not match other hosts', () => {
      expect(arenaHandler.match('https://example.com')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return feed URL for user profile', () => {
      const value = 'https://www.are.na/alice-smith'
      const expected = [
        {
          uri: 'https://www.are.na/alice-smith/feed/rss',
          hint: { key: 'arena:profile', label: 'Profile' },
        },
      ]

      expect(arenaHandler.resolve(value)).toEqual(expected)
    })

    it('should return feed URL for channel', () => {
      const value = 'https://www.are.na/bob-jones/good-sign-offs'
      const expected = [
        {
          uri: 'https://www.are.na/bob-jones/good-sign-offs/feed/rss',
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
  })
})
