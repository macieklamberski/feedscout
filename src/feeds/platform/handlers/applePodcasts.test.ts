import { describe, expect, it } from 'bun:test'
import { applePodcastsHandler } from './applePodcasts.js'

describe('applePodcastsHandler', () => {
  describe('match', () => {
    const cases = [
      ['https://podcasts.apple.com/podcast/the-daily/id1200361736', true],
      ['https://podcasts.apple.com/us/podcast/the-daily/id1200361736', true],
      ['https://podcasts.apple.com/gb/podcast/some-show/id123456', true],
      ['https://spotify.com/show/abc123', false],
      ['https://youtube.com/@channel', false],
    ] as const

    it.each(cases)('%s -> %s', (url, expected) => {
      expect(applePodcastsHandler.match(url)).toBe(expected)
    })
  })

  describe('resolve', () => {
    it('should return iTunes Lookup API URL for podcast page', () => {
      const value = 'https://podcasts.apple.com/podcast/the-daily/id1200361736'
      const expected = ['https://itunes.apple.com/lookup?id=1200361736&entity=podcast']

      expect(applePodcastsHandler.resolve(value)).toEqual(expected)
    })

    it('should return iTunes Lookup API URL for localized podcast page', () => {
      const value = 'https://podcasts.apple.com/us/podcast/the-daily/id1200361736'
      const expected = ['https://itunes.apple.com/lookup?id=1200361736&entity=podcast']

      expect(applePodcastsHandler.resolve(value)).toEqual(expected)
    })

    it('should return iTunes Lookup API URL for podcast with only ID', () => {
      const value = 'https://podcasts.apple.com/podcast/id987654321'
      const expected = ['https://itunes.apple.com/lookup?id=987654321&entity=podcast']

      expect(applePodcastsHandler.resolve(value)).toEqual(expected)
    })

    it('should extract feed URL from JSON data in content', () => {
      const value = 'https://podcasts.apple.com/podcast/the-daily/id1200361736'
      const content = `
        <html>
          <script>{"feedUrl":"https://feeds.simplecast.com/example-feed"}</script>
        </html>
      `
      const expected = ['https://feeds.simplecast.com/example-feed']

      expect(applePodcastsHandler.resolve(value, content)).toEqual(expected)
    })

    it('should extract feed URL from JSON-LD structured data', () => {
      const value = 'https://podcasts.apple.com/podcast/id123456'
      const content = `
        <html>
          <script type="application/ld+json">
            {"@type":"PodcastSeries","associatedMedia":{"contentUrl":"https://example.com/podcast.rss"}}
          </script>
        </html>
      `
      const expected = ['https://example.com/podcast.rss']

      expect(applePodcastsHandler.resolve(value, content)).toEqual(expected)
    })

    it('should handle invalid JSON in JSON-LD script tag', () => {
      const value = 'https://podcasts.apple.com/podcast/id123456'
      const content = `
        <html>
          <script type="application/ld+json">
            {invalid json here}
          </script>
          <script>{"feedUrl":"https://feeds.example.com/fallback"}</script>
        </html>
      `
      const expected = ['https://feeds.example.com/fallback']

      expect(applePodcastsHandler.resolve(value, content)).toEqual(expected)
    })

    it('should fallback when JSON-LD has no associatedMedia contentUrl', () => {
      const value = 'https://podcasts.apple.com/podcast/id123456'
      const content = `
        <html>
          <script type="application/ld+json">
            {"@type":"PodcastSeries","name":"Some Podcast"}
          </script>
          <script>{"feedUrl":"https://feeds.example.com/backup"}</script>
        </html>
      `
      const expected = ['https://feeds.example.com/backup']

      expect(applePodcastsHandler.resolve(value, content)).toEqual(expected)
    })

    it('should extract feed URL from meta tag', () => {
      const value = 'https://podcasts.apple.com/podcast/id123456'
      const content = `
        <html>
          <head>
            <meta property="al:web:url" content="https://example.com/podcast-feed.rss">
          </head>
        </html>
      `
      const expected = ['https://example.com/podcast-feed.rss']

      expect(applePodcastsHandler.resolve(value, content)).toEqual(expected)
    })

    it('should return empty array for excluded paths', () => {
      expect(applePodcastsHandler.resolve('https://podcasts.apple.com/subscribe')).toEqual([])
      expect(applePodcastsHandler.resolve('https://podcasts.apple.com/app')).toEqual([])
      expect(applePodcastsHandler.resolve('https://podcasts.apple.com/redeem')).toEqual([])
    })

    it('should return empty array for root path without podcast ID', () => {
      const value = 'https://podcasts.apple.com/'
      const expected: Array<string> = []

      expect(applePodcastsHandler.resolve(value)).toEqual(expected)
    })

    it('should fallback to iTunes API when content has no feed URL', () => {
      const value = 'https://podcasts.apple.com/podcast/id555555'
      const content = '<html><body>No feed data here</body></html>'
      const expected = ['https://itunes.apple.com/lookup?id=555555&entity=podcast']

      expect(applePodcastsHandler.resolve(value, content)).toEqual(expected)
    })
  })
})
