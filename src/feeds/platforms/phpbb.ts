import { phpbb } from 'feedintel'
import { parseUrl } from 'trousse'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import {
  findElement,
  getCookieNames,
  getSiteParams,
  getSiteUrl,
  hasElementWithId,
  hasMarker,
} from '../../common/utils.js'
import { isForumotionHtml } from './forumotion.js'

// Discoverability: Discoverable without handler.

export type PhpbbPage = { boardUrl: string; forumId?: string; topicId?: string }

const feeds = withHintLabels(phpbb.feeds)

// Forumotion's phpBB3 template prints the same body id and serves none of phpBB's feeds.
export const isPhpbbHtml = (content: string): boolean => {
  return hasElementWithId(content, 'phpbb') && !isForumotionHtml(content)
}

// phpBB sets `{name}_u`, `{name}_k` and `{name}_sid`, where the board picks the name.
export const isPhpbbHeaders = (headers: Headers): boolean => {
  const names = getCookieNames(headers)

  return names.some((name) => {
    if (!name.endsWith('_sid')) {
      return false
    }

    const prefix = name.slice(0, -'_sid'.length)

    return names.includes(`${prefix}_u`) && names.includes(`${prefix}_k`)
  })
}

const getPhpbbPage = (url: string, content: string | undefined): PhpbbPage | undefined => {
  const page = phpbb.pages.readUrl(url, { isAnyHost: true })

  if (!page) {
    return
  }

  const root = getSiteUrl(page.values)
  const forumId = page.key === 'board' ? undefined : page.values.forumId
  const topicId = page.key === 'topic' ? page.values.topicId : undefined
  // A post link, `viewtopic.php?p={id}`, names no topic, and the page's canonical link does.
  const canonicalLink = findElement(content, (element) => {
    return element.name === 'link' && element.attribs.rel === 'canonical'
  })
  const canonicalUrl = parseUrl(canonicalLink?.attribs.href, url)?.href ?? ''
  const canonicalPage = phpbb.pages.readUrl(canonicalUrl, { isAnyHost: true })
  const canonicalTopicId = canonicalPage?.key === 'topic' ? canonicalPage.values.topicId : undefined

  return {
    boardUrl: root,
    forumId,
    topicId: topicId ?? canonicalTopicId,
  }
}

export const phpbbHandler: PlatformHandler = {
  match: (_url, content, headers) => {
    return hasMarker(content, headers, { html: isPhpbbHtml, headers: isPhpbbHeaders })
  },

  resolve: (url, content) => {
    const page = getPhpbbPage(url, content)
    const pageFeeds = feeds.forSite(url)

    if (!page || !pageFeeds) {
      return []
    }

    const { boardUrl, forumId, topicId } = page
    const site = getSiteParams(boardUrl)

    if (topicId && forumId) {
      return [
        pageFeeds.getFeedEntry('topic', { ...site, topicId }),
        pageFeeds.getFeedEntry('forum', { ...site, forumId }),
        pageFeeds.getFeedEntry('site', site),
        pageFeeds.getFeedEntry('news', site),
        pageFeeds.getFeedEntry('new-topics', site),
        pageFeeds.getFeedEntry('active-topics', site),
        pageFeeds.getFeedEntry('forums', site),
      ]
    }

    if (topicId) {
      return [
        pageFeeds.getFeedEntry('topic', { ...site, topicId }),
        pageFeeds.getFeedEntry('site', site),
        pageFeeds.getFeedEntry('news', site),
        pageFeeds.getFeedEntry('new-topics', site),
        pageFeeds.getFeedEntry('active-topics', site),
        pageFeeds.getFeedEntry('forums', site),
      ]
    }

    if (forumId) {
      return [
        pageFeeds.getFeedEntry('forum', { ...site, forumId }),
        pageFeeds.getFeedEntry('site', site),
        pageFeeds.getFeedEntry('news', site),
        pageFeeds.getFeedEntry('new-topics', site),
        pageFeeds.getFeedEntry('active-topics', site),
        pageFeeds.getFeedEntry('forums', site),
      ]
    }

    return [
      pageFeeds.getFeedEntry('site', site),
      pageFeeds.getFeedEntry('news', site),
      pageFeeds.getFeedEntry('new-topics', site),
      pageFeeds.getFeedEntry('active-topics', site),
      pageFeeds.getFeedEntry('forums', site),
    ]
  },
}
