import { getAnyOf, parseUrl } from 'trousse'
import type { DiscoverUriEntry } from '../../common/types.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint, findElement, hasMarker } from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Generic covers auteur, home, mot, rubrique (html), partly covers article.

const objectWordRegex = /^([a-z]+)(\d+)$/i
const objectFileRegex = /^([a-z]+)(\d+)\.html$/i
const idRegex = /^\d+$/
const notFoundClassRegex = /\bpage_404\b/

const objects = ['article', 'rubrique', 'mot', 'auteur'] as const

type SpipObject = (typeof objects)[number]

type SpipObjectId = { object: SpipObject; id: string }

export type SpipPage =
  | { kind: SpipObject; scriptUrl: string; id: string }
  | { kind: 'home'; scriptUrl: string }

// SPIP sends `Composed-By` on every page it composes, and `X-Spip-Cache` when its page cache is
// on. An install can silence `Composed-By` and still send the cache header.
export const isSpipHeaders = (headers: Headers): boolean => {
  if (headers.get('composed-by')?.startsWith('SPIP')) {
    return true
  }

  return headers.has('x-spip-cache')
}

const getObjectId = (
  name: string | undefined,
  id: string | undefined,
): SpipObjectId | undefined => {
  const object = getAnyOf(name, objects)

  if (!object || !id) {
    return
  }

  return { object, id }
}

// The `page` URL type writes `spip.php?article12` and the `html` type `article12.html`. Every
// install also answers the template form, `spip.php?page=article&id_article=12`.
const getUrlObjectId = (parsedUrl: URL): SpipObjectId | undefined => {
  for (const key of parsedUrl.searchParams.keys()) {
    const [, name, id] = key.match(objectWordRegex) ?? []
    const objectId = getObjectId(name, id)

    if (objectId) {
      return objectId
    }
  }

  const lastSegment = parsedUrl.pathname.split('/').at(-1) ?? ''
  const [, fileName, fileId] = lastSegment.match(objectFileRegex) ?? []
  const fileObjectId = getObjectId(fileName, fileId)

  if (fileObjectId) {
    return fileObjectId
  }

  const page = parsedUrl.searchParams.get('page')
  const object = objects.find((value) => value === page)

  if (!object) {
    return
  }

  const id = parsedUrl.searchParams.get(`id_${object}`)

  if (!id || !idRegex.test(id)) {
    return
  }

  return { object, id }
}

// Rewritten URLs such as `/Some-Title` name no id, and SPIP answers any id with a well-formed
// empty feed, so those pages get the site feed alone. A rewritten URL with folders needs a
// `<base href>` at the install root for its relative `spip.php` links to work.
export const getSpipPage = (url: string, content: string | undefined): SpipPage | undefined => {
  const parsedUrl = parseUrl(url)

  if (!parsedUrl) {
    return
  }

  const base = findElement(content, (element) => {
    return element.name === 'base' && Boolean(element.attribs.href)
  })
  const baseUrl = parseUrl(base?.attribs.href ?? '', parsedUrl) ?? parsedUrl
  const scriptUrl = new URL('spip.php', baseUrl).href
  const objectId = getUrlObjectId(parsedUrl)
  // SPIP answers a made-up id with an empty feed, and its not-found page marks the root element.
  const notFound = findElement(content, (element) => {
    return element.name === 'html' && notFoundClassRegex.test(element.attribs.class ?? '')
  })

  if (!objectId || notFound) {
    return { kind: 'home', scriptUrl }
  }

  return { kind: objectId.object, scriptUrl, id: objectId.id }
}

export const spipHandler: PlatformHandler = {
  match: (url, content, headers) => {
    if (!hasMarker(content, headers, { headers: isSpipHeaders })) {
      return false
    }

    return getSpipPage(url, content) !== undefined
  },

  resolve: (url, content) => {
    const page = getSpipPage(url, content)

    if (!page) {
      return []
    }

    const { scriptUrl } = page
    const uris: Array<DiscoverUriEntry> = []

    // The comments plugin serves this. An install without it answers 404 or 500. The plugin's
    // Atom template is Atom 0.3 with each entry wrapped in an `<item>`, which parses with no
    // entries, so only the RSS one is emitted.
    if (page.kind === 'article') {
      uris.push({
        uri: `${scriptUrl}?${new URLSearchParams({ page: 'comments-rss', id_article: page.id })}`,
        hint: composeHint('spip:article-comments'),
      })
    }

    if (page.kind === 'rubrique') {
      uris.push({
        uri: `${scriptUrl}?${new URLSearchParams({ page: 'backend', id_rubrique: page.id })}`,
        hint: composeHint('spip:section'),
      })
    }

    if (page.kind === 'mot') {
      uris.push({
        uri: `${scriptUrl}?${new URLSearchParams({ page: 'backend', id_mot: page.id })}`,
        hint: composeHint('spip:keyword'),
      })
    }

    if (page.kind === 'auteur') {
      uris.push({
        uri: `${scriptUrl}?${new URLSearchParams({ page: 'backend', id_auteur: page.id })}`,
        hint: composeHint('spip:author'),
      })
    }

    uris.push({ uri: `${scriptUrl}?page=backend`, hint: composeHint('spip:articles') })

    return uris
  },
}
