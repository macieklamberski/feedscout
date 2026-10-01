import { describe, expect, it } from 'bun:test'
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

  it('should return undefined for another page', () => {
    expect(parseV2exUrl('https://www.v2ex.com/recent')).toBeUndefined()
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

    it('should return lowercase node feed for a capitalized node', () => {
      const value = 'https://www.v2ex.com/go/Python'
      const expected = [
        {
          uri: 'https://www.v2ex.com/feed/python.xml',
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

    it('should return lowercase tab feed for a capitalized tab', () => {
      const value = 'https://www.v2ex.com/?tab=TECH'
      const expected = [
        {
          uri: 'https://www.v2ex.com/feed/tab/tech.xml',
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

    it('should return empty array for unrecognized paths', () => {
      const value = 'https://www.v2ex.com/t/12345'

      expect(v2exHandler.resolve(value)).toEqual([])
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
  })
})
