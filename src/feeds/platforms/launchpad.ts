import { launchpad } from 'feedintel'
import { getPathSegments, isAnyOf, isHostOf, parseUrl } from 'trousse'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { digitsRegex } from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Generic finds: branch, bug, package-bugs, person-bugs, project-announcements, project-branches, project-bugs, project-revisions.
// Handler needed for: announcements, bugs, person-branches, person-revisions.

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

const bugsHosts = ['bugs.launchpad.net']
const codeHosts = ['code.launchpad.net']
const hosts = launchpad.hosts.exact

const feeds = withHintLabels(launchpad.feeds)

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

    // The site-wide announcements and bugs need no value from the page, so every page builds them
    // after its own feeds.
    if (parsed.kind === 'home' && parsed.application === 'main') {
      return [feeds.getFeedEntry('announcements'), feeds.getFeedEntry('bugs')]
    }

    if (parsed.kind === 'home') {
      return [feeds.getFeedEntry('bugs'), feeds.getFeedEntry('announcements')]
    }

    if (parsed.kind === 'bug') {
      return [
        feeds.getFeedEntry('bug', parsed),
        feeds.getFeedEntry('announcements'),
        feeds.getFeedEntry('bugs'),
      ]
    }

    if (parsed.kind === 'branch') {
      return [
        feeds.getFeedEntry('branch', parsed),
        feeds.getFeedEntry('announcements'),
        feeds.getFeedEntry('bugs'),
      ]
    }

    if (parsed.kind === 'sourcePackage') {
      return [
        feeds.getFeedEntry('package-bugs', parsed),
        feeds.getFeedEntry('announcements'),
        feeds.getFeedEntry('bugs'),
      ]
    }

    if (parsed.kind === 'project') {
      const { application, project } = parsed

      if (application === 'bugs') {
        return [
          feeds.getFeedEntry('project-bugs', { project }),
          feeds.getFeedEntry('announcements'),
          feeds.getFeedEntry('bugs'),
        ]
      }

      if (application === 'code') {
        return [
          feeds.getFeedEntry('project-branches', { project }),
          feeds.getFeedEntry('project-revisions', { project }),
          feeds.getFeedEntry('announcements'),
          feeds.getFeedEntry('bugs'),
        ]
      }

      return [
        feeds.getFeedEntry('project-announcements', { project }),
        feeds.getFeedEntry('project-bugs', { project }),
        feeds.getFeedEntry('project-branches', { project }),
        feeds.getFeedEntry('project-revisions', { project }),
        feeds.getFeedEntry('announcements'),
        feeds.getFeedEntry('bugs'),
      ]
    }

    const { application, username } = parsed

    if (application === 'bugs') {
      return [
        feeds.getFeedEntry('person-bugs', { username }),
        feeds.getFeedEntry('announcements'),
        feeds.getFeedEntry('bugs'),
      ]
    }

    if (application === 'code') {
      return [
        feeds.getFeedEntry('person-branches', { username }),
        feeds.getFeedEntry('person-revisions', { username }),
        feeds.getFeedEntry('announcements'),
        feeds.getFeedEntry('bugs'),
      ]
    }

    return [
      feeds.getFeedEntry('person-bugs', { username }),
      feeds.getFeedEntry('person-branches', { username }),
      feeds.getFeedEntry('person-revisions', { username }),
      feeds.getFeedEntry('announcements'),
      feeds.getFeedEntry('bugs'),
    ]
  },

  getFeedHint: feeds.getFeedHint,
}
