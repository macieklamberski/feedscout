import { describe, expect, it } from 'bun:test'
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

  it('should return undefined for the home page', () => {
    expect(parseNebulaUrl('https://nebula.tv/')).toBeUndefined()
  })

  it('should return undefined for videos pages', () => {
    expect(parseNebulaUrl('https://nebula.tv/videos')).toBeUndefined()
    expect(
      parseNebulaUrl('https://nebula.tv/videos/realengineering-why-ships-float'),
    ).toBeUndefined()
  })

  it('should return undefined for explore pages', () => {
    expect(parseNebulaUrl('https://nebula.tv/explore')).toBeUndefined()
  })

  it('should return undefined for explore pages in any case', () => {
    expect(parseNebulaUrl('https://nebula.tv/Explore')).toBeUndefined()
  })

  it('should return undefined for excluded paths', () => {
    expect(parseNebulaUrl('https://nebula.tv/login')).toBeUndefined()
    expect(parseNebulaUrl('https://nebula.tv/about')).toBeUndefined()
    expect(parseNebulaUrl('https://nebula.tv/classes')).toBeUndefined()
    expect(parseNebulaUrl('https://nebula.tv/library')).toBeUndefined()
    expect(parseNebulaUrl('https://nebula.tv/originals')).toBeUndefined()
    expect(parseNebulaUrl('https://nebula.tv/pricing')).toBeUndefined()
    expect(parseNebulaUrl('https://nebula.tv/privacy')).toBeUndefined()
    expect(parseNebulaUrl('https://nebula.tv/search')).toBeUndefined()
    expect(parseNebulaUrl('https://nebula.tv/settings')).toBeUndefined()
    expect(parseNebulaUrl('https://nebula.tv/signup')).toBeUndefined()
    expect(parseNebulaUrl('https://nebula.tv/terms')).toBeUndefined()
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

    it('should lowercase the category query value', () => {
      const value = 'https://nebula.tv/explore?category=Science'
      const expected = [
        {
          uri: 'https://rss.nebula.app/video/categories/science.rss',
          hint: { key: 'nebula:category', label: 'Category' },
        },
        {
          uri: 'https://rss.nebula.app/video/categories/science.rss?plus=true',
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

    it('should return empty array for excluded paths', () => {
      expect(nebulaHandler.resolve('https://nebula.tv/login')).toEqual([])
    })
  })
})
