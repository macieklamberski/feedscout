import { describe, expect, it } from 'bun:test'
import { postypeHandler } from './postype.js'

describe('postypeHandler', () => {
  describe('match', () => {
    it('should match a channel path on the main host', () => {
      expect(postypeHandler.match('https://www.postype.com/@example')).toBe(true)
      expect(postypeHandler.match('https://postype.com/@example')).toBe(true)
    })

    it('should match a channel subdomain', () => {
      expect(postypeHandler.match('https://example.postype.com/')).toBe(true)
    })

    it('should not match the main host without a channel path', () => {
      expect(postypeHandler.match('https://www.postype.com/')).toBe(false)
      expect(postypeHandler.match('https://www.postype.com/explore')).toBe(false)
    })

    it('should not match infrastructure subdomains', () => {
      expect(postypeHandler.match('https://api.postype.com/')).toBe(false)
      expect(postypeHandler.match('https://cdn.postype.com/')).toBe(false)
    })

    it('should not match other hosts', () => {
      expect(postypeHandler.match('https://example.com/@example')).toBe(false)
    })

    it('should not match invalid URLs', () => {
      expect(postypeHandler.match('not-a-url')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return the channel feed for a path form', () => {
      const value = 'https://www.postype.com/@example'
      const expected = [
        {
          uri: 'https://www.postype.com/@example/rss',
          hint: { key: 'postype:posts', label: 'Posts' },
        },
      ]

      expect(postypeHandler.resolve(value)).toEqual(expected)
    })

    it('should return the channel feed for a subdomain form', () => {
      const value = 'https://example.postype.com/'
      const expected = [
        {
          uri: 'https://example.postype.com/rss',
          hint: { key: 'postype:posts', label: 'Posts' },
        },
      ]

      expect(postypeHandler.resolve(value)).toEqual(expected)
    })

    it('should return an empty array for a bare at sign', () => {
      expect(postypeHandler.resolve('https://www.postype.com/@')).toEqual([])
    })

    it('should return an empty array for the main host root', () => {
      expect(postypeHandler.resolve('https://www.postype.com/')).toEqual([])
    })

    it('should return an empty array for another host', () => {
      expect(postypeHandler.resolve('https://example.com/@example')).toEqual([])
    })

    it('should return an empty array for an infrastructure subdomain', () => {
      expect(postypeHandler.resolve('https://api.postype.com/')).toEqual([])
    })

    it('should return an empty array for invalid URLs', () => {
      expect(postypeHandler.resolve('not-a-url')).toEqual([])
    })
  })
})
