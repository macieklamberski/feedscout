import { describe, expect, it } from 'bun:test'
import { fc2Handler } from './fc2.js'

describe('fc2Handler', () => {
  describe('match', () => {
    it('should match the canonical blog host', () => {
      expect(fc2Handler.match('https://example.blog.fc2.com/')).toBe(true)
    })

    it('should match a legacy numbered blog host', () => {
      expect(fc2Handler.match('http://example.blog26.fc2.com/')).toBe(true)
    })

    it('should not match other FC2 services', () => {
      expect(fc2Handler.match('https://example.web.fc2.com/')).toBe(false)
    })

    it('should not match other hosts', () => {
      expect(fc2Handler.match('https://example.com/')).toBe(false)
    })

    it('should not match invalid URLs', () => {
      expect(fc2Handler.match('not-a-url')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return the posts feed on the host in hand', () => {
      const value = 'https://example.blog.fc2.com/blog-entry-1.html'
      const expected = [
        { uri: 'https://example.blog.fc2.com/?xml', hint: { key: 'fc2:posts', label: 'Posts' } },
      ]

      expect(fc2Handler.resolve(value)).toEqual(expected)
    })

    it('should return an empty array for invalid URLs', () => {
      expect(fc2Handler.resolve('not-a-url')).toEqual([])
    })
  })
})
