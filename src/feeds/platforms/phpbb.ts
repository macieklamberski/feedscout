import { composeQuery, getQueryParam, parseUrl } from 'trousse'
import type { DiscoverUriEntry } from '../../common/types.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import {
  composeHint,
  digitsRegex,
  findElement,
  getCookieNames,
  getNumericId,
  getScriptDirectory,
  hasElementWithId,
  hasMarker,
} from '../../common/utils.js'
import { isForumotionHtml } from './forumotion.js'

// Discoverability: Partially discoverable without handler.
// Generic partly covers board, forum, post, topic.

export type PhpbbPage = { boardUrl: string; forumId?: string; topicId?: string }

const topicIdRegex = /[?&]t=(?<id>[^&#]+)/i

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

const getNumericParam = (searchParams: URLSearchParams, name: string): string | undefined => {
  const value = getQueryParam(searchParams, name)

  if (value && digitsRegex.test(value)) {
    return value
  }
}

const getPhpbbPage = (url: string, content: string | undefined): PhpbbPage | undefined => {
  const parsedUrl = parseUrl(url)

  if (!parsedUrl) {
    return
  }

  const { origin, pathname, searchParams } = parsedUrl
  // A post link, `viewtopic.php?p={id}`, names no topic, and the page's canonical link does.
  const canonicalLink = findElement(content, (element) => {
    return element.name === 'link' && element.attribs.rel === 'canonical'
  })

  return {
    // A board is routinely mounted under a sub-path such as `/community`.
    boardUrl: `${origin}${getScriptDirectory(pathname)}`,
    forumId: getNumericParam(searchParams, 'f'),
    topicId:
      getNumericParam(searchParams, 't') ?? getNumericId(canonicalLink?.attribs.href, topicIdRegex),
  }
}

export const phpbbHandler: PlatformHandler = {
  match: (_url, content, headers) => {
    return hasMarker(content, headers, { html: isPhpbbHtml, headers: isPhpbbHeaders })
  },

  resolve: (url, content) => {
    const page = getPhpbbPage(url, content)

    if (!page) {
      return []
    }

    const { boardUrl, forumId, topicId } = page
    const uris: Array<DiscoverUriEntry> = []

    if (topicId) {
      uris.push({
        uri: `${boardUrl}/feed.php${composeQuery({ t: topicId })}`,
        hint: composeHint('phpbb:topic'),
      })
    }

    if (forumId) {
      uris.push({
        uri: `${boardUrl}/feed.php${composeQuery({ f: forumId })}`,
        hint: composeHint('phpbb:forum'),
      })
    }

    // Each board-wide feed is an administrator toggle, so a board serves any subset of them.
    uris.push(
      { uri: `${boardUrl}/feed.php`, hint: composeHint('phpbb:site') },
      { uri: `${boardUrl}/feed.php?mode=news`, hint: composeHint('phpbb:news') },
      { uri: `${boardUrl}/feed.php?mode=topics`, hint: composeHint('phpbb:new-topics') },
      { uri: `${boardUrl}/feed.php?mode=topics_active`, hint: composeHint('phpbb:active-topics') },
      { uri: `${boardUrl}/feed.php?mode=forums`, hint: composeHint('phpbb:forums') },
    )

    return uris
  },
}
