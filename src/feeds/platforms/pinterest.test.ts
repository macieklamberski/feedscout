import { describe, expect, it } from 'bun:test'
import type { PinterestUrl } from './pinterest.js'
import { parsePinterestUrl, pinterestHandler } from './pinterest.js'

describe('parsePinterestUrl', () => {
  it('should return the user for a profile page', () => {
    const expected: PinterestUrl = { kind: 'user', username: 'nasa' }

    expect(parsePinterestUrl('https://www.pinterest.com/nasa')).toEqual(expected)
  })

  it('should return the user for a trailing slash', () => {
    const expected: PinterestUrl = { kind: 'user', username: 'nasa' }

    expect(parsePinterestUrl('https://www.pinterest.com/nasa/')).toEqual(expected)
  })

  it('should return the user for the bare host', () => {
    const expected: PinterestUrl = { kind: 'user', username: 'nasa' }

    expect(parsePinterestUrl('https://pinterest.com/nasa')).toEqual(expected)
  })

  it('should return the user for user subpages', () => {
    const expected: PinterestUrl = { kind: 'user', username: 'nasa' }

    expect(parsePinterestUrl('https://www.pinterest.com/nasa/pins')).toEqual(expected)
    expect(parsePinterestUrl('https://www.pinterest.com/nasa/boards')).toEqual(expected)
    expect(parsePinterestUrl('https://www.pinterest.com/nasa/_saved')).toEqual(expected)
    expect(parsePinterestUrl('https://www.pinterest.com/nasa/_created')).toEqual(expected)
    expect(parsePinterestUrl('https://www.pinterest.com/nasa/followers')).toEqual(expected)
    expect(parsePinterestUrl('https://www.pinterest.com/nasa/following')).toEqual(expected)
  })

  it('should return the user for a user subpage in any case', () => {
    const expected: PinterestUrl = { kind: 'user', username: 'nasa' }

    expect(parsePinterestUrl('https://www.pinterest.com/nasa/Pins')).toEqual(expected)
  })

  it('should return the board for a board page', () => {
    const expected: PinterestUrl = { kind: 'board', username: 'nasa', board: 'mars' }

    expect(parsePinterestUrl('https://www.pinterest.com/nasa/mars')).toEqual(expected)
  })

  it('should return the board for a board with trailing slash', () => {
    const value = 'https://www.pinterest.com/nasa/space-exploration/'
    const expected: PinterestUrl = { kind: 'board', username: 'nasa', board: 'space-exploration' }

    expect(parsePinterestUrl(value)).toEqual(expected)
  })

  it('should return the board for a board section', () => {
    const value = 'https://www.pinterest.com/nasa/mars/rovers'
    const expected: PinterestUrl = { kind: 'board', username: 'nasa', board: 'mars' }

    expect(parsePinterestUrl(value)).toEqual(expected)
  })

  it('should return undefined for excluded paths', () => {
    expect(parsePinterestUrl('https://www.pinterest.com/search/pins')).toBeUndefined()
    expect(parsePinterestUrl('https://www.pinterest.com/ideas')).toBeUndefined()
    expect(parsePinterestUrl('https://www.pinterest.com/today')).toBeUndefined()
    expect(parsePinterestUrl('https://www.pinterest.com/explore')).toBeUndefined()
    expect(parsePinterestUrl('https://www.pinterest.com/_')).toBeUndefined()
    expect(parsePinterestUrl('https://www.pinterest.com/about')).toBeUndefined()
    expect(parsePinterestUrl('https://www.pinterest.com/business')).toBeUndefined()
    expect(parsePinterestUrl('https://www.pinterest.com/convert')).toBeUndefined()
    expect(parsePinterestUrl('https://www.pinterest.com/login')).toBeUndefined()
    expect(parsePinterestUrl('https://www.pinterest.com/news_hub')).toBeUndefined()
    expect(parsePinterestUrl('https://www.pinterest.com/password')).toBeUndefined()
    expect(parsePinterestUrl('https://www.pinterest.com/privacy')).toBeUndefined()
    expect(parsePinterestUrl('https://www.pinterest.com/resource')).toBeUndefined()
    expect(parsePinterestUrl('https://www.pinterest.com/settings')).toBeUndefined()
    expect(parsePinterestUrl('https://www.pinterest.com/terms')).toBeUndefined()
    expect(parsePinterestUrl('https://www.pinterest.com/topics')).toBeUndefined()
  })

  it('should return undefined for a pin page', () => {
    expect(parsePinterestUrl('https://www.pinterest.com/pin/123456789')).toBeUndefined()
  })

  it('should return undefined for the homepage', () => {
    expect(parsePinterestUrl('https://www.pinterest.com/')).toBeUndefined()
  })

  it('should return undefined for a pin.it short link', () => {
    expect(parsePinterestUrl('https://pin.it/abc123')).toBeUndefined()
  })

  it('should return undefined for another host', () => {
    expect(parsePinterestUrl('https://example.com/pinterest')).toBeUndefined()
  })

  it('should return undefined for an invalid URL', () => {
    expect(parsePinterestUrl('not-a-url')).toBeUndefined()
  })
})

describe('pinterestHandler', () => {
  describe('match', () => {
    it('should match a Pinterest URL', () => {
      expect(pinterestHandler.match('https://www.pinterest.com/nasa')).toBe(true)
    })

    it('should not match another host', () => {
      expect(pinterestHandler.match('https://example.com/pinterest')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return user feed for profile page', () => {
      const value = 'https://www.pinterest.com/nasa'
      const expected = [
        {
          uri: 'https://www.pinterest.com/nasa/feed.rss',
          hint: { key: 'pinterest:pins', label: 'Pins' },
        },
      ]

      expect(pinterestHandler.resolve(value)).toEqual(expected)
    })

    it('should return board feed for /{user}/{board}', () => {
      const value = 'https://www.pinterest.com/nasa/mars'
      const expected = [
        {
          uri: 'https://www.pinterest.com/nasa/mars.rss',
          hint: { key: 'pinterest:board', label: 'Board' },
        },
      ]

      expect(pinterestHandler.resolve(value)).toEqual(expected)
    })

    it('should return user feed for pins page', () => {
      const value = 'https://www.pinterest.com/nasa/pins'
      const expected = [
        {
          uri: 'https://www.pinterest.com/nasa/feed.rss',
          hint: { key: 'pinterest:pins', label: 'Pins' },
        },
      ]

      expect(pinterestHandler.resolve(value)).toEqual(expected)
    })

    it('should return empty array for excluded paths', () => {
      expect(pinterestHandler.resolve('https://www.pinterest.com/ideas')).toEqual([])
    })

    it('should return empty array for homepage', () => {
      const value = 'https://www.pinterest.com/'

      expect(pinterestHandler.resolve(value)).toEqual([])
    })
  })
})
