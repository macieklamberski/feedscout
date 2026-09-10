import { describe, expect, it } from 'bun:test'
import { smzdmHandler } from './smzdm.js'

describe('smzdmHandler', () => {
  describe('match', () => {
    const values: Array<[boolean, string]> = [
      [true, 'https://www.smzdm.com'],
      [true, 'https://smzdm.com/'],
      [false, 'https://post.smzdm.com'],
      [false, 'https://smzdm.com.example.com'],
      [false, 'https://example.com'],
    ]

    it.each(values)('should return %s for %s', (expected, url) => {
      expect(smzdmHandler.match(url)).toBe(expected)
    })

    it('should return false for invalid URL', () => {
      expect(smzdmHandler.match('not-a-url')).toBe(false)
    })
  })

  describe('resolve', () => {
    const expected = [
      { uri: 'http://feed.smzdm.com', hint: { key: 'smzdm:deals', label: 'Deals' } },
    ]

    it('should return the deals feed for the homepage', () => {
      expect(smzdmHandler.resolve('https://www.smzdm.com')).toEqual(expected)
    })

    it('should return the deals feed for any page', () => {
      expect(smzdmHandler.resolve('https://www.smzdm.com/fenlei/yingpan/')).toEqual(expected)
    })
  })
})
