import { describe, expect, it } from 'bun:test'
import { isPhpbbHtml, phpbbHandler } from './phpbb.js'

const phpbbHtml = '<body id="phpbb" class="section-index">'
const otherHtml = '<body id="XF">'

describe('isPhpbbHtml', () => {
  it('should return true for the phpBB body id', () => {
    expect(isPhpbbHtml(phpbbHtml)).toBe(true)
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

    it('should not match without content', () => {
      expect(phpbbHandler.match('https://example.com/community/')).toBe(false)
    })

    it('should not match invalid URLs', () => {
      expect(phpbbHandler.match('not-a-url', phpbbHtml)).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should build the feed from a board mounted under a sub-path', () => {
      const value = 'https://example.com/community/'
      const expected = [
        {
          uri: 'https://example.com/community/feed.php',
          hint: { key: 'phpbb:site', label: 'Site' },
        },
      ]

      expect(phpbbHandler.resolve(value)).toEqual(expected)
    })

    it('should drop the script segment and add the forum feed', () => {
      const value = 'https://example.com/community/viewforum.php?f=12'
      const expected = [
        {
          uri: 'https://example.com/community/feed.php?f=12',
          hint: { key: 'phpbb:forum', label: 'Forum' },
        },
        {
          uri: 'https://example.com/community/feed.php',
          hint: { key: 'phpbb:site', label: 'Site' },
        },
      ]

      expect(phpbbHandler.resolve(value)).toEqual(expected)
    })

    it('should handle a board at the origin root', () => {
      const value = 'https://example.com/'
      const expected = [
        { uri: 'https://example.com/feed.php', hint: { key: 'phpbb:site', label: 'Site' } },
      ]

      expect(phpbbHandler.resolve(value)).toEqual(expected)
    })

    it('should return an empty array for invalid URLs', () => {
      expect(phpbbHandler.resolve('not-a-url')).toEqual([])
    })
  })
})
