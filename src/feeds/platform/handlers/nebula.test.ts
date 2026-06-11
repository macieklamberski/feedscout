import { describe, expect, it } from 'bun:test'
import { nebulaHandler } from './nebula.js'

describe('nebulaHandler', () => {
  describe('match', () => {
    const values: Array<[boolean, string]> = [
      [true, 'https://nebula.tv/realengineering'],
      [true, 'https://www.nebula.tv/realengineering'],
      [true, 'https://nebula.tv'],
      [false, 'https://example.com'],
    ]

    it.each(values)('should return %s for %s', (expected, url) => {
      expect(nebulaHandler.match(url)).toBe(expected)
    })

    it('should return false for invalid URL', () => {
      expect(nebulaHandler.match('not-a-url')).toBe(false)
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

    it('should return feed URL regardless of subpath', () => {
      const value = 'https://nebula.tv/realengineering/videos/some-video'
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
          uri: 'https://rss.nebula.app/video/channels.rss',
          hint: { key: 'nebula:channels', label: 'Recently Added Channels' },
        },
      ]

      expect(nebulaHandler.resolve(value)).toEqual(expected)
    })

    it('should return empty array for excluded paths', () => {
      const values = [
        'https://nebula.tv/login',
        'https://nebula.tv/about',
        'https://nebula.tv/classes',
        'https://nebula.tv/library',
        'https://nebula.tv/originals',
        'https://nebula.tv/pricing',
        'https://nebula.tv/privacy',
        'https://nebula.tv/search',
        'https://nebula.tv/settings',
        'https://nebula.tv/signup',
        'https://nebula.tv/terms',
      ]

      for (const value of values) {
        expect(nebulaHandler.resolve(value)).toEqual([])
      }
    })

    it.todo('should define behavior for invalid URL input', () => {
      // resolve('not-a-url') currently throws a TypeError from the unguarded new URL call; the
      // desired contract (throw vs empty array) is undecided.
    })
  })
})
