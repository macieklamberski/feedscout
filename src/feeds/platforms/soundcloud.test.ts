import { describe, expect, it } from 'bun:test'
import { soundcloudHandler } from './soundcloud.js'

describe('soundcloudHandler', () => {
  describe('match', () => {
    const values: Array<[boolean, string]> = [
      [true, 'https://soundcloud.com/diplo'],
      [true, 'https://www.soundcloud.com/diplo'],
      [true, 'https://m.soundcloud.com/diplo'],
      [true, 'https://soundcloud.com/diplo/tracks'],
      [false, 'https://soundcloud.com/discover'],
      [false, 'https://soundcloud.com/stream'],
      [false, 'https://soundcloud.com/search'],
      [false, 'https://soundcloud.com/upload'],
      [false, 'https://soundcloud.com/you'],
      [false, 'https://soundcloud.com/settings'],
      [false, 'https://soundcloud.com/messages'],
      [false, 'https://soundcloud.com/Discover'],
      [false, 'https://soundcloud.com/STREAM'],
      [false, 'https://soundcloud.com'],
      [false, 'https://example.com/diplo'],
    ]

    it.each(values)('should return %s for %s', (expected, url) => {
      expect(soundcloudHandler.match(url)).toBe(expected)
    })

    it('should return false for invalid URL', () => {
      expect(soundcloudHandler.match('not-a-url')).toBe(false)
    })
  })

  describe('resolve', () => {
    const contentWithUserId = `
      <meta property="twitter:app:url:googleplay" content="soundcloud://users:16730">
      <meta property="al:ios:url" content="soundcloud://users:16730">
    `

    it('should return RSS feed when user ID found in content', () => {
      const value = 'https://soundcloud.com/diplo'
      const expected = [
        {
          uri: 'https://feeds.soundcloud.com/users/soundcloud:users:16730/sounds.rss',
          hint: { key: 'soundcloud:tracks', label: 'Tracks' },
        },
      ]

      expect(soundcloudHandler.resolve(value, contentWithUserId)).toEqual(expected)
    })

    it('should return empty array when no content provided', () => {
      const value = 'https://soundcloud.com/diplo'

      expect(soundcloudHandler.resolve(value)).toEqual([])
    })

    it('should return empty array when user ID not found in content', () => {
      const value = 'https://soundcloud.com/diplo'
      const content = '<html><body>No user ID here</body></html>'

      expect(soundcloudHandler.resolve(value, content)).toEqual([])
    })

    it('should return empty array for invalid URL without content', () => {
      expect(soundcloudHandler.resolve('not-a-url')).toEqual([])
    })
  })
})
