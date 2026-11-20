import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry, DiscoverUriHint } from '../../common/types.js'
import { discoverUrisFromPlatform } from '../../common/uris/platform/index.js'
import { defaultPlatformOptions } from '../defaults.js'
import { isOdooHeaders, type OdooUrl, odooHandler, parseOdooUrl } from './odoo.js'

const odooHeaders = new Headers([
  ['set-cookie', 'frontend_lang=en_US; Expires=Mon, 04 Oct 2027 03:49:19 GMT; Path=/'],
  [
    'set-cookie',
    'session_id=33MXx6gjTT4lTRfjbDx9XUjot2huKnH6; Expires=Mon, 11 Oct 2027 03:49:19 GMT; HttpOnly; Path=/',
  ],
])
const sessionOnlyHeaders = new Headers({
  'set-cookie': 'session_id=7619cd5a8fbaad1972197c99b9109175bb692ca8; HttpOnly; Path=/',
})

describe('isOdooHeaders', () => {
  it('should return true for the language and session cookies', () => {
    expect(isOdooHeaders(odooHeaders)).toBe(true)
  })

  it('should return false for a session cookie alone', () => {
    expect(isOdooHeaders(sessionOnlyHeaders)).toBe(false)
  })

  it('should return false for a language cookie alone', () => {
    const value = new Headers({ 'set-cookie': 'frontend_lang=en_US; Path=/' })

    expect(isOdooHeaders(value)).toBe(false)
  })

  it('should return false without cookies', () => {
    expect(isOdooHeaders(new Headers())).toBe(false)
  })
})

describe('parseOdooUrl', () => {
  it('should return the blog of a blog page', () => {
    const expected: OdooUrl = { kind: 'blog', blog: 'news-1' }

    expect(parseOdooUrl('https://example.com/blog/news-1')).toEqual(expected)
  })

  it('should return the blog of a post page', () => {
    const expected: OdooUrl = { kind: 'blog', blog: 'news-1' }

    expect(parseOdooUrl('https://example.com/blog/news-1/ubuntu-touch-q-a-199-4013')).toEqual(
      expected,
    )
  })

  it('should return the blog of a post page on Odoo 13 and earlier', () => {
    const expected: OdooUrl = { kind: 'blog', blog: 'news-1' }

    expect(parseOdooUrl('https://example.com/blog/news-1/post/a-post-12')).toEqual(expected)
  })

  it('should return the blog of a tag page', () => {
    const expected: OdooUrl = { kind: 'blog', blog: 'news-1' }

    expect(parseOdooUrl('https://example.com/blog/news-1/tag/audiocast-1')).toEqual(expected)
  })

  it('should return the blog of a translated page', () => {
    const expected: OdooUrl = { kind: 'blog', blog: 'actualites-5' }

    expect(parseOdooUrl('https://example.com/fr_FR/blog/actualites-5')).toEqual(expected)
  })

  it('should return the blog under a bare language prefix', () => {
    const value = 'https://example.com/fr/blog/actualites-5'
    const expected: OdooUrl = { kind: 'blog', blog: 'actualites-5' }

    expect(parseOdooUrl(value)).toEqual(expected)
  })

  it('should return the blog under a language and numeric region prefix', () => {
    const value = 'https://example.com/es_419/blog/noticias-5'
    const expected: OdooUrl = { kind: 'blog', blog: 'noticias-5' }

    expect(parseOdooUrl(value)).toEqual(expected)
  })

  it('should return undefined under a prefix that names no language', () => {
    const value = 'https://example.com/abcd/blog/news-1'

    expect(parseOdooUrl(value)).toBeUndefined()
  })

  it('should return undefined for the list of all blogs', () => {
    expect(parseOdooUrl('https://example.com/blog')).toBeUndefined()
  })

  it('should return undefined for a tag page across all blogs', () => {
    expect(parseOdooUrl('https://example.com/blog/tag/audiocast-1')).toBeUndefined()
  })

  it('should return undefined for a blog segment without an id', () => {
    expect(parseOdooUrl('https://example.com/blog/news')).toBeUndefined()
  })

  it('should return undefined for an unparsable URL', () => {
    expect(parseOdooUrl('not-a-url')).toBeUndefined()
  })
})

describe('odooHandler', () => {
  describe('match', () => {
    it('should match an Odoo blog page', () => {
      expect(odooHandler.match('https://example.com/blog/news-1', '', odooHeaders)).toBe(true)
    })

    it('should not match without headers', () => {
      expect(odooHandler.match('https://example.com/blog/news-1')).toBe(false)
    })

    it('should not match an Odoo page outside a blog', () => {
      expect(odooHandler.match('https://example.com/shop', '', odooHeaders)).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return empty array for a URL that does not parse', () => {
      expect(odooHandler.resolve('not-a-url')).toEqual([])
    })

    it('should return the blog feed for a post page', () => {
      const value = 'https://example.com/blog/news-1/ubuntu-touch-q-a-199-4013'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://example.com/blog/news-1/feed',
          hint: { key: 'odoo:blog', label: 'Blog', format: 'atom' },
        },
      ]

      expect(odooHandler.resolve(value)).toEqual(expected)
    })

    it('should return the bare blog feed for a page under a language prefix', () => {
      const value = 'https://example.com/fr_FR/blog/actualites-5'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://example.com/blog/actualites-5/feed',
          hint: { key: 'odoo:blog', label: 'Blog', format: 'atom' },
        },
      ]

      expect(odooHandler.resolve(value)).toEqual(expected)
    })
  })

  describe('getFeedHint', () => {
    it('should return the blog hint for a feed under a language prefix', () => {
      const value = 'https://example.odoo.com/fr_FR/blog/actualites-5/feed'
      const expected: DiscoverUriHint = { key: 'odoo:blog', label: 'Blog', format: 'atom' }

      expect(odooHandler.getFeedHint?.(value)).toEqual(expected)
    })
  })

  describe('own feeds through the Platform method', () => {
    it('should return a blog feed under a language prefix over http as itself', async () => {
      const value = 'http://example.odoo.com/en_GB/blog/news-2/feed'
      const options = {
        ...defaultPlatformOptions,
        handlers: [odooHandler],
        baseUrl: value,
      }
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'http://example.odoo.com/en_GB/blog/news-2/feed',
          hint: { key: 'odoo:blog', label: 'Blog', format: 'atom' },
        },
      ]

      expect(await discoverUrisFromPlatform(undefined, undefined, options)).toEqual(expected)
    })
  })
})
