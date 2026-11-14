import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry, DiscoverUriHint } from '../../common/types.js'
import { discoverUrisFromPlatform } from '../../common/uris/platform/index.js'
import { defaultPlatformOptions } from '../defaults.js'
import { isJiraHtml, jiraHandler } from './jira.js'

const jiraHtml = `
  <meta
    name="ajs-base-url"
    content="https://jira.example.org"
  >
  <meta
    name="ajs-context-path"
    content=""
  >
  <meta
    name="application-name"
    content="JIRA"
  >
`
const contextPathHtml = `
  <meta
    name="ajs-base-url"
    content="https://example.org/jira"
  >
  <meta
    name="ajs-context-path"
    content="/jira"
  >
  <meta
    name="application-name"
    content="JIRA"
  >
`
const otherHtml = `
  <meta
    name="confluence-base-url"
    content="https://wiki.example.org"
  >
`

describe('isJiraHtml', () => {
  it('should return true for the base URL and application name metas', () => {
    expect(isJiraHtml(jiraHtml)).toBe(true)
  })

  it('should return false for the base URL meta of another Atlassian product', () => {
    const value = '<meta name="ajs-base-url" content="https://wiki.example.org">'

    expect(isJiraHtml(value)).toBe(false)
  })

  it('should return false for a Confluence page', () => {
    expect(isJiraHtml(otherHtml)).toBe(false)
  })

  it('should return false for empty content', () => {
    expect(isJiraHtml('')).toBe(false)
  })
})

