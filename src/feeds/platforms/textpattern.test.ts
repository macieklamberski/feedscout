import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry } from '../../common/types.js'
import { isTextpatternHtml, textpatternHandler } from './textpattern.js'

const textpatternHtml = '<meta name="generator" content="Textpattern CMS">'
const otherHtml = '<meta name="generator" content="WordPress 6.4">'

describe('isTextpatternHtml', () => {
  it('should return true for the Textpattern generator meta tag', () => {
    expect(isTextpatternHtml(textpatternHtml)).toBe(true)
  })

  it('should return false for another generator', () => {
    expect(isTextpatternHtml(otherHtml)).toBe(false)
  })

  it('should return false for empty content', () => {
    expect(isTextpatternHtml('')).toBe(false)
  })
})

describe('textpatternHandler', () => {
  describe('match', () => {
    it('should match a Textpattern page', () => {
      expect(textpatternHandler.match('https://example.com/article/1', textpatternHtml)).toBe(true)
    })

    it('should not match without content', () => {
      expect(textpatternHandler.match('https://example.com/')).toBe(false)
    })

    it('should not match another platform', () => {
      expect(textpatternHandler.match('https://example.com/', otherHtml)).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return the RSS and Atom feeds', () => {
      const value = 'https://example.com/article/1'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://example.com/rss',
          hint: { key: 'textpattern:posts', label: 'Posts', format: 'rss' },
        },
        {
          uri: 'https://example.com/atom',
          hint: { key: 'textpattern:posts', label: 'Posts', format: 'atom' },
        },
      ]

      expect(textpatternHandler.resolve(value)).toEqual(expected)
    })

    it('should return the feeds of a site under a sub-path', () => {
      const value = 'https://example.com/blog/articles/1/hello'
      const content = `
        <link
          rel="alternate"
          type="application/rss+xml"
          href="https://example.com/blog/rss/"
        >
      `
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://example.com/blog/rss',
          hint: { key: 'textpattern:posts', label: 'Posts', format: 'rss' },
        },
        {
          uri: 'https://example.com/blog/atom',
          hint: { key: 'textpattern:posts', label: 'Posts', format: 'atom' },
        },
      ]

      expect(textpatternHandler.resolve(value, content)).toEqual(expected)
    })

    it('should ignore a feed link of a site the page is not under', () => {
      const value = 'https://example.com/articles/1/hello'
      const content = `
        <link rel="stylesheet" href="https://example.com/css/default.css">
        <link
          rel="alternate"
          type="application/rss+xml"
          href="https://example.com/blog/rss"
        >
      `
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://example.com/rss',
          hint: { key: 'textpattern:posts', label: 'Posts', format: 'rss' },
        },
        {
          uri: 'https://example.com/atom',
          hint: { key: 'textpattern:posts', label: 'Posts', format: 'atom' },
        },
      ]

      expect(textpatternHandler.resolve(value, content)).toEqual(expected)
    })

    it('should ignore a feed link on another host', () => {
      const value = 'https://example.com/articles/1/hello'
      const content = `
        <link
          rel="alternate"
          type="application/rss+xml"
          href="https://example.org/blog/rss"
        >
      `
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://example.com/rss',
          hint: { key: 'textpattern:posts', label: 'Posts', format: 'rss' },
        },
        {
          uri: 'https://example.com/atom',
          hint: { key: 'textpattern:posts', label: 'Posts', format: 'atom' },
        },
      ]

      expect(textpatternHandler.resolve(value, content)).toEqual(expected)
    })
  })
})
