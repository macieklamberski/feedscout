import { describe, expect, it } from 'bun:test'
import { type DiscuzUrl, discuzHandler, isDiscuzHtml, parseDiscuzUrl } from './discuz.js'

const discuzHtml = '<meta name="generator" content="Discuz! X3.4" />'
const otherHtml = '<meta name="generator" content="phpBB">'
const discuz7Html = '<meta name="generator" content="Discuz! 7.2" />'
const discuz7ArchiverHtml = '<meta name="generator" content="Discuz! Archiver 7.2" />'
const discuz6Html = '<meta name="generator" content="Discuz! 6.1.0" />'
const discuz5Html = '<meta name="generator" content="Discuz! 5.5.0 with Templates 5.5.0" />'

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

  it('should return the board from an archiver query key', () => {
    const expected: DiscuzUrl = { kind: 'board', boardId: '22' }

    expect(parseDiscuzUrl('https://bbs.example.com/archiver/?fid-22.html')).toEqual(expected)
  })

  it('should return the board from a rewritten archiver path', () => {
    const expected: DiscuzUrl = { kind: 'board', boardId: '22' }

    expect(parseDiscuzUrl('https://example.com/forum/archiver/fid-22.html?page=2')).toEqual(
      expected,
    )
  })

  it('should return the site for an archiver thread', () => {
    const expected: DiscuzUrl = { kind: 'site' }

    expect(parseDiscuzUrl('https://bbs.example.com/archiver/?tid-123.html')).toEqual(expected)
  })

  it('should return the site for a fid- page outside the archiver', () => {
    const expected: DiscuzUrl = { kind: 'site' }

    expect(parseDiscuzUrl('https://bbs.example.com/fid-22.html')).toEqual(expected)
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
          uri: 'https://example.com/forum.php?mod=rss&fid=22&auth=0',
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
          uri: 'https://example.com/forum.php?mod=rss&fid=22&auth=0',
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
          uri: 'https://example.com/forum.php?mod=rss&fid=45&auth=0',
          hint: { key: 'discuz:board', label: 'Board' },
        },
        {
          uri: 'https://example.com/forum.php?mod=rss',
          hint: { key: 'discuz:site', label: 'Site' },
        },
      ]

      expect(discuzHandler.resolve(value)).toEqual(expected)
    })

    it('should return the forum.php feeds for a Discuz! X page', () => {
      const value = 'https://example.com/forum.php?mod=forumdisplay&fid=45'
      const expected = [
        {
          uri: 'https://example.com/forum.php?mod=rss&fid=45&auth=0',
          hint: { key: 'discuz:board', label: 'Board' },
        },
        {
          uri: 'https://example.com/forum.php?mod=rss',
          hint: { key: 'discuz:site', label: 'Site' },
        },
      ]

      expect(discuzHandler.resolve(value, discuzHtml)).toEqual(expected)
    })

    it('should return the forum.php feeds from a Discuz! X install directory', () => {
      const value = 'https://example.com/forum/forum-32-1.html'
      const expected = [
        {
          uri: 'https://example.com/forum/forum.php?mod=rss&fid=32&auth=0',
          hint: { key: 'discuz:board', label: 'Board' },
        },
        {
          uri: 'https://example.com/forum/forum.php?mod=rss',
          hint: { key: 'discuz:site', label: 'Site' },
        },
      ]

      expect(discuzHandler.resolve(value, discuzHtml)).toEqual(expected)
    })

    it('should return the forum.php site feed for a Discuz! X install root', () => {
      const value = 'https://example.com/forum/'
      const expected = [
        {
          uri: 'https://example.com/forum/forum.php?mod=rss',
          hint: { key: 'discuz:site', label: 'Site' },
        },
      ]

      expect(discuzHandler.resolve(value, discuzHtml)).toEqual(expected)
    })

    it('should return the forum.php site feed from a Discuz! X archiver page', () => {
      const value = 'https://example.com/forum/archiver/?tid-123.html'
      const expected = [
        {
          uri: 'https://example.com/forum/forum.php?mod=rss',
          hint: { key: 'discuz:site', label: 'Site' },
        },
      ]

      expect(discuzHandler.resolve(value, discuzHtml)).toEqual(expected)
    })

    it('should return the forum.php feeds from a Discuz! X archiver board page', () => {
      const value = 'https://example.com/forum/archiver/?fid-32.html'
      const expected = [
        {
          uri: 'https://example.com/forum/forum.php?mod=rss&fid=32&auth=0',
          hint: { key: 'discuz:board', label: 'Board' },
        },
        {
          uri: 'https://example.com/forum/forum.php?mod=rss',
          hint: { key: 'discuz:site', label: 'Site' },
        },
      ]

      expect(discuzHandler.resolve(value, discuzHtml)).toEqual(expected)
    })

    it('should return the rss.php site feed from a Discuz! 7 archiver page', () => {
      const value = 'http://example.com/archiver/'
      const expected = [
        {
          uri: 'http://example.com/rss.php?auth=0',
          hint: { key: 'discuz:site', label: 'Site' },
        },
      ]

      expect(discuzHandler.resolve(value, discuz7ArchiverHtml)).toEqual(expected)
    })

    it('should return the rss.php feeds from a Discuz! 7 archiver board page', () => {
      const value = 'http://example.com/bbs/archiver/?fid-113.html'
      const expected = [
        {
          uri: 'http://example.com/bbs/rss.php?fid=113&auth=0',
          hint: { key: 'discuz:board', label: 'Board' },
        },
        {
          uri: 'http://example.com/bbs/rss.php?auth=0',
          hint: { key: 'discuz:site', label: 'Site' },
        },
      ]

      expect(discuzHandler.resolve(value, discuz7ArchiverHtml)).toEqual(expected)
    })

    it('should return the rss.php feeds for a Discuz! 7 board page', () => {
      const value = 'http://example.com/forumdisplay.php?fid=113'
      const expected = [
        {
          uri: 'http://example.com/rss.php?fid=113&auth=0',
          hint: { key: 'discuz:board', label: 'Board' },
        },
        {
          uri: 'http://example.com/rss.php?auth=0',
          hint: { key: 'discuz:site', label: 'Site' },
        },
      ]

      expect(discuzHandler.resolve(value, discuz7Html)).toEqual(expected)
    })

    it('should return the rss.php site feed for a Discuz! 7 thread page', () => {
      const value = 'http://example.com/viewthread.php?tid=187'
      const expected = [
        {
          uri: 'http://example.com/rss.php?auth=0',
          hint: { key: 'discuz:site', label: 'Site' },
        },
      ]

      expect(discuzHandler.resolve(value, discuz7Html)).toEqual(expected)
    })

    it('should return the rss.php feeds for a Discuz! 6 board page', () => {
      const value = 'http://example.com/forumdisplay.php?fid=6'
      const expected = [
        {
          uri: 'http://example.com/rss.php?fid=6&auth=0',
          hint: { key: 'discuz:board', label: 'Board' },
        },
        {
          uri: 'http://example.com/rss.php?auth=0',
          hint: { key: 'discuz:site', label: 'Site' },
        },
      ]

      expect(discuzHandler.resolve(value, discuz6Html)).toEqual(expected)
    })

    it('should return the rss.php feeds for a Discuz! 5 board page', () => {
      const value = 'http://example.com/bbs/forumdisplay.php?fid=27'
      const expected = [
        {
          uri: 'http://example.com/bbs/rss.php?fid=27&auth=0',
          hint: { key: 'discuz:board', label: 'Board' },
        },
        {
          uri: 'http://example.com/bbs/rss.php?auth=0',
          hint: { key: 'discuz:site', label: 'Site' },
        },
      ]

      expect(discuzHandler.resolve(value, discuz5Html)).toEqual(expected)
    })

    it('should return the rss.php feeds from a Discuz! 7 install directory', () => {
      const value = 'http://example.com/bbs/forumdisplay.php?fid=6'
      const expected = [
        {
          uri: 'http://example.com/bbs/rss.php?fid=6&auth=0',
          hint: { key: 'discuz:board', label: 'Board' },
        },
        {
          uri: 'http://example.com/bbs/rss.php?auth=0',
          hint: { key: 'discuz:site', label: 'Site' },
        },
      ]

      expect(discuzHandler.resolve(value, discuz7Html)).toEqual(expected)
    })

    it('should return the rss.php site feed for a Discuz! 7 install root', () => {
      const value = 'http://example.com/bbs/'
      const expected = [
        {
          uri: 'http://example.com/bbs/rss.php?auth=0',
          hint: { key: 'discuz:site', label: 'Site' },
        },
      ]

      expect(discuzHandler.resolve(value, discuz7Html)).toEqual(expected)
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
