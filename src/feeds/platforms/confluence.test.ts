import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry } from '../../common/types.js'
import {
  type ConfluencePage,
  confluenceHandler,
  getConfluencePage,
  isConfluenceHtml,
} from './confluence.js'

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

describe('getConfluencePage', () => {
  it('should return the space of a space page under the context path', () => {
    const value = 'https://wiki.example.org/confluence/display/DOCS/Home'
    const expected: ConfluencePage = {
      kind: 'space',
      baseUrl: 'https://wiki.example.org/confluence',
      spaceKey: 'DOCS',
    }

    expect(getConfluencePage(value, confluenceHtml)).toEqual(expected)
  })

  it('should return the space of a space page at the root context', () => {
    const value = 'https://wiki.example.org/display/DOCS/Home'
    const expected: ConfluencePage = {
      kind: 'space',
      baseUrl: 'https://wiki.example.org',
      spaceKey: 'DOCS',
    }

    expect(getConfluencePage(value, rootContextHtml)).toEqual(expected)
  })

  it('should return the site for a page without a space key', () => {
    const value = 'https://wiki.example.org/confluence/dashboard.action'
    const content = `
      <meta
        name="confluence-context-path"
        content="/confluence"
      >
    `
    const expected: ConfluencePage = {
      kind: 'site',
      baseUrl: 'https://wiki.example.org/confluence',
    }

    expect(getConfluencePage(value, content)).toEqual(expected)
  })

  it('should return the site at the origin without content', () => {
    const value = 'https://wiki.example.org/confluence/dashboard.action'
    const expected: ConfluencePage = { kind: 'site', baseUrl: 'https://wiki.example.org' }

    expect(getConfluencePage(value, undefined)).toEqual(expected)
  })

  it('should drop the trailing slash of the context path', () => {
    const value = 'https://wiki.example.org/wiki/dashboard.action'
    const content = `
      <meta
        name="confluence-context-path"
        content="/wiki/"
      >
    `
    const expected: ConfluencePage = { kind: 'site', baseUrl: 'https://wiki.example.org/wiki' }

    expect(getConfluencePage(value, content)).toEqual(expected)
  })
})

