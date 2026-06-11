import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry } from '../../../common/types.js'
import { youtubeHandler } from './youtube.js'

describe('youtubeHandler', () => {
  describe('match', () => {
    const values: Array<[boolean, string]> = [
      [true, 'https://youtube.com/@channel'],
      [true, 'https://www.youtube.com/@channel'],
      [true, 'https://m.youtube.com/@channel'],
      [true, 'https://music.youtube.com/channel/UC1234567890'],
      [true, 'https://youtu.be/dQw4w9WgXcQ'],
      [true, 'https://www.youtu.be/dQw4w9WgXcQ'],
      [false, 'https://vimeo.com/channel'],
    ]

    it.each(values)('should return %s for %s', (expected, url) => {
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
      const value = 'https://youtube.com/channel/UC1234567890'

      expect(youtubeHandler.resolve(value)).toEqual(expectedChannelFeeds)
    })

    it('should return feed URL for playlist', () => {
      const value = 'https://youtube.com/playlist?list=PL1234567890'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://www.youtube.com/feeds/videos.xml?playlist_id=PL1234567890',
          hint: { key: 'youtube:playlist', label: 'Playlist' },
        },
      ]

      expect(youtubeHandler.resolve(value)).toEqual(expected)
    })

    it('should return only playlist feed for watch page with list param', () => {
      const value = 'https://youtube.com/watch?v=abc123&list=PL1234567890'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://www.youtube.com/feeds/videos.xml?playlist_id=PL1234567890',
          hint: { key: 'youtube:playlist', label: 'Playlist' },
        },
      ]

      expect(youtubeHandler.resolve(value, '{"channelId":"UC1234567890"}')).toEqual(expected)
    })

    it('should return all feed variants for channel ID on music.youtube.com', () => {
      const value = 'https://music.youtube.com/channel/UC1234567890'

      expect(youtubeHandler.resolve(value)).toEqual(expectedChannelFeeds)
    })

    it('should extract channel ID from @handle page content', () => {
      const value = 'https://youtube.com/@veritasium'
      const content = '{"channelId":"UC1234567890"}'

      expect(youtubeHandler.resolve(value, content)).toEqual(expectedChannelFeeds)
    })

    it('should extract channel ID from legacy /user/ page content', () => {
      const value = 'https://youtube.com/user/pewdiepie'
      const content = '{"channelId":"UC1234567890"}'

      expect(youtubeHandler.resolve(value, content)).toEqual(expectedChannelFeeds)
    })

    it('should extract channel ID from /c/ custom URL page content', () => {
      const value = 'https://youtube.com/c/mkbhd'
      const content = '{"channelId":"UC1234567890"}'

      expect(youtubeHandler.resolve(value, content)).toEqual(expectedChannelFeeds)
    })

    it('should extract channel ID from externalId in consent page content', () => {
      const value = 'https://youtube.com/@testchannel'
      const content = '{"externalId":"UC1234567890"}'

      expect(youtubeHandler.resolve(value, content)).toEqual(expectedChannelFeeds)
    })

    it('should return empty array when @handle content has no channel ID', () => {
      const value = 'https://youtube.com/@nonexistent'

      expect(youtubeHandler.resolve(value, '<html>No channel ID here</html>')).toEqual([])
    })

    it('should return empty array when /user/ content has no channel ID', () => {
      const value = 'https://youtube.com/user/nonexistent'

      expect(youtubeHandler.resolve(value, '<html>No channel ID here</html>')).toEqual([])
    })

    it('should return empty array when /c/ content has no channel ID', () => {
      const value = 'https://youtube.com/c/nonexistent'

      expect(youtubeHandler.resolve(value, '<html>No channel ID here</html>')).toEqual([])
    })

    it('should return empty array for video page without content', () => {
      expect(youtubeHandler.resolve('https://youtube.com/watch?v=abc123')).toEqual([])
    })

    it('should extract channel ID from video page content', () => {
      const value = 'https://youtube.com/watch?v=abc123'
      const content = '{"channelId":"UC1234567890"}'

      expect(youtubeHandler.resolve(value, content)).toEqual(expectedChannelFeeds)
    })

    it('should extract channel ID from youtu.be short URL content', () => {
      const value = 'https://youtu.be/abc123'
      const content = '{"channelId":"UC1234567890"}'

      expect(youtubeHandler.resolve(value, content)).toEqual(expectedChannelFeeds)
    })

    it('should extract channel ID from /shorts/{id} URL content', () => {
      const value = 'https://youtube.com/shorts/abc123'
      const content = '{"channelId":"UC1234567890"}'

      expect(youtubeHandler.resolve(value, content)).toEqual(expectedChannelFeeds)
    })

    it('should extract channel ID from /live/{id} URL content', () => {
      const value = 'https://youtube.com/live/abc123'
      const content = '{"channelId":"UC1234567890"}'

      expect(youtubeHandler.resolve(value, content)).toEqual(expectedChannelFeeds)
    })

    it('should return empty array for /shorts/{id} without content', () => {
      expect(youtubeHandler.resolve('https://youtube.com/shorts/abc123')).toEqual([])
    })

    it('should return empty array for /live/{id} without content', () => {
      expect(youtubeHandler.resolve('https://youtube.com/live/abc123')).toEqual([])
    })

    it.todo('should define behavior for invalid URL input', () => {
      // resolve('not-a-url') currently throws a TypeError from the unguarded new URL call; the
      // desired contract (throw vs empty array) is undecided.
    })
  })
})
