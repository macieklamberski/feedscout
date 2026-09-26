import type { DiscoverUriEntry } from '../../common/types.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint, findElement, getCookieNames, hasElementWithId } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

const forumIdRegex = /[?&]f=(\d+)/
const topicIdRegex = /[?&]t=(\d+)/
const scriptSegmentRegex = /\/[^/]*\.php$/i
const trailingSlashRegex = /\/$/

export const isPhpbbHtml = (content: string): boolean => {
  return hasElementWithId(content, 'phpbb')
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

export const phpbbHandler: PlatformHandler = {
  match: (url, content, headers) => {
    if (!URL.canParse(url)) {
      return false
    }

    if (content && isPhpbbHtml(content)) {
      return true
    }

    if (headers && isPhpbbHeaders(headers)) {
      return true
    }

    return false
  },

  resolve: (url, content) => {
    const { origin, pathname, search } = new URL(url)
    // A board is routinely mounted under a sub-path such as `/community`.
    const boardPath = pathname.replace(scriptSegmentRegex, '').replace(trailingSlashRegex, '')
    const boardUrl = `${origin}${boardPath}`
    const forumId = search.match(forumIdRegex)?.[1]
    // A post link, `viewtopic.php?p={id}`, names no topic, and the page's canonical link does.
    const canonicalLink = findElement(content, (element) => {
      return element.name === 'link' && element.attribs.rel === 'canonical'
    })
    const topicId =
      search.match(topicIdRegex)?.[1] ?? canonicalLink?.attribs.href?.match(topicIdRegex)?.[1]
    const uris: Array<DiscoverUriEntry> = []

    if (topicId) {
      uris.push({
        uri: `${boardUrl}/feed.php?t=${topicId}`,
        hint: composeHint('phpbb:topic'),
      })
    }

    if (forumId) {
      uris.push({
        uri: `${boardUrl}/feed.php?f=${forumId}`,
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
