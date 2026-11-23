import { launchpad } from 'feedintel'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'

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

const feeds = withHintLabels(launchpad.feeds)

export const parseLaunchpadUrl = (url: string): LaunchpadUrl | undefined => {
  const page = launchpad.pages.read(url)

  if (!page) {
    return
  }

  const { bugId, owner, project, branch, distribution, series, sourcePackage, username } =
    page.params

  switch (page.key) {
    case 'home':
      return { kind: 'home', application: 'main' }
    case 'bugsHome':
      return { kind: 'home', application: 'bugs' }
    case 'bug':
      return { kind: 'bug', bugId }
    case 'branch':
      if (project) {
        return { kind: 'branch', owner, project, branch }
      }

      return { kind: 'branch', owner, distribution, series, sourcePackage, branch }
    case 'sourcePackage':
      return { kind: 'sourcePackage', distribution, sourcePackage }
    case 'person':
      return { kind: 'person', application: 'main', username }
    case 'bugsPerson':
      return { kind: 'person', application: 'bugs', username }
    case 'codePerson':
      return { kind: 'person', application: 'code', username }
    case 'project':
      return { kind: 'project', application: 'main', project }
    case 'bugsProject':
      return { kind: 'project', application: 'bugs', project }
    case 'codeProject':
      return { kind: 'project', application: 'code', project }
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
