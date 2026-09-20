import { describe, expect, it } from 'bun:test'
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
`
const otherHtml = `
  <meta
    name="confluence-base-url"
    content="https://wiki.example.org"
  >
`

describe('isJiraHtml', () => {
  it('should return true for the base URL meta tag', () => {
    expect(isJiraHtml(jiraHtml)).toBe(true)
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

    it('should not match Confluence on a Cloud site', () => {
      expect(jiraHandler.match('https://example.atlassian.net/wiki/spaces/DOCS')).toBe(false)
    })

    it('should match a Data Center issue path with content', () => {
      expect(jiraHandler.match('https://jira.example.org/browse/ABC-1', jiraHtml)).toBe(true)
    })

    it('should match a Data Center project path with content', () => {
      expect(jiraHandler.match('https://jira.example.org/projects/ABC', jiraHtml)).toBe(true)
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

    it('should not match invalid URLs', () => {
      expect(jiraHandler.match('not-a-url', jiraHtml)).toBe(false)
    })
  })

  describe('resolve', () => {
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

    it('should return an empty array for a Confluence path', () => {
      expect(jiraHandler.resolve('https://example.atlassian.net/wiki/spaces/DOCS')).toEqual([])
    })

    it('should return an empty array for invalid URLs', () => {
      expect(jiraHandler.resolve('not-a-url')).toEqual([])
    })
  })
})
