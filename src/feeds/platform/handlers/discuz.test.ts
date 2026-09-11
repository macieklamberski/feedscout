import { describe, expect, it } from 'bun:test'
import { discuzHandler, isDiscuzHtml } from './discuz.js'

const discuzHtml = '<meta name="generator" content="Discuz! X3.4" />'
const otherHtml = '<meta name="generator" content="phpBB">'

describe('isDiscuzHtml', () => {
  it('should return true for the Discuz generator meta tag', () => {
    expect(isDiscuzHtml(discuzHtml)).toBe(true)
  })

  it('should return false for another forum platform', () => {
    expect(isDiscuzHtml(otherHtml)).toBe(false)
  })

  it('should return false for empty content', () => {
    expect(isDiscuzHtml('')).toBe(false)
  })
})

describe('discuzHandler', () => {
  describe('match', () => {
    it('should match a Discuz page', () => {
      expect(discuzHandler.match('https://example.com/forum-22-1.html', discuzHtml)).toBe(true)
    })

    it('should not match without content', () => {
      expect(discuzHandler.match('https://example.com/forum-22-1.html')).toBe(false)
    })

    it('should not match invalid URLs', () => {
      expect(discuzHandler.match('not-a-url', discuzHtml)).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return the board and site feeds for a board path', () => {
      const value = 'https://example.com/forum-22-1.html'
      const expected = [
        {
          uri: 'https://example.com/forum.php?mod=rss&fid=22',
          hint: { key: 'discuz:board', label: 'Board' },
        },
        {
          uri: 'https://example.com/forum.php?mod=rss',
          hint: { key: 'discuz:site', label: 'Site' },
        },
      ]

      expect(discuzHandler.resolve(value)).toEqual(expected)
    })

    it('should read the board id from a query parameter', () => {
      const value = 'https://example.com/forum.php?mod=forumdisplay&fid=45'
      const expected = [
        {
          uri: 'https://example.com/forum.php?mod=rss&fid=45',
          hint: { key: 'discuz:board', label: 'Board' },
        },
        {
          uri: 'https://example.com/forum.php?mod=rss',
          hint: { key: 'discuz:site', label: 'Site' },
        },
      ]

      expect(discuzHandler.resolve(value)).toEqual(expected)
    })

    it('should return only the site feed without a board id', () => {
      const value = 'https://example.com/'
      const expected = [
        {
          uri: 'https://example.com/forum.php?mod=rss',
          hint: { key: 'discuz:site', label: 'Site' },
        },
      ]

      expect(discuzHandler.resolve(value)).toEqual(expected)
    })

    it('should return an empty array for invalid URLs', () => {
      expect(discuzHandler.resolve('not-a-url')).toEqual([])
    })
  })
})
