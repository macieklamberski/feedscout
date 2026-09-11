import { describe, expect, it } from 'bun:test'
import { drupalHandler, isDrupalHeaders, isDrupalHtml } from './drupal.js'

const drupalHtml = '<meta name="Generator" content="Drupal 11 (https://www.drupal.org)" />'
const drupalHeaders = new Headers({ 'x-generator': 'Drupal 11 (https://www.drupal.org)' })
const otherHtml = '<meta name="generator" content="WordPress 6.4">'

describe('isDrupalHtml', () => {
  it('should return true for the Drupal generator meta tag', () => {
    expect(isDrupalHtml(drupalHtml)).toBe(true)
  })

  it('should return false for another generator', () => {
    expect(isDrupalHtml(otherHtml)).toBe(false)
  })

  it('should return false for empty content', () => {
    expect(isDrupalHtml('')).toBe(false)
  })
})

describe('isDrupalHeaders', () => {
  it('should return true for the x-generator header', () => {
    expect(isDrupalHeaders(drupalHeaders)).toBe(true)
  })

  it('should return false when the header is absent', () => {
    expect(isDrupalHeaders(new Headers())).toBe(false)
    expect(isDrupalHeaders(new Headers({ 'x-generator': 'Hugo 0.120' }))).toBe(false)
  })
})

describe('drupalHandler', () => {
  describe('match', () => {
    it('should match a page with the generator meta tag', () => {
      expect(drupalHandler.match('https://example.com/node/1', drupalHtml)).toBe(true)
    })

    it('should match a page with the generator header', () => {
      expect(drupalHandler.match('https://example.com/', '', drupalHeaders)).toBe(true)
    })

    it('should not match without content or headers', () => {
      expect(drupalHandler.match('https://example.com/')).toBe(false)
    })

    it('should not match another platform', () => {
      expect(drupalHandler.match('https://example.com/', otherHtml)).toBe(false)
    })

    it('should not match invalid URLs', () => {
      expect(drupalHandler.match('not-a-url', drupalHtml)).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return the site feed', () => {
      const value = 'https://example.com/node/1'
      const expected = [
        { uri: 'https://example.com/rss.xml', hint: { key: 'drupal:site', label: 'Site' } },
      ]

      expect(drupalHandler.resolve(value)).toEqual(expected)
    })

    it('should return an empty array for invalid URLs', () => {
      expect(drupalHandler.resolve('not-a-url')).toEqual([])
    })
  })
})
