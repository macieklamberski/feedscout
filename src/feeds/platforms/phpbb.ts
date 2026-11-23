import { phpbb } from 'feedintel'
import { parseUrl } from 'trousse'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { findElement, getCookieNames, hasElementWithId, hasMarker } from '../../common/utils.js'
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
  const page = phpbb.pages.read(url, { isAnyHost: true })

  if (!page) {
    return
  }

  const { root } = page.params
  const forumId = page.key === 'board' ? undefined : page.params.forumId
  const topicId = page.key === 'topic' ? page.params.topicId : undefined
  // A post link, `viewtopic.php?p={id}`, names no topic, and the page's canonical link does.
  const canonicalLink = findElement(content, (element) => {
    return element.name === 'link' && element.attribs.rel === 'canonical'
  })
  const canonicalUrl = parseUrl(canonicalLink?.attribs.href, url)?.href ?? ''
  const canonicalPage = phpbb.pages.read(canonicalUrl, { isAnyHost: true })
  const canonicalTopicId = canonicalPage?.key === 'topic' ? canonicalPage.params.topicId : undefined

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
    const pageFeeds = feeds.forUrl(url)

    if (!page || !pageFeeds) {
      return []
    }

    const { boardUrl: root, forumId, topicId } = page

    if (topicId && forumId) {
      return [
        pageFeeds.getFeedEntry('topic', { root, topicId }),
        pageFeeds.getFeedEntry('forum', { root, forumId }),
        pageFeeds.getFeedEntry('site', { root }),
        pageFeeds.getFeedEntry('news', { root }),
        pageFeeds.getFeedEntry('new-topics', { root }),
        pageFeeds.getFeedEntry('active-topics', { root }),
        pageFeeds.getFeedEntry('forums', { root }),
      ]
    }

    if (topicId) {
      return [
        pageFeeds.getFeedEntry('topic', { root, topicId }),
        pageFeeds.getFeedEntry('site', { root }),
        pageFeeds.getFeedEntry('news', { root }),
        pageFeeds.getFeedEntry('new-topics', { root }),
        pageFeeds.getFeedEntry('active-topics', { root }),
        pageFeeds.getFeedEntry('forums', { root }),
      ]
    }

    if (forumId) {
      return [
        pageFeeds.getFeedEntry('forum', { root, forumId }),
        pageFeeds.getFeedEntry('site', { root }),
        pageFeeds.getFeedEntry('news', { root }),
        pageFeeds.getFeedEntry('new-topics', { root }),
        pageFeeds.getFeedEntry('active-topics', { root }),
        pageFeeds.getFeedEntry('forums', { root }),
      ]
    }

    return [
      pageFeeds.getFeedEntry('site', { root }),
      pageFeeds.getFeedEntry('news', { root }),
      pageFeeds.getFeedEntry('new-topics', { root }),
      pageFeeds.getFeedEntry('active-topics', { root }),
      pageFeeds.getFeedEntry('forums', { root }),
    ]
  },
}
