import { isSubdomainOf, parseUrl } from 'trousse'
import type { DiscoverUriEntry } from '../../common/types.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint, getMetaContent } from '../../common/utils.js'

// Discoverability: Not discoverable without handler.
// Handler needed for: all shapes.

const domains = ['atlassian.net']

// Data Center installs sit under a context path such as `/jira`, so none of
// these can anchor at the start of the pathname.
const issueRegex = /\/browse\/([A-Za-z][A-Za-z0-9_]+)-\d+/i
const projectRegex = /\/projects\/([A-Za-z][A-Za-z0-9_]+)(?:\/(?!repos\b)|$)/i
const jiraPathRegex = /\/(?:jira|secure|issues)\//i
const trailingSlashRegex = /\/$/
const confluencePathRegex = /^\/wiki(?:\/|$)/i

const isCloudHost = (url: string): boolean => {
  return isSubdomainOf(url, domains)
}

const isJiraPath = (pathname: string): boolean => {
  return issueRegex.test(pathname) || projectRegex.test(pathname) || jiraPathRegex.test(pathname)
}

const getProjectKey = (pathname: string, content: string): string | undefined => {
  const key = pathname.match(issueRegex)?.[1] ?? pathname.match(projectRegex)?.[1]

  return key ?? getMetaContent(content, 'ajs-project-key')
}

export const isJiraHtml = (content: string): boolean => {
  return Boolean(getMetaContent(content, 'ajs-base-url'))
}

export const jiraHandler: PlatformHandler = {
  match: (url, content) => {
    const parsedUrl = parseUrl(url)

    if (!parsedUrl) {
      return false
    }

    const { pathname } = parsedUrl

    if (confluencePathRegex.test(pathname)) {
      return false
    }

    if (isCloudHost(url)) {
      return true
    }

    return Boolean(content) && isJiraHtml(content ?? '') && isJiraPath(pathname)
  },

  resolve: (url, content) => {
    const { origin, pathname } = new URL(url)

    if (confluencePathRegex.test(pathname)) {
      return []
    }

    const contextPath = getMetaContent(content ?? '', 'ajs-context-path') ?? ''
    const baseUrl = `${origin}${contextPath}`.replace(trailingSlashRegex, '')
    const projectKey = getProjectKey(pathname, content ?? '')
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
