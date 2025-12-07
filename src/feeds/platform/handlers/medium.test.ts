import { describe, expect, it } from 'bun:test'
import type { DiscoverFetchFn } from '../../../common/types.js'
import { mediumHandler } from './medium.js'

const createMockFetch = (body = ''): DiscoverFetchFn => {
  return async () => ({ body, headers: new Headers(), url: '', status: 200, statusText: 'OK' })
}

describe('mediumHandler', () => {
  describe('match', () => {
    const cases = [
      ['https://medium.com/@user', true],
      ['https://www.medium.com/@user', true],
      ['https://blog.medium.com', true],
      ['https://substack.com/@user', false],
    ] as const

    it.each(cases)('%s -> %s', (url, expected) => {
      expect(mediumHandler.match(url)).toBe(expected)
    })
  })

  describe('resolve', () => {
    it('should return feed URL for user profile', async () => {
      const value = await mediumHandler.resolve('https://medium.com/@username', createMockFetch())

      expect(value).toEqual(['https://medium.com/feed/@username'])
    })

    it('should return feed URL for publication', async () => {
      const value = await mediumHandler.resolve(
        'https://medium.com/towards-data-science',
        createMockFetch(),
      )

      expect(value).toEqual(['https://medium.com/feed/towards-data-science'])
    })

    it('should return feed URL for custom subdomain', async () => {
      const value = await mediumHandler.resolve('https://blog.medium.com', createMockFetch())

      expect(value).toEqual(['https://medium.com/feed/blog'])
    })

    it('should skip reserved paths', async () => {
      const value = await mediumHandler.resolve(
        'https://medium.com/tag/programming',
        createMockFetch(),
      )

      expect(value).toEqual([])
    })

    it('should return empty array for non-matching paths', async () => {
      const value = await mediumHandler.resolve('https://medium.com/me/settings', createMockFetch())

      expect(value).toEqual([])
    })
  })
})
