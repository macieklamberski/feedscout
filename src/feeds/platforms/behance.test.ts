import { describe, expect, it } from 'bun:test'
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

  it('should return undefined for excluded paths', () => {
    expect(parseBehanceUrl('https://www.behance.net/search')).toBeUndefined()
    expect(parseBehanceUrl('https://www.behance.net/blog')).toBeUndefined()
    expect(parseBehanceUrl('https://www.behance.net/about')).toBeUndefined()
  })

  it('should return undefined for an excluded path in another case', () => {
    expect(parseBehanceUrl('https://www.behance.net/Search')).toBeUndefined()
  })

  it('should return undefined for other nested profile paths', () => {
    expect(parseBehanceUrl('https://www.behance.net/johndoe/projects')).toBeUndefined()
  })

  it('should return undefined for a gallery page', () => {
    expect(parseBehanceUrl('https://www.behance.net/gallery/123456/Brand-Identity')).toBeUndefined()
  })

  it('should return the home page', () => {
    const expected: BehanceUrl = { kind: 'home' }

    expect(parseBehanceUrl('https://www.behance.net/')).toEqual(expected)
  })

  it('should return the home page for the galleries page', () => {
    const expected: BehanceUrl = { kind: 'home' }

    expect(parseBehanceUrl('https://www.behance.net/Galleries/')).toEqual(expected)
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

    it('should return empty array when the URL names no profile', () => {
      expect(behanceHandler.resolve('https://www.behance.net/search')).toEqual([])
    })
  })
})
