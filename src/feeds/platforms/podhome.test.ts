import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry, DiscoverUriHint } from '../../common/types.js'
import { discoverUrisFromPlatform } from '../../common/uris/platform/index.js'
import { defaultPlatformOptions } from '../defaults.js'
import { podhomeHandler } from './podhome.js'

const stylesheet = '<link rel="stylesheet" href="https://cdn.podhome.fm/servesite3.min.css">'
const feedLink = `
  <link
    type="application/rss+xml"
    rel="alternate"
    title="Example Show"
    href="https://serve.podhome.fm/rss/00000000-0000-4000-8000-000000000000"
  >
`

describe('podhomeHandler', () => {
  describe('match', () => {
    it('should match a show page on serve.podhome.fm', () => {
      const value = `${stylesheet}${feedLink}`

      expect(podhomeHandler.match('https://serve.podhome.fm/example-show', value)).toBe(true)
    })

    it('should match a show page on a custom domain', () => {
      const value = `${stylesheet}${feedLink}`

      expect(podhomeHandler.match('https://www.example.com/', value)).toBe(true)
    })

    it('should not match a feed link without the show site assets', () => {
      expect(podhomeHandler.match('https://www.example.com/', feedLink)).toBe(false)
    })

    it('should not match the show site assets without a feed link', () => {
      expect(podhomeHandler.match('https://www.example.com/', stylesheet)).toBe(false)
    })

    it('should match a feed link with an uppercase route word', () => {
      const value = `${stylesheet}<link rel="alternate" href="https://serve.podhome.fm/RSS/abc">`

      expect(podhomeHandler.match('https://serve.podhome.fm/example-show', value)).toBe(true)
    })

    it('should not match an alternate link to another host', () => {
      const value = `${stylesheet}<link rel="alternate" href="https://example.com/rss/abc">`

      expect(podhomeHandler.match('https://www.example.com/', value)).toBe(false)
    })

    it('should not match an alternate link outside the feed path', () => {
      const value = `${stylesheet}<link rel="alternate" href="https://serve.podhome.fm/example-show">`

      expect(podhomeHandler.match('https://www.example.com/', value)).toBe(false)
    })

    it('should not match without content', () => {
      expect(podhomeHandler.match('https://serve.podhome.fm/example-show')).toBe(false)
    })

    it('should not match invalid URLs', () => {
      expect(podhomeHandler.match('not-a-url', `${stylesheet}${feedLink}`)).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return empty array for a page without content', () => {
      expect(podhomeHandler.resolve('https://serve.podhome.fm/show')).toEqual([])
    })

    it('should return the show feed the page links', () => {
      const url = 'https://serve.podhome.fm/episodepage/example-show/1'
      const value = `${stylesheet}${feedLink}`
      const expected = [
        {
          uri: 'https://serve.podhome.fm/rss/00000000-0000-4000-8000-000000000000',
          hint: { key: 'podhome:podcast', label: 'Podcast' },
        },
      ]

      expect(podhomeHandler.resolve(url, value)).toEqual(expected)
    })

    it('should return the https feed for a feed linked over http', () => {
      const url = 'https://serve.podhome.fm/example-show'
      const value = `${stylesheet}<link rel="alternate" href="http://serve.podhome.fm/RSS/00000000-0000-4000-8000-000000000000">`
      const expected = [
        {
          uri: 'https://serve.podhome.fm/rss/00000000-0000-4000-8000-000000000000',
          hint: { key: 'podhome:podcast', label: 'Podcast' },
        },
      ]

      expect(podhomeHandler.resolve(url, value)).toEqual(expected)
    })
  })

  describe('getFeedHint', () => {
    it('should return the podcast hint for a show feed', () => {
      const value = 'https://serve.podhome.fm/rss/00000000-0000-4000-8000-000000000000'
      const expected: DiscoverUriHint = { key: 'podhome:podcast', label: 'Podcast' }

      expect(podhomeHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the podcast hint for a show feed over http', () => {
      const value = 'http://serve.podhome.fm/rss/00000000-0000-4000-8000-000000000000'
      const expected: DiscoverUriHint = { key: 'podhome:podcast', label: 'Podcast' }

      expect(podhomeHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the podcast hint for a show feed with a trailing slash', () => {
      const value = 'https://serve.podhome.fm/rss/00000000-0000-4000-8000-000000000000/'
      const expected: DiscoverUriHint = { key: 'podhome:podcast', label: 'Podcast' }

      expect(podhomeHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the podcast hint for a show feed with an uppercase id', () => {
      const value = 'https://serve.podhome.fm/RSS/ABCDEF00-0000-4000-8000-000000000000'
      const expected: DiscoverUriHint = { key: 'podhome:podcast', label: 'Podcast' }

      expect(podhomeHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the podcast hint for a show feed id without hyphens', () => {
      const value = 'https://serve.podhome.fm/rss/00000000000040008000000000000000'
      const expected: DiscoverUriHint = { key: 'podhome:podcast', label: 'Podcast' }

      expect(podhomeHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return undefined for an all-hex word of another length in the feed path', () => {
      const value = 'https://serve.podhome.fm/rss/cafe'

      expect(podhomeHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for an all-hex word in the feed path', () => {
      const value = 'https://serve.podhome.fm/rss/feed'

      expect(podhomeHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for the stylesheet a feed links', () => {
      const value = 'https://serve.podhome.fm/rss/xslsheet'

      expect(podhomeHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for the feed path without an id', () => {
      const value = 'https://serve.podhome.fm/rss/'

      expect(podhomeHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for a show page', () => {
      const value = 'https://serve.podhome.fm/example-show'

      expect(podhomeHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for an episode page', () => {
      const value = 'https://serve.podhome.fm/episodepage/example-show/1'

      expect(podhomeHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for a feed path on another host', () => {
      const value = 'https://example.com/rss/00000000-0000-4000-8000-000000000000'

      expect(podhomeHandler.getFeedHint?.(value)).toBeUndefined()
    })
  })

  describe('own feeds through the Platform method', () => {
    const hint: DiscoverUriHint = { key: 'podhome:podcast', label: 'Podcast' }
    const values = [
      'https://serve.podhome.fm/rss/00000000-0000-4000-8000-000000000000',
      'http://serve.podhome.fm/rss/00000000-0000-4000-8000-000000000000',
      'https://serve.podhome.fm/RSS/00000000-0000-4000-8000-000000000000/',
      'https://serve.podhome.fm/rss/00000000000040008000000000000000',
    ]

    it.each(values)('should return %s as itself', async (value) => {
      const result = await discoverUrisFromPlatform(undefined, undefined, {
        ...defaultPlatformOptions,
        handlers: [podhomeHandler],
        baseUrl: value,
      })
      const expected: Array<DiscoverUriEntry> = [{ uri: value, hint }]

      expect(result).toEqual(expected)
    })
  })
})
