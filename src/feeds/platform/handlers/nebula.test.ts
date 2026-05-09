import { describe, expect, it } from 'bun:test'
import { nebulaHandler } from './nebula.js'

describe('nebulaHandler', () => {
  describe('match', () => {
    const cases = [
      ['https://nebula.tv/realengineering', true],
      ['https://www.nebula.tv/realengineering', true],
      ['https://nebula.tv', true],
      ['https://example.com', false],
    ] as const

    it.each(cases)('%s -> %s', (url, expected) => {
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
      ]

      expect(nebulaHandler.resolve(value)).toEqual(expected)
    })

    it('should return empty array for excluded paths', () => {
      const value = 'https://nebula.tv/login'

      expect(nebulaHandler.resolve(value)).toEqual([])
    })
  })
})
