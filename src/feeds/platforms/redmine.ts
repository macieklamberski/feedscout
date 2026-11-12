import { encodePathSegment, isAnyOf, isPresent, parseUrl, resolveUrl } from 'trousse'
import type { DiscoverUriEntry } from '../../common/types.js'
import { definePlatformFeeds, type PlatformFeedParams } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import {
  composeHint,
  digitsRegex,
  findDescendant,
  findElement,
  findElements,
  getCookieNames,
  getMetaContent,
  getTenantSubdomain,
  hasClass,
  hasMarker,
} from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Generic covers activity, board, home, issue, issues, news, projectActivity, projectIssues, projectNews, projects, repository (html), partly covers project.

export type RedminePage = (
  | { kind: 'home'; root: string }
  | { kind: 'projects'; root: string }
  | { kind: 'issues'; root: string; project?: string }
  | { kind: 'issue'; root: string; issueId: string }
  | { kind: 'news'; root: string; project?: string }
  | { kind: 'activity'; root: string; project?: string }
  | { kind: 'project'; root: string; project: string; hasIssues: boolean; hasNews: boolean }
  | { kind: 'board'; root: string; project: string; boardId: string }
  | { kind: 'repository'; root: string; project: string; repository: string }
) & { alternateHrefs: Array<string> }

