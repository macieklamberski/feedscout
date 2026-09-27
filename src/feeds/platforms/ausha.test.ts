import { describe, expect, it } from 'bun:test'
import { aushaHandler } from './ausha.js'

describe('aushaHandler', () => {
  describe('match', () => {
    const values: Array<[boolean, string]> = [
      [true, 'https://podcast.ausha.co/example-show'],
      [true, 'https://podcast.ausha.co/example-show/example-episode'],
      [true, 'https://smartlink.ausha.co/example-show'],
      [true, 'https://smartlink.ausha.co/example-show/example-episode'],
      [false, 'https://podcast.ausha.co/c/example-channel'],
      [false, 'https://podcast.ausha.co/'],
      [false, 'https://www.ausha.co/example-show'],
      [false, 'https://example.com/example-show'],
    ]

    it.each(values)('should return %s for %s', (expected, url) => {
      expect(aushaHandler.match(url)).toBe(expected)
    })
  })

  describe('resolve', () => {
    it('should return the feed read from the page content', () => {
      const value = 'https://podcast.ausha.co/example-show'
      const content = '{"key":"rss","url":"https://feed.ausha.co/VODwGU7PMQGG","position":0}'
      const expected = [
        {
          uri: 'https://feed.ausha.co/VODwGU7PMQGG',
          hint: { key: 'ausha:podcast', label: 'Podcast' },
        },
      ]

      expect(aushaHandler.resolve(value, content)).toEqual(expected)
    })

    it('should return empty array when no content provided', () => {
      const value = 'https://podcast.ausha.co/example-show'

      expect(aushaHandler.resolve(value)).toEqual([])
    })

    it('should return empty array when the feed id is not in the content', () => {
      const value = 'https://podcast.ausha.co/example-show'
      const content = '<html><body>No feed here</body></html>'

      expect(aushaHandler.resolve(value, content)).toEqual([])
    })
  })
})
