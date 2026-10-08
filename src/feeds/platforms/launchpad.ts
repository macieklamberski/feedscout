import { getPathSegments, isAnyOf, isHostOf, parseUrl } from 'trousse'
import type { DiscoverUriEntry } from '../../common/types.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint } from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Generic covers branch, bug, bugsPerson, bugsProject, codeProject, person, project, sourcePackage (html).
// Handler needed for: bugsHome, codePerson, home.

// Launchpad serves its main site, Bugs and Code on separate hosts, and each answers with its
// own feeds for the same person or project.
type LaunchpadApplication = 'main' | 'bugs' | 'code'

export type LaunchpadUrl =
  | { kind: 'home'; application: 'main' | 'bugs' }
  | { kind: 'bug'; bugId: string }
  | { kind: 'branch'; path: string }
  | { kind: 'sourcePackage'; distribution: string; sourcePackage: string }
  | { kind: 'person'; application: LaunchpadApplication; username: string }
  | { kind: 'project'; application: LaunchpadApplication; project: string }

const mainHosts = ['launchpad.net']
const bugsHosts = ['bugs.launchpad.net']
const codeHosts = ['code.launchpad.net']
const hosts = [...mainHosts, ...bugsHosts, ...codeHosts]
// Launchpad advertises its feeds over http, and the https URLs redirect there.
const feedsOrigin = 'http://feeds.launchpad.net'

const bugIdRegex = /^\d+$/

// Top-level routes of the Launchpad root that are not project or distribution names.
const excludedPaths = [
  'archives',
  'bazaar',
  'binarypackagenames',
  'branches',
  'bugs',
  'builders',
  'codeofconduct',
  'distros',
  'faq',
  'feedback',
  'karmaaction',
  'legal',
  'livefses',
  'package-sets',
  'people',
  'pillars',
  'products',
  'projectgroups',
  'projects',
  'questions',
  'sourcepackagenames',
  'specs',
  'sprints',
  'support',
  'temporary-blobs',
  'testopenid',
  'token',
  'translations',
  'vulnerabilities',
]

const getApplication = (parsedUrl: URL): LaunchpadApplication => {
  if (isHostOf(parsedUrl, bugsHosts)) {
    return 'bugs'
  }

  if (isHostOf(parsedUrl, codeHosts)) {
    return 'code'
  }

  return 'main'
}

export const parseLaunchpadUrl = (url: string): LaunchpadUrl | undefined => {
  const parsedUrl = parseUrl(url)

  if (!parsedUrl || !isHostOf(parsedUrl, hosts)) {
    return
  }

  const segments = getPathSegments(parsedUrl)
  const [first, second, third] = segments
  const application = getApplication(parsedUrl)
  const isCodeHost = application === 'code'

  if (!first && application !== 'code') {
    return { kind: 'home', application }
  }

  // Code has no site-wide feed.
  if (!first) {
    return
  }

  if (!isCodeHost) {
    const bugIndex = segments.findIndex((segment, index) => {
      return isAnyOf(segment, '+bug') || (index === 0 && isAnyOf(segment, 'bugs'))
    })
    const bugId = segments[bugIndex + 1]

    if (bugIndex !== -1 && bugId && bugIdRegex.test(bugId)) {
      return { kind: 'bug', bugId }
    }
  }

  if (first.startsWith('~')) {
    if (first.length > 1 && segments.length === 1) {
      return { kind: 'person', application, username: first.slice(1) }
    }

    // Bazaar branches live at ~owner/project/branch or ~owner/distro/series/package/branch.
    const isBranchPath = segments.length === 3 || segments.length === 5

    if (isCodeHost && isBranchPath && !segments.some((segment) => segment.startsWith('+'))) {
      return { kind: 'branch', path: segments.join('/') }
    }

    return
  }

  if (first.startsWith('+') || isAnyOf(first, excludedPaths)) {
    return
  }

  if (segments.length === 1) {
    return { kind: 'project', application, project: first }
  }

  if (!isCodeHost && third && segments.length === 3 && isAnyOf(second, '+source')) {
    return { kind: 'sourcePackage', distribution: first, sourcePackage: third }
  }
}

export const launchpadHandler: PlatformHandler = {
  match: (url) => {
    return parseLaunchpadUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseLaunchpadUrl(url)

    if (!parsed) {
      return []
    }

    if (parsed.kind === 'home' && parsed.application === 'main') {
      return [
        { uri: `${feedsOrigin}/announcements.atom`, hint: composeHint('launchpad:announcements') },
      ]
    }

    if (parsed.kind === 'home') {
      return [{ uri: `${feedsOrigin}/bugs/latest-bugs.atom`, hint: composeHint('launchpad:bugs') }]
    }

    if (parsed.kind === 'bug') {
      return [
        { uri: `${feedsOrigin}/bugs/${parsed.bugId}/bug.atom`, hint: composeHint('launchpad:bug') },
      ]
    }

    if (parsed.kind === 'branch') {
      return [
        { uri: `${feedsOrigin}/${parsed.path}/branch.atom`, hint: composeHint('launchpad:branch') },
      ]
    }

    if (parsed.kind === 'sourcePackage') {
      const { distribution, sourcePackage } = parsed

      return [
        {
          uri: `${feedsOrigin}/${distribution}/+source/${sourcePackage}/latest-bugs.atom`,
          hint: composeHint('launchpad:bugs'),
        },
      ]
    }

    const base =
      parsed.kind === 'person'
        ? `${feedsOrigin}/~${parsed.username}`
        : `${feedsOrigin}/${parsed.project}`
    const feeds: Array<DiscoverUriEntry> = []

    if (parsed.kind === 'project' && parsed.application === 'main') {
      feeds.push({
        uri: `${base}/announcements.atom`,
        hint: composeHint('launchpad:announcements'),
      })
    }

    if (parsed.application !== 'code') {
      feeds.push({ uri: `${base}/latest-bugs.atom`, hint: composeHint('launchpad:bugs') })
    }

    if (parsed.application !== 'bugs') {
      feeds.push({ uri: `${base}/branches.atom`, hint: composeHint('launchpad:branches') })
      feeds.push({ uri: `${base}/revisions.atom`, hint: composeHint('launchpad:revisions') })
    }

    return feeds
  },
}
