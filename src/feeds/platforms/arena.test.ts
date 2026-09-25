import { describe, expect, it } from 'bun:test'
import type { ArenaUrl } from './arena.js'
import { arenaHandler, parseArenaUrl } from './arena.js'

describe('parseArenaUrl', () => {
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

  it('should return undefined for excluded paths', () => {
    expect(parseArenaUrl('https://www.are.na/editorial')).toBeUndefined()
    expect(parseArenaUrl('https://www.are.na/explore')).toBeUndefined()
    expect(parseArenaUrl('https://www.are.na/settings')).toBeUndefined()
  })

  it('should return undefined for an excluded path in another case', () => {
    expect(parseArenaUrl('https://www.are.na/Explore')).toBeUndefined()
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
    it('should match any Are.na URL', () => {
      expect(arenaHandler.match('https://are.na')).toBe(true)
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

    it('should return empty array when the URL names no profile or channel', () => {
      expect(arenaHandler.resolve('https://www.are.na/explore')).toEqual([])
    })
  })
})