const poweredByRegex = /Powered by <a\s[^<>]*href="https?:\/\/www\.redmine\.org\/"/
const projectClassRegex = /(?:^|\s)project-(\S+)/
const repositoryRevisionsRegex = /\/repository\/([^/"?#]+)\/revisions\b/i
const schemeRegex = /^https?:/
const trailingSlashRegex = /\/$/
const originSchemeRegex = /^https?:\/\//

// Planio hosts an install on a site subdomain. An install on its own domain is known only by its
// marker, so its feeds are built here but not claimed.
const domains = ['plan.io']

// A key with a project row builds that row when the page names a project, and the site row when
// it does not.
const feeds = definePlatformFeeds(
  [
    { key: 'redmine:news', template: '{scheme}://{host}/projects/{project}/news.atom' },
    { key: 'redmine:news', template: '{scheme}://{host}/news.atom' },
    { key: 'redmine:activity', template: '{scheme}://{host}/projects/{project}/activity.atom' },
    { key: 'redmine:activity', template: '{scheme}://{host}/activity.atom' },
    { key: 'redmine:projects', template: '{scheme}://{host}/projects.atom' },
    { key: 'redmine:issues', template: '{scheme}://{host}/projects/{project}/issues.atom' },
    { key: 'redmine:issues', template: '{scheme}://{host}/issues.atom' },
    { key: 'redmine:issue', template: '{scheme}://{host}/issues/{issueId}.atom' },
    {
      key: 'redmine:board',
      template: '{scheme}://{host}/projects/{project}/boards/{boardId}.atom',
    },
    {
      key: 'redmine:revisions',
      template: '{scheme}://{host}/projects/{project}/repository/{repository}/revisions.atom',
    },
  ],
  { domains },
)

// The core layout prints the footer link, and Bitnami stacks swap it for their own, which
// still keep the description meta.
export const isRedmineHtml = (content: string): boolean => {
  return poweredByRegex.test(content) || getMetaContent(content, 'description') === 'Redmine'
}

export const isRedmineHeaders = (headers: Headers): boolean => {
  return getCookieNames(headers).includes('_redmine_session')
}

// The top menu's home link names the install root, which can be a sub-path such as /redmine.
const getRootPath = (url: string, content: string | undefined): string => {
  const homeLink = findElement(content, (element) => {
    return element.name === 'a' && hasClass(element, 'home')
  })
  const homeUrl = resolveUrl(homeLink?.attribs.href ?? '/', url)

  return parseUrl(homeUrl)?.pathname.replace(trailingSlashRegex, '') ?? ''
}

// The project menu lists a module only when it is on and the reader may see it, and the feed of a
// module that is off answers 403 or the sign-in page. A theme without the menu keeps every feed.
const hasMenuItem = (content: string | undefined, name: string): boolean => {
  const mainMenu = findElement(content, (element) => element.attribs.id === 'main-menu')

  if (!mainMenu) {
    return true
  }

  return findDescendant(mainMenu, (element) => hasClass(element, name)) !== undefined
}

const getAlternateHrefs = (url: string, content: string | undefined): Array<string> => {
  const links = findElements(content ?? '', (element) => {
    return element.name === 'link' && element.attribs.rel === 'alternate'
  })

  return links.map((link) => resolveUrl(link.attribs.href ?? '', url)).filter(isPresent)
}

// Redmine spells an alternate link from the request it sees, so an install behind a TLS proxy
// links http feeds from an https page.
const getAlternateSpelling = (uri: string, alternateHrefs: Array<string>): string => {
  const address = uri.replace(schemeRegex, '')

  return alternateHrefs.find((href) => href.replace(schemeRegex, '') === address) ?? uri
}

export const getRedminePage = (
  url: string,
  content: string | undefined,
): RedminePage | undefined => {
  const parsedUrl = parseUrl(url)

  if (!parsedUrl) {
    return
  }

  const body = findElement(content, (element) => element.name === 'body')

  // A private project redirects an anonymous reader to the sign-in page.
  if (hasClass(body, 'controller-account')) {
    return
  }

  // Redmine renders a 403 or 404 inside its layout, with the reason in this paragraph.
  const errorExplanation = findElement(content, (element) => {
    return element.name === 'p' && element.attribs.id === 'errorExplanation'
  })

  if (errorExplanation) {
    return
  }

  // Redmine prints the project identifier as a body class only when the reader may see the
  // project, so a missing or private project leaves it out.
  const classProject = body?.attribs.class?.match(projectClassRegex)?.[1]
  // The class is page markup, which can hold a `/`.
  const project = classProject ? encodePathSegment(classProject) : undefined
  const rootPath = getRootPath(url, content)
  const root = `${parsedUrl.origin}${rootPath}`
  const alternateHrefs = getAlternateHrefs(url, content)
  const isUnderRoot =
    parsedUrl.pathname === rootPath || parsedUrl.pathname.startsWith(`${rootPath}/`)
  const pathname = isUnderRoot ? parsedUrl.pathname.slice(rootPath.length) : parsedUrl.pathname
  const [first, second, third, fourth] = pathname.split('/').filter(Boolean)

  if (isAnyOf(first, 'projects') && second) {
    if (!project) {
      return
    }

    if (isAnyOf(third, 'issues') && !fourth) {
      return { kind: 'issues', root, alternateHrefs, project }
    }

    if (isAnyOf(third, 'news') && !fourth) {
      return { kind: 'news', root, alternateHrefs, project }
    }

    if (isAnyOf(third, 'activity') && !fourth) {
      return { kind: 'activity', root, alternateHrefs, project }
    }

    if (isAnyOf(third, 'boards') && fourth && digitsRegex.test(fourth)) {
      return { kind: 'board', root, alternateHrefs, project, boardId: fourth }
    }

    // The bare repository page names its default repository only in its own feed links.
    const linkedRepository = content?.match(repositoryRevisionsRegex)?.[1]
    const repository = linkedRepository ? encodePathSegment(linkedRepository) : undefined

    if (isAnyOf(third, 'repository') && repository) {
      return { kind: 'repository', root, alternateHrefs, project, repository }
    }
  }

  if (isAnyOf(first, 'issues') && second && digitsRegex.test(second)) {
    if (!project) {
      return
    }

    return { kind: 'issue', root, alternateHrefs, issueId: second }
  }

  if (!second && isAnyOf(first, 'projects')) {
    return { kind: 'projects', root, alternateHrefs }
  }

  if (!second && isAnyOf(first, 'issues')) {
    return { kind: 'issues', root, alternateHrefs }
  }

  if (!second && isAnyOf(first, 'news')) {
    return { kind: 'news', root, alternateHrefs }
  }

  if (!second && isAnyOf(first, 'activity')) {
    return { kind: 'activity', root, alternateHrefs }
  }

  if (project) {
    return {
      kind: 'project',
      root,
      alternateHrefs,
      project,
      hasIssues: hasMenuItem(content, 'issues'),
      hasNews: hasMenuItem(content, 'news'),
    }
  }

  return { kind: 'home', root, alternateHrefs }
}

export const redmineHandler: PlatformHandler = {
  match: (url, content, headers) => {
    if (!hasMarker(content, headers, { html: isRedmineHtml, headers: isRedmineHeaders })) {
      return false
    }

    return getRedminePage(url, content) !== undefined
  },

  resolve: (url, content) => {
    const page = getRedminePage(url, content)
    const pageFeeds = feeds.forUrl(url)

    if (!page || !pageFeeds) {
      return []
    }

    // An install under a sub-path such as /redmine keeps it after the host in every feed.
    const params: PlatformFeedParams = { host: page.root.replace(originSchemeRegex, '') }

    if ('project' in page && page.project) {
      params.project = page.project
    }

    const getFeedEntry = (key: string, values?: PlatformFeedParams): DiscoverUriEntry => {
      const uri = pageFeeds.getFeedUrl(key, { ...params, ...values })

      return { uri: getAlternateSpelling(uri, page.alternateHrefs), hint: composeHint(key) }
    }
    const uris: Array<DiscoverUriEntry> = []

    if (page.kind === 'home') {
      uris.push(getFeedEntry('redmine:news'), getFeedEntry('redmine:activity'))
    }

    if (page.kind === 'projects') {
      uris.push(getFeedEntry('redmine:projects'))
    }

    if (page.kind === 'issues') {
      uris.push(getFeedEntry('redmine:issues'))
    }

    if (page.kind === 'issue') {
      uris.push(getFeedEntry('redmine:issue', { issueId: page.issueId }))
    }

    if (page.kind === 'news') {
      uris.push(getFeedEntry('redmine:news'))
    }

    if (page.kind === 'activity') {
      uris.push(getFeedEntry('redmine:activity'))
    }

    if (page.kind === 'project') {
      uris.push(getFeedEntry('redmine:activity'))

      if (page.hasIssues) {
        uris.push(getFeedEntry('redmine:issues'))
      }

      if (page.hasNews) {
        uris.push(getFeedEntry('redmine:news'))
      }
    }

    if (page.kind === 'board') {
      uris.push(getFeedEntry('redmine:board', { boardId: page.boardId }))
    }

    if (page.kind === 'repository') {
      uris.push(getFeedEntry('redmine:revisions', { repository: page.repository }))
    }

    return uris
  },

  // The table reads any host under the domains, so only a site's own subdomain is claimed, not the
  // apex, www or a nested host.
  getFeedHint: (url) => {
    if (!getTenantSubdomain(url, domains)) {
      return
    }

    return feeds.getFeedHint(url)
  },
}
