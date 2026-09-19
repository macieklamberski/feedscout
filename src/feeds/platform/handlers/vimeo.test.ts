import { describe, expect, it } from 'bun:test'
import { vimeoHandler } from './vimeo.js'

describe('vimeoHandler', () => {
  describe('match', () => {
    const values: Array<[boolean, string]> = [
      [true, 'https://vimeo.com/casey'],
      [true, 'https://vimeo.com/channels/staffpicks'],
      [true, 'https://www.vimeo.com/user'],
      [false, 'https://youtube.com/user'],
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

    it('should return empty array for excluded paths', () => {
      const values = [
        'https://vimeo.com/search',
        'https://vimeo.com/watch',
        'https://vimeo.com/upload',
        'https://vimeo.com/settings',
        'https://vimeo.com/explore',
        'https://vimeo.com/about',
        'https://vimeo.com/album',
        'https://vimeo.com/blog',
        'https://vimeo.com/business',
        'https://vimeo.com/careers',
        'https://vimeo.com/categories',
        'https://vimeo.com/channels',
        'https://vimeo.com/create',
        'https://vimeo.com/enterprise',
        'https://vimeo.com/features',
        'https://vimeo.com/for-hire',
        'https://vimeo.com/groups',
        'https://vimeo.com/help',
        'https://vimeo.com/join',
        'https://vimeo.com/log_in',
        'https://vimeo.com/manage',
        'https://vimeo.com/ondemand',
        'https://vimeo.com/ott',
        'https://vimeo.com/plus',
        'https://vimeo.com/pricing',
        'https://vimeo.com/pro',
        'https://vimeo.com/showcase',
        'https://vimeo.com/site_map',
        'https://vimeo.com/solutions',
        'https://vimeo.com/stock',
        'https://vimeo.com/upgrade',
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

    it.todo('should define behavior for invalid URL input', () => {
      // resolve('not-a-url') currently throws a TypeError from the unguarded new URL call; the
      // desired contract (throw vs empty array) is undecided.
    })
  })
})
