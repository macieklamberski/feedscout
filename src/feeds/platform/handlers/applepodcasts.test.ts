import { describe, expect, it } from 'bun:test'
import type { DiscoverFetchFn } from '../../../common/types.js'
import { applePodcastsHandler } from './applepodcasts.js'

const createMockFetch = (body = ''): DiscoverFetchFn => {
  return async () => ({ body, headers: new Headers(), url: '', status: 200, statusText: 'OK' })
}

describe('applePodcastsHandler', () => {
  describe('match', () => {
    const cases = [
      ['https://podcasts.apple.com/us/podcast/id123456', true],
      ['https://itunes.apple.com/us/podcast/id123456', true],
      ['https://de.podcasts.apple.com/podcast/id123456', true],
      ['https://example.com/podcast', false],
    ] as const

    it.each(cases)('%s -> %s', (url, expected) => {
      expect(applePodcastsHandler.match(url)).toBe(expected)
    })
  })

  describe('resolve', () => {
    it('should return feed URL from iTunes API response', async () => {
      const body = JSON.stringify({
        resultCount: 1,
        results: [
          { wrapperType: 'track', kind: 'podcast', feedUrl: 'https://example.com/podcast.rss' },
        ],
      })
      const value = await applePodcastsHandler.resolve(
        'https://podcasts.apple.com/us/podcast/show-name/id123456',
        createMockFetch(body),
      )

      expect(value).toEqual(['https://example.com/podcast.rss'])
    })

    it('should return empty array when podcast ID not found', async () => {
      const value = await applePodcastsHandler.resolve(
        'https://podcasts.apple.com/us/podcast/show-name',
        createMockFetch(),
      )

      expect(value).toEqual([])
    })

    it('should return empty array when API returns no results', async () => {
      const body = JSON.stringify({ resultCount: 0, results: [] })
      const value = await applePodcastsHandler.resolve(
        'https://podcasts.apple.com/us/podcast/show-name/id123456',
        createMockFetch(body),
      )

      expect(value).toEqual([])
    })

    it('should return empty array when result is not a podcast', async () => {
      const body = JSON.stringify({
        resultCount: 1,
        results: [{ wrapperType: 'collection', kind: 'album' }],
      })
      const value = await applePodcastsHandler.resolve(
        'https://podcasts.apple.com/us/podcast/show-name/id123456',
        createMockFetch(body),
      )

      expect(value).toEqual([])
    })
  })
})
