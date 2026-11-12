import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry, DiscoverUriHint } from '../../common/types.js'
import { discoverUrisFromPlatform } from '../../common/uris/platform/index.js'
import { defaultPlatformOptions } from '../defaults.js'
import type { NebulaUrl } from './nebula.js'
import { nebulaHandler, parseNebulaUrl } from './nebula.js'

describe('parseNebulaUrl', () => {
  it('should return the slug for a channel page', () => {
    const expected: NebulaUrl = { kind: 'channel', slug: 'realengineering' }

    expect(parseNebulaUrl('https://nebula.tv/realengineering')).toEqual(expected)
  })

  it('should return the slug for a channel subpage', () => {
    const value = 'https://nebula.tv/realengineering/videos/some-video'
    const expected: NebulaUrl = { kind: 'channel', slug: 'realengineering' }

    expect(parseNebulaUrl(value)).toEqual(expected)
  })

  it('should return the slug for the www host', () => {
    const value = 'https://www.nebula.tv/realengineering'
    const expected: NebulaUrl = { kind: 'channel', slug: 'realengineering' }

    expect(parseNebulaUrl(value)).toEqual(expected)
  })

  it('should return explore for the home page', () => {
    const expected: NebulaUrl = { kind: 'explore' }

    expect(parseNebulaUrl('https://nebula.tv/')).toEqual(expected)
  })

  it('should return explore for videos pages', () => {
    const expected: NebulaUrl = { kind: 'explore' }

    expect(parseNebulaUrl('https://nebula.tv/videos')).toEqual(expected)
    expect(parseNebulaUrl('https://nebula.tv/videos/realengineering-why-ships-float')).toEqual(
      expected,
    )
  })

  it('should return explore with the category of an explore page', () => {
    const expected: NebulaUrl = { kind: 'explore', category: 'Science' }

    expect(parseNebulaUrl('https://nebula.tv/explore?category=Science')).toEqual(expected)
  })

  it('should return explore for explore pages in any case', () => {
    const expected: NebulaUrl = { kind: 'explore' }

    expect(parseNebulaUrl('https://nebula.tv/Explore')).toEqual(expected)
  })

  it('should return undefined for another host', () => {
    expect(parseNebulaUrl('https://example.com/realengineering')).toBeUndefined()
  })

  it('should return undefined for an invalid URL', () => {
    expect(parseNebulaUrl('not-a-url')).toBeUndefined()
  })
})

