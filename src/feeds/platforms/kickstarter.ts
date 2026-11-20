import { kickstarter } from 'feedintel'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'

// Discoverability: Partially discoverable without handler.
// Generic finds: updates.
// Handler needed for: projects.

export type KickstarterUrl =
  | { kind: 'project'; creator: string; project: string }
  | { kind: 'page'; name: string }
  | { kind: 'home' }

const feeds = withHintLabels(kickstarter.feeds)

export const parseKickstarterUrl = (url: string): KickstarterUrl | undefined => {
  const page = kickstarter.pages.read(url)

  if (!page) {
    return
  }

  if (page.key === 'project') {
    return { kind: 'project', creator: page.params.creator, project: page.params.project }
  }

  if (page.key === 'page') {
    return { kind: 'page', name: page.params.name }
  }

  return { kind: 'home' }
}

export const kickstarterHandler: PlatformHandler = {
  match: (url) => {
    return parseKickstarterUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseKickstarterUrl(url)

    if (!parsed) {
      return []
    }

    // The new projects feed needs no value from the page, so every page builds it after its own
    // feeds.
    if (parsed.kind === 'project') {
      return [
        feeds.getFeedEntry('updates', {
          creator: parsed.creator,
          project: parsed.project,
        }),
        feeds.getFeedEntry('projects'),
      ]
    }

    if (parsed.kind === 'page') {
      return [feeds.getFeedEntry('page', { name: parsed.name }), feeds.getFeedEntry('projects')]
    }

    // Homepage or discover pages - return global new projects feed.
    return [feeds.getFeedEntry('projects')]
  },

  getFeedHint: feeds.getFeedHint,
}
