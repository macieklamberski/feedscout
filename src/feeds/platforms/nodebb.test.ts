import { describe, expect, it } from 'bun:test'
import { isNodebbHeaders, nodebbHandler } from './nodebb.js'

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

describe('nodebbHandler', () => {
  describe('match', () => {
    it('should match a NodeBB page', () => {
      expect(nodebbHandler.match('https://example.org/', '', nodebbHeaders)).toBe(true)
    })

    it('should not match without the header', () => {
      expect(nodebbHandler.match('https://example.org/')).toBe(false)
    })

    it('should not match invalid URLs', () => {
      expect(nodebbHandler.match('not-a-url', '', nodebbHeaders)).toBe(false)
    })
  })

  describe('resolve', () => {
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

    it('should return an empty array for invalid URLs', () => {
      expect(nodebbHandler.resolve('not-a-url')).toEqual([])
    })
  })
})
