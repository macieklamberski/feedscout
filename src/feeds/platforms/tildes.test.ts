import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry } from '../../common/types.js'
import { tildesHandler } from './tildes.js'

describe('tildesHandler', () => {
  describe('match', () => {
    const values: Array<[boolean, string]> = [
      [true, 'https://tildes.net/~tech'],
      [true, 'https://www.tildes.net/~science'],
      [true, 'https://tildes.net'],
      [false, 'https://example.com'],
    ]

    it.each(values)('should return %s for %s', (expected, url) => {
      expect(tildesHandler.match(url)).toBe(expected)
    })

    it('should return false for invalid URL', () => {
      expect(tildesHandler.match('not-a-url')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return RSS and Atom feeds for group', () => {
      const value = 'https://tildes.net/~tech'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://tildes.net/~tech/topics.rss',
          hint: { key: 'tildes:group', label: 'Group', format: 'rss' },
        },
        {
          uri: 'https://tildes.net/~tech/topics.atom',
          hint: { key: 'tildes:group', label: 'Group', format: 'atom' },
        },
      ]

      expect(tildesHandler.resolve(value)).toEqual(expected)
    })

    it('should return group feeds regardless of subpath', () => {
      const value = 'https://tildes.net/~tech/some-topic'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://tildes.net/~tech/topics.rss',
          hint: { key: 'tildes:group', label: 'Group', format: 'rss' },
        },
        {
          uri: 'https://tildes.net/~tech/topics.atom',
          hint: { key: 'tildes:group', label: 'Group', format: 'atom' },
        },
      ]

      expect(tildesHandler.resolve(value)).toEqual(expected)
    })

    it('should return global topics feeds for root path', () => {
      const value = 'https://tildes.net/'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://tildes.net/topics.rss',
          hint: { key: 'tildes:topics', label: 'Topics', format: 'rss' },
        },
        {
          uri: 'https://tildes.net/topics.atom',
          hint: { key: 'tildes:topics', label: 'Topics', format: 'atom' },
        },
      ]

      expect(tildesHandler.resolve(value)).toEqual(expected)
    })

    it('should return empty array for paths without ~ prefix', () => {
      const value = 'https://tildes.net/login'

      expect(tildesHandler.resolve(value)).toEqual([])
    })

    it('should pass through tag query on group feeds', () => {
      const value = 'https://tildes.net/~tech?tag=programming'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://tildes.net/~tech/topics.rss?tag=programming',
          hint: { key: 'tildes:group', label: 'Group', format: 'rss' },
        },
        {
          uri: 'https://tildes.net/~tech/topics.atom?tag=programming',
          hint: { key: 'tildes:group', label: 'Group', format: 'atom' },
        },
      ]

      expect(tildesHandler.resolve(value)).toEqual(expected)
    })

    it('should pass through tag query on global topics feeds', () => {
      const value = 'https://tildes.net/?tag=programming'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://tildes.net/topics.rss?tag=programming',
          hint: { key: 'tildes:topics', label: 'Topics', format: 'rss' },
        },
        {
          uri: 'https://tildes.net/topics.atom?tag=programming',
          hint: { key: 'tildes:topics', label: 'Topics', format: 'atom' },
        },
      ]

      expect(tildesHandler.resolve(value)).toEqual(expected)
    })
  })
})
