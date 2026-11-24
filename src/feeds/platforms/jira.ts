import { jira } from 'feedintel'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import {
  getMetaContent,
  getSiteParams,
  getSiteUrl,
  hasMarker,
  hasMetaContent,
} from '../../common/utils.js'

// Discoverability: Not discoverable without handler.
// Handler needed for: issue, project, site.

const feeds = withHintLabels(jira.feeds)

const isConfluencePage = (url: string): boolean => {
  return jira.pages.read(url, { base: [] })?.key === 'confluence'
}

const jiraPathKeys = ['issue', 'project', 'app']

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
  issueNumber?: string
}

const getJiraPage = (url: string, content: string | undefined): JiraPage | undefined => {
  if (isConfluencePage(url)) {
    return
  }

  const contextPath = getMetaContent(content ?? '', 'ajs-context-path') ?? ''
  const base = jira.pages.read(url, { base: contextPath })
  const path = jira.pages.read(url, { isAnyHost: true })

  // In a folder only the `{host}` rows read the URL, which the cloud row is not.
  if (!base || base.key === 'cloud') {
    return
  }

  const cloud = jira.pages.read(url)
  const pathKey = path?.key === 'issue' || path?.key === 'project' ? path.params.key : undefined

  return {
    baseUrl: getSiteUrl(base.params),
    tenant: cloud?.key === 'cloud' ? cloud.params.tenant : undefined,
    projectKey: pathKey ?? getMetaContent(content ?? '', 'ajs-project-key'),
    issueNumber: path?.key === 'issue' ? path.params.number : undefined,
  }
}

export const jiraHandler: PlatformHandler = {
  match: (url, content, headers) => {
    if (isConfluencePage(url)) {
      return false
    }

    if (jira.pages.read(url)) {
      return true
    }

    if (!hasMarker(content, headers, { html: isJiraHtml })) {
      return false
    }

    return jiraPathKeys.includes(jira.pages.read(url, { isAnyHost: true })?.key ?? '')
  },

  resolve: (url, content) => {
    const jiraPage = getJiraPage(url, content)
    const page = feeds.forUrl(url)

    if (!jiraPage || !page) {
      return []
    }

    const { baseUrl, tenant, projectKey, issueNumber } = jiraPage
    // A cloud site serves from its origin.
    const site = tenant ? undefined : getSiteParams(baseUrl)

    if (issueNumber) {
      return [
        page.getFeedEntry('issue', { ...site, key: projectKey, number: issueNumber }, 'rss'),
        page.getFeedEntry('project', { ...site, key: projectKey }),
        page.getFeedEntry('site', site),
      ]
    }

    if (projectKey) {
      return [
        page.getFeedEntry('project', { ...site, key: projectKey }),
        page.getFeedEntry('site', site),
      ]
    }

    return [page.getFeedEntry('site', site)]
  },

  getFeedHint: feeds.getFeedHint,
}
