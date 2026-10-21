import { describe, expect, it } from 'bun:test'
import { type FirstoryPage, firstoryHandler, getFirstoryPage } from './firstory.js'

describe('getFirstoryPage', () => {
  const content = '<a href="https://feed.firstory.me/rss/user/ckabcdefgh0123456789klmno">RSS</a>'

  it('should return the cuid of a show page', () => {
    const value = 'https://open.firstory.me/user/example'
    const expected: FirstoryPage = { kind: 'show', cuid: 'ckabcdefgh0123456789klmno' }

    expect(getFirstoryPage(value, content)).toEqual(expected)
  })

  it('should return the cuid of a firstory.cc page', () => {
    const value = 'https://example.firstory.cc/'
    const expected: FirstoryPage = { kind: 'show', cuid: 'ckabcdefgh0123456789klmno' }

    expect(getFirstoryPage(value, content)).toEqual(expected)
  })

  it('should return undefined without content', () => {
    expect(getFirstoryPage('https://open.firstory.me/user/example', undefined)).toBeUndefined()
  })

  it('should return undefined for another host', () => {
    expect(getFirstoryPage('https://example.com/user/example', content)).toBeUndefined()
  })

  it('should return undefined for the bare firstory.cc host', () => {
    expect(getFirstoryPage('https://firstory.cc/', content)).toBeUndefined()
  })
})

describe('firstoryHandler', () => {
  const content =
    '<a href="https://feed.firstory.me/rss/user/ckabcdefgh0123456789klmno" target="_blank">RSS</a>'

  describe('match', () => {
    const values: Array<[boolean, string]> = [
      [true, 'https://open.firstory.me/user/example'],
      [true, 'https://open.firstory.fm/user/example'],
      [true, 'https://open.firstory.fm/story/cmabcdefgh0123456789klmno'],
      [true, 'https://example.firstory.cc/'],
      [true, 'https://example.firstory.cc/episodes/cmabcdefgh0123456789klmno'],
      [false, 'https://firstory.cc/'],
      [false, 'https://firstory.me/'],
      [false, 'https://example.com/user/example'],
    ]

    it.each(values)('should return %s for %s', (expected, url) => {
      expect(firstoryHandler.match(url, content)).toBe(expected)
    })

    it('should return false for page without feed link', () => {
      expect(firstoryHandler.match('https://open.firstory.fm/browse', '<html></html>')).toBe(false)
    })

    it('should return false when no content provided', () => {
      expect(firstoryHandler.match('https://open.firstory.fm/user/example')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return feed URL read from the page', () => {
      const value = 'https://open.firstory.fm/user/example'
      const expected = [
        {
          uri: 'https://feed.firstory.me/rss/user/ckabcdefgh0123456789klmno',
          hint: { key: 'firstory:podcast', label: 'Podcast' },
        },
      ]

      expect(firstoryHandler.resolve(value, content)).toEqual(expected)
    })

    it('should return empty array when no content provided', () => {
      expect(firstoryHandler.resolve('https://open.firstory.fm/user/example')).toEqual([])
    })
  })
})
