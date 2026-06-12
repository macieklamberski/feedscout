import { describe, expect, it } from 'bun:test'
import { mediumHandler } from './medium.js'

describe('mediumHandler', () => {
  describe('match', () => {
    const values: Array<[boolean, string]> = [
      [true, 'https://medium.com/@ev'],
      [true, 'https://www.medium.com/@ev'],
      [true, 'https://medium.com/towards-data-science'],
      [true, 'https://blog.medium.com'],
      [false, 'https://example.com/@ev'],
    ]

    it.each(values)('should return %s for %s', (expected, url) => {
      expect(mediumHandler.match(url)).toBe(expected)
    })

    it('should return false for invalid URL', () => {
      expect(mediumHandler.match('not-a-url')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return RSS feed URL for user profile', () => {
      const value = 'https://medium.com/@ev'
      const expected = [
        { uri: 'https://medium.com/feed/@ev', hint: { key: 'medium:posts', label: 'Posts' } },
      ]

      expect(mediumHandler.resolve(value)).toEqual(expected)
    })

    it('should return RSS feed URL for publication', () => {
      const value = 'https://medium.com/towards-data-science'
      const expected = [
        {
          uri: 'https://medium.com/feed/towards-data-science',
          hint: { key: 'medium:publication', label: 'Publication' },
        },
      ]

      expect(mediumHandler.resolve(value)).toEqual(expected)
    })

    it('should return RSS feed URL for subdomain publication', () => {
      const value = 'https://blog.medium.com/some-article'
      const expected = [
        {
          uri: 'https://blog.medium.com/feed',
          hint: { key: 'medium:publication', label: 'Publication' },
        },
      ]

      expect(mediumHandler.resolve(value)).toEqual(expected)
    })

    it('should return RSS feed URL for tag page', () => {
      const value = 'https://medium.com/tag/javascript'
      const expected = [
        {
          uri: 'https://medium.com/feed/tag/javascript',
          hint: { key: 'medium:tag', label: 'Tag' },
        },
      ]

      expect(mediumHandler.resolve(value)).toEqual(expected)
    })

    it('should return RSS feed URL for publication tagged page', () => {
      const value = 'https://medium.com/towards-data-science/tagged/machine-learning'
      const expected = [
        {
          uri: 'https://medium.com/feed/towards-data-science/tagged/machine-learning',
          hint: { key: 'medium:tagged', label: 'Tagged' },
        },
      ]

      expect(mediumHandler.resolve(value)).toEqual(expected)
    })

    it('should return RSS feed URL for subdomain tagged page', () => {
      const value = 'https://blog.medium.com/tagged/engineering'
      const expected = [
        {
          uri: 'https://blog.medium.com/feed/tagged/engineering',
          hint: { key: 'medium:tagged', label: 'Tagged' },
        },
      ]

      expect(mediumHandler.resolve(value)).toEqual(expected)
    })

    it('should return empty array for excluded paths', () => {
      const excludedUrls = [
        'https://medium.com/search',
        'https://medium.com/me',
        'https://medium.com/new-story',
        'https://medium.com/plans',
        'https://medium.com/membership',
      ]

      for (const url of excludedUrls) {
        expect(mediumHandler.resolve(url)).toEqual([])
      }
    })

    it('should return empty array for excluded paths in tagged URLs', () => {
      const excludedUrls = [
        'https://medium.com/search/tagged/javascript',
        'https://medium.com/me/tagged/react',
        'https://medium.com/plans/tagged/python',
        'https://medium.com/membership/tagged/writing',
      ]

      for (const url of excludedUrls) {
        expect(mediumHandler.resolve(url)).toEqual([])
      }
    })

    it('should return empty array for root path', () => {
      const value = 'https://medium.com/'

      expect(mediumHandler.resolve(value)).toEqual([])
    })

    it('should handle user profile with article path', () => {
      const value = 'https://medium.com/@ev/some-article'
      const expected = [
        { uri: 'https://medium.com/feed/@ev', hint: { key: 'medium:posts', label: 'Posts' } },
      ]

      expect(mediumHandler.resolve(value)).toEqual(expected)
    })

    it('should return RSS feed URL for publication on www.medium.com', () => {
      const value = 'https://www.medium.com/towards-data-science'
      const expected = [
        {
          uri: 'https://medium.com/feed/towards-data-science',
          hint: { key: 'medium:publication', label: 'Publication' },
        },
      ]

      expect(mediumHandler.resolve(value)).toEqual(expected)
    })

    it('should return RSS feed URL for numeric-only publication name', () => {
      const value = 'https://medium.com/12345'
      const expected = [
        {
          uri: 'https://medium.com/feed/12345',
          hint: { key: 'medium:publication', label: 'Publication' },
        },
      ]

      expect(mediumHandler.resolve(value)).toEqual(expected)
    })

    it.todo('should define behavior for invalid URL input', () => {
      // resolve('not-a-url') currently throws a TypeError from the unguarded new URL call; the
      // desired contract (throw vs empty array) is undecided.
    })
  })
})
