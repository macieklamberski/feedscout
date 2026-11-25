import { sportadmin } from 'feedintel'
import { parseUrl } from 'trousse'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { findElement } from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Generic finds: news.
// Handler needed for: team.

export type SportadminPage = { kind: 'club' } | { kind: 'team'; sectionId: string }

// The next game widget, which the classic template prints on the club home page alone.
const nextGameRegex = /wNextGame\.asp\?SID=(\d+)/i

const feeds = withHintLabels(sportadmin.feeds)

const getLayoutSectionId = (href: string | undefined, url: string): string | undefined => {
  const page = sportadmin.pages.readUrl(parseUrl(href, url)?.href ?? '')

  if (page?.key !== 'layout') {
    return
  }

  return page.values.sectionId
}

// The link to the other layout, "Gå till Webbversion" or its app counterpart.
const findLayoutSectionId = (url: string, content: string | undefined): string | undefined => {
  const link = findElement(content, (element) => {
    return element.name === 'a' && getLayoutSectionId(element.attribs.href, url) !== undefined
  })

  return getLayoutSectionId(link?.attribs.href, url)
}

// The new template answers an unknown section with the club home page, whose canonical is the
// root, and its feed then serves the club news items.
const getUrlSectionId = (url: string, content: string | undefined): string | undefined => {
  const page = sportadmin.pages.readUrl(url)
  const canonical = findElement(content, (element) => {
    return element.name === 'link' && element.attribs.rel === 'canonical'
  })?.attribs.href

  if ((page?.key !== 'section' && page?.key !== 'layout') || !canonical) {
    return
  }

  if (sportadmin.pages.readUrl(parseUrl(canonical, url)?.href ?? '')?.key === 'home') {
    return
  }

  return page.values.sectionId
}

export const getSportadminPage = (
  url: string,
  content: string | undefined,
): SportadminPage | undefined => {
  if (!sportadmin.pages.readUrl(url)) {
    return
  }

  // On the classic template a team url redirects to `/start/?ID={page}`, so the layout link names
  // the team. The new template prints no layout link and keeps `/?SID={id}` in the url.
  const sectionId = findLayoutSectionId(url, content) ?? getUrlSectionId(url, content)

  // On the club home page the layout link names the root section, whose feed serves the club
  // news items.
  if (!sectionId || sectionId === content?.match(nextGameRegex)?.[1]) {
    return { kind: 'club' }
  }

  return { kind: 'team', sectionId }
}

export const sportadminHandler: PlatformHandler = {
  match: (url, content) => {
    return getSportadminPage(url, content) !== undefined
  },

  resolve: (url, content) => {
    const page = getSportadminPage(url, content)
    const pageFeeds = feeds.forSite(url)

    if (!page || !pageFeeds) {
      return []
    }

    if (page.kind === 'team') {
      return [
        pageFeeds.getFeedEntry('team', { sectionId: page.sectionId }),
        pageFeeds.getFeedEntry('news'),
      ]
    }

    return [pageFeeds.getFeedEntry('news')]
  },

  getFeedHint: feeds.getFeedHint,
}
