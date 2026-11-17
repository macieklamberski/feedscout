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
  | { kind: 'user'; root: string; userId: string }
  | { kind: 'news'; root: string; project?: string }
  | { kind: 'activity'; root: string; project?: string }
  | { kind: 'project'; root: string; project: string; hasIssues: boolean; hasNews: boolean }
  | { kind: 'board'; root: string; project: string; boardId: string }
  | { kind: 'repository'; root: string; project: string; repository: string }
) & { alternateHrefs: Array<string>; project?: string }

type RedmineFeedKey = Parameters<typeof feeds.getFeedUrl>[0]

const poweredByRegex = /Powered by <a\s[^<>]*href="https?:\/\/www\.redmine\.org\/"/
const projectClassRegex = /(?:^|\s)project-(\S+)/
const repositoryRevisionsRegex = /\/repository\/([^/"?#]+)\/revisions\b/i
const schemeRegex = /^https?:/
const trailingSlashRegex = /\/$/
// The issue list parameters that lay the list out or turn its filters on, so an issues feed
// with only these holds the same issues. Any other one, such as query_id, filters it.
const issueListParams = [
  'sort',
  'per_page',
  'page',
  'c',
  'group_by',
  't',
  'utf8',
  'set_filter',
  'key',
]

// Planio hosts an install on a site subdomain of either domain. An install on its own domain is
// known only by its marker, so its feeds are built here but not claimed.
const domains = ['plan.io', 'planio.com']

const feeds = definePlatformFeeds(
  [
    { key: 'redmine:project-news', main: '{root}/projects/{project}/news.atom' },
    { key: 'redmine:news', main: '{root}/news.atom' },
    {
      key: 'redmine:project-user-activity',
      main: '{root}/projects/{project}/activity.atom?user_id={userId}',
    },
    { key: 'redmine:project-activity', main: '{root}/projects/{project}/activity.atom' },
    { key: 'redmine:user-activity', main: '{root}/activity.atom?user_id={userId}' },
    { key: 'redmine:activity', main: '{root}/activity.atom' },
    { key: 'redmine:projects', main: '{root}/projects.atom' },
    { key: 'redmine:project-issues', main: '{root}/projects/{project}/issues.atom' },
    { key: 'redmine:issues', main: '{root}/issues.atom' },
    { key: 'redmine:issue', main: '{root}/issues/{issueId}.atom' },
    { key: 'redmine:board', main: '{root}/projects/{project}/boards/{boardId}.atom' },
    {
      key: 'redmine:revisions',
      main: '{root}/projects/{project}/repository/{repository}/revisions.atom',
    },
    // A repository's changes, also as of a revision with `?rev=`, and a project's forums are linked
    // from pages the handler does not read, so these rows only claim.
    {
      key: 'redmine:changes',
      main: '{root}/projects/{project}/repository/{repository}/changes.atom',
    },
    { key: 'redmine:boards', main: '{root}/projects/{project}/boards.atom' },
  ],
  { hosts: { tenants: domains } },
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

  if (isAnyOf(first, 'users') && second && digitsRegex.test(second) && !third) {
    return { kind: 'user', root, alternateHrefs, userId: second }
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

    if (!page) {
      return []
    }

    // An install under a sub-path such as /redmine keeps it in the root of every feed.
    const params: PlatformFeedParams = { root: page.root, project: page.project }

    const getFeedEntry = (
      key: RedmineFeedKey,
      values?: PlatformFeedParams,
    ): DiscoverUriEntry | undefined => {
      const uri = feeds.getFeedUrl(key, { ...params, ...values })

      if (!uri) {
        return
      }

      return { uri: getAlternateSpelling(uri, page.alternateHrefs), hint: composeHint(key) }
    }

    // The site news, activity, projects and issues need no value from the page, so every page
    // builds them after its own feeds.
    if (page.kind === 'home') {
      return [
        getFeedEntry('redmine:news'),
        getFeedEntry('redmine:activity'),
        getFeedEntry('redmine:projects'),
        getFeedEntry('redmine:issues'),
      ]
    }

    if (page.kind === 'projects') {
      return [
        getFeedEntry('redmine:projects'),
        getFeedEntry('redmine:news'),
        getFeedEntry('redmine:activity'),
        getFeedEntry('redmine:issues'),
      ]
    }

    if (page.kind === 'issues') {
      if (page.project) {
        return [
          getFeedEntry('redmine:project-issues'),
          getFeedEntry('redmine:news'),
          getFeedEntry('redmine:activity'),
          getFeedEntry('redmine:projects'),
          getFeedEntry('redmine:issues'),
        ]
      }

      return [
        getFeedEntry('redmine:issues'),
        getFeedEntry('redmine:news'),
        getFeedEntry('redmine:activity'),
        getFeedEntry('redmine:projects'),
      ]
    }

    if (page.kind === 'issue') {
      return [
        getFeedEntry('redmine:issue', { issueId: page.issueId }),
        getFeedEntry('redmine:news'),
        getFeedEntry('redmine:activity'),
        getFeedEntry('redmine:projects'),
        getFeedEntry('redmine:issues'),
      ]
    }

    if (page.kind === 'user') {
      return [
        getFeedEntry('redmine:user-activity', { userId: page.userId }),
        getFeedEntry('redmine:news'),
        getFeedEntry('redmine:activity'),
      ]
    }

    if (page.kind === 'news') {
      if (page.project) {
        return [
          getFeedEntry('redmine:project-news'),
          getFeedEntry('redmine:news'),
          getFeedEntry('redmine:activity'),
          getFeedEntry('redmine:projects'),
          getFeedEntry('redmine:issues'),
        ]
      }

      return [
        getFeedEntry('redmine:news'),
        getFeedEntry('redmine:activity'),
        getFeedEntry('redmine:projects'),
        getFeedEntry('redmine:issues'),
      ]
    }

    if (page.kind === 'activity') {
      if (page.project) {
        return [
          getFeedEntry('redmine:project-activity'),
          getFeedEntry('redmine:news'),
          getFeedEntry('redmine:activity'),
          getFeedEntry('redmine:projects'),
          getFeedEntry('redmine:issues'),
        ]
      }

      return [
        getFeedEntry('redmine:activity'),
        getFeedEntry('redmine:news'),
        getFeedEntry('redmine:projects'),
        getFeedEntry('redmine:issues'),
      ]
    }

    if (page.kind === 'project') {
      return [
        getFeedEntry('redmine:project-activity'),
        ...(page.hasIssues ? [getFeedEntry('redmine:project-issues')] : []),
        ...(page.hasNews ? [getFeedEntry('redmine:project-news')] : []),
        getFeedEntry('redmine:news'),
        getFeedEntry('redmine:activity'),
        getFeedEntry('redmine:projects'),
        getFeedEntry('redmine:issues'),
      ]
    }

    if (page.kind === 'board') {
      return [
        getFeedEntry('redmine:board', { boardId: page.boardId }),
        getFeedEntry('redmine:news'),
        getFeedEntry('redmine:activity'),
        getFeedEntry('redmine:projects'),
        getFeedEntry('redmine:issues'),
      ]
    }

    return [
      getFeedEntry('redmine:revisions', { repository: page.repository }),
      getFeedEntry('redmine:news'),
      getFeedEntry('redmine:activity'),
      getFeedEntry('redmine:projects'),
      getFeedEntry('redmine:issues'),
    ]
  },

  getFeedHint: (url) => {
    const hint = feeds.getFeedHint(url)
    const parsedUrl = parseUrl(url)

    if (!hint || !parsedUrl || !isAnyOf(hint.key, ['redmine:issues', 'redmine:project-issues'])) {
      return hint
    }

    // A parameter name such as `f[]` or `op[status_id]` is read without its brackets.
    const names = [...parsedUrl.searchParams.keys()].map((name) => name.split('[')[0])

    if (names.every((name) => isAnyOf(name, issueListParams))) {
      return hint
    }

    if (hint.key === 'redmine:project-issues') {
      return composeHint('redmine:project-filtered-issues')
    }

    return composeHint('redmine:filtered-issues')
  },
}
