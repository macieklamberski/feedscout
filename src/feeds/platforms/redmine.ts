import { isAnyOf, isPresent, parseUrl, resolveUrl } from 'trousse'
import type { DiscoverUriHint } from '../../common/types.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import {
  composeHint,
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

const poweredByRegex = /Powered by <a\s[^>]*href="https?:\/\/www\.redmine\.org\/"/
const numericIdRegex = /^\d+$/
const projectClassRegex = /(?:^|\s)project-(\S+)/
const repositoryRevisionsRegex = /\/repository\/([^/"?#]+)\/revisions\b/
const schemeRegex = /^https?:/
const trailingSlashRegex = /\/$/

export type RedminePage =
  | { kind: 'home'; root: string }
  | { kind: 'projects'; root: string }
  | { kind: 'issues'; root: string; project?: string }
  | { kind: 'issue'; root: string; issueId: string }
  | { kind: 'news'; root: string; project?: string }
  | { kind: 'activity'; root: string; project?: string }
  | { kind: 'project'; root: string; project: string; hasIssues: boolean; hasNews: boolean }
  | { kind: 'board'; root: string; project: string; boardId: string }
  | { kind: 'repository'; root: string; project: string; repository: string }

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

  return parseUrl(homeUrl ?? '')?.pathname.replace(trailingSlashRegex, '') ?? ''
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

// Redmine spells an alternate link from the request it sees, so an install behind a TLS proxy
// links http feeds from an https page.
const getAlternateSpelling = (uri: string, url: string, content: string | undefined): string => {
  const links = findElements(content ?? '', (element) => {
    return element.name === 'link' && element.attribs.rel === 'alternate'
  })
  const hrefs = links.map((link) => resolveUrl(link.attribs.href ?? '', url)).filter(isPresent)
  const address = uri.replace(schemeRegex, '')

  return hrefs.find((href) => href.replace(schemeRegex, '') === address) ?? uri
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
  const project = body?.attribs.class?.match(projectClassRegex)?.[1]
  const rootPath = getRootPath(url, content)
  const root = `${parsedUrl.origin}${rootPath}`
  const isUnderRoot =
    parsedUrl.pathname === rootPath || parsedUrl.pathname.startsWith(`${rootPath}/`)
  const pathname = isUnderRoot ? parsedUrl.pathname.slice(rootPath.length) : parsedUrl.pathname
  const [first, second, third, fourth] = pathname.split('/').filter(Boolean)

  if (isAnyOf(first, 'projects') && second) {
    if (!project) {
      return
    }

    if (isAnyOf(third, 'issues') && !fourth) {
      return { kind: 'issues', root, project }
    }

    if (isAnyOf(third, 'news') && !fourth) {
      return { kind: 'news', root, project }
    }

    if (isAnyOf(third, 'activity') && !fourth) {
      return { kind: 'activity', root, project }
    }

    if (isAnyOf(third, 'boards') && fourth && numericIdRegex.test(fourth)) {
      return { kind: 'board', root, project, boardId: fourth }
    }

    // The bare repository page names its default repository only in its own feed links.
    const repository = content?.match(repositoryRevisionsRegex)?.[1]

    if (isAnyOf(third, 'repository') && repository) {
      return { kind: 'repository', root, project, repository }
    }

    return {
      kind: 'project',
      root,
      project,
      hasIssues: hasMenuItem(content, 'issues'),
      hasNews: hasMenuItem(content, 'news'),
    }
  }

  if (isAnyOf(first, 'issues') && second && numericIdRegex.test(second)) {
    if (!project) {
      return
    }

    return { kind: 'issue', root, issueId: second }
  }

  if (!second && isAnyOf(first, 'projects')) {
    return { kind: 'projects', root }
  }

  if (!second && isAnyOf(first, 'issues')) {
    return { kind: 'issues', root }
  }

  if (!second && isAnyOf(first, 'news')) {
    return { kind: 'news', root }
  }

  if (!second && isAnyOf(first, 'activity')) {
    return { kind: 'activity', root }
  }

  if (project) {
    return {
      kind: 'project',
      root,
      project,
      hasIssues: hasMenuItem(content, 'issues'),
      hasNews: hasMenuItem(content, 'news'),
    }
  }

  return { kind: 'home', root }
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

    const { root } = page
    const scope = 'project' in page && page.project ? `${root}/projects/${page.project}` : root
    const uris: Array<{ uri: string; hint: DiscoverUriHint }> = []

    if (page.kind === 'home') {
      uris.push(
        { uri: `${root}/news.atom`, hint: composeHint('redmine:news') },
        { uri: `${root}/activity.atom`, hint: composeHint('redmine:activity') },
      )
    }

    if (page.kind === 'projects') {
      uris.push({ uri: `${root}/projects.atom`, hint: composeHint('redmine:projects') })
    }

    if (page.kind === 'issues') {
      uris.push({ uri: `${scope}/issues.atom`, hint: composeHint('redmine:issues') })
    }

    if (page.kind === 'issue') {
      uris.push({ uri: `${root}/issues/${page.issueId}.atom`, hint: composeHint('redmine:issue') })
    }

    if (page.kind === 'news') {
      uris.push({ uri: `${scope}/news.atom`, hint: composeHint('redmine:news') })
    }

    if (page.kind === 'activity') {
      uris.push({ uri: `${scope}/activity.atom`, hint: composeHint('redmine:activity') })
    }

    if (page.kind === 'project') {
      uris.push({ uri: `${scope}/activity.atom`, hint: composeHint('redmine:activity') })

      if (page.hasIssues) {
        uris.push({ uri: `${scope}/issues.atom`, hint: composeHint('redmine:issues') })
      }

      if (page.hasNews) {
        uris.push({ uri: `${scope}/news.atom`, hint: composeHint('redmine:news') })
      }
    }

    if (page.kind === 'board') {
      uris.push({
        uri: `${scope}/boards/${page.boardId}.atom`,
        hint: composeHint('redmine:board'),
      })
    }

    if (page.kind === 'repository') {
      uris.push({
        uri: `${scope}/repository/${page.repository}/revisions.atom`,
        hint: composeHint('redmine:revisions'),
      })
    }

    for (const entry of uris) {
      entry.uri = getAlternateSpelling(entry.uri, url, content)
    }

    return uris
  },
}
