import { isSubdomainOf } from 'trousse'
import type { DiscoverUriEntry } from '../../../common/types.js'
import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { composeHint, getMetaContent } from '../../../common/utils.js'

// Discoverability: Not discoverable without handler.
//
// Jira advertises its activity streams nowhere. They are served by a servlet at
// `{base}/plugins/servlet/streams`, optionally keyed to one project, and the
// site stream answers with Atom and no session on both Cloud and Data Center.
//
// Cloud is matched by host, because it renders client-side and serves none of
// the `ajs-*` meta tags Data Center does. A Cloud site also hosts Confluence
// under `/wiki/`, which is not Jira and is excluded.
//
// Data Center is matched by `ajs-base-url` plus a Jira-shaped path. Confluence
// and Bitbucket Server both ship `ajs-base-url` too, so the path is what tells
// them apart: Bitbucket puts `repos` after the project key.

// Data Center installs sit under a context path such as `/jira`, so none of
// these can anchor at the start of the pathname.
const issueRegex = /\/browse\/([A-Za-z][A-Za-z0-9_]+)-\d+/
const projectRegex = /\/projects\/([A-Za-z][A-Za-z0-9_]+)(?:\/(?!repos\b)|$)/
const jiraPathRegex = /\/(?:jira|secure|issues)\//
const trailingSlashRegex = /\/$/
const confluencePathRegex = /^\/wiki(?:\/|$)/

const isCloudHost = (url: string): boolean => {
  return isSubdomainOf(url, 'atlassian.net')
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
    try {
      const { pathname } = new URL(url)

      if (confluencePathRegex.test(pathname)) {
        return false
      }

      if (isCloudHost(url)) {
        return true
      }

      return Boolean(content) && isJiraHtml(content ?? '') && isJiraPath(pathname)
    } catch {}

    return false
  },

  resolve: (url, content) => {
    try {
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
    } catch {}

    return []
  },
}
