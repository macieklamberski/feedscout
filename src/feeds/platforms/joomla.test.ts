import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry } from '../../common/types.js'
import { isJoomlaHtml, type JoomlaUrl, joomlaHandler, parseJoomlaUrl } from './joomla.js'

const joomlaHtml = '<meta name="generator" content="Joomla! - Open Source Content Management">'
const otherHtml = '<meta name="generator" content="Drupal 11">'

describe('isJoomlaHtml', () => {
  it('should return true for the Joomla generator meta tag', () => {
    expect(isJoomlaHtml(joomlaHtml)).toBe(true)
  })

  it('should return true for the script options a template keeps', () => {
    const value = `
      <meta name="generator" content="Helix Ultimate - The Most Popular Joomla! Template Framework.">
      <script type="application/json" class="joomla-script-options new">{}</script>
    `

    expect(isJoomlaHtml(value)).toBe(true)
  })

  it('should return false for another generator', () => {
    expect(isJoomlaHtml(otherHtml)).toBe(false)
  })

  it('should return false for empty content', () => {
    expect(isJoomlaHtml('')).toBe(false)
  })
})

describe('parseJoomlaUrl', () => {
  it('should return the view path for a page', () => {
    const expected: JoomlaUrl = { kind: 'view', path: '/blog/news' }

    expect(parseJoomlaUrl('https://example.com/blog/news')).toEqual(expected)
  })

  it('should return the root path for the home page', () => {
    const expected: JoomlaUrl = { kind: 'view', path: '/' }

    expect(parseJoomlaUrl('https://example.com/')).toEqual(expected)
  })

  it('should return undefined for an unparsable URL', () => {
    expect(parseJoomlaUrl('not-a-url')).toBeUndefined()
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
  })

  describe('resolve', () => {
    it('should return empty array for a URL that does not parse', () => {
      expect(joomlaHandler.resolve('not-a-url')).toEqual([])
    })

    it('should return the RSS and Atom forms of the view', () => {
      const value = 'https://example.com/announcements'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://example.com/announcements?format=feed&type=rss',
          hint: { key: 'joomla:view', label: 'View', format: 'rss' },
        },
        {
          uri: 'https://example.com/announcements?format=feed&type=atom',
          hint: { key: 'joomla:view', label: 'View', format: 'atom' },
        },
      ]

      expect(joomlaHandler.resolve(value)).toEqual(expected)
    })

    it('should keep a search-engine friendly html suffix', () => {
      const value = 'https://example.com/blogs.html'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://example.com/blogs.html?format=feed&type=rss',
          hint: { key: 'joomla:view', label: 'View', format: 'rss' },
        },
        {
          uri: 'https://example.com/blogs.html?format=feed&type=atom',
          hint: { key: 'joomla:view', label: 'View', format: 'atom' },
        },
      ]

      expect(joomlaHandler.resolve(value)).toEqual(expected)
    })

    it('should build the feeds of the home page on the site root', () => {
      const value = 'https://example.com/'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://example.com/?format=feed&type=rss',
          hint: { key: 'joomla:view', label: 'View', format: 'rss' },
        },
        {
          uri: 'https://example.com/?format=feed&type=atom',
          hint: { key: 'joomla:view', label: 'View', format: 'atom' },
        },
      ]

      expect(joomlaHandler.resolve(value)).toEqual(expected)
    })

    it('should drop an existing query string', () => {
      const value = 'https://example.com/announcements/?start=20'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://example.com/announcements/?format=feed&type=rss',
          hint: { key: 'joomla:view', label: 'View', format: 'rss' },
        },
        {
          uri: 'https://example.com/announcements/?format=feed&type=atom',
          hint: { key: 'joomla:view', label: 'View', format: 'atom' },
        },
      ]

      expect(joomlaHandler.resolve(value)).toEqual(expected)
    })
  })
})
