import { describe, expect, it } from 'bun:test'
import type { DiscoverFetchFn } from '../../../common/types.js'
import { substackHandler } from './substack.js'

const createMockFetch = (body = ''): DiscoverFetchFn => {
  return async () => ({ body, headers: new Headers(), url: '', status: 200, statusText: 'OK' })
}

describe('substackHandler', () => {
  describe('match', () => {
    const cases = [
      ['https://example.substack.com', true],
      ['https://blog.example.substack.com', true],
      ['https://medium.com', false],
    ] as const

    it.each(cases)('%s -> %s', (url, expected) => {
      expect(substackHandler.match(url)).toBe(expected)
    })
  })

  describe('resolve', () => {
    it('should return feed URL for newsletter', async () => {
      const value = await substackHandler.resolve('https://example.substack.com', createMockFetch())

      expect(value).toEqual(['https://example.substack.com/feed'])
    })

    it('should return feed URL regardless of path', async () => {
      const value = await substackHandler.resolve(
        'https://newsletter.substack.com/p/some-article',
        createMockFetch(),
      )

      expect(value).toEqual(['https://newsletter.substack.com/feed'])
    })
  })
})
