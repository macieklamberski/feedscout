import { describe, expect, it } from 'bun:test'
import { tildesHandler } from './tildes.js'

describe('tildesHandler', () => {
  describe('match', () => {
    const cases = [
      ['https://tildes.net/~tech', true],
      ['https://www.tildes.net/~science', true],
      ['https://tildes.net', true],
      ['https://example.com', false],
    ] as const

    it.each(cases)('%s -> %s', (url, expected) => {
      expect(tildesHandler.match(url)).toBe(expected)
    })

    it('should return false for invalid URL', () => {
      expect(tildesHandler.match('not-a-url')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return RSS and Atom feeds for group', () => {
      const value = 'https://tildes.net/~tech'
      const expected = [
        {
          uri: 'https://tildes.net/~tech/topics.rss',
          hint: { key: 'tildes:group-rss', label: 'Group (RSS)' },
        },
        {
          uri: 'https://tildes.net/~tech/topics.atom',
          hint: { key: 'tildes:group-atom', label: 'Group (Atom)' },
        },
      ]

      expect(tildesHandler.resolve(value)).toEqual(expected)
    })

    it('should return group feeds regardless of subpath', () => {
      const value = 'https://tildes.net/~tech/some-topic'
      const expected = [
        {
          uri: 'https://tildes.net/~tech/topics.rss',
          hint: { key: 'tildes:group-rss', label: 'Group (RSS)' },
        },
        {
          uri: 'https://tildes.net/~tech/topics.atom',
          hint: { key: 'tildes:group-atom', label: 'Group (Atom)' },
        },
      ]

      expect(tildesHandler.resolve(value)).toEqual(expected)
    })

    it('should return global topics feeds for root path', () => {
      const value = 'https://tildes.net/'
      const expected = [
        {
          uri: 'https://tildes.net/topics.rss',
          hint: { key: 'tildes:topics-rss', label: 'Topics (RSS)' },
        },
        {
          uri: 'https://tildes.net/topics.atom',
          hint: { key: 'tildes:topics-atom', label: 'Topics (Atom)' },
        },
      ]

      expect(tildesHandler.resolve(value)).toEqual(expected)
    })

    it('should return empty array for paths without ~ prefix', () => {
      const value = 'https://tildes.net/login'

      expect(tildesHandler.resolve(value)).toEqual([])
    })
  })
})
