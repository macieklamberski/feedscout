import { describe, expect, it } from 'bun:test'
import {
  type ApplePodcastsPage,
  type ApplePodcastsUrl,
  applePodcastsHandler,
  getApplePodcastsPage,
  parseApplePodcastsUrl,
} from './applePodcasts.js'

describe('parseApplePodcastsUrl', () => {
  it('should return the podcast for a podcast page', () => {
    const value = 'https://podcasts.apple.com/us/podcast/the-daily/id1200361736'
    const expected: ApplePodcastsUrl = { kind: 'podcast' }

    expect(parseApplePodcastsUrl(value)).toEqual(expected)
  })

  it('should return the podcast for a page without locale and name', () => {
    const expected: ApplePodcastsUrl = { kind: 'podcast' }

    expect(parseApplePodcastsUrl('https://podcasts.apple.com/podcast/id1200361736')).toEqual(
      expected,
    )
  })

  it('should return the podcast for a storefront longer than two letters', () => {
    const value = 'https://podcasts.apple.com/xyz/podcast/the-daily/id1200361736'
    const expected: ApplePodcastsUrl = { kind: 'podcast' }

    expect(parseApplePodcastsUrl(value)).toEqual(expected)
  })

  it('should return undefined for a browse page', () => {
    expect(parseApplePodcastsUrl('https://podcasts.apple.com/us/browse')).toBeUndefined()
  })

  it('should return undefined for another host', () => {
    const value = 'https://example.com/us/podcast/the-daily/id1200361736'

    expect(parseApplePodcastsUrl(value)).toBeUndefined()
  })
})

describe('getApplePodcastsPage', () => {
  const value = 'https://podcasts.apple.com/us/podcast/the-daily/id1200361736'

  it('should return the feed URL the page carries', () => {
    const content = '{"feedUrl":"https://feeds.example.com/the-daily","name":"The Daily"}'
    const expected: ApplePodcastsPage = {
      kind: 'podcast',
      feedUrl: 'https://feeds.example.com/the-daily',
    }

    expect(getApplePodcastsPage(value, content)).toEqual(expected)
  })

  it('should read a feed URL with spaces around the colon', () => {
    const content = '{"feedUrl" : "https://example.com/feed.xml"}'
    const expected: ApplePodcastsPage = { kind: 'podcast', feedUrl: 'https://example.com/feed.xml' }

    expect(getApplePodcastsPage(value, content)).toEqual(expected)
  })

  it('should decode the JSON escapes in the feed URL', () => {
    const content = '{"feedUrl":"https:\\/\\/feeds.example.com\\/x?a=1\\u0026b=2"}'
    const expected: ApplePodcastsPage = {
      kind: 'podcast',
      feedUrl: 'https://feeds.example.com/x?a=1&b=2',
    }

    expect(getApplePodcastsPage(value, content)).toEqual(expected)
  })

  it('should keep a feed URL whose escapes do not decode', () => {
    const content = '{"feedUrl":"https://feeds.example.com/x\\q"}'
    const expected: ApplePodcastsPage = {
      kind: 'podcast',
      feedUrl: 'https://feeds.example.com/x\\q',
    }

    expect(getApplePodcastsPage(value, content)).toEqual(expected)
  })

  it('should return undefined without content', () => {
    expect(getApplePodcastsPage(value, undefined)).toBeUndefined()
  })

  it('should return undefined when the content carries no feed URL', () => {
    const content = '<html><body>No feed URL here</body></html>'

    expect(getApplePodcastsPage(value, content)).toBeUndefined()
  })

  it('should return undefined for a URL outside the platform', () => {
    const content = '{"feedUrl":"https://feeds.example.com/the-daily"}'

    expect(getApplePodcastsPage('https://example.com/', content)).toBeUndefined()
  })
})

describe('applePodcastsHandler', () => {
  describe('match', () => {
    const values: Array<[boolean, string]> = [
      [true, 'https://podcasts.apple.com/us/podcast/the-daily/id1200361736'],
      [true, 'https://podcasts.apple.com/gb/podcast/some-podcast/id123456789'],
      [true, 'https://podcasts.apple.com/de/podcast/podcast-name/id987654321'],
      [true, 'https://podcasts.apple.com/us/podcast/id1200361736'],
      [true, 'https://podcasts.apple.com/podcast/the-daily/id1200361736'],
      [true, 'https://podcasts.apple.com/podcast/id1200361736'],
      [true, 'https://podcasts.apple.com/US/Podcast/the-daily/id1200361736'],
      [false, 'https://podcasts.apple.com/us/artist/the-new-york-times/id121664449'],
      [false, 'https://podcasts.apple.com/us/podcast/the-daily/id123x'],
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
    it('should return empty array for a URL outside the platform', () => {
      expect(applePodcastsHandler.resolve('https://example.com/')).toEqual([])
    })

    it('should return the feed URL the page carries', () => {
      const value = 'https://podcasts.apple.com/us/podcast/the-daily/id1200361736'
      const content = '{"feedUrl":"https://feeds.example.com/the-daily","name":"The Daily"}'
      const expected = [
        {
          uri: 'https://feeds.example.com/the-daily',
          hint: { key: 'apple-podcasts:podcast', label: 'Podcast' },
        },
      ]

      expect(applePodcastsHandler.resolve(value, content)).toEqual(expected)
    })
  })
})
