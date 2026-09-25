import { describe, expect, it } from 'bun:test'
import { isPhpbbHtml, phpbbHandler } from './phpbb.js'

const phpbbHtml = '<body id="phpbb" class="section-index">'
const otherHtml = '<body id="XF">'

describe('isPhpbbHtml', () => {
  it('should return true for the phpBB body id', () => {
    expect(isPhpbbHtml(phpbbHtml)).toBe(true)
  })

  it('should return true for an unquoted phpBB body id', () => {
    expect(isPhpbbHtml('<body id=phpbb>')).toBe(true)
  })

  it('should return false for another forum platform', () => {
    expect(isPhpbbHtml(otherHtml)).toBe(false)
  })

  it('should return false for empty content', () => {
    expect(isPhpbbHtml('')).toBe(false)
  })
})

describe('phpbbHandler', () => {
  describe('match', () => {
    it('should match a phpBB page', () => {
      expect(phpbbHandler.match('https://example.com/community/', phpbbHtml)).toBe(true)
    })

    it('should match a themed board by its session cookies', () => {
      const value = 'https://example.com/community/'
      const headers = new Headers()
      headers.append('set-cookie', 'phpbb3_7ybyg_can_u=1; path=/')
      headers.append('set-cookie', 'phpbb3_7ybyg_can_k=; path=/')
      headers.append('set-cookie', 'phpbb3_7ybyg_can_sid=abc; path=/')

      expect(phpbbHandler.match(value, '<html></html>', headers)).toBe(true)
    })

    it('should not match a lone session id cookie', () => {
      const value = 'https://example.com/community/'
      const headers = new Headers({ 'set-cookie': 'app_sid=abc; path=/' })

      expect(phpbbHandler.match(value, '<html></html>', headers)).toBe(false)
    })

    it('should not match without content', () => {
      expect(phpbbHandler.match('https://example.com/community/')).toBe(false)
    })

    it('should not match invalid URLs', () => {
      expect(phpbbHandler.match('not-a-url', phpbbHtml)).toBe(false)
    })
  })

  describe('resolve', () => {
    const getBoardFeeds = (boardUrl: string) => {
      return [
        { uri: `${boardUrl}/feed.php`, hint: { key: 'phpbb:site', label: 'Site' } },
        { uri: `${boardUrl}/feed.php?mode=news`, hint: { key: 'phpbb:news', label: 'News' } },
        {
          uri: `${boardUrl}/feed.php?mode=topics`,
          hint: { key: 'phpbb:new-topics', label: 'New topics' },
        },
        {
          uri: `${boardUrl}/feed.php?mode=topics_active`,
          hint: { key: 'phpbb:active-topics', label: 'Active topics' },
        },
        { uri: `${boardUrl}/feed.php?mode=forums`, hint: { key: 'phpbb:forums', label: 'Forums' } },
      ]
    }

    it('should build the board feeds from a board mounted under a sub-path', () => {
      expect(phpbbHandler.resolve('https://example.com/community/')).toEqual(
        getBoardFeeds('https://example.com/community'),
      )
    })

    it('should drop the script segment and add the forum feed', () => {
      const value = 'https://example.com/community/viewforum.php?f=12'
      const expected = [
        {
          uri: 'https://example.com/community/feed.php?f=12',
          hint: { key: 'phpbb:forum', label: 'Forum' },
        },
        ...getBoardFeeds('https://example.com/community'),
      ]

      expect(phpbbHandler.resolve(value)).toEqual(expected)
    })

    it('should add the topic feed before the forum feed', () => {
      const value = 'https://example.com/community/viewtopic.php?f=12&t=345'
      const expected = [
        {
          uri: 'https://example.com/community/feed.php?t=345',
          hint: { key: 'phpbb:topic', label: 'Topic' },
        },
        {
          uri: 'https://example.com/community/feed.php?f=12',
          hint: { key: 'phpbb:forum', label: 'Forum' },
        },
        ...getBoardFeeds('https://example.com/community'),
      ]

      expect(phpbbHandler.resolve(value)).toEqual(expected)
    })

    it('should handle a board at the origin root', () => {
      const expected = getBoardFeeds('https://example.com')

      expect(phpbbHandler.resolve('https://example.com/')).toEqual(expected)
    })
  })
})
