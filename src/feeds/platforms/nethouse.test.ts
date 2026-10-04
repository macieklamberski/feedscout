import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry } from '../../common/types.js'
import { isNethouseHeaders, nethouseHandler } from './nethouse.js'

describe('isNethouseHeaders', () => {
  it('should return true for the Nethouse generator header', () => {
    const value = new Headers({ 'x-generator': 'nethouse' })

    expect(isNethouseHeaders(value)).toBe(true)
  })

  it('should return false for another generator header', () => {
    const value = new Headers({ 'x-generator': 'Drupal 8 (https://www.drupal.org)' })

    expect(isNethouseHeaders(value)).toBe(false)
  })

  it('should return false for a generator that only contains nethouse', () => {
    const value = new Headers({ 'x-generator': 'bonnethouse-cms' })

    expect(isNethouseHeaders(value)).toBe(false)
  })

  it('should return false without the generator header', () => {
    expect(isNethouseHeaders(new Headers())).toBe(false)
  })
})

describe('nethouseHandler', () => {
  describe('match', () => {
    const values: Array<[boolean, string]> = [
      [true, 'https://geography.nethouse.ru/'],
      [false, 'https://www.nethouse.ru/'],
      [true, 'https://jivoirodnik.nethouse.ru/articles'],
      [true, 'https://errorfreeled.nethouse.me/'],
      [false, 'https://nethouse.ru/'],
      [false, 'https://example.com/'],
    ]

    it.each(values)('should return %s for %s', (expected, url) => {
      expect(nethouseHandler.match(url)).toBe(expected)
    })

    it('should return true for a custom domain with the Nethouse generator header', () => {
      const headers = new Headers({ 'x-generator': 'nethouse' })

      expect(nethouseHandler.match('https://example.com/', '', headers)).toBe(true)
    })
  })

  describe('resolve', () => {
    it('should return the news and articles feeds for a site', () => {
      const value = 'https://jivoirodnik.nethouse.ru/articles/223023'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://jivoirodnik.nethouse.ru/posts/rss',
          hint: { key: 'nethouse:news', label: 'News' },
        },
        {
          uri: 'https://jivoirodnik.nethouse.ru/articles/rss',
          hint: { key: 'nethouse:articles', label: 'Articles' },
        },
      ]

      expect(nethouseHandler.resolve(value)).toEqual(expected)
    })
  })
})
