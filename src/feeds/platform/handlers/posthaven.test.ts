import { describe, expect, it } from 'bun:test'
import { posthavenHandler } from './posthaven.js'

describe('posthavenHandler', () => {
  describe('match', () => {
    const cases = [
      ['https://blog.posthaven.com', true],
      ['https://anything.posthaven.com/post', true],
      ['https://posthaven.com', false],
      ['https://example.com', false],
    ] as const

    it.each(cases)('%s -> %s', (url, expected) => {
      expect(posthavenHandler.match(url)).toBe(expected)
    })

    it('should return false for invalid URL', () => {
      expect(posthavenHandler.match('not-a-url')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return posts feed for blog', () => {
      const value = 'https://blog.posthaven.com'
      const expected = [
        {
          uri: 'https://blog.posthaven.com/posts.atom',
          hint: { key: 'posthaven:posts', label: 'Posts' },
        },
      ]

      expect(posthavenHandler.resolve(value)).toEqual(expected)
    })

    it('should return feed URL regardless of path', () => {
      const value = 'https://blog.posthaven.com/some-post-slug'
      const expected = [
        {
          uri: 'https://blog.posthaven.com/posts.atom',
          hint: { key: 'posthaven:posts', label: 'Posts' },
        },
      ]

      expect(posthavenHandler.resolve(value)).toEqual(expected)
    })
  })
})
