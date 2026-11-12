import { composeQuery } from 'trousse'
import type { DiscoverUriEntry } from '../../common/types.js'
import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import {
  composeHint,
  getMetaContent,
  getTenantSubdomain,
  hasMarker,
  hasMetaContent,
} from '../../common/utils.js'

// Discoverability: Not discoverable without handler.
// Handler needed for: all shapes.

const domains = ['atlassian.net']

// Data Center installs sit under a context path such as `/jira`, so none of
// these can anchor at the start of the pathname.
const issueRegex = /\/browse\/([A-Za-z][A-Za-z0-9_]+)-\d+/i
const projectRegex = /\/projects\/([A-Za-z][A-Za-z0-9_]+)(?:\/(?!repos\b)|$)/i
const jiraPathRegex = /\/(?:jira|secure|issues)(?:\/|$)/i
const trailingSlashRegex = /\/$/
const confluencePathRegex = /^\/wiki(?:\/|$)/i

const feeds = definePlatformFeeds([
  {
    key: 'jira:project',
    template: 'https://{tenant}.atlassian.net/plugins/servlet/streams?key={key}',
  },
  { key: 'jira:project', template: 'https://{tenant}.atlassian.net/activity?key={key}' },
  { key: 'jira:site', template: 'https://{tenant}.atlassian.net/plugins/servlet/streams' },
])

const isCloudHost = (url: string): boolean => {
  return getTenantSubdomain(url, domains) !== undefined
}

const isJiraPath = (pathname: string): boolean => {
  return issueRegex.test(pathname) || projectRegex.test(pathname) || jiraPathRegex.test(pathname)
}

// Atlassian's other products print the same `ajs-*` metas, so the application name decides.
export const isJiraHtml = (content: string): boolean => {
  return (
    Boolean(getMetaContent(content, 'ajs-base-url')) &&
    hasMetaContent(content, 'application-name', 'JIRA')
  )
}

export type JiraPage = { baseUrl: string; tenant?: string; projectKey?: string }

const getJiraPage = (url: string, content: string | undefined): JiraPage | undefined => {
  const { origin, pathname } = new URL(url)

  if (confluencePathRegex.test(pathname)) {
    return
  }

  const contextPath = getMetaContent(content ?? '', 'ajs-context-path') ?? ''
  const pathKey = pathname.match(issueRegex)?.[1] ?? pathname.match(projectRegex)?.[1]

  return {
    baseUrl: `${origin}${contextPath}`.replace(trailingSlashRegex, ''),
    tenant: getTenantSubdomain(url, domains),
    projectKey: pathKey ?? getMetaContent(content ?? '', 'ajs-project-key'),
  }
}

export const jiraHandler: PlatformHandler = {
  match: (url, content, headers) => {
    const { pathname } = new URL(url)

    if (confluencePathRegex.test(pathname)) {
      return false
    }

    if (isCloudHost(url)) {
      return true
    }

    if (!hasMarker(content, headers, { html: isJiraHtml })) {
      return false
    }

    return isJiraPath(pathname)
  },

  resolve: (url, content) => {
    const page = getJiraPage(url, content)

    if (!page) {
      return []
    }

    const { baseUrl, tenant, projectKey } = page
    const uris: Array<DiscoverUriEntry> = []

    if (tenant) {
      if (projectKey) {
        uris.push(feeds.getFeedEntry('jira:project', { tenant, key: projectKey }))
      }

      uris.push(feeds.getFeedEntry('jira:site', { tenant }))

      return uris
    }

    // A Data Center install runs on its own host, under a root its page names.
    if (projectKey) {
      uris.push({
        uri: `${baseUrl}/plugins/servlet/streams${composeQuery({ key: projectKey })}`,
        hint: composeHint('jira:project'),
      })
    }

    uris.push({
      uri: `${baseUrl}/plugins/servlet/streams`,
      hint: composeHint('jira:site'),
    })

    return uris
  },

  getFeedKey: feeds.getFeedKey,
}
