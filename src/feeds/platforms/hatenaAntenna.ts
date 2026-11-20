import { hatenaAntenna } from 'feedintel'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { findDescendant, findElement } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

export type HatenaAntennaUrl =
  | { kind: 'antenna'; username: string }
  | { kind: 'group'; username: string; groupId: string }
export type HatenaAntennaPage = HatenaAntennaUrl

const feeds = withHintLabels(hatenaAntenna.feeds)

// The group nav with one group in bold, the one the page shows.
const hasSelectedGroup = (content: string): boolean => {
  const pager = findElement(content, (element) => {
    return element.name === 'p' && element.attribs.id === 'pager_group'
  })

  if (!pager) {
    return false
  }

  return findDescendant(pager, (element) => element.name === 'b') !== undefined
}

export const parseHatenaAntennaUrl = (url: string): HatenaAntennaUrl | undefined => {
  const page = hatenaAntenna.pages.read(url)

  if (!page) {
    return
  }

  const { username, groupId } = page.params

  if (page.key === 'group') {
    return { kind: 'group', username, groupId }
  }

  return { kind: 'antenna', username }
}

export const getHatenaAntennaPage = (
  url: string,
  content: string | undefined,
): HatenaAntennaPage | undefined => {
  const parsed = parseHatenaAntennaUrl(url)

  if (!parsed) {
    return
  }

  // Hatena bolds the group the page shows in its group nav. A made-up group id leaves every group
  // a link and serves an empty feed, so the page falls back to the whole antenna.
  if (parsed.kind === 'group' && content !== undefined && !hasSelectedGroup(content)) {
    return { kind: 'antenna', username: parsed.username }
  }

  return parsed
}

export const hatenaAntennaHandler: PlatformHandler = {
  match: (url) => {
    return parseHatenaAntennaUrl(url) !== undefined
  },

  resolve: (url, content) => {
    const page = getHatenaAntennaPage(url, content)

    if (!page) {
      return []
    }

    if (page.kind === 'group') {
      return [
        feeds.getFeedEntry('group', {
          username: page.username,
          groupId: page.groupId,
        }),
      ]
    }

    return [feeds.getFeedEntry('antenna', { username: page.username })]
  },

  getFeedHint: feeds.getFeedHint,
}
