import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry, DiscoverUriHint } from '../../common/types.js'
import { discoverUrisFromPlatform } from '../../common/uris/platform/index.js'
import { defaultPlatformOptions } from '../defaults.js'
import {
  type CastosPage,
  type CastosUrl,
  castosHandler,
  getCastosPage,
  parseCastosUrl,
} from './castos.js'

describe('parseCastosUrl', () => {
  it('should return the show for a show subdomain', () => {
    const expected: CastosUrl = { kind: 'show', slug: 'myshow' }

    expect(parseCastosUrl('https://myshow.castos.com/')).toEqual(expected)
  })

  it('should return undefined for another host', () => {
    expect(parseCastosUrl('https://example.com/')).toBeUndefined()
  })
})

describe('getCastosPage', () => {
  it('should return the feed id the page links', () => {
    const value = 'https://my-show.castos.com/'
    const content = '<a href="https://feeds.castos.com/x8k2p">RSS</a>'
    const expected: CastosPage = { kind: 'show', slug: 'my-show', feedId: 'x8k2p' }

    expect(getCastosPage(value, content)).toEqual(expected)
  })

  it('should return the slug alone without content', () => {
    const expected: CastosPage = { kind: 'show', slug: 'my-show' }

    expect(getCastosPage('https://my-show.castos.com/', undefined)).toEqual(expected)
  })

  it('should return the slug alone for a page without a feed link', () => {
    const expected: CastosPage = { kind: 'show', slug: 'my-show' }

    expect(getCastosPage('https://my-show.castos.com/', '<p>My Show</p>')).toEqual(expected)
  })

  it('should return undefined for another host', () => {
    expect(getCastosPage('https://example.com/', undefined)).toBeUndefined()
  })
})

describe('castosHandler', () => {
  describe('match', () => {
    const values: Array<[boolean, string]> = [
      [true, 'https://alice-podcast.castos.com'],
      [true, 'https://alice-podcast.castos.com/episodes/first-episode'],
      [false, 'https://castos.com'],
      [false, 'https://www.castos.com'],
      [false, 'https://blog.example.castos.com'],
      [false, 'https://example.com'],
    ]

    it.each(values)('should return %s for %s', (expected, url) => {
      expect(castosHandler.match(url)).toBe(expected)
    })
  })

  describe('resolve', () => {
    it('should return empty array for a URL outside the platform', () => {
      expect(castosHandler.resolve('https://example.com/')).toEqual([])
    })

    it('should keep the scheme of an http show page without a feed link', () => {
      const value = 'http://alice-podcast.castos.com/'
      const expected = [
        {
          uri: 'http://alice-podcast.castos.com/feed',
          hint: { key: 'castos:podcast', label: 'Podcast' },
        },
      ]

      expect(castosHandler.resolve(value)).toEqual(expected)
    })

    it('should return feed URL linked from the page', () => {
      const value = 'https://alice-podcast.castos.com/episodes/first-episode'
      const content =
        '<link type="application/rss+xml" rel="alternate" href="https://feeds.castos.com/abc12" />'
      const expected = [
        {
          uri: 'https://feeds.castos.com/abc12',
          hint: { key: 'castos:podcast', label: 'Podcast' },
        },
      ]

      expect(castosHandler.resolve(value, content)).toEqual(expected)
    })

    it('should return show site feed URL without page content', () => {
      const value = 'https://alice-podcast.castos.com'
      const expected = [
        {
          uri: 'https://alice-podcast.castos.com/feed',
          hint: { key: 'castos:podcast', label: 'Podcast' },
        },
      ]

      expect(castosHandler.resolve(value)).toEqual(expected)
    })

    it('should return empty array for the bare host', () => {
      expect(castosHandler.resolve('https://castos.com/')).toEqual([])
    })
  })

  describe('getFeedHint', () => {
    it('should return the podcast hint for a show site feed', () => {
      const value = 'https://alice-podcast.castos.com/feed'
      const expected: DiscoverUriHint = { key: 'castos:podcast', label: 'Podcast' }

      expect(castosHandler.getFeedHint?.(value)).toEqual(expected)
    })
  })

  describe('own feeds through the Platform method', () => {
    it('should return a show site feed as itself', async () => {
      const value = 'http://alice-podcast.castos.com/feed'
      const options = {
        ...defaultPlatformOptions,
        handlers: [castosHandler],
        baseUrl: value,
      }
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'http://alice-podcast.castos.com/feed',
          hint: { key: 'castos:podcast', label: 'Podcast' },
        },
      ]

      expect(await discoverUrisFromPlatform(undefined, undefined, options)).toEqual(expected)
    })
  })
})
