import { describe, expect, it } from 'bun:test'
import { livejournalHandler } from './livejournal.js'

describe('livejournalHandler', () => {
  describe('match', () => {
    const cases = [
      ['https://ohnotheydidnt.livejournal.com', true],
      ['https://blog.example.livejournal.com', true],
      ['https://livejournal.com', false],
      ['https://example.com', false],
    ] as const

    it.each(cases)('%s -> %s', (url, expected) => {
      expect(livejournalHandler.match(url)).toBe(expected)
    })

    it('should return false for invalid URL', () => {
      expect(livejournalHandler.match('not-a-url')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return RSS and Atom feeds for blog', () => {
      const value = 'https://ohnotheydidnt.livejournal.com'
      const expected = [
        {
          uri: 'https://ohnotheydidnt.livejournal.com/data/rss',
          hint: { key: 'livejournal:posts-rss', label: 'Posts (RSS)' },
        },
        {
          uri: 'https://ohnotheydidnt.livejournal.com/data/atom',
          hint: { key: 'livejournal:posts-atom', label: 'Posts (Atom)' },
        },
      ]

      expect(livejournalHandler.resolve(value)).toEqual(expected)
    })

    it('should return feed URLs regardless of path', () => {
      const value = 'https://ohnotheydidnt.livejournal.com/123456.html'
      const expected = [
        {
          uri: 'https://ohnotheydidnt.livejournal.com/data/rss',
          hint: { key: 'livejournal:posts-rss', label: 'Posts (RSS)' },
        },
        {
          uri: 'https://ohnotheydidnt.livejournal.com/data/atom',
          hint: { key: 'livejournal:posts-atom', label: 'Posts (Atom)' },
        },
      ]

      expect(livejournalHandler.resolve(value)).toEqual(expected)
    })
  })
})
