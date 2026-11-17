import { jira } from 'feedintel'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import {
  getMetaContent,
  getTenantSubdomain,
  hasMarker,
  hasMetaContent,
} from '../../common/utils.js'

// Discoverability: Not discoverable without handler.
// Handler needed for: issue, project, site.

const domains = jira.hosts.tenants

// Data Center installs sit under a context path such as `/jira`, so none of
// these can anchor at the start of the pathname.
const issueRegex = /\/browse\/([A-Za-z][A-Za-z0-9_]+)-\d+/i
const issueKeyRegex = /\/browse\/([A-Za-z][A-Za-z0-9_]+-\d+)/i
const projectRegex = /\/projects\/([A-Za-z][A-Za-z0-9_]+)(?:\/(?!repos\b)|$)/i
const jiraPathRegex = /\/(?:jira|secure|issues)(?:\/|$)/i
const trailingSlashRegex = /\/$/
const confluencePathRegex = /^\/wiki(?:\/|$)/i

const feeds = withHintLabels(jira.feeds)

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

export type JiraPage = {
  baseUrl: string
  tenant?: string
  projectKey?: string
  issueKey?: string
}

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
    issueKey: pathname.match(issueKeyRegex)?.[1],
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
    const jiraPage = getJiraPage(url, content)
    const page = feeds.forUrl(url)

    if (!jiraPage || !page) {
      return []
    }

    const { baseUrl, tenant, projectKey, issueKey } = jiraPage
    // A cloud site serves from its origin.
    const root = tenant ? undefined : baseUrl
    if (issueKey) {
      return [
        page.getFeedEntry('issue', { root, issue: issueKey }, 'rss'),
        page.getFeedEntry('project', { root, key: projectKey }),
        page.getFeedEntry('site', { root }),
      ]
    }

    if (projectKey) {
      return [
        page.getFeedEntry('project', { root, key: projectKey }),
        page.getFeedEntry('site', { root }),
      ]
    }

    return [page.getFeedEntry('site', { root })]
  },

  getFeedHint: feeds.getFeedHint,
}
