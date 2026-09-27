import { describe, expect, it } from 'bun:test'
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

  it('should return undefined for site routes', () => {
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
})
