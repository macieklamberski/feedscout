import { describe, expect, it } from 'bun:test'
import { applePodcastsHandler } from './applePodcasts.js'

describe('applePodcastsHandler', () => {
  describe('match', () => {
    const cases = [
      ['https://podcasts.apple.com/us/podcast/the-daily/id1200361736', true],
      ['https://podcasts.apple.com/gb/podcast/some-podcast/id123456789', true],
      ['https://podcasts.apple.com/de/podcast/podcast-name/id987654321', true],
      ['https://podcasts.apple.com/us/podcast/id1200361736', false],
      ['https://podcasts.apple.com/us/artist/the-new-york-times/id121664449', false],
      ['https://podcasts.apple.com/us/charts', false],
      ['https://podcasts.apple.com/', false],
      ['https://music.apple.com/us/album/something/id123', false],
      ['https://example.com/us/podcast/name/id123', false],
    ] as const

    it.each(cases)('%s -> %s', (url, expected) => {
      expect(applePodcastsHandler.match(url)).toBe(expected)
    })
  })

  describe('resolve', () => {
    const contentWithFeedUrl = `
			{"feedUrl":"https://feeds.simplecast.com/Sl5CSM3S","name":"The Daily"}
		`

    it('should return feed URL when found in content', () => {
      const value = 'https://podcasts.apple.com/us/podcast/the-daily/id1200361736'
      const expected = ['https://feeds.simplecast.com/Sl5CSM3S']

      expect(applePodcastsHandler.resolve(value, contentWithFeedUrl)).toEqual(expected)
    })

    it('should return empty array when no content provided', () => {
      const value = 'https://podcasts.apple.com/us/podcast/the-daily/id1200361736'

      expect(applePodcastsHandler.resolve(value)).toEqual([])
    })

    it('should return empty array when feedUrl not found in content', () => {
      const value = 'https://podcasts.apple.com/us/podcast/the-daily/id1200361736'
      const content = '<html><body>No feed URL here</body></html>'

      expect(applePodcastsHandler.resolve(value, content)).toEqual([])
    })

    it('should handle feedUrl with spaces around colon', () => {
      const value = 'https://podcasts.apple.com/us/podcast/the-daily/id1200361736'
      const content = '{"feedUrl" : "https://example.com/feed.xml"}'
      const expected = ['https://example.com/feed.xml']

      expect(applePodcastsHandler.resolve(value, content)).toEqual(expected)
    })
  })
})
