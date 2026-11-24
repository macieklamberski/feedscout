import { sportsregions } from 'feedintel'
import { isHostOrSubdomainOf } from 'trousse'
import { type PlatformFeedParams, withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { hasMarker } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

export type SportsregionsUrl = { kind: 'club' }

const feeds = withHintLabels(sportsregions.feeds)

// The footer of every club site links the platform's abuse report form, on custom domains too.
export const isSportsregionsHtml = (content: string): boolean => {
  return content.includes('www.sportsregions.fr/signaler-un-contenu-inapproprie')
}

// The events page filtered by event type or group links the events feed with the same filter.
const getEventFilters = (url: string): PlatformFeedParams | undefined => {
  const page = sportsregions.pages.read(url, { isAnyHost: true })

  if (page?.key !== 'filtered-events') {
    return
  }

  return { typeId: page.params.typeId, groupId: page.params.groupId }
}

// A club's events page reads as the filtered events, and is the club's page too.
export const parseSportsregionsUrl = (url: string): SportsregionsUrl | undefined => {
  const page = sportsregions.pages.read(url)

  if (!page || page.key === 'portal') {
    return
  }

  return { kind: 'club' }
}

export const sportsregionsHandler: PlatformHandler = {
  match: (url, content, headers) => {
    const page = sportsregions.pages.read(url)

    // The portal prints the same footer.
    if (page) {
      return page.key !== 'portal'
    }

    if (isHostOrSubdomainOf(url, sportsregions.hosts.tenants)) {
      return false
    }

    return hasMarker(content, headers, { html: isSportsregionsHtml })
  },

  resolve: (url) => {
    const page = feeds.forUrl(url)

    if (!page) {
      return []
    }

    const filters = getEventFilters(url)

    if (filters) {
      return [
        page.getFeedEntry('filtered-events', filters),
        page.getFeedEntry('news'),
        page.getFeedEntry('events'),
      ]
    }

    return [page.getFeedEntry('news'), page.getFeedEntry('events')]
  },

  getFeedHint: feeds.getFeedHint,
}