describe('confluenceHandler', () => {
  describe('match', () => {
    it('should match a space page', () => {
      const value = 'https://wiki.example.org/confluence/display/DOCS'

      expect(confluenceHandler.match(value, confluenceHtml)).toBe(true)
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
  })

  describe('resolve', () => {
    it('should keep a space key with & inside the key query value', () => {
      const value = 'https://wiki.example.org/display/X'
      const content = '<meta name="confluence-space-key" content="A&amp;B">'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://wiki.example.org/plugins/servlet/streams?key=A%26B',
          hint: { key: 'confluence:space', label: 'Space' },
        },
        {
          uri: 'https://wiki.example.org/plugins/servlet/streams',
          hint: { key: 'confluence:site', label: 'Site activity' },
        },
        {
          uri: 'https://wiki.example.org/spaces/createrssfeed.action?types=page&types=blogpost&types=comment&spaces=conf_all&sort=modified&title=Dashboard+RSS+Feed&maxResults=15&publicFeed=true&rssType=rss2',
          hint: { key: 'confluence:dashboard', label: 'Dashboard', format: 'rss' },
        },
        {
          uri: 'https://wiki.example.org/spaces/createrssfeed.action?types=page&types=blogpost&types=comment&spaces=conf_all&sort=modified&title=Dashboard+RSS+Feed&maxResults=15&publicFeed=true&rssType=atom',
          hint: { key: 'confluence:dashboard', label: 'Dashboard', format: 'atom' },
        },
      ]

      expect(confluenceHandler.resolve(value, content)).toEqual(expected)
    })

    it('should return the space and site feeds', () => {
      const value = 'https://wiki.example.org/confluence/display/DOCS'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://wiki.example.org/confluence/plugins/servlet/streams?key=DOCS',
          hint: { key: 'confluence:space', label: 'Space' },
        },
        {
          uri: 'https://wiki.example.org/confluence/plugins/servlet/streams',
          hint: { key: 'confluence:site', label: 'Site activity' },
        },
        {
          uri: 'https://wiki.example.org/confluence/spaces/createrssfeed.action?types=page&types=blogpost&types=comment&spaces=conf_all&sort=modified&title=Dashboard+RSS+Feed&maxResults=15&publicFeed=true&rssType=rss2',
          hint: { key: 'confluence:dashboard', label: 'Dashboard', format: 'rss' },
        },
        {
          uri: 'https://wiki.example.org/confluence/spaces/createrssfeed.action?types=page&types=blogpost&types=comment&spaces=conf_all&sort=modified&title=Dashboard+RSS+Feed&maxResults=15&publicFeed=true&rssType=atom',
          hint: { key: 'confluence:dashboard', label: 'Dashboard', format: 'atom' },
        },
      ]

      expect(confluenceHandler.resolve(value, confluenceHtml)).toEqual(expected)
    })

    it('should build from the fetched origin, not the base URL meta tag', () => {
      const value = 'https://internal.example.com/confluence/display/DOCS'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://internal.example.com/confluence/plugins/servlet/streams?key=DOCS',
          hint: { key: 'confluence:space', label: 'Space' },
        },
        {
          uri: 'https://internal.example.com/confluence/plugins/servlet/streams',
          hint: { key: 'confluence:site', label: 'Site activity' },
        },
        {
          uri: 'https://internal.example.com/confluence/spaces/createrssfeed.action?types=page&types=blogpost&types=comment&spaces=conf_all&sort=modified&title=Dashboard+RSS+Feed&maxResults=15&publicFeed=true&rssType=rss2',
          hint: { key: 'confluence:dashboard', label: 'Dashboard', format: 'rss' },
        },
        {
          uri: 'https://internal.example.com/confluence/spaces/createrssfeed.action?types=page&types=blogpost&types=comment&spaces=conf_all&sort=modified&title=Dashboard+RSS+Feed&maxResults=15&publicFeed=true&rssType=atom',
          hint: { key: 'confluence:dashboard', label: 'Dashboard', format: 'atom' },
        },
      ]

      expect(confluenceHandler.resolve(value, confluenceHtml)).toEqual(expected)
    })

    it('should handle an empty context path', () => {
      const value = 'https://wiki.example.org/display/DOCS'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://wiki.example.org/plugins/servlet/streams?key=DOCS',
          hint: { key: 'confluence:space', label: 'Space' },
        },
        {
          uri: 'https://wiki.example.org/plugins/servlet/streams',
          hint: { key: 'confluence:site', label: 'Site activity' },
        },
        {
          uri: 'https://wiki.example.org/spaces/createrssfeed.action?types=page&types=blogpost&types=comment&spaces=conf_all&sort=modified&title=Dashboard+RSS+Feed&maxResults=15&publicFeed=true&rssType=rss2',
          hint: { key: 'confluence:dashboard', label: 'Dashboard', format: 'rss' },
        },
        {
          uri: 'https://wiki.example.org/spaces/createrssfeed.action?types=page&types=blogpost&types=comment&spaces=conf_all&sort=modified&title=Dashboard+RSS+Feed&maxResults=15&publicFeed=true&rssType=atom',
          hint: { key: 'confluence:dashboard', label: 'Dashboard', format: 'atom' },
        },
      ]

      expect(confluenceHandler.resolve(value, rootContextHtml)).toEqual(expected)
    })

    it('should return only the site feeds without a space key', () => {
      const value = 'https://wiki.example.org/confluence/dashboard.action'
      const content = '<meta name="confluence-base-url" content="https://wiki.example.org">'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://wiki.example.org/plugins/servlet/streams',
          hint: { key: 'confluence:site', label: 'Site activity' },
        },
        {
          uri: 'https://wiki.example.org/spaces/createrssfeed.action?types=page&types=blogpost&types=comment&spaces=conf_all&sort=modified&title=Dashboard+RSS+Feed&maxResults=15&publicFeed=true&rssType=rss2',
          hint: { key: 'confluence:dashboard', label: 'Dashboard', format: 'rss' },
        },
        {
          uri: 'https://wiki.example.org/spaces/createrssfeed.action?types=page&types=blogpost&types=comment&spaces=conf_all&sort=modified&title=Dashboard+RSS+Feed&maxResults=15&publicFeed=true&rssType=atom',
          hint: { key: 'confluence:dashboard', label: 'Dashboard', format: 'atom' },
        },
      ]

      expect(confluenceHandler.resolve(value, content)).toEqual(expected)
    })
  })
})
