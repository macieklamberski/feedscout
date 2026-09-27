import { describe, expect, it } from 'bun:test'
import { spotifyForCreatorsHandler } from './spotifyForCreators.js'

describe('spotifyForCreatorsHandler', () => {
  describe('match', () => {
    const values: Array<[boolean, string]> = [
      [true, 'https://creators.spotify.com/pod/profile/example/'],
      [true, 'https://creators.spotify.com/pod/show/example'],
      [true, 'https://creators.spotify.com/pod/profile/example/episodes/Episode-e2abcde'],
      [true, 'https://creators.spotify.com/POD/Profile/example'],
      [false, 'https://creators.spotify.com/pod/profile/'],
      [false, 'https://creators.spotify.com/pod/dashboard'],
      [false, 'https://creators.spotify.com/'],
      [false, 'https://anchor.fm/s/133d445c/podcast/rss'],
      [false, 'https://example.com/pod/profile/example'],
    ]

    it.each(values)('should return %s for %s', (expected, url) => {
      expect(spotifyForCreatorsHandler.match(url)).toBe(expected)
    })
  })

  describe('resolve', () => {
    const value = 'https://creators.spotify.com/pod/profile/example/'

    it('should return feed from the alternate link without /s/', () => {
      const content = '<link rel="alternate" href="https://anchor.fm/133d445c/podcast/rss">'
      const expected = [
        {
          uri: 'https://anchor.fm/s/133d445c/podcast/rss',
          hint: { key: 'spotify-for-creators:podcast', label: 'Podcast' },
        },
      ]

      expect(spotifyForCreatorsHandler.resolve(value, content)).toEqual(expected)
    })

    it('should return feed from the link with /s/', () => {
      const content = '<a href="https://anchor.fm/s/114f072a0/podcast/rss">RSS</a>'
      const expected = [
        {
          uri: 'https://anchor.fm/s/114f072a0/podcast/rss',
          hint: { key: 'spotify-for-creators:podcast', label: 'Podcast' },
        },
      ]

      expect(spotifyForCreatorsHandler.resolve(value, content)).toEqual(expected)
    })

    it('should return empty array when page has station id but no feed link', () => {
      const content = '{"stationId":"133d445c","title":"Episode"}'

      expect(spotifyForCreatorsHandler.resolve(value, content)).toEqual([])
    })

    it('should return empty array when no content provided', () => {
      expect(spotifyForCreatorsHandler.resolve(value)).toEqual([])
    })
  })
})