describe('nebulaHandler', () => {
  describe('match', () => {
    it('should match a nebula.tv URL', () => {
      expect(nebulaHandler.match('https://nebula.tv')).toBe(true)
    })

    it('should not match another host', () => {
      expect(nebulaHandler.match('https://example.com')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return free and Plus feeds for channel', () => {
      const value = 'https://nebula.tv/realengineering'
      const expected = [
        {
          uri: 'https://rss.nebula.app/video/channels/realengineering.rss',
          hint: { key: 'nebula:videos', label: 'Videos' },
        },
        {
          uri: 'https://rss.nebula.app/video/channels/realengineering.rss?plus=true',
          hint: { key: 'nebula:videos-plus', label: 'Videos (Plus)' },
        },
      ]

      expect(nebulaHandler.resolve(value)).toEqual(expected)
    })

    it('should return global feeds for root path', () => {
      const value = 'https://nebula.tv/'
      const expected = [
        {
          uri: 'https://rss.nebula.app/video.rss',
          hint: { key: 'nebula:videos-all', label: 'All Videos' },
        },
        {
          uri: 'https://rss.nebula.app/video.rss?plus=true',
          hint: { key: 'nebula:videos-all-plus', label: 'All Videos (Plus)' },
        },
        {
          uri: 'https://rss.nebula.app/video/categories/originals.rss',
          hint: { key: 'nebula:originals', label: 'Nebula Originals' },
        },
        {
          uri: 'https://rss.nebula.app/video/channels.rss',
          hint: { key: 'nebula:channels', label: 'Recently Added Channels' },
        },
      ]

      expect(nebulaHandler.resolve(value)).toEqual(expected)
    })

    it('should return global feeds for /videos', () => {
      const value = 'https://nebula.tv/videos'
      const expected = [
        {
          uri: 'https://rss.nebula.app/video.rss',
          hint: { key: 'nebula:videos-all', label: 'All Videos' },
        },
        {
          uri: 'https://rss.nebula.app/video.rss?plus=true',
          hint: { key: 'nebula:videos-all-plus', label: 'All Videos (Plus)' },
        },
        {
          uri: 'https://rss.nebula.app/video/categories/originals.rss',
          hint: { key: 'nebula:originals', label: 'Nebula Originals' },
        },
        {
          uri: 'https://rss.nebula.app/video/channels.rss',
          hint: { key: 'nebula:channels', label: 'Recently Added Channels' },
        },
      ]

      expect(nebulaHandler.resolve(value)).toEqual(expected)
    })

    it('should return global feeds for /videos in any case', () => {
      const value = 'https://nebula.tv/Videos'
      const expected = [
        {
          uri: 'https://rss.nebula.app/video.rss',
          hint: { key: 'nebula:videos-all', label: 'All Videos' },
        },
        {
          uri: 'https://rss.nebula.app/video.rss?plus=true',
          hint: { key: 'nebula:videos-all-plus', label: 'All Videos (Plus)' },
        },
        {
          uri: 'https://rss.nebula.app/video/categories/originals.rss',
          hint: { key: 'nebula:originals', label: 'Nebula Originals' },
        },
        {
          uri: 'https://rss.nebula.app/video/channels.rss',
          hint: { key: 'nebula:channels', label: 'Recently Added Channels' },
        },
      ]

      expect(nebulaHandler.resolve(value)).toEqual(expected)
    })

    it('should return global feeds for /explore', () => {
      const value = 'https://nebula.tv/explore'
      const expected = [
        {
          uri: 'https://rss.nebula.app/video.rss',
          hint: { key: 'nebula:videos-all', label: 'All Videos' },
        },
        {
          uri: 'https://rss.nebula.app/video.rss?plus=true',
          hint: { key: 'nebula:videos-all-plus', label: 'All Videos (Plus)' },
        },
        {
          uri: 'https://rss.nebula.app/video/categories/originals.rss',
          hint: { key: 'nebula:originals', label: 'Nebula Originals' },
        },
        {
          uri: 'https://rss.nebula.app/video/channels.rss',
          hint: { key: 'nebula:channels', label: 'Recently Added Channels' },
        },
      ]

      expect(nebulaHandler.resolve(value)).toEqual(expected)
    })

    it('should return global feeds for /explore/{tab}', () => {
      const value = 'https://nebula.tv/explore/podcasts'
      const expected = [
        {
          uri: 'https://rss.nebula.app/video.rss',
          hint: { key: 'nebula:videos-all', label: 'All Videos' },
        },
        {
          uri: 'https://rss.nebula.app/video.rss?plus=true',
          hint: { key: 'nebula:videos-all-plus', label: 'All Videos (Plus)' },
        },
        {
          uri: 'https://rss.nebula.app/video/categories/originals.rss',
          hint: { key: 'nebula:originals', label: 'Nebula Originals' },
        },
        {
          uri: 'https://rss.nebula.app/video/channels.rss',
          hint: { key: 'nebula:channels', label: 'Recently Added Channels' },
        },
      ]

      expect(nebulaHandler.resolve(value)).toEqual(expected)
    })

    it('should return category feeds when category query is set', () => {
      const value = 'https://nebula.tv/videos?category=technology'
      const expected = [
        {
          uri: 'https://rss.nebula.app/video/categories/technology.rss',
          hint: { key: 'nebula:category', label: 'Category' },
        },
        {
          uri: 'https://rss.nebula.app/video/categories/technology.rss?plus=true',
          hint: { key: 'nebula:category-plus', label: 'Category (Plus)' },
        },
        {
          uri: 'https://rss.nebula.app/video.rss',
          hint: { key: 'nebula:videos-all', label: 'All Videos' },
        },
        {
          uri: 'https://rss.nebula.app/video.rss?plus=true',
          hint: { key: 'nebula:videos-all-plus', label: 'All Videos (Plus)' },
        },
        {
          uri: 'https://rss.nebula.app/video/categories/originals.rss',
          hint: { key: 'nebula:originals', label: 'Nebula Originals' },
        },
        {
          uri: 'https://rss.nebula.app/video/channels.rss',
          hint: { key: 'nebula:channels', label: 'Recently Added Channels' },
        },
      ]

      expect(nebulaHandler.resolve(value)).toEqual(expected)
    })

    it('should keep the category query value case', () => {
      const value = 'https://nebula.tv/explore?category=Science'
      const expected = [
        {
          uri: 'https://rss.nebula.app/video/categories/Science.rss',
          hint: { key: 'nebula:category', label: 'Category' },
        },
        {
          uri: 'https://rss.nebula.app/video/categories/Science.rss?plus=true',
          hint: { key: 'nebula:category-plus', label: 'Category (Plus)' },
        },
        {
          uri: 'https://rss.nebula.app/video.rss',
          hint: { key: 'nebula:videos-all', label: 'All Videos' },
        },
        {
          uri: 'https://rss.nebula.app/video.rss?plus=true',
          hint: { key: 'nebula:videos-all-plus', label: 'All Videos (Plus)' },
        },
        {
          uri: 'https://rss.nebula.app/video/categories/originals.rss',
          hint: { key: 'nebula:originals', label: 'Nebula Originals' },
        },
        {
          uri: 'https://rss.nebula.app/video/channels.rss',
          hint: { key: 'nebula:channels', label: 'Recently Added Channels' },
        },
      ]

      expect(nebulaHandler.resolve(value)).toEqual(expected)
    })

    it('should escape a slash in the category', () => {
      const value = 'https://nebula.tv/explore/videos?category=science%2Ftech'
      const expected = [
        {
          uri: 'https://rss.nebula.app/video/categories/science%2Ftech.rss',
          hint: { key: 'nebula:category', label: 'Category' },
        },
        {
          uri: 'https://rss.nebula.app/video/categories/science%2Ftech.rss?plus=true',
          hint: { key: 'nebula:category-plus', label: 'Category (Plus)' },
        },
        {
          uri: 'https://rss.nebula.app/video.rss',
          hint: { key: 'nebula:videos-all', label: 'All Videos' },
        },
        {
          uri: 'https://rss.nebula.app/video.rss?plus=true',
          hint: { key: 'nebula:videos-all-plus', label: 'All Videos (Plus)' },
        },
        {
          uri: 'https://rss.nebula.app/video/categories/originals.rss',
          hint: { key: 'nebula:originals', label: 'Nebula Originals' },
        },
        {
          uri: 'https://rss.nebula.app/video/channels.rss',
          hint: { key: 'nebula:channels', label: 'Recently Added Channels' },
        },
      ]

      expect(nebulaHandler.resolve(value)).toEqual(expected)
    })
  })

  describe('getFeedHint', () => {
    it('should return the videos hint for a channel feed', () => {
      const value = 'https://rss.nebula.app/video/channels/royal-ocean-film-society.rss'
      const expected: DiscoverUriHint = { key: 'nebula:videos', label: 'Videos' }

      expect(nebulaHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the videos plus hint for a channel Plus feed', () => {
      const value = 'https://rss.nebula.app/video/channels/extremities.rss?plus=true'
      const expected: DiscoverUriHint = { key: 'nebula:videos-plus', label: 'Videos (Plus)' }

      expect(nebulaHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the originals hint for the Originals feed', () => {
      const value = 'https://rss.nebula.app/video/categories/originals.rss'
      const expected: DiscoverUriHint = { key: 'nebula:originals', label: 'Nebula Originals' }

      expect(nebulaHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the category hint for a category feed', () => {
      const value = 'https://rss.nebula.app/video/categories/technology.rss'
      const expected: DiscoverUriHint = { key: 'nebula:category', label: 'Category' }

      expect(nebulaHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the category plus hint for a category Plus feed', () => {
      const value = 'https://rss.nebula.app/video/categories/technology.rss?plus=true'
      const expected: DiscoverUriHint = { key: 'nebula:category-plus', label: 'Category (Plus)' }

      expect(nebulaHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the videos all hint for the all videos feed', () => {
      const value = 'https://rss.nebula.app/video.rss'
      const expected: DiscoverUriHint = { key: 'nebula:videos-all', label: 'All Videos' }

      expect(nebulaHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the videos all plus hint for the all videos Plus feed', () => {
      const value = 'https://rss.nebula.app/video.rss?plus=true'
      const expected: DiscoverUriHint = {
        key: 'nebula:videos-all-plus',
        label: 'All Videos (Plus)',
      }

      expect(nebulaHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the channels hint for the recently added channels feed', () => {
      const value = 'https://rss.nebula.app/video/channels.rss'
      const expected: DiscoverUriHint = { key: 'nebula:channels', label: 'Recently Added Channels' }

      expect(nebulaHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return undefined for a channel page', () => {
      const value = 'https://nebula.tv/royal-ocean-film-society'

      expect(nebulaHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for a channel feed path on nebula.tv', () => {
      const value = 'https://nebula.tv/video/channels/extremities.rss'

      expect(nebulaHandler.getFeedHint?.(value)).toBeUndefined()
    })
  })

  describe('own feeds through the Platform method', () => {
    const ownFeeds: Array<[string, DiscoverUriHint]> = [
      [
        'https://rss.nebula.app/video/channels/royal-ocean-film-society.rss',
        { key: 'nebula:videos', label: 'Videos' },
      ],
      [
        'https://rss.nebula.app/video/channels/extremities.rss?plus=true',
        { key: 'nebula:videos-plus', label: 'Videos (Plus)' },
      ],
      [
        'https://rss.nebula.app/video/categories/originals.rss',
        { key: 'nebula:originals', label: 'Nebula Originals' },
      ],
      [
        'https://rss.nebula.app/video/categories/technology.rss',
        { key: 'nebula:category', label: 'Category' },
      ],
      [
        'https://rss.nebula.app/video/categories/technology.rss?plus=true',
        { key: 'nebula:category-plus', label: 'Category (Plus)' },
      ],
      ['https://rss.nebula.app/video.rss', { key: 'nebula:videos-all', label: 'All Videos' }],
      [
        'https://rss.nebula.app/video.rss?plus=true',
        { key: 'nebula:videos-all-plus', label: 'All Videos (Plus)' },
      ],
      [
        'https://rss.nebula.app/video/channels.rss',
        { key: 'nebula:channels', label: 'Recently Added Channels' },
      ],
    ]

    it.each(ownFeeds)('should return %s as itself', async (value, hint) => {
      const result = await discoverUrisFromPlatform(undefined, undefined, {
        ...defaultPlatformOptions,
        handlers: [nebulaHandler],
        baseUrl: value,
      })
      const expected: Array<DiscoverUriEntry> = [{ uri: value, hint }]

      expect(result).toEqual(expected)
    })
  })
})
