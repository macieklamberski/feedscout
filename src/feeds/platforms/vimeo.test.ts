import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry, DiscoverUriHint } from '../../common/types.js'
import { discoverUrisFromPlatform } from '../../common/uris/platform/index.js'
import { defaultPlatformOptions } from '../defaults.js'
import { parseVimeoUrl, type VimeoUrl, vimeoHandler } from './vimeo.js'

describe('parseVimeoUrl', () => {
  it('should return the channel for a channel page', () => {
    const expected: VimeoUrl = { kind: 'channel', channel: 'staffpicks' }

    expect(parseVimeoUrl('https://vimeo.com/channels/staffpicks')).toEqual(expected)
  })

  it('should return the group for a group page', () => {
    const expected: VimeoUrl = { kind: 'group', group: 'motion' }

    expect(parseVimeoUrl('https://vimeo.com/groups/motion')).toEqual(expected)
  })

  it('should return the album for a showcase page', () => {
    const expected: VimeoUrl = { kind: 'album', albumId: '12345' }

    expect(parseVimeoUrl('https://vimeo.com/showcase/12345')).toEqual(expected)
  })

  it('should return the likes for a likes page', () => {
    const expected: VimeoUrl = { kind: 'likes', username: 'someone' }

    expect(parseVimeoUrl('https://vimeo.com/someone/likes')).toEqual(expected)
  })

  it('should return the user for a user page', () => {
    const expected: VimeoUrl = { kind: 'user', username: 'someone' }

    expect(parseVimeoUrl('https://vimeo.com/someone')).toEqual(expected)
  })

  it('should return undefined for a video page', () => {
    expect(parseVimeoUrl('https://vimeo.com/123456')).toBeUndefined()
  })

  it('should return undefined for another host', () => {
    expect(parseVimeoUrl('https://example.com/someone')).toBeUndefined()
  })
})

