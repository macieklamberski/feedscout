import { describe, expect, it } from 'bun:test'
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

  it('should lowercase the name', () => {
    const expected: DevtoUrl = { kind: 'profile', owner: 'alice' }

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

  it('should return undefined for an excluded path', () => {
    expect(parseDevtoUrl('https://dev.to/settings')).toBeUndefined()
  })

  it('should return undefined for an excluded path in another case', () => {
    expect(parseDevtoUrl('https://dev.to/Settings')).toBeUndefined()
  })

  it('should return the profile for a name that starts with an excluded path', () => {
    const expected: DevtoUrl = { kind: 'profile', owner: 'about_me' }

    expect(parseDevtoUrl('https://dev.to/about_me')).toEqual(expected)
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

  it('should return undefined for an API path', () => {
    expect(parseDevtoUrl('https://dev.to/api/articles')).toBeUndefined()
  })

  it('should return undefined for the listings path', () => {
    expect(parseDevtoUrl('https://dev.to/listings')).toBeUndefined()
  })

  it('should return undefined for a user feed', () => {
    expect(parseDevtoUrl('https://dev.to/feed/alice')).toBeUndefined()
  })

  it('should return undefined for a guide page', () => {
    expect(parseDevtoUrl('https://dev.to/p/editor_guide')).toBeUndefined()
  })

  it('should return undefined for the bare tag path', () => {
    expect(parseDevtoUrl('https://dev.to/t')).toBeUndefined()
  })

  it('should return undefined for the homepage', () => {
    expect(parseDevtoUrl('https://dev.to/')).toBeUndefined()
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

    it('should return latest feed for /latest with trailing slash', () => {
      const value = 'https://dev.to/latest/'
      const expected = [
        { uri: 'https://dev.to/feed/latest', hint: { key: 'devto:latest', label: 'Latest' } },
        { uri: 'https://dev.to/feed', hint: { key: 'devto:community', label: 'Community' } },
      ]

      expect(devtoHandler.resolve(value)).toEqual(expected)
    })

    it('should return empty array for an excluded path', () => {
      expect(devtoHandler.resolve('https://dev.to/settings')).toEqual([])
    })
  })
})
