import { describe, expect, it } from 'bun:test'
import { librivoxHandler } from './librivox.js'

const audiobookHtml = `
  <dd><a href="itpc://librivox.org/rss/253" class="book-download-btn">iTunes</a></dd>
  <dd><a href="https://librivox.org/rss/253" class="book-download-btn">RSS</a></dd>
`

describe('librivoxHandler', () => {
  describe('match', () => {
    const values: Array<[boolean, string]> = [
      [true, 'https://librivox.org/pride-and-prejudice-by-jane-austen/'],
      [true, 'https://librivox.org/pride-and-prejudice-by-jane-austen'],
      [false, 'https://librivox.org/author/85'],
      [false, 'https://librivox.org/pages/librivox-feeds/'],
      [false, 'https://librivox.org/'],
      [false, 'https://example.com/pride-and-prejudice-by-jane-austen/'],
    ]

    it.each(values)('should return %s for %s with the feed link', (expected, url) => {
      expect(librivoxHandler.match(url, audiobookHtml)).toBe(expected)
    })

    it('should not match a page without the feed link', () => {
      const value = 'https://librivox.org/search'

      expect(librivoxHandler.match(value, '<a href="/pages/librivox-feeds">Rss</a>')).toBe(false)
    })

    it('should not match without content', () => {
      const value = 'https://librivox.org/pride-and-prejudice-by-jane-austen/'

      expect(librivoxHandler.match(value)).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return the audiobook feed', () => {
      const value = 'https://librivox.org/pride-and-prejudice-by-jane-austen/'
      const expected = [
        {
          uri: 'https://librivox.org/rss/253',
          hint: { key: 'librivox:audiobook', label: 'Audiobook' },
        },
      ]

      expect(librivoxHandler.resolve(value, audiobookHtml)).toEqual(expected)
    })

    it('should return empty array without content', () => {
      const value = 'https://librivox.org/pride-and-prejudice-by-jane-austen/'

      expect(librivoxHandler.resolve(value)).toEqual([])
    })
  })
})
