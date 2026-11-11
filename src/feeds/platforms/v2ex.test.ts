import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry, DiscoverUriHint } from '../../common/types.js'
import { discoverUrisFromPlatform } from '../../common/uris/platform/index.js'
import { defaultPlatformOptions } from '../defaults.js'
import { parseV2exUrl, type V2exUrl, v2exHandler } from './v2ex.js'

describe('parseV2exUrl', () => {
  it('should return the node for a node page', () => {
    const expected: V2exUrl = { kind: 'node', node: 'Python' }

    expect(parseV2exUrl('https://www.v2ex.com/go/Python')).toEqual(expected)
  })

  it('should return the member for a member page', () => {
    const expected: V2exUrl = { kind: 'member', username: 'Livid' }

    expect(parseV2exUrl('https://www.v2ex.com/member/Livid')).toEqual(expected)
  })

  it('should return the tab for a tab query', () => {
    const expected: V2exUrl = { kind: 'tab', tab: 'tech' }

    expect(parseV2exUrl('https://www.v2ex.com/?tab=tech')).toEqual(expected)
  })

  it('should return the home page for the root', () => {
    const expected: V2exUrl = { kind: 'home' }

    expect(parseV2exUrl('https://www.v2ex.com/')).toEqual(expected)
  })

  it('should read another page as the home page', () => {
    const expected: V2exUrl = { kind: 'home' }

    expect(parseV2exUrl('https://www.v2ex.com/t/123456')).toEqual(expected)
  })

  it('should return undefined for another host', () => {
    expect(parseV2exUrl('https://example.com/go/python')).toBeUndefined()
  })
})

