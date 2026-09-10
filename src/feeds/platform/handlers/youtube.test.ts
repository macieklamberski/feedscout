import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry } from '../../../common/types.js'
import { youtubeHandler } from './youtube.js'

describe('youtubeHandler', () => {
  describe('match', () => {
    const cases = [
      ['https://youtube.com/@channel', true],
      ['https://www.youtube.com/@channel', true],
      ['https://m.youtube.com/@channel', true],
      ['https://music.youtube.com/channel/UC1234567890', true],
      ['https://youtu.be/dQw4w9WgXcQ', true],
      ['https://www.youtu.be/dQw4w9WgXcQ', true],
      ['https://vimeo.com/channel', false],
    ] as const

    it.each(cases)('%s -> %s', (url, expected) => {
      expect(youtubeHandler.match(url)).toBe(expected)
    })

    it('should return false for invalid URL', () => {
      expect(youtubeHandler.match('not-a-url')).toBe(false)
    })
  })

  describe('resolve', () => {
    const expectedChannelFeeds: Array<DiscoverUriEntry> = [
      {
        uri: [
          'https://www.youtube.com/feeds/videos.xml?channel_id=UC1234567890',
          'https://www.youtube.com/feeds/videos.xml?playlist_id=UU1234567890',
        ],
        hint: { key: 'youtube:all', label: 'All uploads' },
      },
      {
        uri: 'https://www.youtube.com/feeds/videos.xml?playlist_id=UULF1234567890',
        hint: { key: 'youtube:videos', label: 'Videos' },
      },
      {
        uri: 'https://www.youtube.com/feeds/videos.xml?playlist_id=UUSH1234567890',
        hint: { key: 'youtube:shorts', label: 'Shorts' },
      },
      {
        uri: 'https://www.youtube.com/feeds/videos.xml?playlist_id=UULV1234567890',
        hint: { key: 'youtube:live', label: 'Live streams' },
      },
      {
        uri: 'https://www.youtube.com/feeds/videos.xml?playlist_id=UULP1234567890',
        hint: { key: 'youtube:popular-videos', label: 'Popular videos' },
      },
      {
        uri: 'https://www.youtube.com/feeds/videos.xml?playlist_id=UUPS1234567890',
        hint: { key: 'youtube:popular-shorts', label: 'Popular shorts' },
      },
      {
        uri: 'https://www.youtube.com/feeds/videos.xml?playlist_id=UUPV1234567890',
        hint: { key: 'youtube:popular-live', label: 'Popular live streams' },
      },
      {
        uri: 'https://www.youtube.com/feeds/videos.xml?playlist_id=UUMO1234567890',
        hint: { key: 'youtube:member-videos', label: 'Member videos' },
      },
      {
        uri: 'https://www.youtube.com/feeds/videos.xml?playlist_id=UUMS1234567890',
        hint: { key: 'youtube:member-shorts', label: 'Member shorts' },
      },
      {
        uri: 'https://www.youtube.com/feeds/videos.xml?playlist_id=UUMV1234567890',
        hint: { key: 'youtube:member-live', label: 'Member live streams' },
      },
    ]

    it('should return all feed variants for channel ID', () => {
      const value = youtubeHandler.resolve('https://youtube.com/channel/UC1234567890')

      expect(value).toEqual(expectedChannelFeeds)
    })

    it('should return feed URL for playlist', () => {
      const value = youtubeHandler.resolve('https://youtube.com/playlist?list=PL1234567890')
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://www.youtube.com/feeds/videos.xml?playlist_id=PL1234567890',
          hint: { key: 'youtube:playlist', label: 'Playlist' },
        },
      ]

      expect(value).toEqual(expected)
    })

    it('should extract channel ID from @handle page content', () => {
      const value = youtubeHandler.resolve(
        'https://youtube.com/@veritasium',
        '{"channelId":"UC1234567890"}',
      )

      expect(value).toEqual(expectedChannelFeeds)
    })

    it('should extract channel ID from legacy /user/ page content', () => {
      const value = youtubeHandler.resolve(
        'https://youtube.com/user/pewdiepie',
        '{"channelId":"UC1234567890"}',
      )

      expect(value).toEqual(expectedChannelFeeds)
    })

    it('should extract channel ID from /c/ custom URL page content', () => {
      const value = youtubeHandler.resolve(
        'https://youtube.com/c/mkbhd',
        '{"channelId":"UC1234567890"}',
      )

      expect(value).toEqual(expectedChannelFeeds)
    })

    it('should extract channel ID from externalId in consent page content', () => {
      const value = youtubeHandler.resolve(
        'https://youtube.com/@testchannel',
        '{"externalId":"UC1234567890"}',
      )

      expect(value).toEqual(expectedChannelFeeds)
    })

    it('should return empty array when @handle content has no channel ID', () => {
      const value = youtubeHandler.resolve(
        'https://youtube.com/@nonexistent',
        '<html>No channel ID here</html>',
      )

      expect(value).toEqual([])
    })

    it('should return empty array when /user/ content has no channel ID', () => {
      const value = youtubeHandler.resolve(
        'https://youtube.com/user/nonexistent',
        '<html>No channel ID here</html>',
      )

      expect(value).toEqual([])
    })

    it('should return empty array when /c/ content has no channel ID', () => {
      const value = youtubeHandler.resolve(
        'https://youtube.com/c/nonexistent',
        '<html>No channel ID here</html>',
      )

      expect(value).toEqual([])
    })

    it('should return empty array for video page without content', () => {
      const value = youtubeHandler.resolve('https://youtube.com/watch?v=abc123')

      expect(value).toEqual([])
    })

    it('should extract channel ID from video page content', () => {
      const value = youtubeHandler.resolve(
        'https://youtube.com/watch?v=abc123',
        '{"channelId":"UC1234567890"}',
      )

      expect(value).toEqual(expectedChannelFeeds)
    })

    it('should extract channel ID from youtu.be short URL content', () => {
      const value = youtubeHandler.resolve(
        'https://youtu.be/abc123',
        '{"channelId":"UC1234567890"}',
      )

      expect(value).toEqual(expectedChannelFeeds)
    })

    it('should extract channel ID from /shorts/{id} URL content', () => {
      const value = youtubeHandler.resolve(
        'https://youtube.com/shorts/abc123',
        '{"channelId":"UC1234567890"}',
      )

      expect(value).toEqual(expectedChannelFeeds)
    })

    it('should extract channel ID from /live/{id} URL content', () => {
      const value = youtubeHandler.resolve(
        'https://youtube.com/live/abc123',
        '{"channelId":"UC1234567890"}',
      )

      expect(value).toEqual(expectedChannelFeeds)
    })

    it('should return empty array for /shorts/{id} without content', () => {
      const value = youtubeHandler.resolve('https://youtube.com/shorts/abc123')

      expect(value).toEqual([])
    })

    it('should return empty array for /live/{id} without content', () => {
      const value = youtubeHandler.resolve('https://youtube.com/live/abc123')

      expect(value).toEqual([])
    })
  })
})
