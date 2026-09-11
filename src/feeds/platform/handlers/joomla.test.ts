import { describe, expect, it } from 'bun:test'
import { isJoomlaHtml, joomlaHandler } from './joomla.js'

const joomlaHtml = '<meta name="generator" content="Joomla! - Open Source Content Management">'
const otherHtml = '<meta name="generator" content="Drupal 11">'

describe('isJoomlaHtml', () => {
  it('should return true for the Joomla generator meta tag', () => {
    expect(isJoomlaHtml(joomlaHtml)).toBe(true)
  })

  it('should return false for another generator', () => {
    expect(isJoomlaHtml(otherHtml)).toBe(false)
  })

  it('should return false for empty content', () => {
    expect(isJoomlaHtml('')).toBe(false)
  })
})

describe('joomlaHandler', () => {
  describe('match', () => {
    it('should match a Joomla view', () => {
      expect(joomlaHandler.match('https://example.com/announcements', joomlaHtml)).toBe(true)
    })

    it('should not match without content', () => {
      expect(joomlaHandler.match('https://example.com/announcements')).toBe(false)
    })

    it('should not match another platform', () => {
      expect(joomlaHandler.match('https://example.com/', otherHtml)).toBe(false)
    })

    it('should not match invalid URLs', () => {
      expect(joomlaHandler.match('not-a-url', joomlaHtml)).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return the RSS and Atom forms of the view', () => {
      const value = 'https://example.com/announcements'
      const expected = [
        {
          uri: 'https://example.com/announcements.feed?type=rss',
          hint: { key: 'joomla:view-rss', label: 'View (RSS)' },
        },
        {
          uri: 'https://example.com/announcements.feed?type=atom',
          hint: { key: 'joomla:view-atom', label: 'View (Atom)' },
        },
      ]

      expect(joomlaHandler.resolve(value)).toEqual(expected)
    })

    it('should replace a search-engine friendly html suffix', () => {
      const value = 'https://example.com/blogs.html'
      const expected = [
        {
          uri: 'https://example.com/blogs.feed?type=rss',
          hint: { key: 'joomla:view-rss', label: 'View (RSS)' },
        },
        {
          uri: 'https://example.com/blogs.feed?type=atom',
          hint: { key: 'joomla:view-atom', label: 'View (Atom)' },
        },
      ]

      expect(joomlaHandler.resolve(value)).toEqual(expected)
    })

    it('should drop a trailing slash and an existing query string', () => {
      const value = 'https://example.com/announcements/?start=20'
      const expected = [
        {
          uri: 'https://example.com/announcements.feed?type=rss',
          hint: { key: 'joomla:view-rss', label: 'View (RSS)' },
        },
        {
          uri: 'https://example.com/announcements.feed?type=atom',
          hint: { key: 'joomla:view-atom', label: 'View (Atom)' },
        },
      ]

      expect(joomlaHandler.resolve(value)).toEqual(expected)
    })

    it('should return an empty array for invalid URLs', () => {
      expect(joomlaHandler.resolve('not-a-url')).toEqual([])
    })
  })
})
