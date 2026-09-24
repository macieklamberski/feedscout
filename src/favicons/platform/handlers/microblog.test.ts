import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry } from '../../../common/types.js'
import { microblogHandler } from './microblog.js'

describe('microblogHandler', () => {
  describe('match', () => {
    it('should match a blog subdomain', () => {
      expect(microblogHandler.match('https://example.micro.blog')).toBe(true)
    })

    it('should match a post on a blog subdomain', () => {
      expect(microblogHandler.match('https://example.micro.blog/2026/09/24/hello.html')).toBe(true)
    })

    it('should not match the micro.blog apex', () => {
      expect(microblogHandler.match('https://micro.blog/example')).toBe(false)
    })

    it('should not match www.micro.blog', () => {
      expect(microblogHandler.match('https://www.micro.blog')).toBe(false)
    })

    it('should not match a nested subdomain', () => {
      expect(microblogHandler.match('https://blog.example.micro.blog')).toBe(false)
    })

    it('should not match a lookalike host', () => {
      expect(microblogHandler.match('https://example.notmicro.blog')).toBe(false)
    })

    it('should not match an invalid URL', () => {
      expect(microblogHandler.match('not-a-url')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should resolve the avatar from the blog home page', () => {
      const expected: Array<DiscoverUriEntry> = [{ uri: 'https://micro.blog/example/avatar.jpg' }]

      expect(microblogHandler.resolve('https://example.micro.blog')).toEqual(expected)
    })

    it('should resolve the avatar from a post page', () => {
      const value = 'https://example.micro.blog/2026/09/24/hello.html'
      const expected: Array<DiscoverUriEntry> = [{ uri: 'https://micro.blog/example/avatar.jpg' }]

      expect(microblogHandler.resolve(value)).toEqual(expected)
    })

    it('should resolve the avatar from a category page', () => {
      const value = 'https://example.micro.blog/categories/photos/'
      const expected: Array<DiscoverUriEntry> = [{ uri: 'https://micro.blog/example/avatar.jpg' }]

      expect(microblogHandler.resolve(value)).toEqual(expected)
    })

    it('should return empty array for www.micro.blog', () => {
      expect(microblogHandler.resolve('https://www.micro.blog')).toEqual([])
    })

    it('should return empty array for a nested subdomain', () => {
      expect(microblogHandler.resolve('https://blog.example.micro.blog')).toEqual([])
    })

    it('should return empty array for an invalid URL', () => {
      expect(microblogHandler.resolve('not-a-url')).toEqual([])
    })
  })
})
