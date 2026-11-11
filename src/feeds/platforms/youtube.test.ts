import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry, DiscoverUriHint } from '../../common/types.js'
import { discoverUrisFromPlatform } from '../../common/uris/platform/index.js'
import { defaultPlatformOptions } from '../defaults.js'
import type { YoutubePage, YoutubeUrl } from './youtube.js'
import { getYoutubePage, parseYoutubeUrl, youtubeHandler } from './youtube.js'

describe('parseYoutubeUrl', () => {
  const handleValues: Array<string> = [
    'https://www.youtube.com/@ęęę.dasdsa',
    'https://www.youtube.com/@%C4%99%C4%99%C4%99.dasdsa',
    'https://www.youtube.com/@müller.x',
  ]

  it.each(handleValues)(
    'should return the channel for the handle with accents and a dot %s',
    (value) => {
      const expected: YoutubeUrl = { kind: 'channel', playlistId: undefined }

      expect(parseYoutubeUrl(value)).toEqual(expected)
    },
  )

  const feedlessListValues: Array<string> = [
    'https://www.youtube.com/watch?v=abc&list=RDabc',
    'https://www.youtube.com/watch?v=abc&list=WL',
    'https://www.youtube.com/watch?v=abc&list=LL',
  ]

  it.each(feedlessListValues)('should drop a list without a feed from %s', (value) => {
    const expected: YoutubeUrl = { kind: 'watch', playlistId: undefined }

    expect(parseYoutubeUrl(value)).toEqual(expected)
  })

  it('should keep a curated YouTube Music list', () => {
    const expected: YoutubeUrl = { kind: 'watch', playlistId: 'RDCLAK5uy_abc' }

    expect(parseYoutubeUrl('https://www.youtube.com/watch?v=abc&list=RDCLAK5uy_abc')).toEqual(
      expected,
    )
  })

  it('should return the channel ID for a channel ID page', () => {
    const expected: YoutubeUrl = { kind: 'channel', channelId: 'UC1234567890' }

    expect(parseYoutubeUrl('https://youtube.com/channel/UC1234567890')).toEqual(expected)
  })

  it('should return the channel ID for a channel ID page with a capitalized channel segment', () => {
    const expected: YoutubeUrl = { kind: 'channel', channelId: 'UC1234567890' }

    expect(parseYoutubeUrl('https://youtube.com/Channel/UC1234567890')).toEqual(expected)
  })

  it('should return the channel ID for a channel ID page on music.youtube.com', () => {
    const expected: YoutubeUrl = { kind: 'channel', channelId: 'UC1234567890' }

    expect(parseYoutubeUrl('https://music.youtube.com/channel/UC1234567890')).toEqual(expected)
  })

  it('should return the channel ID for a channel ID with a feed extension', () => {
    const expected: YoutubeUrl = { kind: 'channel', channelId: 'UCBR8-60-B28hp2BmDPdntcQ' }

    expect(parseYoutubeUrl('https://youtube.com/channel/UCBR8-60-B28hp2BmDPdntcQ.rss')).toEqual(
      expected,
    )
  })

  it('should return undefined for a channel ID followed by other characters', () => {
    const value = 'https://youtube.com/channel/UCBR8-60-B28hp2BmDPdntcQ&feature=x'

    expect(parseYoutubeUrl(value)).toBeUndefined()
  })

  it('should return a channel for handle, legacy user and custom URL pages', () => {
    const expected: YoutubeUrl = { kind: 'channel' }

    expect(parseYoutubeUrl('https://youtube.com/@veritasium')).toEqual(expected)
    expect(parseYoutubeUrl('https://youtube.com/user/pewdiepie')).toEqual(expected)
    expect(parseYoutubeUrl('https://youtube.com/c/mkbhd')).toEqual(expected)
  })

  it('should return a channel for a capitalized channel path', () => {
    const expected: YoutubeUrl = { kind: 'channel' }

    expect(parseYoutubeUrl('https://youtube.com/User/pewdiepie')).toEqual(expected)
  })

  it('should return a channel for a custom URL page with a capitalized c segment', () => {
    const expected: YoutubeUrl = { kind: 'channel' }

    expect(parseYoutubeUrl('https://youtube.com/C/mkbhd')).toEqual(expected)
  })

  it('should return undefined for a channel ID without the uppercase UC prefix', () => {
    expect(parseYoutubeUrl('https://youtube.com/channel/ucabc123')).toBeUndefined()
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

  it('should return a watch page for a watch URL with a capitalized watch segment', () => {
    const expected: YoutubeUrl = { kind: 'watch' }

    expect(parseYoutubeUrl('https://youtube.com/Watch?v=abc123')).toEqual(expected)
  })

  it('should return a watch page for a watch URL with trailing slash', () => {
    const expected: YoutubeUrl = { kind: 'watch' }

    expect(parseYoutubeUrl('https://youtube.com/watch/?v=abc123')).toEqual(expected)
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

  it('should return a watch page for a live URL with a capitalized live segment', () => {
    const expected: YoutubeUrl = { kind: 'watch' }

    expect(parseYoutubeUrl('https://youtube.com/Live/abc123')).toEqual(expected)
  })

  it('should return a short for a shorts URL', () => {
    const expected: YoutubeUrl = { kind: 'short' }

    expect(parseYoutubeUrl('https://youtube.com/shorts/abc123')).toEqual(expected)
  })

  it('should return a short for a shorts URL with a capitalized shorts segment', () => {
    const expected: YoutubeUrl = { kind: 'short' }

    expect(parseYoutubeUrl('https://youtube.com/Shorts/abc123')).toEqual(expected)
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
    expect(parseYoutubeUrl('https://example.com/@channel')).toBeUndefined()
  })

  it('should return undefined for an invalid URL', () => {
    expect(parseYoutubeUrl('not-a-url')).toBeUndefined()
  })
})

describe('getYoutubePage', () => {
  const channelIdHtml = '{"channelId":"UC1234567890"}'

  it('should return the channel ID a handle page carries', () => {
    const value = 'https://www.youtube.com/@example'
    const expected: YoutubePage = { kind: 'channel', channelId: 'UC1234567890' }

    expect(getYoutubePage(value, channelIdHtml)).toEqual(expected)
  })

  it('should return the uploader a video page carries', () => {
    const value = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
    const expected: YoutubePage = { kind: 'watch', channelId: 'UC1234567890' }

    expect(getYoutubePage(value, channelIdHtml)).toEqual(expected)
  })

  it('should keep the channel ID of a channel URL over the content', () => {
    const value = 'https://www.youtube.com/channel/UCabcdefghij'
    const expected: YoutubePage = { kind: 'channel', channelId: 'UCabcdefghij' }

    expect(getYoutubePage(value, channelIdHtml)).toEqual(expected)
  })

  it('should leave out the content channel ID for a video in a playlist', () => {
    const value = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ&list=PL1234567890'
    const expected: YoutubePage = { kind: 'watch', playlistId: 'PL1234567890' }

    expect(getYoutubePage(value, channelIdHtml)).toEqual(expected)
  })

  it('should return the page without a channel ID when the content carries none', () => {
    const value = 'https://www.youtube.com/@example'
    const expected: YoutubePage = { kind: 'channel' }

    expect(getYoutubePage(value, '<html></html>')).toEqual(expected)
  })

  it('should return undefined for another host', () => {
    expect(getYoutubePage('https://example.com/@example', channelIdHtml)).toBeUndefined()
  })
})

describe('youtubeHandler', () => {
  describe('match', () => {
    it('should match a YouTube URL', () => {
      expect(youtubeHandler.match('https://youtube.com/@channel')).toBe(true)
    })

    it('should not match another host', () => {
      expect(youtubeHandler.match('https://example.com/channel')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should encode the playlist id in the feed URL', () => {
      const value = 'https://www.youtube.com/playlist?list=PL1%26x%3D2'
      const expected = [
        {
          uri: 'https://www.youtube.com/feeds/videos.xml?playlist_id=PL1%26x=2',
          hint: { key: 'youtube:playlist', label: 'Playlist' },
        },
      ]

      expect(youtubeHandler.resolve(value)).toEqual(expected)
    })

    it('should return empty array for a URL outside YouTube', () => {
      expect(youtubeHandler.resolve('https://example.com/')).toEqual([])
    })

    const expectedChannelFeeds = [
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
      const expected = [
        {
          uri: 'https://www.youtube.com/feeds/videos.xml?playlist_id=PL1234567890',
          hint: { key: 'youtube:playlist', label: 'Playlist' },
        },
      ]

      expect(youtubeHandler.resolve(value)).toEqual(expected)
    })

    it('should return only playlist feed for watch page with list param', () => {
      const value = 'https://youtube.com/watch?v=abc123&list=PL1234567890'
      const expected = [
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

  describe('getFeedKey', () => {
    const channelFeedKeys: Array<[string, string]> = [
      [
        'https://www.youtube.com/feeds/videos.xml?channel_id=UCh63NPM0o2atIXHQQjqfIqA',
        'youtube:all',
      ],
      [
        'https://www.youtube.com/feeds/videos.xml?playlist_id=UUh63NPM0o2atIXHQQjqfIqA',
        'youtube:all',
      ],
      [
        'https://www.youtube.com/feeds/videos.xml?playlist_id=UULFh63NPM0o2atIXHQQjqfIqA',
        'youtube:videos',
      ],
      [
        'https://www.youtube.com/feeds/videos.xml?playlist_id=UUSHh63NPM0o2atIXHQQjqfIqA',
        'youtube:shorts',
      ],
      [
        'https://www.youtube.com/feeds/videos.xml?playlist_id=UULVh63NPM0o2atIXHQQjqfIqA',
        'youtube:live',
      ],
      [
        'https://www.youtube.com/feeds/videos.xml?playlist_id=UULPh63NPM0o2atIXHQQjqfIqA',
        'youtube:popular-videos',
      ],
      [
        'https://www.youtube.com/feeds/videos.xml?playlist_id=UUPSh63NPM0o2atIXHQQjqfIqA',
        'youtube:popular-shorts',
      ],
      [
        'https://www.youtube.com/feeds/videos.xml?playlist_id=UUPVh63NPM0o2atIXHQQjqfIqA',
        'youtube:popular-live',
      ],
      [
        'https://www.youtube.com/feeds/videos.xml?playlist_id=UUMOh63NPM0o2atIXHQQjqfIqA',
        'youtube:member-videos',
      ],
      [
        'https://www.youtube.com/feeds/videos.xml?playlist_id=UUMSh63NPM0o2atIXHQQjqfIqA',
        'youtube:member-shorts',
      ],
      [
        'https://www.youtube.com/feeds/videos.xml?playlist_id=UUMVh63NPM0o2atIXHQQjqfIqA',
        'youtube:member-live',
      ],
    ]

    it.each(channelFeedKeys)('should return the key of the channel feed %s', (value, expected) => {
      expect(youtubeHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return the key of a channel feed with a capitalized path and no www', () => {
      const value = 'https://youtube.com/Feeds/Videos.xml?playlist_id=UULFh63NPM0o2atIXHQQjqfIqA'
      const expected = 'youtube:videos'

      expect(youtubeHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return the playlist key for a playlist feed', () => {
      const value =
        'https://www.youtube.com/feeds/videos.xml?playlist_id=OLAK5uy_lmKuYKcDhQg3fS7o3Ql9Q41XabFKm02_M'
      const expected = 'youtube:playlist'

      expect(youtubeHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return the channel key for an uploads list whose channel ID starts with a prefix', () => {
      const value = 'https://www.youtube.com/feeds/videos.xml?playlist_id=UULFHVgbSwvTgM1PcsOCvHjw'
      const expected = 'youtube:all'

      expect(youtubeHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return the videos key for a videos list whose channel ID starts with a prefix', () => {
      const value =
        'https://www.youtube.com/feeds/videos.xml?playlist_id=UULFLFHVgbSwvTgM1PcsOCvHjw'
      const expected = 'youtube:videos'

      expect(youtubeHandler.getFeedKey?.(value)).toBe(expected)
    })

    const notUploadsFeedValues: Array<string> = [
      'https://www.youtube.com/feeds/videos.xml?playlist_id=PLmxmP8p3bUU34kLdPVeYn3taksN_hOH6L',
      'https://www.youtube.com/feeds/videos.xml?playlist_id=uulfh63NPM0o2atIXHQQjqfIqA',
      'https://www.youtube.com/feeds/videos.xml?playlist_id=UUOGFVzj8CefByxicwh4etbwu',
    ]

    it.each(notUploadsFeedValues)('should return the playlist key for %s', (value) => {
      const expected = 'youtube:playlist'

      expect(youtubeHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return undefined for a channel feed without the UC prefix', () => {
      const value = 'https://www.youtube.com/feeds/videos.xml?channel_id=abc'

      expect(youtubeHandler.getFeedKey?.(value)).toBeUndefined()
    })

    it('should return undefined for a feed without a channel or playlist', () => {
      const value = 'https://www.youtube.com/feeds/videos.xml'

      expect(youtubeHandler.getFeedKey?.(value)).toBeUndefined()
    })

    it('should return undefined for a channel page', () => {
      const value = 'https://www.youtube.com/channel/UCh63NPM0o2atIXHQQjqfIqA'

      expect(youtubeHandler.getFeedKey?.(value)).toBeUndefined()
    })

    it('should return undefined for another host', () => {
      const value = 'https://example.com/feeds/videos.xml?channel_id=UCh63NPM0o2atIXHQQjqfIqA'

      expect(youtubeHandler.getFeedKey?.(value)).toBeUndefined()
    })
  })
})

describe('discoverUrisFromPlatform', () => {
  const ownFeeds: Array<[string, DiscoverUriHint]> = [
    [
      'https://www.youtube.com/feeds/videos.xml?channel_id=UCh63NPM0o2atIXHQQjqfIqA',
      { key: 'youtube:all', label: 'All uploads' },
    ],
    [
      'https://www.youtube.com/feeds/videos.xml?playlist_id=UUh63NPM0o2atIXHQQjqfIqA',
      { key: 'youtube:all', label: 'All uploads' },
    ],
    [
      'https://www.youtube.com/feeds/videos.xml?playlist_id=UULFh63NPM0o2atIXHQQjqfIqA',
      { key: 'youtube:videos', label: 'Videos' },
    ],
    [
      'https://www.youtube.com/feeds/videos.xml?playlist_id=UUSHh63NPM0o2atIXHQQjqfIqA',
      { key: 'youtube:shorts', label: 'Shorts' },
    ],
    [
      'https://www.youtube.com/feeds/videos.xml?playlist_id=UULVh63NPM0o2atIXHQQjqfIqA',
      { key: 'youtube:live', label: 'Live streams' },
    ],
    [
      'https://www.youtube.com/feeds/videos.xml?playlist_id=UULPh63NPM0o2atIXHQQjqfIqA',
      { key: 'youtube:popular-videos', label: 'Popular videos' },
    ],
    [
      'https://www.youtube.com/feeds/videos.xml?playlist_id=UUPSh63NPM0o2atIXHQQjqfIqA',
      { key: 'youtube:popular-shorts', label: 'Popular shorts' },
    ],
    [
      'https://www.youtube.com/feeds/videos.xml?playlist_id=UUPVh63NPM0o2atIXHQQjqfIqA',
      { key: 'youtube:popular-live', label: 'Popular live streams' },
    ],
    [
      'https://www.youtube.com/feeds/videos.xml?playlist_id=UUMOh63NPM0o2atIXHQQjqfIqA',
      { key: 'youtube:member-videos', label: 'Member videos' },
    ],
    [
      'https://www.youtube.com/feeds/videos.xml?playlist_id=UUMSh63NPM0o2atIXHQQjqfIqA',
      { key: 'youtube:member-shorts', label: 'Member shorts' },
    ],
    [
      'https://www.youtube.com/feeds/videos.xml?playlist_id=UUMVh63NPM0o2atIXHQQjqfIqA',
      { key: 'youtube:member-live', label: 'Member live streams' },
    ],
    [
      'https://www.youtube.com/feeds/videos.xml?playlist_id=OLAK5uy_lmKuYKcDhQg3fS7o3Ql9Q41XabFKm02_M',
      { key: 'youtube:playlist', label: 'Playlist' },
    ],
  ]

  it.each(ownFeeds)('should return %s as itself', async (value, hint) => {
    const options = {
      ...defaultPlatformOptions,
      handlers: [youtubeHandler],
      baseUrl: value,
    }
    const expected: Array<DiscoverUriEntry> = [{ uri: value, hint }]

    expect(await discoverUrisFromPlatform(undefined, undefined, options)).toEqual(expected)
  })
})
