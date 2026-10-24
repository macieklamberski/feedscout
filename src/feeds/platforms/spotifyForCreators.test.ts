import { describe, expect, it } from 'bun:test'
import {
  getSpotifyForCreatorsPage,
  parseSpotifyForCreatorsUrl,
  type SpotifyForCreatorsPage,
  type SpotifyForCreatorsUrl,
  spotifyForCreatorsHandler,
} from './spotifyForCreators.js'

describe('parseSpotifyForCreatorsUrl', () => {
  it('should return the show for a show page', () => {
    const expected: SpotifyForCreatorsUrl = { kind: 'show' }

    expect(parseSpotifyForCreatorsUrl('https://creators.spotify.com/pod/show/example')).toEqual(
      expected,
    )
  })

  it('should return the show for a profile page', () => {
    const expected: SpotifyForCreatorsUrl = { kind: 'show' }

    expect(parseSpotifyForCreatorsUrl('https://creators.spotify.com/pod/profile/example')).toEqual(
      expected,
    )
  })

  it('should return undefined for another page', () => {
    expect(parseSpotifyForCreatorsUrl('https://creators.spotify.com/')).toBeUndefined()
  })

  it('should return undefined for another host', () => {
    expect(parseSpotifyForCreatorsUrl('https://example.com/pod/show/example')).toBeUndefined()
  })
})

describe('getSpotifyForCreatorsPage', () => {
  const showUrl = 'https://creators.spotify.com/pod/show/example'
  const content = '<a href="https://anchor.fm/s/1a2b3c4d/podcast/rss">RSS</a>'

  it('should return the station id the feed link names', () => {
    const expected: SpotifyForCreatorsPage = { kind: 'show', stationId: '1a2b3c4d' }

    expect(getSpotifyForCreatorsPage(showUrl, content)).toEqual(expected)
  })

  it('should return the station id the alternate link names without /s/', () => {
    const alternateHtml = `
      <link
        rel="alternate"
        type="application/rss+xml"
        href="https://anchor.fm/1a2b3c4d/podcast/rss"
      >
    `
    const expected: SpotifyForCreatorsPage = { kind: 'show', stationId: '1a2b3c4d' }

    expect(getSpotifyForCreatorsPage(showUrl, alternateHtml)).toEqual(expected)
  })

  it('should return undefined without content', () => {
    expect(getSpotifyForCreatorsPage(showUrl, undefined)).toBeUndefined()
  })

  it('should return undefined for a page that is not a show', () => {
    const value = 'https://creators.spotify.com/'

    expect(getSpotifyForCreatorsPage(value, content)).toBeUndefined()
  })
})

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
    it('should return empty array for a URL outside Spotify for Creators', () => {
      expect(spotifyForCreatorsHandler.resolve('https://example.com/')).toEqual([])
    })

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
