import { describe, expect, it } from 'bun:test'
import { ivooxHandler } from './ivoox.js'

describe('ivooxHandler', () => {
  describe('match', () => {
    const values: Array<[boolean, string]> = [
      [true, 'https://www.ivoox.com/podcast-example-show_sq_f1234_1.html'],
      [true, 'https://ivoox.com/podcast-example-show_sq_f1234_1.html'],
      [false, 'https://example.com/podcast-example-show_sq_f1234_1.html'],
    ]

    it.each(values)('should return %s for %s', (expected, url) => {
      expect(ivooxHandler.match(url)).toBe(expected)
    })
  })

  describe('resolve', () => {
    it('should return feed URL for podcast page', () => {
      const value = 'https://www.ivoox.com/podcast-example-show_sq_f1234_1.html'
      const expected = [
        {
          uri: 'https://feeds.ivoox.com/feed_fg_f1234_filtro_1.xml',
          hint: { key: 'ivoox:podcast', label: 'Podcast' },
        },
      ]

      expect(ivooxHandler.resolve(value)).toEqual(expected)
    })

    it('should return feed URL for podcast page under a locale prefix', () => {
      const value = 'https://www.ivoox.com/en/podcast-example-show_sq_f1234_1.html'
      const expected = [
        {
          uri: 'https://feeds.ivoox.com/feed_fg_f1234_filtro_1.xml',
          hint: { key: 'ivoox:podcast', label: 'Podcast' },
        },
      ]

      expect(ivooxHandler.resolve(value)).toEqual(expected)
    })

    it('should return feed URL of the series an episode page names', () => {
      const value = 'https://www.ivoox.com/example-episode-audios-mp3_rf_5678_1.html'
      const content = `
        <a href="/podcast-other-show_sq_f9999_1.html">Other show</a>
        <script type="application/ld+json">
          {"partOfSeries":{"@type":"PodcastSeries","@id":"https://www.ivoox.com/podcast-example-show_sq_f1234_1.html#podcast"}}
        </script>
      `
      const expected = [
        {
          uri: 'https://feeds.ivoox.com/feed_fg_f1234_filtro_1.xml',
          hint: { key: 'ivoox:podcast', label: 'Podcast' },
        },
      ]

      expect(ivooxHandler.resolve(value, content)).toEqual(expected)
    })

    it('should return empty array for episode page without content', () => {
      const value = 'https://www.ivoox.com/example-episode-audios-mp3_rf_5678_1.html'

      expect(ivooxHandler.resolve(value)).toEqual([])
    })

    it('should ignore partOfSeries outside an episode page', () => {
      const value = 'https://www.ivoox.com/'
      const content =
        '{"partOfSeries":{"@id":"https://www.ivoox.com/podcast-example-show_sq_f1234_1.html"}}'

      expect(ivooxHandler.resolve(value, content)).toEqual([])
    })
  })
})
