import { describe, expect, it } from 'bun:test'
import { isNodebbHeaders, type NodebbUrl, nodebbHandler, parseNodebbUrl } from './nodebb.js'

const nodebbHeaders = new Headers({ 'x-powered-by': 'NodeBB' })

describe('isNodebbHeaders', () => {
  it('should return true for the NodeBB powered-by header', () => {
    expect(isNodebbHeaders(nodebbHeaders)).toBe(true)
  })

  it('should return false when the header is absent', () => {
    expect(isNodebbHeaders(new Headers())).toBe(false)
    expect(isNodebbHeaders(new Headers({ 'x-powered-by': 'Express' }))).toBe(false)
  })
})

describe('parseNodebbUrl', () => {
  it('should return the topic with its category for a topic page', () => {
    const expected: NodebbUrl = { kind: 'topic', topicId: '42', categoryId: '3' }

    expect(parseNodebbUrl('https://forum.example/category/3/topic/42')).toEqual(expected)
  })

  it('should return the topic for a topic page', () => {
    const expected: NodebbUrl = { kind: 'topic', topicId: '42', categoryId: undefined }

    expect(parseNodebbUrl('https://forum.example/topic/42/some-title')).toEqual(expected)
  })

  it('should return the category for a category page', () => {
    const expected: NodebbUrl = { kind: 'category', categoryId: '3' }

    expect(parseNodebbUrl('https://forum.example/category/3/general')).toEqual(expected)
  })

  it('should return the forum for another page', () => {
    const expected: NodebbUrl = { kind: 'forum' }

    expect(parseNodebbUrl('https://forum.example/recent')).toEqual(expected)
  })

  it('should return undefined for an unparsable URL', () => {
    expect(parseNodebbUrl('not-a-url')).toBeUndefined()
  })
})

describe('nodebbHandler', () => {
  describe('match', () => {
    it('should match a NodeBB page', () => {
      expect(nodebbHandler.match('https://example.org/', '', nodebbHeaders)).toBe(true)
    })

    it('should not match without the header', () => {
      expect(nodebbHandler.match('https://example.org/')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return empty array for a URL that does not parse', () => {
      expect(nodebbHandler.resolve('not-a-url')).toEqual([])
    })

    it('should return the category feed for a capitalized category segment', () => {
      const value = 'https://example.org/Category/2/general'
      const expected = [
        {
          uri: 'https://example.org/category/2.rss',
          hint: { key: 'nodebb:category', label: 'Category' },
        },
        {
          uri: 'https://example.org/recent.rss',
          hint: { key: 'nodebb:recent', label: 'Recent' },
        },
        {
          uri: 'https://example.org/popular.rss',
          hint: { key: 'nodebb:popular', label: 'Popular' },
        },
      ]

      expect(nodebbHandler.resolve(value)).toEqual(expected)
    })

    it('should return the site feeds', () => {
      const value = 'https://example.org/'
      const expected = [
        { uri: 'https://example.org/recent.rss', hint: { key: 'nodebb:recent', label: 'Recent' } },
        {
          uri: 'https://example.org/popular.rss',
          hint: { key: 'nodebb:popular', label: 'Popular' },
        },
      ]

      expect(nodebbHandler.resolve(value)).toEqual(expected)
    })

    it('should add the category feed on a category page', () => {
      const value = 'https://example.org/category/2/general'
      const expected = [
        {
          uri: 'https://example.org/category/2.rss',
          hint: { key: 'nodebb:category', label: 'Category' },
        },
        { uri: 'https://example.org/recent.rss', hint: { key: 'nodebb:recent', label: 'Recent' } },
        {
          uri: 'https://example.org/popular.rss',
          hint: { key: 'nodebb:popular', label: 'Popular' },
        },
      ]

      expect(nodebbHandler.resolve(value)).toEqual(expected)
    })

    it('should add the topic feed on a topic page', () => {
      const value = 'https://example.org/topic/345/a-topic'
      const expected = [
        { uri: 'https://example.org/topic/345.rss', hint: { key: 'nodebb:topic', label: 'Topic' } },
        { uri: 'https://example.org/recent.rss', hint: { key: 'nodebb:recent', label: 'Recent' } },
        {
          uri: 'https://example.org/popular.rss',
          hint: { key: 'nodebb:popular', label: 'Popular' },
        },
      ]

      expect(nodebbHandler.resolve(value)).toEqual(expected)
    })

    it('should add the topic feed on a topic page with a capitalized topic segment', () => {
      const value = 'https://example.org/Topic/345/a-topic'
      const expected = [
        { uri: 'https://example.org/topic/345.rss', hint: { key: 'nodebb:topic', label: 'Topic' } },
        { uri: 'https://example.org/recent.rss', hint: { key: 'nodebb:recent', label: 'Recent' } },
        {
          uri: 'https://example.org/popular.rss',
          hint: { key: 'nodebb:popular', label: 'Popular' },
        },
      ]

      expect(nodebbHandler.resolve(value)).toEqual(expected)
    })
  })
})
