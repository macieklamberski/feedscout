import { describe, expect, it } from 'bun:test'
import { confluenceHandler, isConfluenceHtml } from './confluence.js'

const confluenceHtml = `
  <meta
    id="confluence-context-path"
    name="confluence-context-path"
    content="/confluence"
  >
  <meta
    id="confluence-base-url"
    name="confluence-base-url"
    content="https://wiki.example.org/confluence"
  >
  <meta
    id="confluence-space-key"
    name="confluence-space-key"
    content="DOCS"
  >
`
const rootContextHtml = `
  <meta
    name="confluence-context-path"
    content=""
  >
  <meta
    name="confluence-base-url"
    content="https://wiki.example.org"
  >
  <meta
    name="confluence-space-key"
    content="DOCS"
  >
`
const otherHtml = `
  <meta
    name="ajs-base-url"
    content="https://jira.example.org"
  >
`

describe('isConfluenceHtml', () => {
  it('should return true for the base URL meta tag', () => {
    expect(isConfluenceHtml(confluenceHtml)).toBe(true)
  })

  it('should return false for a Jira page', () => {
    expect(isConfluenceHtml(otherHtml)).toBe(false)
  })

  it('should return false for empty content', () => {
    expect(isConfluenceHtml('')).toBe(false)
  })
})

describe('confluenceHandler', () => {
  describe('match', () => {
    it('should match a space page', () => {
      expect(
        confluenceHandler.match('https://wiki.example.org/confluence/display/DOCS', confluenceHtml),
      ).toBe(true)
    })

    it('should not match without content', () => {
      expect(confluenceHandler.match('https://wiki.example.org/confluence/display/DOCS')).toBe(
        false,
      )
    })

    it('should not match a Jira page', () => {
      expect(confluenceHandler.match('https://jira.example.org/browse/ABC-1', otherHtml)).toBe(
        false,
      )
    })

    it('should not match invalid URLs', () => {
      expect(confluenceHandler.match('not-a-url', confluenceHtml)).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return the space and site streams', () => {
      const value = 'https://wiki.example.org/confluence/display/DOCS'
      const expected = [
        {
          uri: 'https://wiki.example.org/confluence/plugins/servlet/streams?key=DOCS',
          hint: { key: 'confluence:space', label: 'Space' },
        },
        {
          uri: 'https://wiki.example.org/confluence/plugins/servlet/streams',
          hint: { key: 'confluence:site', label: 'Site activity' },
        },
      ]

      expect(confluenceHandler.resolve(value, confluenceHtml)).toEqual(expected)
    })

    it('should build from the fetched origin, not the base URL meta tag', () => {
      const value = 'https://internal.example.com/confluence/display/DOCS'
      const expected = [
        {
          uri: 'https://internal.example.com/confluence/plugins/servlet/streams?key=DOCS',
          hint: { key: 'confluence:space', label: 'Space' },
        },
        {
          uri: 'https://internal.example.com/confluence/plugins/servlet/streams',
          hint: { key: 'confluence:site', label: 'Site activity' },
        },
      ]

      expect(confluenceHandler.resolve(value, confluenceHtml)).toEqual(expected)
    })

    it('should handle an empty context path', () => {
      const value = 'https://wiki.example.org/display/DOCS'
      const expected = [
        {
          uri: 'https://wiki.example.org/plugins/servlet/streams?key=DOCS',
          hint: { key: 'confluence:space', label: 'Space' },
        },
        {
          uri: 'https://wiki.example.org/plugins/servlet/streams',
          hint: { key: 'confluence:site', label: 'Site activity' },
        },
      ]

      expect(confluenceHandler.resolve(value, rootContextHtml)).toEqual(expected)
    })

    it('should return only the site stream without a space key', () => {
      const value = 'https://wiki.example.org/confluence/dashboard.action'
      const content = '<meta name="confluence-base-url" content="https://wiki.example.org">'
      const expected = [
        {
          uri: 'https://wiki.example.org/plugins/servlet/streams',
          hint: { key: 'confluence:site', label: 'Site activity' },
        },
      ]

      expect(confluenceHandler.resolve(value, content)).toEqual(expected)
    })

    it('should return an empty array for invalid URLs', () => {
      expect(confluenceHandler.resolve('not-a-url', confluenceHtml)).toEqual([])
    })
  })
})
