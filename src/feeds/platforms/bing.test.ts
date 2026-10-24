import { describe, expect, it } from 'bun:test'
import type { BingUrl } from './bing.js'
import { bingHandler, parseBingUrl } from './bing.js'

describe('parseBingUrl', () => {
  it('should return a web search for a search page', () => {
    const expected: BingUrl = { kind: 'search', query: 'feedscout' }

    expect(parseBingUrl('https://www.bing.com/search?q=feedscout&form=QBLH')).toEqual(expected)
  })

  it('should return a web search for a search page on the apex host', () => {
    const expected: BingUrl = { kind: 'search', query: 'feedscout' }

    expect(parseBingUrl('https://bing.com/search?q=feedscout')).toEqual(expected)
  })

  it('should return a web search for a search page with a capitalized search segment', () => {
    const expected: BingUrl = { kind: 'search', query: 'feedscout' }

    expect(parseBingUrl('https://www.bing.com/Search?q=feedscout')).toEqual(expected)
  })

  it('should return the decoded query of a search page', () => {
    const expected: BingUrl = { kind: 'search', query: 'site:github.io rss' }

    expect(parseBingUrl('https://www.bing.com/search?q=site%3Agithub.io+rss')).toEqual(expected)
  })

  it('should return a news search for a news search page', () => {
    const expected: BingUrl = { kind: 'news', query: 'rss' }

    expect(parseBingUrl('https://www.bing.com/news/search?q=rss&FORM=HDRSC6')).toEqual(expected)
  })

  it('should return undefined for a search page without a query', () => {
    expect(parseBingUrl('https://www.bing.com/search?form=QBLH')).toBeUndefined()
  })

  it('should return undefined for an image search page', () => {
    expect(parseBingUrl('https://www.bing.com/images/search?q=cat')).toBeUndefined()
  })

  it('should return undefined for the home page', () => {
    expect(parseBingUrl('https://www.bing.com/')).toBeUndefined()
  })

  it('should return undefined for another host', () => {
    expect(parseBingUrl('https://example.com/search?q=feedscout')).toBeUndefined()
  })

  it('should return undefined for an invalid URL', () => {
    expect(parseBingUrl('not a url')).toBeUndefined()
  })
})

describe('bingHandler', () => {
  describe('match', () => {
    it('should match a Bing search page', () => {
      expect(bingHandler.match('https://www.bing.com/search?q=feedscout')).toBe(true)
    })

    it('should not match other hosts', () => {
      expect(bingHandler.match('https://example.com/search?q=feedscout')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return empty array for a URL outside Bing', () => {
      expect(bingHandler.resolve('https://example.com/search?q=feedscout')).toEqual([])
    })

    it('should return the search feed for a search page', () => {
      const value = 'https://www.bing.com/search?q=feedscout&form=QBLH'
      const expected = [
        {
          uri: 'https://www.bing.com/search?q=feedscout&format=rss',
          hint: { key: 'bing:search', label: 'Search' },
        },
      ]

      expect(bingHandler.resolve(value)).toEqual(expected)
    })

    it('should write the query of a search page as a query value', () => {
      const value = 'https://www.bing.com/search?q=site%3Agithub.io+c%2B%2B'
      const expected = [
        {
          uri: 'https://www.bing.com/search?q=site:github.io%20c%2B%2B&format=rss',
          hint: { key: 'bing:search', label: 'Search' },
        },
      ]

      expect(bingHandler.resolve(value)).toEqual(expected)
    })

    it('should return the news search feed for a news search page', () => {
      const value = 'https://www.bing.com/news/search?q=rss&FORM=HDRSC6'
      const expected = [
        {
          uri: 'https://www.bing.com/news/search?q=rss&format=rss',
          hint: { key: 'bing:news', label: 'News search' },
        },
      ]

      expect(bingHandler.resolve(value)).toEqual(expected)
    })
  })
})
