import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry, DiscoverUriHint } from '../../common/types.js'
import { discoverUrisFromPlatform } from '../../common/uris/platform/index.js'
import { defaultPlatformOptions } from '../defaults.js'
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

  describe('getFeedHint', () => {
    it('should return the hint for an audiobook feed', () => {
      const value = 'https://librivox.org/rss/12345'
      const expected: DiscoverUriHint = { key: 'librivox:audiobook', label: 'Audiobook' }

      expect(librivoxHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the hint for an audiobook feed over http', () => {
      const value = 'http://librivox.org/rss/12345'
      const expected: DiscoverUriHint = { key: 'librivox:audiobook', label: 'Audiobook' }

      expect(librivoxHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the hint for an audiobook feed with a trailing slash', () => {
      const value = 'https://librivox.org/rss/12345/'
      const expected: DiscoverUriHint = { key: 'librivox:audiobook', label: 'Audiobook' }

      expect(librivoxHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return undefined for a named feed under rss', () => {
      const value = 'https://librivox.org/rss/latest_releases'

      expect(librivoxHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for a file under rss', () => {
      const value = 'https://librivox.org/rss/robots.txt'

      expect(librivoxHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for an audiobook page', () => {
      const value = 'https://librivox.org/example-by-alice/'

      expect(librivoxHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for an audiobook feed on another host', () => {
      const value = 'https://example.com/rss/12345'

      expect(librivoxHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for an invalid URL', () => {
      const value = 'not a url'

      expect(librivoxHandler.getFeedHint?.(value)).toBeUndefined()
    })
  })

  describe('own feeds through the Platform method', () => {
    const values = [
      'https://librivox.org/rss/12345',
      'http://librivox.org/rss/12345',
      'https://librivox.org/rss/12345/',
    ]

    it.each(values)('should return %s as itself', async (value) => {
      const options = {
        ...defaultPlatformOptions,
        handlers: [librivoxHandler],
        baseUrl: value,
      }
      const expected: Array<DiscoverUriEntry> = [
        { uri: value, hint: { key: 'librivox:audiobook', label: 'Audiobook' } },
      ]

      expect(await discoverUrisFromPlatform(undefined, undefined, options)).toEqual(expected)
    })
  })
})
