import { describe, expect, it } from 'bun:test'
import { insanejournalHandler } from './insanejournal.js'

describe('insanejournalHandler', () => {
  describe('match', () => {
    const cases = [
      ['https://random.insanejournal.com', true],
      ['https://anything.insanejournal.com/post', true],
      ['https://insanejournal.com', false],
      ['https://example.com', false],
    ] as const

    it.each(cases)('%s -> %s', (url, expected) => {
      expect(insanejournalHandler.match(url)).toBe(expected)
    })

    it('should return false for invalid URL', () => {
      expect(insanejournalHandler.match('not-a-url')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return RSS and Atom feeds for journal', () => {
      const value = 'https://random.insanejournal.com'
      const expected = [
        {
          uri: 'https://random.insanejournal.com/data/rss',
          hint: { key: 'insanejournal:posts-rss', label: 'Posts (RSS)' },
        },
        {
          uri: 'https://random.insanejournal.com/data/atom',
          hint: { key: 'insanejournal:posts-atom', label: 'Posts (Atom)' },
        },
      ]

      expect(insanejournalHandler.resolve(value)).toEqual(expected)
    })

    it('should return feeds regardless of path', () => {
      const value = 'https://random.insanejournal.com/123456.html'
      const expected = [
        {
          uri: 'https://random.insanejournal.com/data/rss',
          hint: { key: 'insanejournal:posts-rss', label: 'Posts (RSS)' },
        },
        {
          uri: 'https://random.insanejournal.com/data/atom',
          hint: { key: 'insanejournal:posts-atom', label: 'Posts (Atom)' },
        },
      ]

      expect(insanejournalHandler.resolve(value)).toEqual(expected)
    })
  })
})
