import { describe, expect, it } from 'bun:test'
import { tumblrHandler } from './tumblr.js'

describe('tumblrHandler', () => {
  describe('resolve', () => {
    it('should resolve blog avatar from subdomain URL', () => {
      const expected = [{ uri: 'https://api.tumblr.com/v2/blog/example/avatar/512' }]

      expect(tumblrHandler.resolve('https://example.tumblr.com')).toEqual(expected)
    })

    it('should resolve blog avatar from www.tumblr.com path URL', () => {
      const expected = [{ uri: 'https://api.tumblr.com/v2/blog/example/avatar/512' }]

      expect(tumblrHandler.resolve('https://www.tumblr.com/example')).toEqual(expected)
    })

    it('should return empty array for the tumblr.com root', () => {
      expect(tumblrHandler.resolve('https://tumblr.com')).toEqual([])
    })
  })
})
