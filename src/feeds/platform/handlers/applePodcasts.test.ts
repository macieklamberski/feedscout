import { describe, expect, it } from 'bun:test'
import { applePodcastsHandler } from './applePodcasts.js'

describe('applePodcastsHandler', () => {
  describe('match', () => {
    const values: Array<[boolean, string]> = [
      [true, 'https://podcasts.apple.com/us/podcast/the-daily/id1200361736'],
      [true, 'https://podcasts.apple.com/gb/podcast/some-podcast/id123456789'],
      [true, 'https://podcasts.apple.com/de/podcast/podcast-name/id987654321'],
      [true, 'https://podcasts.apple.com/us/podcast/id1200361736'],
      [true, 'https://podcasts.apple.com/podcast/the-daily/id1200361736'],
      [true, 'https://podcasts.apple.com/podcast/id1200361736'],
      [false, 'https://podcasts.apple.com/us/artist/the-new-york-times/id121664449'],
      [false, 'https://podcasts.apple.com/us/charts'],
      [false, 'https://podcasts.apple.com/'],
      [false, 'https://music.apple.com/us/album/something/id123'],
      [false, 'https://example.com/us/podcast/name/id123'],
    ]

    it.each(values)('should return %s for %s', (expected, url) => {
      expect(applePodcastsHandler.match(url)).toBe(expected)
    })

    it('should return false for invalid URL', () => {
      expect(applePodcastsHandler.match('not-a-url')).toBe(false)
    })
  })

  describe('resolve', () => {
    const contentWithFeedUrl = `
			{"feedUrl":"https://feeds.example.com/the-daily","name":"The Daily"}
		`

    it('should return feed URL when found in content', () => {
      const value = 'https://podcasts.apple.com/us/podcast/the-daily/id1200361736'
      const expected = [
        {
          uri: 'https://feeds.example.com/the-daily',
          hint: { key: 'apple-podcasts:podcast', label: 'Podcast' },
        },
      ]

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
      const expected = [
        {
          uri: 'https://example.com/feed.xml',
          hint: { key: 'apple-podcasts:podcast', label: 'Podcast' },
        },
      ]

      expect(applePodcastsHandler.resolve(value, content)).toEqual(expected)
    })

    it('should return empty array for invalid URL', () => {
      expect(applePodcastsHandler.resolve('not-a-url')).toEqual([])
    })
  })
})
