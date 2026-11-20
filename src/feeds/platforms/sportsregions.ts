import { sportsregions } from 'feedintel'
import { getQueryParam, isHostOrSubdomainOf, parseUrl } from 'trousse'
import { type PlatformFeedParams, withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { digitsRegex, getTenantSubdomain, hasMarker } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

export type SportsregionsUrl = { kind: 'club' }

const domains = sportsregions.hosts.tenants

const eventsPathRegex = /^\/evenements\/?$/i

const feeds = withHintLabels(sportsregions.feeds)

// The footer of every club site links the platform's abuse report form, on custom domains too.
export const isSportsregionsHtml = (content: string): boolean => {
  return content.includes('www.sportsregions.fr/signaler-un-contenu-inapproprie')
}

// The events page filtered by event type or group links the events feed with the same filter.
const getEventFilters = (url: string): PlatformFeedParams | undefined => {
  const parsedUrl = parseUrl(url)

  if (!parsedUrl || !eventsPathRegex.test(parsedUrl.pathname)) {
    return
  }

  const filters: PlatformFeedParams = {}
  const typeId = getQueryParam(parsedUrl, 'type_id')
  const groupId = getQueryParam(parsedUrl, 'groupe_id')

  if (typeId && digitsRegex.test(typeId)) {
    filters.typeId = typeId
  }

  if (groupId && digitsRegex.test(groupId)) {
    filters.groupId = groupId
  }

  if (Object.keys(filters).length === 0) {
    return
  }

  return filters
}

export const parseSportsregionsUrl = (url: string): SportsregionsUrl | undefined => {
  if (!getTenantSubdomain(url, domains)) {
    return
  }

  return { kind: 'club' }
}

export const sportsregionsHandler: PlatformHandler = {
  match: (url, content, headers) => {
    if (parseSportsregionsUrl(url)) {
      return true
    }

    // The portal and the help center print the same footer.
    if (isHostOrSubdomainOf(url, domains)) {
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
