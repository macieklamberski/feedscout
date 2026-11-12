import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry, DiscoverUriHint } from '../../common/types.js'
import { discoverUrisFromPlatform } from '../../common/uris/platform/index.js'
import { defaultPlatformOptions } from '../defaults.js'
import { isUcozHeaders, parseUcozUrl, type UcozUrl, ucozHandler } from './ucoz.js'

describe('isUcozHeaders', () => {
  it('should return true for the uCoz site cookie', () => {
    const value = new Headers({
      'set-cookie': '8exampleuCoz=; path=/; expires=Fri, 04-Oct-2024 13:08:04 GMT; HttpOnly',
    })

    expect(isUcozHeaders(value)).toBe(true)
  })

  it('should return true for a site label with a hyphen', () => {
    const value = new Headers({ 'set-cookie': '4example-siteuCoz=; path=/' })

    expect(isUcozHeaders(value)).toBe(true)
  })

  it('should return true for a cookie with a letter prefix', () => {
    const value = new Headers({ 'set-cookie': 'oexampleuCoz=; path=/' })

    expect(isUcozHeaders(value)).toBe(true)
  })

  it('should return false for the cookie name without a prefix', () => {
    const value = new Headers({ 'set-cookie': 'uCoz=1; path=/' })

    expect(isUcozHeaders(value)).toBe(false)
  })

  it('should return false for other cookies', () => {
    const value = new Headers({ 'set-cookie': 'PHPSESSID=e08iumaf4ajv1q455kmrv78hb1; path=/' })

    expect(isUcozHeaders(value)).toBe(false)
  })
})

describe('parseUcozUrl', () => {
  it('should return home for the site root', () => {
    const expected: UcozUrl = { kind: 'home' }

    expect(parseUcozUrl('https://example.at.ua/')).toEqual(expected)
  })

  it('should return home for a static page', () => {
    const expected: UcozUrl = { kind: 'home' }

    expect(parseUcozUrl('https://example.at.ua/index/0-3')).toEqual(expected)
  })

  it('should return the module for a news entry', () => {
    const expected: UcozUrl = { kind: 'module', module: 'news' }

    expect(parseUcozUrl('https://example.at.ua/news/pro_shiny_shumnye_i_tikhie')).toEqual(expected)
  })

  it('should return the module for a module index', () => {
    const expected: UcozUrl = { kind: 'module', module: 'publ' }

    expect(parseUcozUrl('https://example.ucoz.ru/publ/')).toEqual(expected)
  })

  it('should return the module in its own spelling for an uppercase path', () => {
    const expected: UcozUrl = { kind: 'module', module: 'load' }

    expect(parseUcozUrl('https://example.ucoz.ru/Load/')).toEqual(expected)
  })

  it('should return the forum module for the forum index', () => {
    const expected: UcozUrl = { kind: 'module', module: 'forum' }

    expect(parseUcozUrl('https://example.ucoz.ru/forum/')).toEqual(expected)
  })

  it('should return the forum module for a forum-wide page', () => {
    const expected: UcozUrl = { kind: 'module', module: 'forum' }

    expect(parseUcozUrl('https://example.at.ua/forum/0-0-1-34')).toEqual(expected)
  })

  it('should return the forum section for a section page', () => {
    const expected: UcozUrl = { kind: 'forumSection', sectionId: '108' }

    expect(parseUcozUrl('https://example.at.ua/forum/108')).toEqual(expected)
  })

  it('should return the forum section for a topic page', () => {
    const expected: UcozUrl = { kind: 'forumSection', sectionId: '108' }

    expect(parseUcozUrl('https://example.at.ua/forum/108-107-1')).toEqual(expected)
  })

  it('should return home for an unknown module', () => {
    const expected: UcozUrl = { kind: 'home' }

    expect(parseUcozUrl('https://example.at.ua/gb/')).toEqual(expected)
  })

  it('should return undefined for a nested subdomain', () => {
    expect(parseUcozUrl('https://forum.example.ucoz.ru/')).toBeUndefined()
  })

  it('should return undefined for invalid URL', () => {
    expect(parseUcozUrl('not-a-url')).toBeUndefined()
  })
})

