import { describe, expect, it } from 'bun:test'
import type { DiscoverFetchFn } from '../../../common/types.js'
import { devtoHandler } from './devto.js'

const createMockFetch = (body = ''): DiscoverFetchFn => {
  return async () => ({ body, headers: new Headers(), url: '', status: 200, statusText: 'OK' })
}

describe('devtoHandler', () => {
  describe('match', () => {
    const cases = [
      ['https://dev.to/username', true],
      ['https://www.dev.to/username', true],
      ['https://hashnode.dev/username', false],
    ] as const

    it.each(cases)('%s -> %s', (url, expected) => {
      expect(devtoHandler.match(url)).toBe(expected)
    })
  })

  describe('resolve', () => {
    it('should return feed URL for user profile', async () => {
      const value = await devtoHandler.resolve('https://dev.to/username', createMockFetch())

      expect(value).toEqual(['https://dev.to/feed/username'])
    })

    it('should return feed URL for tag page', async () => {
      const value = await devtoHandler.resolve('https://dev.to/t/javascript', createMockFetch())

      expect(value).toEqual(['https://dev.to/feed/tag/javascript'])
    })

    it('should skip reserved paths', async () => {
      const value = await devtoHandler.resolve('https://dev.to/search', createMockFetch())

      expect(value).toEqual([])
    })

    it('should skip settings paths', async () => {
      const value = await devtoHandler.resolve('https://dev.to/settings', createMockFetch())

      expect(value).toEqual([])
    })
  })
})
