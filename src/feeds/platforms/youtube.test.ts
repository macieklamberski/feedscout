import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry } from '../../common/types.js'
import type { YoutubeUrl } from './youtube.js'
import { parseYoutubeUrl, youtubeHandler } from './youtube.js'

describe('parseYoutubeUrl', () => {
  it('should return the channel ID for a channel ID page', () => {
    const expected: YoutubeUrl = { kind: 'channel', channelId: 'UC1234567890' }

    expect(parseYoutubeUrl('https://youtube.com/channel/UC1234567890')).toEqual(expected)
  })

  it('should return the channel ID for a channel ID page on music.youtube.com', () => {
    const expected: YoutubeUrl = { kind: 'channel', channelId: 'UC1234567890' }

    expect(parseYoutubeUrl('https://music.youtube.com/channel/UC1234567890')).toEqual(expected)
  })

  it('should return a channel for handle, legacy user and custom URL pages', () => {
    const expected: YoutubeUrl = { kind: 'channel' }

    expect(parseYoutubeUrl('https://youtube.com/@veritasium')).toEqual(expected)
    expect(parseYoutubeUrl('https://youtube.com/user/pewdiepie')).toEqual(expected)
    expect(parseYoutubeUrl('https://youtube.com/c/mkbhd')).toEqual(expected)
  })

  it('should return a channel for the www and mobile hosts', () => {
    const expected: YoutubeUrl = { kind: 'channel' }

    expect(parseYoutubeUrl('https://www.youtube.com/@channel')).toEqual(expected)
    expect(parseYoutubeUrl('https://m.youtube.com/@channel')).toEqual(expected)
  })

  it('should return a channel with its playlist', () => {
    const expected: YoutubeUrl = { kind: 'channel', playlistId: 'PL1234567890' }

    expect(parseYoutubeUrl('https://youtube.com/@veritasium?list=PL1234567890')).toEqual(expected)
  })

  it('should return a watch page for a watch URL', () => {
    const expected: YoutubeUrl = { kind: 'watch' }

    expect(parseYoutubeUrl('https://youtube.com/watch?v=abc123')).toEqual(expected)
  })

  it('should return a watch page with its playlist', () => {
    const value = 'https://youtube.com/watch?v=abc123&list=PL1234567890'
    const expected: YoutubeUrl = { kind: 'watch', playlistId: 'PL1234567890' }

    expect(parseYoutubeUrl(value)).toEqual(expected)
  })

  it('should return a watch page for a youtu.be short link', () => {
    const expected: YoutubeUrl = { kind: 'watch' }

    expect(parseYoutubeUrl('https://youtu.be/dQw4w9WgXcQ')).toEqual(expected)
    expect(parseYoutubeUrl('https://www.youtu.be/dQw4w9WgXcQ')).toEqual(expected)
  })

  it('should return a watch page for a live URL', () => {
    const expected: YoutubeUrl = { kind: 'watch' }

    expect(parseYoutubeUrl('https://youtube.com/live/abc123')).toEqual(expected)
  })

  it('should return a short for a shorts URL', () => {
    const expected: YoutubeUrl = { kind: 'short' }

    expect(parseYoutubeUrl('https://youtube.com/shorts/abc123')).toEqual(expected)
  })

  it('should return a player page for a video ID outside the watch path', () => {
    const expected: YoutubeUrl = { kind: 'player' }

    expect(parseYoutubeUrl('https://youtube.com/watch_popup?v=abc123')).toEqual(expected)
  })

  it('should return the playlist for a playlist page', () => {
    const expected: YoutubeUrl = { kind: 'playlist', playlistId: 'PL1234567890' }

    expect(parseYoutubeUrl('https://youtube.com/playlist?list=PL1234567890')).toEqual(expected)
  })

  it('should return undefined for a channel path without a UC ID', () => {
    expect(parseYoutubeUrl('https://youtube.com/channel/abc')).toBeUndefined()
  })

  it('should return undefined for a watch path without a video ID', () => {
    expect(parseYoutubeUrl('https://youtube.com/watch')).toBeUndefined()
  })

  it('should return undefined for the root', () => {
    expect(parseYoutubeUrl('https://youtube.com/')).toBeUndefined()
    expect(parseYoutubeUrl('https://youtu.be/')).toBeUndefined()
  })

  it('should return undefined for another host', () => {
    expect(parseYoutubeUrl('https://vimeo.com/@channel')).toBeUndefined()
  })

  it('should return undefined for an invalid URL', () => {
    expect(parseYoutubeUrl('not-a-url')).toBeUndefined()
  })
})

describe('youtubeHandler', () => {
  describe('match', () => {
    it('should match a YouTube URL', () => {
      expect(youtubeHandler.match('https://youtube.com/@channel')).toBe(true)
    })

    it('should not match another host', () => {
      expect(youtubeHandler.match('https://vimeo.com/channel')).toBe(false)
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

    it('should extract channel ID from @handle page content', () => {
      const value = 'https://youtube.com/@veritasium'
      const content = '{"channelId":"UC1234567890"}'

      expect(youtubeHandler.resolve(value, content)).toEqual(expectedChannelFeeds)
    })

    it('should extract channel ID from externalId in consent page content', () => {
      const value = 'https://youtube.com/@testchannel'
      const content = '{"externalId":"UC1234567890"}'

      expect(youtubeHandler.resolve(value, content)).toEqual(expectedChannelFeeds)
    })

    it('should prefer the channel own externalId over a featured channel ID on a channel page', () => {
      const value = 'https://youtube.com/@testchannel'
      const content = `
        {"channelId":"UC0000000000"}
        {"externalId":"UC1234567890"}
      `

      expect(youtubeHandler.resolve(value, content)).toEqual(expectedChannelFeeds)
    })

    it('should extract channel ID from externalChannelId on a video page', () => {
      const value = 'https://youtube.com/watch?v=dQw4w9WgXcQ'
      const content = '{"externalChannelId":"UC1234567890"}'

      expect(youtubeHandler.resolve(value, content)).toEqual(expectedChannelFeeds)
    })

    it('should return empty array when @handle content has no channel ID', () => {
      const value = 'https://youtube.com/@nonexistent'

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

    it('should extract channel ID from /shorts/{id} URL content', () => {
      const value = 'https://youtube.com/shorts/abc123'
      const content = '{"channelId":"UC1234567890"}'

      expect(youtubeHandler.resolve(value, content)).toEqual(expectedChannelFeeds)
    })
  })
})