describe('vimeoHandler', () => {
  describe('match', () => {
    const values: Array<[boolean, string]> = [
      [true, 'https://vimeo.com/casey'],
      [true, 'https://vimeo.com/channels/staffpicks'],
      [true, 'https://www.vimeo.com/user'],
      [false, 'https://example.org/user'],
      [false, 'https://example.com'],
    ]

    it.each(values)('should return %s for %s', (expected, url) => {
      expect(vimeoHandler.match(url)).toBe(expected)
    })

    it('should return false for invalid URL', () => {
      expect(vimeoHandler.match('not-a-url')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return empty array for a URL outside Vimeo', () => {
      expect(vimeoHandler.resolve('https://example.com/')).toEqual([])
    })

    it('should return videos feed for user page', () => {
      const value = 'https://vimeo.com/casey'
      const expected = [
        {
          uri: 'https://vimeo.com/casey/videos/rss',
          hint: { key: 'vimeo:videos', label: 'Videos' },
        },
      ]

      expect(vimeoHandler.resolve(value)).toEqual(expected)
    })

    it('should return the videos feed on the apex host over https for a www page over http', () => {
      const value = 'http://www.vimeo.com/casey'
      const expected = [
        {
          uri: 'https://vimeo.com/casey/videos/rss',
          hint: { key: 'vimeo:videos', label: 'Videos' },
        },
      ]

      expect(vimeoHandler.resolve(value)).toEqual(expected)
    })

    it('should return likes and videos feeds for likes page', () => {
      const value = 'https://vimeo.com/casey/likes'
      const expected = [
        {
          uri: 'https://vimeo.com/casey/likes/rss',
          hint: { key: 'vimeo:likes', label: 'Likes' },
        },
        {
          uri: 'https://vimeo.com/casey/videos/rss',
          hint: { key: 'vimeo:videos', label: 'Videos' },
        },
      ]

      expect(vimeoHandler.resolve(value)).toEqual(expected)
    })

    it('should return likes and videos feeds for likes page with a capitalized likes segment', () => {
      const value = 'https://vimeo.com/casey/Likes'
      const expected = [
        {
          uri: 'https://vimeo.com/casey/likes/rss',
          hint: { key: 'vimeo:likes', label: 'Likes' },
        },
        {
          uri: 'https://vimeo.com/casey/videos/rss',
          hint: { key: 'vimeo:videos', label: 'Videos' },
        },
      ]

      expect(vimeoHandler.resolve(value)).toEqual(expected)
    })

    it('should return videos feed for user subpage', () => {
      const value = 'https://vimeo.com/casey/videos'
      const expected = [
        {
          uri: 'https://vimeo.com/casey/videos/rss',
          hint: { key: 'vimeo:videos', label: 'Videos' },
        },
      ]

      expect(vimeoHandler.resolve(value)).toEqual(expected)
    })

    it('should return channel feed for channel page', () => {
      const value = 'https://vimeo.com/channels/staffpicks'
      const expected = [
        {
          uri: 'https://vimeo.com/channels/staffpicks/videos/rss',
          hint: { key: 'vimeo:channel', label: 'Channel' },
        },
      ]

      expect(vimeoHandler.resolve(value)).toEqual(expected)
    })

    it('should return channel feed for channel page with a capitalized channels segment', () => {
      const value = 'https://vimeo.com/Channels/staffpicks'
      const expected = [
        {
          uri: 'https://vimeo.com/channels/staffpicks/videos/rss',
          hint: { key: 'vimeo:channel', label: 'Channel' },
        },
      ]

      expect(vimeoHandler.resolve(value)).toEqual(expected)
    })

    it('should return channel feed for channel subpage', () => {
      const value = 'https://vimeo.com/channels/staffpicks/videos'
      const expected = [
        {
          uri: 'https://vimeo.com/channels/staffpicks/videos/rss',
          hint: { key: 'vimeo:channel', label: 'Channel' },
        },
      ]

      expect(vimeoHandler.resolve(value)).toEqual(expected)
    })

    it('should return group feed for group page', () => {
      const value = 'https://vimeo.com/groups/animation'
      const expected = [
        {
          uri: 'https://vimeo.com/groups/animation/videos/rss',
          hint: { key: 'vimeo:group', label: 'Group' },
        },
      ]

      expect(vimeoHandler.resolve(value)).toEqual(expected)
    })

    it('should return group feed for group page with a capitalized groups segment', () => {
      const value = 'https://vimeo.com/Groups/animation'
      const expected = [
        {
          uri: 'https://vimeo.com/groups/animation/videos/rss',
          hint: { key: 'vimeo:group', label: 'Group' },
        },
      ]

      expect(vimeoHandler.resolve(value)).toEqual(expected)
    })

    it('should return group feed for group subpage', () => {
      const value = 'https://vimeo.com/groups/animation/videos'
      const expected = [
        {
          uri: 'https://vimeo.com/groups/animation/videos/rss',
          hint: { key: 'vimeo:group', label: 'Group' },
        },
      ]

      expect(vimeoHandler.resolve(value)).toEqual(expected)
    })

    it('should return album feed for /album/{id}', () => {
      const value = 'https://vimeo.com/album/12345'
      const expected = [
        {
          uri: 'https://vimeo.com/album/12345/rss',
          hint: { key: 'vimeo:album', label: 'Album' },
        },
      ]

      expect(vimeoHandler.resolve(value)).toEqual(expected)
    })

    it('should return album feed for /album/{id}/subpage', () => {
      const value = 'https://vimeo.com/album/12345/something'
      const expected = [
        {
          uri: 'https://vimeo.com/album/12345/rss',
          hint: { key: 'vimeo:album', label: 'Album' },
        },
      ]

      expect(vimeoHandler.resolve(value)).toEqual(expected)
    })

    it('should return album feed for /showcase/{id} (rewritten to /album/)', () => {
      const value = 'https://vimeo.com/showcase/12345'
      const expected = [
        {
          uri: 'https://vimeo.com/album/12345/rss',
          hint: { key: 'vimeo:album', label: 'Album' },
        },
      ]

      expect(vimeoHandler.resolve(value)).toEqual(expected)
    })

    it('should return album feed for a capitalized /Showcase/{id}', () => {
      const value = 'https://vimeo.com/Showcase/12345'
      const expected = [
        {
          uri: 'https://vimeo.com/album/12345/rss',
          hint: { key: 'vimeo:album', label: 'Album' },
        },
      ]

      expect(vimeoHandler.resolve(value)).toEqual(expected)
    })

    it('should return empty array for non-numeric album id', () => {
      const value = 'https://vimeo.com/album/not-a-number'

      expect(vimeoHandler.resolve(value)).toEqual([])
    })

    it('should return empty array for root page', () => {
      const value = 'https://vimeo.com'

      expect(vimeoHandler.resolve(value)).toEqual([])
    })

    it('should return empty array for video pages', () => {
      const values = ['https://vimeo.com/12345', 'https://vimeo.com/999999999']

      for (const value of values) {
        expect(vimeoHandler.resolve(value)).toEqual([])
      }
    })
  })

  describe('getFeedHint', () => {
    it('should return the videos hint for a user videos feed', () => {
      const value = 'https://vimeo.com/alice/videos/rss'
      const expected: DiscoverUriHint = { key: 'vimeo:videos', label: 'Videos' }

      expect(vimeoHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the videos hint for a user videos feed on the www host over http', () => {
      const value = 'http://www.vimeo.com/alice/videos/rss'
      const expected: DiscoverUriHint = { key: 'vimeo:videos', label: 'Videos' }

      expect(vimeoHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the videos hint for a user all videos feed', () => {
      const value = 'https://vimeo.com/user12345/videos/all/rss'
      const expected: DiscoverUriHint = { key: 'vimeo:videos', label: 'Videos' }

      expect(vimeoHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the likes hint for a user likes feed', () => {
      const value = 'https://vimeo.com/alice/likes/rss'
      const expected: DiscoverUriHint = { key: 'vimeo:likes', label: 'Likes' }

      expect(vimeoHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the channel hint for a channel feed', () => {
      const value = 'https://vimeo.com/channels/staffpicks/videos/rss'
      const expected: DiscoverUriHint = { key: 'vimeo:channel', label: 'Channel' }

      expect(vimeoHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the channel hint for a channel feed with a numeric channel', () => {
      const value = 'https://vimeo.com/channels/12345/videos/rss'
      const expected: DiscoverUriHint = { key: 'vimeo:channel', label: 'Channel' }

      expect(vimeoHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the group hint for a group feed', () => {
      const value = 'https://vimeo.com/groups/example/videos/rss'
      const expected: DiscoverUriHint = { key: 'vimeo:group', label: 'Group' }

      expect(vimeoHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the album hint for an album feed', () => {
      const value = 'https://vimeo.com/album/12345/rss'
      const expected: DiscoverUriHint = { key: 'vimeo:album', label: 'Album' }

      expect(vimeoHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return undefined for a numeric first segment', () => {
      const value = 'https://vimeo.com/123456/videos/rss'

      expect(vimeoHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for a likes feed under the channels route', () => {
      const value = 'https://vimeo.com/channels/likes/rss'

      expect(vimeoHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for an album feed with a non-numeric id', () => {
      const value = 'https://vimeo.com/album/not-a-number/rss'

      expect(vimeoHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for a showcase feed', () => {
      const value = 'https://vimeo.com/showcase/12345/rss'

      expect(vimeoHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for the blog feed', () => {
      const value = 'https://vimeo.com/blog/feed.xml'

      expect(vimeoHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for a user page', () => {
      const value = 'https://vimeo.com/alice'

      expect(vimeoHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for another host', () => {
      const value = 'https://example.com/alice/videos/rss'

      expect(vimeoHandler.getFeedHint?.(value)).toBeUndefined()
    })
  })

  describe('own feeds through the Platform method', () => {
    const values: Array<[string, DiscoverUriEntry['hint']]> = [
      ['https://vimeo.com/alice/videos/rss', { key: 'vimeo:videos', label: 'Videos' }],
      ['https://vimeo.com/user12345/videos/all/rss', { key: 'vimeo:videos', label: 'Videos' }],
      ['https://vimeo.com/alice/likes/rss', { key: 'vimeo:likes', label: 'Likes' }],
      [
        'https://vimeo.com/channels/staffpicks/videos/rss',
        { key: 'vimeo:channel', label: 'Channel' },
      ],
      ['https://vimeo.com/channels/12345/videos/rss', { key: 'vimeo:channel', label: 'Channel' }],
      ['https://vimeo.com/groups/example/videos/rss', { key: 'vimeo:group', label: 'Group' }],
      ['https://vimeo.com/album/12345/rss', { key: 'vimeo:album', label: 'Album' }],
    ]

    it.each(values)('should return %s as itself', async (value, hint) => {
      const result = await discoverUrisFromPlatform(undefined, undefined, {
        ...defaultPlatformOptions,
        handlers: [vimeoHandler],
        baseUrl: value,
      })
      const expected: Array<DiscoverUriEntry> = [{ uri: value, hint }]

      expect(result).toEqual(expected)
    })
  })
})
