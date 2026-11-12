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
          uri: 'https://jira.example.org/plugins/servlet/streams?key=A%26B',
          hint: { key: 'jira:project', label: 'Project' },
        },
        {
          uri: 'https://jira.example.org/plugins/servlet/streams',
          hint: { key: 'jira:site', label: 'Site activity' },
        },
      ]

      expect(jiraHandler.resolve(value, content)).toEqual(expected)
    })

    it('should return the project and site feeds for a capitalized browse segment', () => {
      const value = 'https://example.atlassian.net/Browse/ABC-1'
      const expected = [
        {
          uri: 'https://example.atlassian.net/plugins/servlet/streams?key=ABC',
          hint: { key: 'jira:project', label: 'Project' },
        },
        {
          uri: 'https://example.atlassian.net/plugins/servlet/streams',
          hint: { key: 'jira:site', label: 'Site activity' },
        },
      ]

      expect(jiraHandler.resolve(value)).toEqual(expected)
    })

    it('should return the project and site streams for an issue path', () => {
      const value = 'https://jira.example.org/browse/ABC-1'
      const expected = [
        {
          uri: 'https://jira.example.org/plugins/servlet/streams?key=ABC',
          hint: { key: 'jira:project', label: 'Project' },
        },
        {
          uri: 'https://jira.example.org/plugins/servlet/streams',
          hint: { key: 'jira:site', label: 'Site activity' },
        },
      ]

      expect(jiraHandler.resolve(value, jiraHtml)).toEqual(expected)
    })

    it('should read the project key from a project path', () => {
      const value = 'https://example.atlassian.net/jira/software/projects/ABC/boards/1'
      const expected = [
        {
          uri: 'https://example.atlassian.net/plugins/servlet/streams?key=ABC',
          hint: { key: 'jira:project', label: 'Project' },
        },
        {
          uri: 'https://example.atlassian.net/plugins/servlet/streams',
          hint: { key: 'jira:site', label: 'Site activity' },
        },
      ]

      expect(jiraHandler.resolve(value)).toEqual(expected)
    })

    it('should prefix the context path', () => {
      const value = 'https://example.org/jira/browse/ABC-1'
      const expected = [
        {
          uri: 'https://example.org/jira/plugins/servlet/streams?key=ABC',
          hint: { key: 'jira:project', label: 'Project' },
        },
        {
          uri: 'https://example.org/jira/plugins/servlet/streams',
          hint: { key: 'jira:site', label: 'Site activity' },
        },
      ]

      expect(jiraHandler.resolve(value, contextPathHtml)).toEqual(expected)
    })

    it('should return only the site stream without a project key', () => {
      const value = 'https://example.atlassian.net/'
      const expected = [
        {
          uri: 'https://example.atlassian.net/plugins/servlet/streams',
          hint: { key: 'jira:site', label: 'Site activity' },
        },
      ]

      expect(jiraHandler.resolve(value)).toEqual(expected)
    })

    it('should return https feeds for an http Cloud page', () => {
      const value = 'http://example.atlassian.net/browse/ABC-1'
      const expected = [
        {
          uri: 'https://example.atlassian.net/plugins/servlet/streams?key=ABC',
          hint: { key: 'jira:project', label: 'Project' },
        },
        {
          uri: 'https://example.atlassian.net/plugins/servlet/streams',
          hint: { key: 'jira:site', label: 'Site activity' },
        },
      ]

      expect(jiraHandler.resolve(value)).toEqual(expected)
    })

    it('should return an empty array for a Confluence path', () => {
      expect(jiraHandler.resolve('https://example.atlassian.net/wiki/spaces/DOCS')).toEqual([])
    })
  })

  describe('getFeedKey', () => {
    it('should return the project key for a project feed', () => {
      const value = 'https://xdevsoftware.atlassian.net/plugins/servlet/streams?key=XWS'
      const expected = 'jira:project'

      expect(jiraHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return the site key for a site feed', () => {
      const value = 'https://dcosjira.atlassian.net/plugins/servlet/streams'
      const expected = 'jira:site'

      expect(jiraHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return the project key for a project activity feed', () => {
      const value = 'https://redhat.atlassian.net/activity?key=TORQUE'
      const expected = 'jira:project'

      expect(jiraHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return the project key for a project feed with a trailing slash', () => {
      const value = 'https://dcosjira.atlassian.net/plugins/servlet/streams/?key=DCOS'
      const expected = 'jira:project'

      expect(jiraHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return the project key for a project feed with another parameter', () => {
      const value = 'https://dcosjira.atlassian.net/plugins/servlet/streams?key=DCOS&maxResults=10'
      const expected = 'jira:project'

      expect(jiraHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return undefined for an issue page', () => {
      const value = 'https://dcosjira.atlassian.net/browse/DCOS-1'

      expect(jiraHandler.getFeedKey?.(value)).toBeUndefined()
    })

    it('should return undefined for a Confluence feed on a Cloud site', () => {
      const value = 'https://dcosjira.atlassian.net/wiki/plugins/servlet/streams?key=DOCS'

      expect(jiraHandler.getFeedKey?.(value)).toBeUndefined()
    })

    it('should return undefined for a Confluence activity feed on a Cloud site', () => {
      const value = 'https://redhat.atlassian.net/wiki/activity'

      expect(jiraHandler.getFeedKey?.(value)).toBeUndefined()
    })

    it('should return undefined for a feed on the www host', () => {
      const value = 'https://www.atlassian.net/plugins/servlet/streams'

      expect(jiraHandler.getFeedKey?.(value)).toBeUndefined()
    })

    it('should return undefined for a feed on a nested subdomain', () => {
      const value = 'https://a.dcosjira.atlassian.net/plugins/servlet/streams'

      expect(jiraHandler.getFeedKey?.(value)).toBeUndefined()
    })

    it('should return undefined for a Data Center feed', () => {
      const value = 'https://jira.example.org/plugins/servlet/streams?key=ABC'

      expect(jiraHandler.getFeedKey?.(value)).toBeUndefined()
    })
  })

  describe('own feeds through the Platform method', () => {
    const ownFeeds: Array<[string, DiscoverUriHint]> = [
      [
        'https://xdevsoftware.atlassian.net/plugins/servlet/streams?key=XWS',
        { key: 'jira:project', label: 'Project' },
      ],
      [
        'https://dcosjira.atlassian.net/plugins/servlet/streams?key=DCOS',
        { key: 'jira:project', label: 'Project' },
      ],
      [
        'https://redhat.atlassian.net/activity?key=TORQUE',
        { key: 'jira:project', label: 'Project' },
      ],
      [
        'https://dcosjira.atlassian.net/plugins/servlet/streams',
        { key: 'jira:site', label: 'Site activity' },
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