describe('v2exHandler', () => {
  describe('match', () => {
    const values: Array<[boolean, string]> = [
      [true, 'https://www.v2ex.com/'],
      [true, 'https://v2ex.com/'],
      [false, 'https://example.com'],
    ]

    it.each(values)('should return %s for %s', (expected, url) => {
      expect(v2exHandler.match(url)).toBe(expected)
    })

    it('should return false for invalid URL', () => {
      expect(v2exHandler.match('not-a-url')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return empty array for a URL outside V2EX', () => {
      expect(v2exHandler.resolve('https://example.com/')).toEqual([])
    })

    it('should return index feed for root page', () => {
      const value = 'https://www.v2ex.com/'
      const expected = [
        {
          uri: 'https://www.v2ex.com/index.xml',
          hint: { key: 'v2ex:index', label: 'Index' },
        },
      ]

      expect(v2exHandler.resolve(value)).toEqual(expected)
    })

    it('should return node feed for node page', () => {
      const value = 'https://www.v2ex.com/go/programmer'
      const expected = [
        {
          uri: 'https://www.v2ex.com/feed/programmer.xml',
          hint: { key: 'v2ex:node', label: 'Node' },
        },
      ]

      expect(v2exHandler.resolve(value)).toEqual(expected)
    })

    it('should keep the case of a capitalized node', () => {
      const value = 'https://www.v2ex.com/go/Python'
      const expected = [
        {
          uri: 'https://www.v2ex.com/feed/Python.xml',
          hint: { key: 'v2ex:node', label: 'Node' },
        },
      ]

      expect(v2exHandler.resolve(value)).toEqual(expected)
    })

    it('should return node feed for node page with a capitalized go segment', () => {
      const value = 'https://www.v2ex.com/Go/programmer'
      const expected = [
        {
          uri: 'https://www.v2ex.com/feed/programmer.xml',
          hint: { key: 'v2ex:node', label: 'Node' },
        },
      ]

      expect(v2exHandler.resolve(value)).toEqual(expected)
    })

    it('should return member feed for member page', () => {
      const value = 'https://www.v2ex.com/member/livid'
      const expected = [
        {
          uri: 'https://www.v2ex.com/feed/member/livid.xml',
          hint: { key: 'v2ex:member', label: 'Member' },
        },
      ]

      expect(v2exHandler.resolve(value)).toEqual(expected)
    })

    it('should return member feed for member page with a capitalized member segment', () => {
      const value = 'https://www.v2ex.com/Member/livid'
      const expected = [
        {
          uri: 'https://www.v2ex.com/feed/member/livid.xml',
          hint: { key: 'v2ex:member', label: 'Member' },
        },
      ]

      expect(v2exHandler.resolve(value)).toEqual(expected)
    })

    it('should return tab feed for tab page', () => {
      const value = 'https://www.v2ex.com/?tab=tech'
      const expected = [
        {
          uri: 'https://www.v2ex.com/feed/tab/tech.xml',
          hint: { key: 'v2ex:tab', label: 'Tab' },
        },
        { uri: 'https://www.v2ex.com/index.xml', hint: { key: 'v2ex:index', label: 'Index' } },
      ]

      expect(v2exHandler.resolve(value)).toEqual(expected)
    })

    it('should keep the case of a capitalized tab', () => {
      const value = 'https://www.v2ex.com/?tab=TECH'
      const expected = [
        {
          uri: 'https://www.v2ex.com/feed/tab/TECH.xml',
          hint: { key: 'v2ex:tab', label: 'Tab' },
        },
        { uri: 'https://www.v2ex.com/index.xml', hint: { key: 'v2ex:index', label: 'Index' } },
      ]

      expect(v2exHandler.resolve(value)).toEqual(expected)
    })

    it('should return index feed for root without www', () => {
      const value = 'https://v2ex.com/'
      const expected = [
        {
          uri: 'https://www.v2ex.com/index.xml',
          hint: { key: 'v2ex:index', label: 'Index' },
        },
      ]

      expect(v2exHandler.resolve(value)).toEqual(expected)
    })

    it('should return tab feed for /t/{id} page with tab query', () => {
      const value = 'https://www.v2ex.com/t/12345?tab=tech'
      const expected = [
        {
          uri: 'https://www.v2ex.com/feed/tab/tech.xml',
          hint: { key: 'v2ex:tab', label: 'Tab' },
        },
        { uri: 'https://www.v2ex.com/index.xml', hint: { key: 'v2ex:index', label: 'Index' } },
      ]

      expect(v2exHandler.resolve(value)).toEqual(expected)
    })

    it('should escape a slash in the tab', () => {
      const value = 'https://www.v2ex.com/?tab=tech%2Fnews'
      const expected = [
        {
          uri: 'https://www.v2ex.com/feed/tab/tech%2Fnews.xml',
          hint: { key: 'v2ex:tab', label: 'Tab' },
        },
        {
          uri: 'https://www.v2ex.com/index.xml',
          hint: { key: 'v2ex:index', label: 'Index' },
        },
      ]

      expect(v2exHandler.resolve(value)).toEqual(expected)
    })

    it('should escape a backslash in the tab', () => {
      const value = 'https://www.v2ex.com/?tab=..%5C..%5Cmember%5Cfoo'
      const expected = [
        {
          uri: 'https://www.v2ex.com/feed/tab/..%5C..%5Cmember%5Cfoo.xml',
          hint: { key: 'v2ex:tab', label: 'Tab' },
        },
        {
          uri: 'https://www.v2ex.com/index.xml',
          hint: { key: 'v2ex:index', label: 'Index' },
        },
      ]

      expect(v2exHandler.resolve(value)).toEqual(expected)
    })
  })

  describe('getFeedKey', () => {
    it('should return the member key for a member feed', () => {
      const value = 'https://www.v2ex.com/feed/member/cfans1993.xml'
      const expected = 'v2ex:member'

      expect(v2exHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return the node key for a node feed', () => {
      const value = 'https://www.v2ex.com/feed/markdown.xml'
      const expected = 'v2ex:node'

      expect(v2exHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return the tab key for a tab feed', () => {
      const value = 'https://www.v2ex.com/feed/tab/qna.xml'
      const expected = 'v2ex:tab'

      expect(v2exHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return the index key for the site feed', () => {
      const value = 'https://www.v2ex.com/index.xml'
      const expected = 'v2ex:index'

      expect(v2exHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return the member key for a member feed without www', () => {
      const value = 'https://v2ex.com/feed/member/feelinglucky.xml'
      const expected = 'v2ex:member'

      expect(v2exHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return undefined for a feed path with a third segment', () => {
      const value = 'https://www.v2ex.com/feed/member/feelinglucky/extra.xml'

      expect(v2exHandler.getFeedKey?.(value)).toBeUndefined()
    })

    it('should return undefined for a member page', () => {
      const value = 'https://www.v2ex.com/member/feelinglucky'

      expect(v2exHandler.getFeedKey?.(value)).toBeUndefined()
    })

    it('should return undefined for a node page', () => {
      const value = 'https://www.v2ex.com/go/markdown'

      expect(v2exHandler.getFeedKey?.(value)).toBeUndefined()
    })

    it('should return undefined for another host', () => {
      const value = 'https://example.com/feed/member/feelinglucky.xml'

      expect(v2exHandler.getFeedKey?.(value)).toBeUndefined()
    })
  })

  describe('own feeds through the Platform method', () => {
    const ownFeeds: Array<[string, DiscoverUriHint]> = [
      ['https://www.v2ex.com/feed/member/cfans1993.xml', { key: 'v2ex:member', label: 'Member' }],
      [
        'https://www.v2ex.com/feed/member/feelinglucky.xml',
        { key: 'v2ex:member', label: 'Member' },
      ],
      ['https://www.v2ex.com/feed/markdown.xml', { key: 'v2ex:node', label: 'Node' }],
      ['https://www.v2ex.com/feed/designer.xml', { key: 'v2ex:node', label: 'Node' }],
      ['https://www.v2ex.com/feed/tab/qna.xml', { key: 'v2ex:tab', label: 'Tab' }],
      ['https://www.v2ex.com/feed/tab/apple.xml', { key: 'v2ex:tab', label: 'Tab' }],
      ['https://www.v2ex.com/index.xml', { key: 'v2ex:index', label: 'Index' }],
    ]

    it.each(ownFeeds)('should return %s as itself', async (value, hint) => {
      const result = await discoverUrisFromPlatform(undefined, undefined, {
        ...defaultPlatformOptions,
        handlers: [v2exHandler],
        baseUrl: value,
      })
      const expected: Array<DiscoverUriEntry> = [{ uri: value, hint }]

      expect(result).toEqual(expected)
    })
  })
})
