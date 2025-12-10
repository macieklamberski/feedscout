import { describe, expect, it } from 'bun:test'
import { soundcloudHandler } from './soundcloud.js'

describe('soundcloudHandler', () => {
  describe('match', () => {
    const cases = [
      ['https://soundcloud.com/diplo', true],
      ['https://www.soundcloud.com/diplo', true],
      ['https://m.soundcloud.com/diplo', true],
      ['https://soundcloud.com/diplo/tracks', true],
      ['https://soundcloud.com/discover', false],
      ['https://soundcloud.com/stream', false],
      ['https://soundcloud.com/search', false],
      ['https://soundcloud.com/upload', false],
      ['https://soundcloud.com', false],
      ['https://example.com/diplo', false],
    ] as const

    it.each(cases)('%s -> %s', (url, expected) => {
      expect(soundcloudHandler.match(url)).toBe(expected)
    })
  })

  describe('resolve', () => {
    const contentWithUserId = `
      <meta property="twitter:app:url:googleplay" content="soundcloud://users:16730">
      <meta property="al:ios:url" content="soundcloud://users:16730">
    `

    it('should return RSS feed when user ID found in content', () => {
      const value = 'https://soundcloud.com/diplo'
      const expected = ['https://feeds.soundcloud.com/users/soundcloud:users:16730/sounds.rss']

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
  })
})