describe('jiraHandler', () => {
  describe('match', () => {
    it('should match a Cloud site without content', () => {
      expect(jiraHandler.match('https://example.atlassian.net/browse/ABC-1')).toBe(true)
      expect(jiraHandler.match('https://example.atlassian.net/jira/software/projects/ABC')).toBe(
        true,
      )
    })

    it('should not match the www host without content', () => {
      expect(jiraHandler.match('https://www.atlassian.net/browse/ABC-1')).toBe(false)
    })

    it('should not match a nested subdomain without content', () => {
      expect(jiraHandler.match('https://a.b.atlassian.net/browse/ABC-1')).toBe(false)
    })

    it('should not match Confluence on a Cloud site', () => {
      expect(jiraHandler.match('https://example.atlassian.net/wiki/spaces/DOCS')).toBe(false)
    })

    it('should not match Confluence on a Cloud site with a capitalized wiki segment', () => {
      expect(jiraHandler.match('https://example.atlassian.net/Wiki/spaces/DOCS')).toBe(false)
    })

    it('should match a Data Center issue path with content', () => {
      expect(jiraHandler.match('https://jira.example.org/browse/ABC-1', jiraHtml)).toBe(true)
    })

    it('should match a Data Center project path with content', () => {
      expect(jiraHandler.match('https://jira.example.org/projects/ABC', jiraHtml)).toBe(true)
    })

    it('should match a Data Center project path with content with a capitalized projects segment', () => {
      expect(jiraHandler.match('https://jira.example.org/Projects/ABC', jiraHtml)).toBe(true)
    })

    it('should match a context path without a trailing slash', () => {
      expect(jiraHandler.match('https://example.org/jira', jiraHtml)).toBe(true)
    })

    it('should match a capitalized context path without a trailing slash', () => {
      expect(jiraHandler.match('https://example.org/Jira', jiraHtml)).toBe(true)
    })

    it('should not match a Bitbucket repository path', () => {
      expect(jiraHandler.match('https://code.example.org/projects/ABC/repos/app', jiraHtml)).toBe(
        false,
      )
    })

    it('should not match a Confluence page that also ships the meta tag', () => {
      expect(jiraHandler.match('https://wiki.example.org/display/DOCS', jiraHtml)).toBe(false)
    })

    it('should not match a Data Center path without content', () => {
      expect(jiraHandler.match('https://jira.example.org/browse/ABC-1')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should keep a project key with & inside the key query value', () => {
      const value = 'https://jira.example.org/secure/Dashboard.jspa'
      const content = '<meta name="ajs-project-key" content="A&amp;B">'
      const expected = [
        {
          uri: 'https://jira.example.org/activity?key=A%26B',
          hint: { key: 'jira:project', label: 'Project' },
        },
        {
          uri: 'https://jira.example.org/activity',
          hint: { key: 'jira:site', label: 'Site activity' },
        },
      ]

      expect(jiraHandler.resolve(value, content)).toEqual(expected)
    })

    it('should return the project and site feeds for a capitalized browse segment', () => {
      const value = 'https://example.atlassian.net/Browse/ABC-1'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://example.atlassian.net/si/jira.issueviews:issue-xml/ABC-1/ABC-1.xml',
          hint: { key: 'jira:issue', label: 'Issue', format: 'rss' },
        },
        {
          uri: 'https://example.atlassian.net/activity?key=ABC',
          hint: { key: 'jira:project', label: 'Project' },
        },
        {
          uri: 'https://example.atlassian.net/activity',
          hint: { key: 'jira:site', label: 'Site activity' },
        },
      ]

      expect(jiraHandler.resolve(value)).toEqual(expected)
    })

    it('should return the project and site streams for an issue path', () => {
      const value = 'https://jira.example.org/browse/ABC-1'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://jira.example.org/si/jira.issueviews:issue-xml/ABC-1/ABC-1.xml',
          hint: { key: 'jira:issue', label: 'Issue', format: 'rss' },
        },
        {
          uri: 'https://jira.example.org/activity?key=ABC',
          hint: { key: 'jira:project', label: 'Project' },
        },
        {
          uri: 'https://jira.example.org/activity',
          hint: { key: 'jira:site', label: 'Site activity' },
        },
      ]

      expect(jiraHandler.resolve(value, jiraHtml)).toEqual(expected)
    })

    it('should read the project key from a project path', () => {
      const value = 'https://example.atlassian.net/jira/software/projects/ABC/boards/1'
      const expected = [
        {
          uri: 'https://example.atlassian.net/activity?key=ABC',
          hint: { key: 'jira:project', label: 'Project' },
        },
        {
          uri: 'https://example.atlassian.net/activity',
          hint: { key: 'jira:site', label: 'Site activity' },
        },
      ]

      expect(jiraHandler.resolve(value)).toEqual(expected)
    })

    it('should prefix the context path', () => {
      const value = 'https://example.org/jira/browse/ABC-1'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://example.org/jira/si/jira.issueviews:issue-xml/ABC-1/ABC-1.xml',
          hint: { key: 'jira:issue', label: 'Issue', format: 'rss' },
        },
        {
          uri: 'https://example.org/jira/activity?key=ABC',
          hint: { key: 'jira:project', label: 'Project' },
        },
        {
          uri: 'https://example.org/jira/activity',
          hint: { key: 'jira:site', label: 'Site activity' },
        },
      ]

      expect(jiraHandler.resolve(value, contextPathHtml)).toEqual(expected)
    })

    it('should return only the site stream without a project key', () => {
      const value = 'https://example.atlassian.net/'
      const expected = [
        {
          uri: 'https://example.atlassian.net/activity',
          hint: { key: 'jira:site', label: 'Site activity' },
        },
      ]

      expect(jiraHandler.resolve(value)).toEqual(expected)
    })

    it('should return the feeds under the page scheme for an http Cloud page', () => {
      const value = 'http://example.atlassian.net/browse/ABC-1'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'http://example.atlassian.net/si/jira.issueviews:issue-xml/ABC-1/ABC-1.xml',
          hint: { key: 'jira:issue', label: 'Issue', format: 'rss' },
        },
        {
          uri: 'http://example.atlassian.net/activity?key=ABC',
          hint: { key: 'jira:project', label: 'Project' },
        },
        {
          uri: 'http://example.atlassian.net/activity',
          hint: { key: 'jira:site', label: 'Site activity' },
        },
      ]

      expect(jiraHandler.resolve(value)).toEqual(expected)
    })

    it('should return an empty array for a Confluence path', () => {
      expect(jiraHandler.resolve('https://example.atlassian.net/wiki/spaces/DOCS')).toEqual([])
    })
  })

  describe('getFeedHint', () => {
    it('should return the project hint for a project feed', () => {
      const value = 'https://carolsoft.atlassian.net/plugins/servlet/streams?key=XWS'
      const expected: DiscoverUriHint = { key: 'jira:project', label: 'Project' }

      expect(jiraHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the site hint for a site feed', () => {
      const value = 'https://alicejira.atlassian.net/plugins/servlet/streams'
      const expected: DiscoverUriHint = { key: 'jira:site', label: 'Site activity' }

      expect(jiraHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the project hint for a project activity feed', () => {
      const value = 'https://bobcorp.atlassian.net/activity?key=TORQUE'
      const expected: DiscoverUriHint = { key: 'jira:project', label: 'Project' }

      expect(jiraHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the site hint for a site activity feed', () => {
      const value = 'https://alice.atlassian.net/activity'
      const expected: DiscoverUriHint = { key: 'jira:site', label: 'Site activity' }

      expect(jiraHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the project hint for a project feed with a trailing slash', () => {
      const value = 'https://alicejira.atlassian.net/plugins/servlet/streams/?key=DCOS'
      const expected: DiscoverUriHint = { key: 'jira:project', label: 'Project' }

      expect(jiraHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the project hint for a project feed with another parameter', () => {
      const value = 'https://alicejira.atlassian.net/plugins/servlet/streams?key=DCOS&maxResults=10'
      const expected: DiscoverUriHint = { key: 'jira:project', label: 'Project' }

      expect(jiraHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the issue hint for an issue XML view', () => {
      const value = 'https://alice.atlassian.net/si/jira.issueviews:issue-xml/ABC-12/ABC-12.xml'
      const expected: DiscoverUriHint = { key: 'jira:issue', label: 'Issue', format: 'rss' }

      expect(jiraHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return undefined for an issue page', () => {
      const value = 'https://alicejira.atlassian.net/browse/DCOS-1'

      expect(jiraHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for a Confluence feed on a Cloud site', () => {
      const value = 'https://alicejira.atlassian.net/wiki/plugins/servlet/streams?key=DOCS'

      expect(jiraHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for a Confluence activity feed on a Cloud site', () => {
      const value = 'https://bobcorp.atlassian.net/wiki/activity'

      expect(jiraHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for a feed on the www host', () => {
      const value = 'https://www.atlassian.net/plugins/servlet/streams'

      expect(jiraHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for a feed on a nested subdomain', () => {
      const value = 'https://a.alicejira.atlassian.net/plugins/servlet/streams'

      expect(jiraHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for a Data Center feed', () => {
      const value = 'https://jira.example.org/plugins/servlet/streams?key=ABC'

      expect(jiraHandler.getFeedHint?.(value)).toBeUndefined()
    })
  })

  describe('own feeds through the Platform method', () => {
    const ownFeeds: Array<[string, DiscoverUriHint]> = [
      [
        'https://carolsoft.atlassian.net/plugins/servlet/streams?key=XWS',
        { key: 'jira:project', label: 'Project' },
      ],
      [
        'https://alicejira.atlassian.net/plugins/servlet/streams?key=DCOS',
        { key: 'jira:project', label: 'Project' },
      ],
      [
        'https://bobcorp.atlassian.net/activity?key=TORQUE',
        { key: 'jira:project', label: 'Project' },
      ],
      [
        'https://alicejira.atlassian.net/plugins/servlet/streams',
        { key: 'jira:site', label: 'Site activity' },
      ],
      ['https://alice.atlassian.net/activity', { key: 'jira:site', label: 'Site activity' }],
      [
        'http://alice.atlassian.net/si/jira.issueviews:issue-xml/ABC-12/ABC-12.xml',
        { key: 'jira:issue', label: 'Issue', format: 'rss' },
      ],
    ]

    it.each(ownFeeds)('should return %s as itself', async (value, hint) => {
      const result = await discoverUrisFromPlatform(undefined, undefined, {
        ...defaultPlatformOptions,
        handlers: [jiraHandler],
        baseUrl: value,
      })
      const expected: Array<DiscoverUriEntry> = [{ uri: value, hint }]

      expect(result).toEqual(expected)
    })
  })
})
