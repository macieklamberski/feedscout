import { describe, expect, it } from 'bun:test'
import { megaphoneHandler } from './megaphone.js'

describe('megaphoneHandler', () => {
  describe('match', () => {
    const values: Array<[boolean, string]> = [
      [true, 'https://playlist.megaphone.fm/?p=ABC1234567890'],
      [true, 'https://playlist.megaphone.fm/?p=my-show'],
      [true, 'https://player.megaphone.fm/ABC9876543210'],
      [true, 'https://player.megaphone.fm/ABC9876543210/'],
      [true, 'https://player.megaphone.fm/?e=ABC9876543210'],
      [false, 'https://playlist.megaphone.fm/'],
      [false, 'https://playlist.megaphone.fm/?p=bad%20id'],
      [false, 'https://player.megaphone.fm/'],
      [false, 'https://player.megaphone.fm/services'],
      [false, 'https://player.megaphone.fm/services/oembed'],
      [false, 'https://feeds.megaphone.fm/ABC1234567890'],
      [false, 'https://example.com/?p=ABC1234567890'],
    ]

    it.each(values)('should return %s for %s', (expected, url) => {
      expect(megaphoneHandler.match(url)).toBe(expected)
    })
  })

  describe('resolve', () => {
    const episodeContent =
      '<a target="_blank" title="Subscribe via RSS" href="http://feeds.megaphone.fm/ABC1234567890">'

    it('should return feed URL for playlist', () => {
      const value = 'https://playlist.megaphone.fm/?p=ABC1234567890'
      const expected = [
        {
          uri: 'https://feeds.megaphone.fm/ABC1234567890',
          hint: { key: 'megaphone:podcast', label: 'Podcast' },
        },
      ]

      expect(megaphoneHandler.resolve(value)).toEqual(expected)
    })

    it('should return show feed URL from episode player content', () => {
      const value = 'https://player.megaphone.fm/ABC9876543210'
      const expected = [
        {
          uri: 'https://feeds.megaphone.fm/ABC1234567890',
          hint: { key: 'megaphone:podcast', label: 'Podcast' },
        },
      ]

      expect(megaphoneHandler.resolve(value, episodeContent)).toEqual(expected)
    })

    it('should return empty array for episode player without RSS link', () => {
      const value = 'https://player.megaphone.fm/ABC9876543210'

      expect(megaphoneHandler.resolve(value, '<html></html>')).toEqual([])
    })
  })
})
