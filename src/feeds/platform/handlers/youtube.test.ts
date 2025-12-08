import { describe, expect, it } from 'bun:test'
import { youtubeHandler } from './youtube.js'

describe('youtubeHandler', () => {
  describe('match', () => {
    const cases = [
      ['https://youtube.com/@channel', true],
      ['https://www.youtube.com/@channel', true],
      ['https://vimeo.com/channel', false],
    ] as const

    it.each(cases)('%s -> %s', (url, expected) => {
      expect(youtubeHandler.match(url)).toBe(expected)
    })
  })

  describe('resolve', () => {
    it('should return feed URL for channel ID', () => {
      const value = 'https://youtube.com/channel/UC1234567890'
      const expected = ['https://www.youtube.com/feeds/videos.xml?channel_id=UC1234567890']

      expect(youtubeHandler.resolve(value, '')).toEqual(expected)
    })

    it('should return feed URL for playlist', () => {
      const value = 'https://youtube.com/playlist?list=PL1234567890'
      const expected = ['https://www.youtube.com/feeds/videos.xml?playlist_id=PL1234567890']

      expect(youtubeHandler.resolve(value, '')).toEqual(expected)
    })

    it('should extract channel ID from @handle page content', () => {
      const value = 'https://youtube.com/@veritasium'
      const content = '{"channelId":"UC1234567890"}'
      const expected = ['https://www.youtube.com/feeds/videos.xml?channel_id=UC1234567890']

      expect(youtubeHandler.resolve(value, content)).toEqual(expected)
    })

    it('should return empty array when @handle content has no channel ID', () => {
      const value = 'https://youtube.com/@nonexistent'
      const content = '<html>No channel ID here</html>'
      const expected: Array<string> = []

      expect(youtubeHandler.resolve(value, content)).toEqual(expected)
    })

    it('should return empty array for unsupported paths', () => {
      const value = 'https://youtube.com/watch?v=abc123'
      const expected: Array<string> = []

      expect(youtubeHandler.resolve(value, '')).toEqual(expected)
    })
  })
})
