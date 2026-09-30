import { getPathSegments, isAnyOf, isHostOf, parseUrl } from 'trousse'
import type { DiscoverUriEntry } from '../../common/types.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint } from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Generic covers branch, bug, bugsPerson, bugsProject, codeProject, home, person, sourcePackage (html), partly covers project.
// Handler needed for: bugsHome, codePerson.

type LaunchpadUrl =
  | { kind: 'home' }
  | { kind: 'bug'; bugId: string }
  | { kind: 'branch'; path: string }
  | { kind: 'sourcePackage'; distribution: string; sourcePackage: string }
  | { kind: 'person'; username: string }
  | { kind: 'project'; project: string }

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

const parseLaunchpadUrl = (parsedUrl: URL): LaunchpadUrl | undefined => {
  const segments = getPathSegments(parsedUrl)
  const [first, second, third] = segments
  const isCodeHost = isHostOf(parsedUrl, codeHosts)

  if (!first) {
    return { kind: 'home' }
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
      return { kind: 'person', username: first.slice(1) }
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
    return { kind: 'project', project: first }
  }

  if (!isCodeHost && third && segments.length === 3 && isAnyOf(second, '+source')) {
    return { kind: 'sourcePackage', distribution: first, sourcePackage: third }
  }
}

const getLaunchpadFeeds = (url: string): Array<DiscoverUriEntry> => {
  const parsedUrl = parseUrl(url)

  if (!parsedUrl || !isHostOf(parsedUrl, hosts)) {
    return []
  }

  const parsed = parseLaunchpadUrl(parsedUrl)
  const isMainHost = isHostOf(parsedUrl, mainHosts)
  const isBugsHost = isHostOf(parsedUrl, bugsHosts)
  const isCodeHost = isHostOf(parsedUrl, codeHosts)

  if (!parsed) {
    return []
  }

  if (parsed.kind === 'home') {
    if (isMainHost) {
      return [
        { uri: `${feedsOrigin}/announcements.atom`, hint: composeHint('launchpad:announcements') },
      ]
    }

    if (isBugsHost) {
      return [{ uri: `${feedsOrigin}/bugs/latest-bugs.atom`, hint: composeHint('launchpad:bugs') }]
    }

    return []
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

  if (parsed.kind === 'project' && isMainHost) {
    feeds.push({ uri: `${base}/announcements.atom`, hint: composeHint('launchpad:announcements') })
  }

  if (!isCodeHost) {
    feeds.push({ uri: `${base}/latest-bugs.atom`, hint: composeHint('launchpad:bugs') })
  }

  if (!isBugsHost) {
    feeds.push({ uri: `${base}/branches.atom`, hint: composeHint('launchpad:branches') })
    feeds.push({ uri: `${base}/revisions.atom`, hint: composeHint('launchpad:revisions') })
  }

  return feeds
}

export const launchpadHandler: PlatformHandler = {
  match: (url) => {
    return getLaunchpadFeeds(url).length > 0
  },

  resolve: (url) => {
    return getLaunchpadFeeds(url)
  },
}
