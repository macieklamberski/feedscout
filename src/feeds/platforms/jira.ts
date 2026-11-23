import { jira } from 'feedintel'
import { parseUrl } from 'trousse'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { getMetaContent, hasMarker, hasMetaContent } from '../../common/utils.js'

// Discoverability: Not discoverable without handler.
// Handler needed for: issue, project, site.

const feeds = withHintLabels(jira.feeds)

const isConfluencePage = (url: string): boolean => {
  return jira.pages.read(url, { root: parseUrl(url)?.origin ?? '' })?.key === 'confluence'
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
  issueKey?: string
}

const getJiraPage = (url: string, content: string | undefined): JiraPage | undefined => {
  const parsedUrl = parseUrl(url)

  if (!parsedUrl || isConfluencePage(url)) {
    return
  }

  const contextPath = getMetaContent(content ?? '', 'ajs-context-path') ?? ''
  const base = jira.pages.read(url, { root: `${parsedUrl.origin}${contextPath}` })
  const path = jira.pages.read(url, { isAnyHost: true })

  if (!base) {
    return
  }

  const { key, number } = path?.params ?? {}
  const pathKey = path?.key === 'issue' || path?.key === 'project' ? key : undefined

  return {
    baseUrl: base.params.root,
    tenant: jira.pages.read(url)?.params.tenant,
    projectKey: pathKey ?? getMetaContent(content ?? '', 'ajs-project-key'),
    issueKey: path?.key === 'issue' ? `${key}-${number}` : undefined,
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
