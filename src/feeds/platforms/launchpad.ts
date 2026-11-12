import { getPathSegments, isAnyOf, isHostOf, parseUrl } from 'trousse'
import type { DiscoverUriEntry } from '../../common/types.js'
import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { digitsRegex } from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Generic covers branch, bug, bugsPerson, bugsProject, codeProject, home, person, project, sourcePackage (html).
// Handler needed for: bugsHome, codePerson.

// Launchpad serves its main site, Bugs and Code on separate hosts, and each answers with its
// own feeds for the same person or project.
type LaunchpadApplication = 'main' | 'bugs' | 'code'

export type LaunchpadUrl =
  | { kind: 'home'; application: 'main' | 'bugs' }
  | { kind: 'bug'; bugId: string }
  | { kind: 'branch'; owner: string; project: string; branch: string }
  | {
      kind: 'branch'
      owner: string
      distribution: string
      series: string
      sourcePackage: string
      branch: string
    }
  | { kind: 'sourcePackage'; distribution: string; sourcePackage: string }
  | { kind: 'person'; application: LaunchpadApplication; username: string }
  | { kind: 'project'; application: LaunchpadApplication; project: string }

const mainHosts = ['launchpad.net']
const bugsHosts = ['bugs.launchpad.net']
const codeHosts = ['code.launchpad.net']
const hosts = [...mainHosts, ...bugsHosts, ...codeHosts]

// Launchpad advertises its feeds over http, and the https URLs redirect there.
const feeds = definePlatformFeeds([
  {
    key: 'launchpad:announcements',
    template: 'http://feeds.launchpad.net/{project}/announcements.atom',
  },
  { key: 'launchpad:announcements', template: 'http://feeds.launchpad.net/announcements.atom' },
  {
    key: 'launchpad:bugs',
    template: 'http://feeds.launchpad.net/{distribution}/+source/{sourcePackage}/latest-bugs.atom',
  },
  { key: 'launchpad:bugs', template: 'http://feeds.launchpad.net/~{username}/latest-bugs.atom' },
  { key: 'launchpad:bugs', template: 'http://feeds.launchpad.net/{project}/latest-bugs.atom' },
  { key: 'launchpad:bugs', template: 'http://feeds.launchpad.net/bugs/latest-bugs.atom' },
  { key: 'launchpad:bug', template: 'http://feeds.launchpad.net/bugs/{bugId}/bug.atom' },
  {
    key: 'launchpad:branch',
    template:
      'http://feeds.launchpad.net/~{owner}/{distribution}/{series}/{sourcePackage}/{branch}/branch.atom',
  },
  {
    key: 'launchpad:branch',
    template: 'http://feeds.launchpad.net/~{owner}/{project}/{branch}/branch.atom',
  },
  { key: 'launchpad:branches', template: 'http://feeds.launchpad.net/~{username}/branches.atom' },
  { key: 'launchpad:branches', template: 'http://feeds.launchpad.net/{project}/branches.atom' },
  { key: 'launchpad:revisions', template: 'http://feeds.launchpad.net/~{username}/revisions.atom' },
  { key: 'launchpad:revisions', template: 'http://feeds.launchpad.net/{project}/revisions.atom' },
])

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
  const [pillarOrPerson, route, sourcePackage] = segments
  const application = getApplication(parsedUrl)
  const isCodeHost = application === 'code'

  if (!pillarOrPerson && application !== 'code') {
    return { kind: 'home', application }
  }

  // Code has no site-wide feed.
  if (!pillarOrPerson) {
    return
  }

  if (!isCodeHost) {
    const bugIndex = segments.findIndex((segment, index) => {
      return isAnyOf(segment, '+bug') || (index === 0 && isAnyOf(segment, 'bugs'))
    })
    const [, bugId] = segments.slice(bugIndex)

    if (bugIndex !== -1 && bugId && digitsRegex.test(bugId)) {
      return { kind: 'bug', bugId }
    }
  }

  if (pillarOrPerson.startsWith('~')) {
    if (pillarOrPerson.length > 1 && segments.length === 1) {
      return { kind: 'person', application, username: pillarOrPerson.slice(1) }
    }

    if (!isCodeHost || segments.some((segment) => segment.startsWith('+'))) {
      return
    }

    // Bazaar branches live at ~owner/project/branch or ~owner/distro/series/package/branch.
    const owner = pillarOrPerson.slice(1)

    if (segments.length === 3) {
      const [, project, branch] = segments

      return { kind: 'branch', owner, project, branch }
    }

    if (segments.length === 5) {
      const [, distribution, series, sourcePackage, branch] = segments

      return { kind: 'branch', owner, distribution, series, sourcePackage, branch }
    }

    return
  }

  if (pillarOrPerson.startsWith('+')) {
    return
  }

  if (segments.length === 1) {
    return { kind: 'project', application, project: pillarOrPerson }
  }

  if (!isCodeHost && sourcePackage && segments.length === 3 && isAnyOf(route, '+source')) {
    return { kind: 'sourcePackage', distribution: pillarOrPerson, sourcePackage }
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
      return [feeds.getFeedEntry('launchpad:announcements')]
    }

    if (parsed.kind === 'home') {
      return [feeds.getFeedEntry('launchpad:bugs')]
    }

    if (parsed.kind === 'bug') {
      return [feeds.getFeedEntry('launchpad:bug', parsed)]
    }

    if (parsed.kind === 'branch') {
      return [feeds.getFeedEntry('launchpad:branch', parsed)]
    }

    if (parsed.kind === 'sourcePackage') {
      return [feeds.getFeedEntry('launchpad:bugs', parsed)]
    }

    const entries: Array<DiscoverUriEntry> = []

    if (parsed.kind === 'project' && parsed.application === 'main') {
      entries.push(feeds.getFeedEntry('launchpad:announcements', parsed))
    }

    if (parsed.application !== 'code') {
      entries.push(feeds.getFeedEntry('launchpad:bugs', parsed))
    }

    if (parsed.application !== 'bugs') {
      entries.push(feeds.getFeedEntry('launchpad:branches', parsed))
      entries.push(feeds.getFeedEntry('launchpad:revisions', parsed))
    }

    return entries
  },

  getFeedHint: feeds.getFeedHint,
}
