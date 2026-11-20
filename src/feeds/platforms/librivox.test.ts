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
      [true, 'https://librivox.org/author/85'],
      [true, 'https://librivox.org/pages/librivox-feeds/'],
      [true, 'https://librivox.org/'],
      [false, 'https://example.com/pride-and-prejudice-by-jane-austen/'],
    ]

    it.each(values)('should return %s for %s', (expected, url) => {
      expect(librivoxHandler.match(url)).toBe(expected)
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
        {
          uri: 'https://librivox.org/rss/latest_releases',
          hint: { key: 'librivox:latest', label: 'New releases' },
        },
      ]

      expect(librivoxHandler.resolve(value, audiobookHtml)).toEqual(expected)
    })

    it('should return the new releases feed for an audiobook page without content', () => {
      const value = 'https://librivox.org/pride-and-prejudice-by-jane-austen/'
      const expected = [
        {
          uri: 'https://librivox.org/rss/latest_releases',
          hint: { key: 'librivox:latest', label: 'New releases' },
        },
      ]

      expect(librivoxHandler.resolve(value)).toEqual(expected)
    })

    it('should return the new releases feed for a page that is no audiobook', () => {
      const value = 'https://librivox.org/author/85'
      const expected = [
        {
          uri: 'https://librivox.org/rss/latest_releases',
          hint: { key: 'librivox:latest', label: 'New releases' },
        },
      ]

      expect(librivoxHandler.resolve(value, audiobookHtml)).toEqual(expected)
    })
  })

  describe('getFeedHint', () => {
    it('should return the hint for an audiobook feed', () => {
      const value = 'https://librivox.org/rss/12345'
      const expected: DiscoverUriHint = { key: 'librivox:audiobook', label: 'Audiobook' }

      expect(librivoxHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the new releases hint for the new releases feed', () => {
      const value = 'https://librivox.org/rss/latest_releases'
      const expected: DiscoverUriHint = { key: 'librivox:latest', label: 'New releases' }

      expect(librivoxHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return undefined for another named path under rss', () => {
      const value = 'https://librivox.org/rss/example'

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

    it('should return undefined for an invalid URL', () => {
      const value = 'not a url'

      expect(librivoxHandler.getFeedHint?.(value)).toBeUndefined()
    })
  })

  describe('own feeds through the Platform method', () => {
    it('should return an audiobook feed as itself', async () => {
      const value = 'https://librivox.org/rss/12345'
      const options = {
        ...defaultPlatformOptions,
        handlers: [librivoxHandler],
        baseUrl: value,
      }
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://librivox.org/rss/12345',
          hint: { key: 'librivox:audiobook', label: 'Audiobook' },
        },
      ]

      expect(await discoverUrisFromPlatform(undefined, undefined, options)).toEqual(expected)
    })
  })
})
