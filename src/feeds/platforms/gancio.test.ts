import { describe, expect, it } from 'bun:test'
import { gancioHandler } from './gancio.js'

const content = `
  <link
    rel="stylesheet"
    href="https://example.org/custom_css"
  >
`

describe('gancioHandler', () => {
  describe('match', () => {
    it('should match a page carrying the custom_css stylesheet', () => {
      expect(gancioHandler.match('https://example.org/', content)).toBe(true)
    })

    it('should not match a page without the stylesheet', () => {
      const value = '<link rel="stylesheet" href="/_nuxt/css/238c047.css">'

      expect(gancioHandler.match('https://example.org/', value)).toBe(false)
    })

    it('should not match without content', () => {
      expect(gancioHandler.match('https://example.org/')).toBe(false)
    })

    it('should not match invalid URLs', () => {
      expect(gancioHandler.match('not-a-url', content)).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return the site feed for the home page', () => {
      const expected = [
        {
          uri: 'https://example.org/feed/rss',
          hint: { key: 'gancio:site', label: 'Site' },
        },
      ]

      expect(gancioHandler.resolve('https://example.org/', content)).toEqual(expected)
    })

    it('should return the site feed for an event page', () => {
      const value = 'https://example.org/event/book-fair'
      const expected = [
        {
          uri: 'https://example.org/feed/rss',
          hint: { key: 'gancio:site', label: 'Site' },
        },
      ]

      expect(gancioHandler.resolve(value, content)).toEqual(expected)
    })

    it('should return the tag feed for a tag page', () => {
      const value = 'https://example.org/tag/book%20fair'
      const expected = [
        {
          uri: 'https://example.org/feed/rss/tag/book%20fair',
          hint: { key: 'gancio:tag', label: 'Tag' },
        },
      ]

      expect(gancioHandler.resolve(value, content)).toEqual(expected)
    })

    it('should return the place feed by id for a place page', () => {
      const value = 'https://example.org/place/27/Town%20Hall'
      const expected = [
        {
          uri: 'https://example.org/feed/rss/place/27',
          hint: { key: 'gancio:place', label: 'Place' },
        },
      ]

      expect(gancioHandler.resolve(value, content)).toEqual(expected)
    })

    it('should return the collection feed for a collection page', () => {
      const value = 'https://example.org/collection/Music'
      const expected = [
        {
          uri: 'https://example.org/feed/rss/collection/Music',
          hint: { key: 'gancio:collection', label: 'Collection' },
        },
      ]

      expect(gancioHandler.resolve(value, content)).toEqual(expected)
    })

    it('should build the feeds from the install root the stylesheet names', () => {
      const value = 'https://example.org/events/tag/music'
      const subPathContent = '<link rel="stylesheet" href="https://example.org/events/custom_css">'
      const expected = [
        {
          uri: 'https://example.org/events/feed/rss/tag/music',
          hint: { key: 'gancio:tag', label: 'Tag' },
        },
      ]

      expect(gancioHandler.resolve(value, subPathContent)).toEqual(expected)
    })

    it('should drop the extra slash of a base URL ending in one', () => {
      const value = '<link rel="stylesheet" href="https://example.org//custom_css">'
      const expected = [
        {
          uri: 'https://example.org/feed/rss',
          hint: { key: 'gancio:site', label: 'Site' },
        },
      ]

      expect(gancioHandler.resolve('https://example.org/', value)).toEqual(expected)
    })

    it('should build the feeds from the page origin when the base URL names another host', () => {
      const value = '<link rel="stylesheet" href="https://example.com/custom_css">'
      const expected = [
        {
          uri: 'https://example.org/feed/rss',
          hint: { key: 'gancio:site', label: 'Site' },
        },
      ]

      expect(gancioHandler.resolve('https://example.org/', value)).toEqual(expected)
    })

    it('should return nothing without the stylesheet', () => {
      expect(gancioHandler.resolve('https://example.org/', '')).toEqual([])
    })
  })
})