describe('ucozHandler', () => {
  describe('match', () => {
    const hostCases: Array<[boolean, string]> = [
      [true, 'https://example.at.ua/'],
      [true, 'https://example.ucoz.ru/news/'],
      [true, 'https://example.narod.ru/'],
      [true, 'http://example.ucoz.pl/'],
      [true, 'http://example.ucoz.co.uk/'],
      [false, 'https://www.ucoz.ru/'],
      [false, 'https://ucoz.ru/'],
      [false, 'https://example.com/'],
    ]

    it.each(hostCases)('should return %s for %s', (expected, url) => {
      expect(ucozHandler.match(url)).toBe(expected)
    })

    it('should return true for a custom domain with the uCoz cookie', () => {
      const headers = new Headers({ 'set-cookie': '8exampleuCoz=; path=/' })

      expect(ucozHandler.match('https://www.example.com/', '', headers)).toBe(true)
    })

    it('should return false for a custom domain without the uCoz cookie', () => {
      const headers = new Headers({ 'set-cookie': 'PHPSESSID=e08iumaf4ajv1q455kmrv78hb1' })

      expect(ucozHandler.match('https://example.org/', '', headers)).toBe(false)
    })

    it('should return false for invalid URL', () => {
      expect(ucozHandler.match('not-a-url')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return empty array for a URL that does not parse', () => {
      expect(ucozHandler.resolve('not-a-url')).toEqual([])
    })

    it('should return the news feed for the home page', () => {
      const value = 'https://example.at.ua/'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://example.at.ua/news/rss',
          hint: { key: 'ucoz:news', label: 'News' },
        },
      ]

      expect(ucozHandler.resolve(value)).toEqual(expected)
    })

    it('should return the module feed for a module page', () => {
      const value = 'https://example.ucoz.ru/publ/'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://example.ucoz.ru/publ/rss',
          hint: { key: 'ucoz:publ', label: 'Articles' },
        },
      ]

      expect(ucozHandler.resolve(value)).toEqual(expected)
    })

    it('should return the forum feed for the forum index', () => {
      const value = 'https://example.ucoz.ru/forum/'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://example.ucoz.ru/forum/rss',
          hint: { key: 'ucoz:forum', label: 'Forum' },
        },
      ]

      expect(ucozHandler.resolve(value)).toEqual(expected)
    })

    it('should return the section and forum feeds for a topic page', () => {
      const value = 'https://example.at.ua/forum/108-107-1'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://example.at.ua/forum/108-0-0-37',
          hint: { key: 'ucoz:forum-section', label: 'Forum section' },
        },
        {
          uri: 'https://example.at.ua/forum/rss',
          hint: { key: 'ucoz:forum', label: 'Forum' },
        },
      ]

      expect(ucozHandler.resolve(value)).toEqual(expected)
    })

    it('should keep the http origin of a site', () => {
      const value = 'http://example.ucoz.pl/'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'http://example.ucoz.pl/news/rss',
          hint: { key: 'ucoz:news', label: 'News' },
        },
      ]

      expect(ucozHandler.resolve(value)).toEqual(expected)
    })

    it('should keep the http origin of a custom domain', () => {
      const value = 'http://example.com/news/'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'http://example.com/news/rss',
          hint: { key: 'ucoz:news', label: 'News' },
        },
      ]

      expect(ucozHandler.resolve(value)).toEqual(expected)
    })

    it('should return the section and forum feeds for a topic page on a custom domain', () => {
      const value = 'https://example.com/forum/108-107-1'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://example.com/forum/108-0-0-37',
          hint: { key: 'ucoz:forum-section', label: 'Forum section' },
        },
        {
          uri: 'https://example.com/forum/rss',
          hint: { key: 'ucoz:forum', label: 'Forum' },
        },
      ]

      expect(ucozHandler.resolve(value)).toEqual(expected)
    })
  })

  describe('getFeedHint', () => {
    const moduleFeeds: Array<[string, DiscoverUriHint]> = [
      ['https://example.ucoz.ru/news/rss', { key: 'ucoz:news', label: 'News' }],
      ['https://example.at.ua/publ/rss', { key: 'ucoz:publ', label: 'Articles' }],
      ['https://example.narod.ru/load/rss', { key: 'ucoz:load', label: 'Files' }],
      ['https://example.ucoz.net/photo/rss', { key: 'ucoz:photo', label: 'Photos' }],
      ['https://example.ucoz.com.br/blog/rss', { key: 'ucoz:blog', label: 'Blog' }],
      ['https://example.my1.ru/dir/rss', { key: 'ucoz:dir', label: 'Site catalog' }],
      ['https://example.do.am/board/rss', { key: 'ucoz:board', label: 'Classifieds' }],
      ['https://example.3dn.ru/stuff/rss', { key: 'ucoz:stuff', label: 'Online games' }],
      ['https://example.clan.su/forum/rss', { key: 'ucoz:forum', label: 'Forum' }],
    ]

    it.each(moduleFeeds)('should return the module hint for %s', (value, expected) => {
      expect(ucozHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the forum hint for the forum feed as section 0', () => {
      const value = 'https://example.moy.su/forum/0-0-0-37'
      const expected: DiscoverUriHint = { key: 'ucoz:forum', label: 'Forum' }

      expect(ucozHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the forum section hint for a section feed', () => {
      const value = 'https://example.ucoz.ru/forum/12-0-0-37'
      const expected: DiscoverUriHint = { key: 'ucoz:forum-section', label: 'Forum section' }

      expect(ucozHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the module hint for a feed on the www host of a site', () => {
      const value = 'http://www.example.ucoz.ru/load/rss'
      const expected: DiscoverUriHint = { key: 'ucoz:load', label: 'Files' }

      expect(ucozHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the module hint for a feed with a trailing slash', () => {
      const value = 'https://example.ucoz.ru/news/rss/'
      const expected: DiscoverUriHint = { key: 'ucoz:news', label: 'News' }

      expect(ucozHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return undefined for a module page', () => {
      const value = 'https://example.ucoz.ru/news/'

      expect(ucozHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for the feed path of an unknown module', () => {
      const value = 'https://example.ucoz.ru/gb/rss'

      expect(ucozHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for a feed on the uCoz apex', () => {
      const value = 'https://ucoz.ru/news/rss'

      expect(ucozHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for a feed on a nested subdomain', () => {
      const value = 'https://forum.example.ucoz.ru/news/rss'

      expect(ucozHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for the news feed of a custom domain', () => {
      const value = 'https://example.com/news/rss'

      expect(ucozHandler.getFeedHint?.(value)).toBeUndefined()
    })
  })

  describe('own feeds through the Platform method', () => {
    const ownFeeds: Array<[string, DiscoverUriHint]> = [
      ['https://example.ucoz.ru/news/rss/', { key: 'ucoz:news', label: 'News' }],
      ['https://example.at.ua/publ/rss/', { key: 'ucoz:publ', label: 'Articles' }],
      ['http://www.example.ucoz.ru/load/rss', { key: 'ucoz:load', label: 'Files' }],
      ['https://example.narod.ru/photo/rss/', { key: 'ucoz:photo', label: 'Photos' }],
      ['https://example.ucoz.com.br/blog/rss/', { key: 'ucoz:blog', label: 'Blog' }],
      ['https://example.my1.ru/dir/rss/', { key: 'ucoz:dir', label: 'Site catalog' }],
      ['https://example.do.am/board/rss/', { key: 'ucoz:board', label: 'Classifieds' }],
      ['https://example.3dn.ru/stuff/rss/', { key: 'ucoz:stuff', label: 'Online games' }],
      ['https://example.clan.su/forum/rss/', { key: 'ucoz:forum', label: 'Forum' }],
      ['https://example.moy.su/forum/0-0-0-37', { key: 'ucoz:forum', label: 'Forum' }],
      [
        'https://example.ucoz.net/forum/12-0-0-37',
        { key: 'ucoz:forum-section', label: 'Forum section' },
      ],
    ]

    it.each(ownFeeds)('should return %s as itself', async (value, hint) => {
      const result = await discoverUrisFromPlatform(undefined, undefined, {
        ...defaultPlatformOptions,
        handlers: [ucozHandler],
        baseUrl: value,
      })
      const expected: Array<DiscoverUriEntry> = [{ uri: value, hint }]

      expect(result).toEqual(expected)
    })
  })
})
