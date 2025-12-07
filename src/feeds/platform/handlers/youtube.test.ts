import { describe, expect, it } from 'bun:test'
import type { DiscoverFetchFn } from '../../../common/types.js'
import { youtubeHandler } from './youtube.js'

const createMockFetch = (body = ''): DiscoverFetchFn => {
  return async () => ({ body, headers: new Headers(), url: '', status: 200, statusText: 'OK' })
}

describe('youtubeHandler', () => {
  describe('match', () => {
    it.each([
      ['https://youtube.com/@channel', true],
      ['https://www.youtube.com/@channel', true],
      ['https://vimeo.com/channel', false],
    ])('%s -> %s', (url, expected) => {
      expect(youtubeHandler.match(url)).toBe(expected)
    })
  })

  describe('resolve', () => {
    it('should return feed URL for channel ID', async () => {
      const value = await youtubeHandler.resolve(
        'https://youtube.com/channel/UC1234567890',
        createMockFetch(),
      )

      expect(value).toEqual(['https://www.youtube.com/feeds/videos.xml?channel_id=UC1234567890'])
    })

    it('should return feed URL for playlist', async () => {
      const value = await youtubeHandler.resolve(
        'https://youtube.com/playlist?list=PL1234567890',
        createMockFetch(),
      )

      expect(value).toEqual(['https://www.youtube.com/feeds/videos.xml?playlist_id=PL1234567890'])
    })

    it('should fetch channel ID from @handle page', async () => {
      const value = await youtubeHandler.resolve(
        'https://youtube.com/@veritasium',
        createMockFetch('{"channelId":"UC1234567890"}'),
      )

      expect(value).toEqual(['https://www.youtube.com/feeds/videos.xml?channel_id=UC1234567890'])
    })

    it('should return empty array when @handle page fetch fails', async () => {
      const value = await youtubeHandler.resolve(
        'https://youtube.com/@nonexistent',
        createMockFetch('<html>No channel ID here</html>'),
      )

      expect(value).toEqual([])
    })

    it('should return empty array for unsupported paths', async () => {
      const value = await youtubeHandler.resolve(
        'https://youtube.com/watch?v=abc123',
        createMockFetch(),
      )

      expect(value).toEqual([])
    })
  })
})
