import { parseUrl } from 'trousse'
import type { DiscoverUriEntry } from '../../common/types.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import {
  composeHint,
  findElement,
  getCookieNames,
  getScriptDirectory,
  hasMarker,
} from '../../common/utils.js'

// Discoverability: Discoverable without handler.

const coreScriptRegex = /\/clientscript\/vbulletin-core\.js/
const clientscriptPathRegex = /\/clientscript\/.*$/
const rollupScriptRegex = /(?:^|\/)js\/header-rollup(?:-\d+)?\.js/
const rollupPathRegex = /\/js\/[^/]*$/
// vBulletin 5 and 6.0 print `"channelid": "{id}"` in `pageData`,
// 6.1 and later `data-channelid='{id}'`.
const channelIdRegex = /(?:"channelid":\s*"|data-channelid=['"])(\d+)/
const forumDisplayRegex = /\/forumdisplay\.php$/i
const forumIdRegex = /[?&]f=(\d+)/
const friendlyForumIdRegex = /^\?(\d+)(?:-|&|$)/

// vBulletin 4 prints `clientscript/vbulletin-core.js` as an absolute URL under the forum root.
// vBulletin 5 and 6 print `js/header-rollup-{version}.js` or `js/header-rollup.js?c={hash}`
// relative to a `<base>` at the root.
const getScriptSrc = (content: string | undefined, srcRegex: RegExp): string | undefined => {
  const script = findElement(content, (element) => {
    return element.name === 'script' && srcRegex.test(element.attribs.src ?? '')
  })

  return script?.attribs.src
}

export const isVbulletinHtml = (content: string): boolean => {
  return (
    getScriptSrc(content, coreScriptRegex) !== undefined ||
    getScriptSrc(content, rollupScriptRegex) !== undefined
  )
}

// vBulletin 3 to 6 set `{prefix}lastvisit` and `{prefix}lastactivity`, the board picks the prefix.
export const isVbulletinHeaders = (headers: Headers): boolean => {
  const names = getCookieNames(headers)

  return names.some((name) => {
    if (!name.endsWith('lastvisit')) {
      return false
    }

    const prefix = name.slice(0, -'lastvisit'.length)

    return names.includes(`${prefix}lastactivity`)
  })
}

// Friendly URLs name the forum as `?{id}-{title}` or `?{id}`, and plain ones as `?f={id}`.
const getForumId = (pathname: string, search: string): string | undefined => {
  if (!forumDisplayRegex.test(pathname)) {
    return
  }

  return search.match(forumIdRegex)?.[1] ?? search.match(friendlyForumIdRegex)?.[1]
}

export type VbulletinPage = { siteFeedUrl: string; forumFeedUrl?: string }

// vBulletin 5 and 6 serve `external?type=rss2` and have no `external.php`.
const getVbulletin5Page = (url: string, content: string | undefined): VbulletinPage | undefined => {
  const rollupScriptSrc = getScriptSrc(content, rollupScriptRegex)

  if (!rollupScriptSrc) {
    return
  }

  const baseElement = findElement(content, (element) => {
    return element.name === 'base'
  })
  const baseUrl = parseUrl(baseElement?.attribs.href ?? '', url) ?? url
  const rollupScriptUrl = new URL(rollupScriptSrc, baseUrl)
  const rootPath = rollupScriptUrl.pathname.replace(rollupPathRegex, '')
  const channelId = content?.match(channelIdRegex)?.[1]
  const siteFeedUrl = `${rollupScriptUrl.origin}${rootPath}/external?type=rss2`

  // The root channel, id 1, serves the same items as the site feed.
  if (channelId && channelId !== '1') {
    return { siteFeedUrl, forumFeedUrl: `${siteFeedUrl}&nodeid=${channelId}` }
  }

  return { siteFeedUrl }
}

// A rewritten page URL such as `/other-gps-systems.html` names no install root.
const getVbulletin4RootUrl = (parsedUrl: URL, content: string | undefined): string => {
  const coreScriptSrc = getScriptSrc(content, coreScriptRegex)
  const coreScriptUrl = coreScriptSrc ? parseUrl(coreScriptSrc, parsedUrl) : undefined

  if (coreScriptUrl) {
    return `${coreScriptUrl.origin}${coreScriptUrl.pathname.replace(clientscriptPathRegex, '')}`
  }

  return `${parsedUrl.origin}${getScriptDirectory(parsedUrl.pathname)}`
}

const getVbulletinPage = (url: string, content: string | undefined): VbulletinPage | undefined => {
  const parsedUrl = parseUrl(url)

  if (!parsedUrl) {
    return
  }

  const vbulletin5Page = getVbulletin5Page(url, content)

  if (vbulletin5Page) {
    return vbulletin5Page
  }

  const rootUrl = getVbulletin4RootUrl(parsedUrl, content)
  const forumId = getForumId(parsedUrl.pathname, parsedUrl.search)
  const page: VbulletinPage = { siteFeedUrl: `${rootUrl}/external.php?type=RSS2` }

  if (forumId) {
    page.forumFeedUrl = `${rootUrl}/external.php?type=RSS2&forumids=${forumId}`
  }

  return page
}

export const vbulletinHandler: PlatformHandler = {
  match: (_url, content, headers) => {
    return hasMarker(content, headers, { html: isVbulletinHtml, headers: isVbulletinHeaders })
  },

  resolve: (url, content) => {
    const page = getVbulletinPage(url, content)

    if (!page) {
      return []
    }

    const { siteFeedUrl, forumFeedUrl } = page
    const uris: Array<DiscoverUriEntry> = []

    if (forumFeedUrl) {
      uris.push({ uri: forumFeedUrl, hint: composeHint('vbulletin:forum') })
    }

    uris.push({ uri: siteFeedUrl, hint: composeHint('vbulletin:site') })

    return uris
  },
}
