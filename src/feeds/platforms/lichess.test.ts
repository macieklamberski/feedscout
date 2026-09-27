import { describe, expect, it } from 'bun:test'
import { lichessHandler } from './lichess.js'

describe('lichessHandler', () => {
  describe('match', () => {
    it('should match a lichess.org URL', () => {
      expect(lichessHandler.match('https://lichess.org/@/thibault/blog')).toBe(true)
    })

    it('should not match another host', () => {
      expect(lichessHandler.match('https://example.com/@/thibault/blog')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return the blog feed for a user blog', () => {
      const value = 'https://lichess.org/@/thibault/blog'
      const expected = [
        {
          uri: 'https://lichess.org/@/thibault/blog.atom',
          hint: { key: 'lichess:blog', label: 'Blog' },
        },
      ]

      expect(lichessHandler.resolve(value)).toEqual(expected)
    })

    it('should return the blog feed for a user blog post', () => {
      const value = 'https://lichess.org/@/thibault/blog/how-to-report-a-bug/otcAwtvA'
      const expected = [
        {
          uri: 'https://lichess.org/@/thibault/blog.atom',
          hint: { key: 'lichess:blog', label: 'Blog' },
        },
      ]

      expect(lichessHandler.resolve(value)).toEqual(expected)
    })

    it('should keep the username case', () => {
      const value = 'https://lichess.org/@/Thibault/blog'
      const expected = [
        {
          uri: 'https://lichess.org/@/Thibault/blog.atom',
          hint: { key: 'lichess:blog', label: 'Blog' },
        },
      ]

      expect(lichessHandler.resolve(value)).toEqual(expected)
    })

    it('should return the Lichess blog feed for the official blog', () => {
      const value = 'https://lichess.org/blog'
      const expected = [
        {
          uri: 'https://lichess.org/@/Lichess/blog.atom',
          hint: { key: 'lichess:blog', label: 'Blog' },
        },
      ]

      expect(lichessHandler.resolve(value)).toEqual(expected)
    })

    it('should return the Lichess blog feed for an old official blog post', () => {
      const value = 'https://lichess.org/blog/W3WeMyQAACQAdfAL/7-piece-syzygy-tablebases'
      const expected = [
        {
          uri: 'https://lichess.org/@/Lichess/blog.atom',
          hint: { key: 'lichess:blog', label: 'Blog' },
        },
      ]

      expect(lichessHandler.resolve(value)).toEqual(expected)
    })

    it('should return the community blogs feed for the community page', () => {
      const value = 'https://lichess.org/blog/community?filter=best'
      const expected = [
        {
          uri: 'https://lichess.org/blog/community.atom',
          hint: { key: 'lichess:community', label: 'Community blogs' },
        },
      ]

      expect(lichessHandler.resolve(value)).toEqual(expected)
    })

    it('should return the language community blogs feed for a language community page', () => {
      const value = 'https://lichess.org/fr/blog/community'
      const expected = [
        {
          uri: 'https://lichess.org/blog/community.atom?lang=fr',
          hint: { key: 'lichess:community', label: 'Community blogs' },
        },
      ]

      expect(lichessHandler.resolve(value)).toEqual(expected)
    })

    it('should lowercase an uppercase language code', () => {
      const value = 'https://lichess.org/FR/blog/community'
      const expected = [
        {
          uri: 'https://lichess.org/blog/community.atom?lang=fr',
          hint: { key: 'lichess:community', label: 'Community blogs' },
        },
      ]

      expect(lichessHandler.resolve(value)).toEqual(expected)
    })

    it('should return the updates feed for a monthly blog archive page', () => {
      const value = 'https://lichess.org/blog/monthly/2026/9'
      const expected = [
        {
          uri: 'https://lichess.org/feed.atom',
          hint: { key: 'lichess:updates', label: 'Updates' },
        },
      ]

      expect(lichessHandler.resolve(value)).toEqual(expected)
    })

    it('should return the updates feed for a blog topic page', () => {
      const value = 'https://lichess.org/blog/topic/Chess'
      const expected = [
        {
          uri: 'https://lichess.org/feed.atom',
          hint: { key: 'lichess:updates', label: 'Updates' },
        },
      ]

      expect(lichessHandler.resolve(value)).toEqual(expected)
    })

    it('should return the updates feed for the blog topics page', () => {
      const expected = [
        {
          uri: 'https://lichess.org/feed.atom',
          hint: { key: 'lichess:updates', label: 'Updates' },
        },
      ]

      expect(lichessHandler.resolve('https://lichess.org/blog/topic')).toEqual(expected)
    })

    it('should return the updates feed for a profile page', () => {
      const expected = [
        {
          uri: 'https://lichess.org/feed.atom',
          hint: { key: 'lichess:updates', label: 'Updates' },
        },
      ]

      expect(lichessHandler.resolve('https://lichess.org/@/thibault')).toEqual(expected)
    })

    it('should return the updates feed for the home page', () => {
      const expected = [
        {
          uri: 'https://lichess.org/feed.atom',
          hint: { key: 'lichess:updates', label: 'Updates' },
        },
      ]

      expect(lichessHandler.resolve('https://lichess.org/')).toEqual(expected)
    })
  })
})
