import { describe, expect, it } from 'bun:test'
import { omnystudioHandler } from './omnystudio.js'

describe('omnystudioHandler', () => {
  describe('match', () => {
    it('should match a show page', () => {
      expect(omnystudioHandler.match('https://omny.fm/shows/example-show')).toBe(true)
    })

    it('should not match the site root', () => {
      expect(omnystudioHandler.match('https://omny.fm/')).toBe(false)
    })

    it('should not match other hosts', () => {
      expect(omnystudioHandler.match('https://example.com/shows/example-show')).toBe(false)
    })

    it('should not match invalid URLs', () => {
      expect(omnystudioHandler.match('not-a-url')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return the show feed', () => {
      const value = 'https://omny.fm/shows/example-show'
      const expected = [
        {
          uri: 'https://omny.fm/shows/example-show/playlists/podcast.rss',
          hint: { key: 'omnystudio:show', label: 'Show' },
        },
      ]

      expect(omnystudioHandler.resolve(value)).toEqual(expected)
    })

    it('should use the slug from an episode page', () => {
      const value = 'https://omny.fm/shows/example-show/an-episode'
      const expected = [
        {
          uri: 'https://omny.fm/shows/example-show/playlists/podcast.rss',
          hint: { key: 'omnystudio:show', label: 'Show' },
        },
      ]

      expect(omnystudioHandler.resolve(value)).toEqual(expected)
    })

    it('should return an empty array for the site root', () => {
      expect(omnystudioHandler.resolve('https://omny.fm/')).toEqual([])
    })

    it('should return an empty array for invalid URLs', () => {
      expect(omnystudioHandler.resolve('not-a-url')).toEqual([])
    })
  })
})
