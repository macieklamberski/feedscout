import { describe, expect, it } from 'bun:test'
import { type DiscuzUrl, discuzHandler, isDiscuzHtml, parseDiscuzUrl } from './discuz.js'

const discuzHtml = '<meta name="generator" content="Discuz! X3.4" />'
const otherHtml = '<meta name="generator" content="phpBB">'

describe('parseDiscuzUrl', () => {
  it('should return the board from the fid query', () => {
    const expected: DiscuzUrl = { kind: 'board', boardId: '22' }

    expect(parseDiscuzUrl('https://bbs.example.com/forum.php?mod=forumdisplay&fid=22')).toEqual(
      expected,
    )
  })

  it('should return the board from a rewritten path', () => {
    const expected: DiscuzUrl = { kind: 'board', boardId: '22' }

    expect(parseDiscuzUrl('https://bbs.example.com/forum-22-1.html')).toEqual(expected)
  })

  it('should return the site for a page without a board', () => {
    const expected: DiscuzUrl = { kind: 'site' }

    expect(parseDiscuzUrl('https://bbs.example.com/')).toEqual(expected)
  })

  it('should return the site for a non-numeric fid', () => {
    const expected: DiscuzUrl = { kind: 'site' }

    expect(parseDiscuzUrl('https://bbs.example.com/forum.php?fid=abc')).toEqual(expected)
  })
})

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

    it('should match an install without the generator by the salt key cookie', () => {
      const value = 'https://example.com/forum-22-1.html'
      const headers = new Headers({ 'set-cookie': 'K1VB_e732_saltkey=abc; path=/; HttpOnly' })

      expect(discuzHandler.match(value, '<html></html>', headers)).toBe(true)
    })

    it('should not match a cookie that only contains the salt key suffix', () => {
      const value = 'https://example.com/forum-22-1.html'
      const headers = new Headers({ 'set-cookie': 'session=a_saltkey; path=/' })

      expect(discuzHandler.match(value, '<html></html>', headers)).toBe(false)
    })

    it('should not match without content', () => {
      expect(discuzHandler.match('https://example.com/forum-22-1.html')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return empty array for a URL that does not parse', () => {
      expect(discuzHandler.resolve('not-a-url')).toEqual([])
    })

    it('should return the board and site feeds for a capitalized forum segment', () => {
      const value = 'https://example.com/Forum-22-1.html'
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
  })
})
