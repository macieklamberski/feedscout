import { describe, expect, it } from 'bun:test'
import { youtubeHandler } from './youtube.js'

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
    it('should return feed URL for channel ID', () => {
      const value = youtubeHandler.resolve('https://youtube.com/channel/UC1234567890', '')

      expect(value).toEqual(['https://www.youtube.com/feeds/videos.xml?channel_id=UC1234567890'])
    })

    it('should return feed URL for playlist', () => {
      const value = youtubeHandler.resolve('https://youtube.com/playlist?list=PL1234567890', '')

      expect(value).toEqual(['https://www.youtube.com/feeds/videos.xml?playlist_id=PL1234567890'])
    })

    it('should extract channel ID from @handle page content', () => {
      const value = youtubeHandler.resolve(
        'https://youtube.com/@veritasium',
        '{"channelId":"UC1234567890"}',
      )

      expect(value).toEqual(['https://www.youtube.com/feeds/videos.xml?channel_id=UC1234567890'])
    })

    it('should return empty array when @handle content has no channel ID', () => {
      const value = youtubeHandler.resolve(
        'https://youtube.com/@nonexistent',
        '<html>No channel ID here</html>',
      )

      expect(value).toEqual([])
    })

    it('should return empty array for unsupported paths', () => {
      const value = youtubeHandler.resolve('https://youtube.com/watch?v=abc123', '')

      expect(value).toEqual([])
    })
  })
})
