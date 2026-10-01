import { describe, expect, it } from 'bun:test'
import { type AtyponUrl, atyponHandler, parseAtyponUrl } from './atypon.js'

describe('parseAtyponUrl', () => {
  it('should return the journal for a table of contents page', () => {
    const expected: AtyponUrl = { kind: 'journal', code: 'rjhr20', isWiley: false }

    expect(parseAtyponUrl('https://www.tandfonline.com/toc/rjhr20/current')).toEqual(expected)
  })

  it('should return the journal on Wiley', () => {
    const expected: AtyponUrl = { kind: 'journal', code: '15214095', isWiley: true }

    expect(parseAtyponUrl('https://onlinelibrary.wiley.com/journal/15214095')).toEqual(expected)
  })

  it('should return undefined for a page outside a journal', () => {
    expect(parseAtyponUrl('https://www.science.org/')).toBeUndefined()
  })

  it('should return undefined for another host', () => {
    expect(parseAtyponUrl('https://example.com/toc/rjhr20/current')).toBeUndefined()
  })
})

describe('atyponHandler', () => {
  describe('match', () => {
    const values: Array<[boolean, string]> = [
      [true, 'https://dl.acm.org/toc/tog/current'],
      [true, 'https://www.science.org/journal/science'],
      [true, 'https://www.tandfonline.com/loi/tprs20'],
      [true, 'https://onlinelibrary.wiley.com/toc/15406261/2025/80/1'],
      [true, 'https://www.nejm.org/TOC/evid/current'],
      [true, 'https://www.tandfonline.com/journals/tprs20'],
      [true, 'https://journals.sagepub.com/home/asr'],
      [false, 'https://dl.acm.org/doi/10.1145/3592433'],
      [false, 'https://dl.acm.org/toc/'],
      [false, 'https://dl.acm.org/journals'],
      [false, 'https://www.science.org'],
      [false, 'https://example.com/toc/tog/current'],
    ]

    it.each(values)('should return %s for %s', (expected, url) => {
      expect(atyponHandler.match(url)).toBe(expected)
    })

    it('should return false for invalid URL', () => {
      expect(atyponHandler.match('not-a-url')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return empty array for a URL outside the platform', () => {
      expect(atyponHandler.resolve('https://example.com/')).toEqual([])
    })

    it('should return journal feed for journal page', () => {
      const value = 'https://www.tandfonline.com/toc/tprs20/current'
      const expected = [
        {
          uri: 'https://www.tandfonline.com/action/showFeed?type=etoc&feed=rss&jc=tprs20',
          hint: { key: 'atypon:journal', label: 'Journal' },
        },
      ]

      expect(atyponHandler.resolve(value)).toEqual(expected)
    })

    it('should return journal and most cited feeds for Wiley journal page', () => {
      const value = 'https://onlinelibrary.wiley.com/journal/15406261'
      const expected = [
        {
          uri: 'https://onlinelibrary.wiley.com/action/showFeed?type=etoc&feed=rss&jc=15406261',
          hint: { key: 'atypon:journal', label: 'Journal' },
        },
        {
          uri: 'https://onlinelibrary.wiley.com/feed/15406261/most-cited',
          hint: { key: 'atypon:most-cited', label: 'Most cited' },
        },
      ]

      expect(atyponHandler.resolve(value)).toEqual(expected)
    })

    it('should return empty array for URL without journal code', () => {
      const value = 'https://dl.acm.org/doi/10.1145/3290605.3300233'

      expect(atyponHandler.resolve(value)).toEqual([])
    })
  })
})
