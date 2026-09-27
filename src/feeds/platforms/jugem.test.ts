import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry } from '../../common/types.js'
import { jugemHandler } from './jugem.js'

describe('jugemHandler', () => {
  describe('match', () => {
    const values: Array<[boolean, string]> = [
      [true, 'https://alice.jugem.jp'],
      [true, 'https://alice.jugem.jp/?eid=123'],
      [false, 'https://www.jugem.jp'],
      [false, 'https://blog.alice.jugem.jp'],
      [false, 'https://jugem.jp'],
      [false, 'https://example.com'],
    ]

    it.each(values)('should return %s for %s', (expected, url) => {
      expect(jugemHandler.match(url)).toBe(expected)
    })
  })

  describe('resolve', () => {
    it('should return RSS 1.0 and Atom feeds for blog', () => {
      const value = 'https://alice.jugem.jp/?cid=3'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://alice.jugem.jp/?mode=rss',
          hint: { key: 'jugem:posts', label: 'Posts', format: 'rdf' },
        },
        {
          uri: 'https://alice.jugem.jp/?mode=atom',
          hint: { key: 'jugem:posts', label: 'Posts', format: 'atom' },
        },
      ]

      expect(jugemHandler.resolve(value)).toEqual(expected)
    })
  })
})
