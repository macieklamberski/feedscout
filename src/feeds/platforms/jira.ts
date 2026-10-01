import { isSubdomainOf } from 'trousse'
import type { DiscoverUriEntry } from '../../common/types.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint, getMetaContent, hasMarker } from '../../common/utils.js'

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

const isCloudHost = (url: string): boolean => {
  return isSubdomainOf(url, domains)
}

const isJiraPath = (pathname: string): boolean => {
  return issueRegex.test(pathname) || projectRegex.test(pathname) || jiraPathRegex.test(pathname)
}

export const isJiraHtml = (content: string): boolean => {
  return Boolean(getMetaContent(content, 'ajs-base-url'))
}

export type JiraPage = { baseUrl: string; projectKey?: string }

const getJiraPage = (url: string, content: string | undefined): JiraPage | undefined => {
  const { origin, pathname } = new URL(url)

  if (confluencePathRegex.test(pathname)) {
    return
  }

  const contextPath = getMetaContent(content ?? '', 'ajs-context-path') ?? ''
  const pathKey = pathname.match(issueRegex)?.[1] ?? pathname.match(projectRegex)?.[1]

  return {
    baseUrl: `${origin}${contextPath}`.replace(trailingSlashRegex, ''),
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

    const { baseUrl, projectKey } = page
    const uris: Array<DiscoverUriEntry> = []

    if (projectKey) {
      uris.push({
        uri: `${baseUrl}/plugins/servlet/streams?key=${projectKey}`,
        hint: composeHint('jira:project'),
      })
    }

    uris.push({
      uri: `${baseUrl}/plugins/servlet/streams`,
      hint: composeHint('jira:site'),
    })

    return uris
  },
}
