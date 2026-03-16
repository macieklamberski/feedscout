import { describe, expect, it } from 'bun:test'
import { vimeoHandler } from './vimeo.js'

describe('vimeoHandler', () => {
  describe('match', () => {
    const cases = [
      ['https://vimeo.com/casey', true],
      ['https://vimeo.com/channels/staffpicks', true],
      ['https://www.vimeo.com/user', true],
      ['https://youtube.com/user', false],
      ['https://example.com', false],
    ] as const

    it.each(cases)('%s -> %s', (url, expected) => {
      expect(vimeoHandler.match(url)).toBe(expected)
    })

    it('should throw for invalid URL', () => {
      expect(() => vimeoHandler.match('not-a-url')).toThrow()
    })
  })

  describe('resolve', () => {
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

    it('should return empty array for excluded paths', () => {
      const values = [
        'https://vimeo.com/search',
        'https://vimeo.com/watch',
        'https://vimeo.com/upload',
        'https://vimeo.com/settings',
        'https://vimeo.com/explore',
      ]

      for (const value of values) {
        expect(vimeoHandler.resolve(value)).toEqual([])
      }
    })

    it('should return empty array for excluded paths with subpage', () => {
      const values = [
        'https://vimeo.com/categories/animation',
        'https://vimeo.com/features/video-player',
        'https://vimeo.com/help/faq',
      ]

      for (const value of values) {
        expect(vimeoHandler.resolve(value)).toEqual([])
      }
    })
  })
})
