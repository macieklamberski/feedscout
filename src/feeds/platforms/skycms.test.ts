import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry } from '../../common/types.js'
import {
  hasSkycmsRssList,
  isSkycmsHeaders,
  isSkycmsHtml,
  parseSkycmsUrl,
  type SkycmsUrl,
  skycmsHandler,
} from './skycms.js'

const skycmsHeaders = new Headers([
  ['set-cookie', 'cms_public=9392a29a661cd8b0ceb9e7264ef82d32; path=/; secure; HttpOnly'],
  ['set-cookie', 'skycms_LanguageId=1; Max-Age=86400; path=/; secure; SameSite=lax'],
  ['set-cookie', 'skycms_PageCounter=1234; Max-Age=86400; path=/; secure; HttpOnly'],
])
const bipHtml = `
  <li class="nav-item">
    <a
      href="https://example.com/1225/mapa-biuletynu.html"
      class="nav-link"
    ><span>Mapa biuletynu</span></a>
  </li>
  <li class="nav-item">
    <a
      href="https://example.com/3467/lista-kanalow-rss.html"
      class="nav-link"
    ><span>Lista kanałów RSS <i class="fa fa-rss menuRssIcon"></i></span></a>
  </li>
`
const iconHtml = `
  <link
    rel="icon"
    href="/cms/public/image/default/bip_v4/favicon/favicon-32x32.png"
  >
`
const siteHtml = `
  <li class="nav-item">
    <a
      href="https://example.com/13206/strefa-przedsiebiorcy.html"
      class="nav-link"
    ><span>Strefa przedsiębiorcy</span></a>
  </li>
`

describe('isSkycmsHeaders', () => {
  it('should return true for the page counter cookie', () => {
    expect(isSkycmsHeaders(skycmsHeaders)).toBe(true)
  })

  it('should return false for another session cookie', () => {
    const value = new Headers({ 'set-cookie': 'PHPSESSID=abc; path=/' })

    expect(isSkycmsHeaders(value)).toBe(false)
  })

  it('should return false without cookies', () => {
    expect(isSkycmsHeaders(new Headers())).toBe(false)
  })
})

describe('isSkycmsHtml', () => {
  it('should return true for a template icon', () => {
    expect(isSkycmsHtml(iconHtml)).toBe(true)
  })

  it('should return true for an older template icon', () => {
    const value = `
      <link
        rel="icon"
        href="/cms/public/image/default/bip_v3/favicon/favicon-32x32.png"
      >
    `

    expect(isSkycmsHtml(value)).toBe(true)
  })

  it('should return true for a client-branded template icon', () => {
    const value = `
      <link
        rel="icon"
        href="/clients/cms_amw/image/default/bip/favicon/favicon-32x32.png"
      >
    `

    expect(isSkycmsHtml(value)).toBe(true)
  })

  it('should return false for a client icon outside the bulletin template', () => {
    const value = `
      <link
        rel="icon"
        href="/clients/cms_netkoncept4/image/default/favicons/favicon-32x32.png"
      >
    `

    expect(isSkycmsHtml(value)).toBe(false)
  })

  it('should return false for a template path outside a link element', () => {
    const value = '<a href="/cms/public/image/default/bip_v4/x.pdf">Pobierz</a>'

    expect(isSkycmsHtml(value)).toBe(false)
  })

  it('should return false for a shared asset path', () => {
    const value = `
      <link
        rel="stylesheet"
        href="/min/?f=cms/assets/plugins/x.css"
      >
    `

    expect(isSkycmsHtml(value)).toBe(false)
  })

  it('should return false for a stylesheet of a site outside the bulletin template', () => {
    const value = `
      <link
        href="//example.com/cms/public/fonts/font-awesome/css/font-awesome.min.css"
        rel="stylesheet"
      />
    `

    expect(isSkycmsHtml(value)).toBe(false)
  })
})

describe('hasSkycmsRssList', () => {
  it('should return true for a link to the feed list', () => {
    expect(hasSkycmsRssList(bipHtml)).toBe(true)
  })

  it('should return false for a site without the feed list', () => {
    expect(hasSkycmsRssList(siteHtml)).toBe(false)
  })

  it('should return false without content', () => {
    expect(hasSkycmsRssList(undefined)).toBe(false)
  })
})

describe('parseSkycmsUrl', () => {
  it('should return the id and slug of a page', () => {
    const expected: SkycmsUrl = { kind: 'page', pageId: '2503', slug: 'miasto-i-gmina' }

    expect(parseSkycmsUrl('https://example.com/2503/miasto-i-gmina.html')).toEqual(expected)
  })

  it('should return the page of a URL with a query', () => {
    const expected: SkycmsUrl = { kind: 'page', pageId: '2571', slug: 'ogloszenia' }

    expect(parseSkycmsUrl('https://example.com/2571/ogloszenia.html?page=2')).toEqual(expected)
  })

  it('should return undefined for the home page', () => {
    expect(parseSkycmsUrl('https://example.com/')).toBeUndefined()
  })

  it('should return undefined for the XML copy of a page', () => {
    expect(parseSkycmsUrl('https://example.com/xml/2503/miasto-i-gmina.html')).toBeUndefined()
  })

  it('should return undefined for a page feed', () => {
    expect(parseSkycmsUrl('https://example.com/rss/2503/miasto-i-gmina.html')).toBeUndefined()
  })

  it('should return undefined for an unparsable URL', () => {
    expect(parseSkycmsUrl('not-a-url')).toBeUndefined()
  })
})

describe('skycmsHandler', () => {
  describe('match', () => {
    it('should match a bulletin page', () => {
      const value = 'https://example.com/2503/miasto-i-gmina.html'

      expect(skycmsHandler.match(value, bipHtml, skycmsHeaders)).toBe(true)
    })

    it('should match a bulletin page without headers', () => {
      const value = 'https://example.com/2503/miasto-i-gmina.html'

      expect(skycmsHandler.match(value, `${iconHtml}${bipHtml}`, undefined)).toBe(true)
    })

    it('should not match without the cookie or the template', () => {
      const value = 'https://example.com/2503/miasto-i-gmina.html'

      expect(skycmsHandler.match(value, bipHtml, new Headers())).toBe(false)
    })

    it('should not match a site without the feed list', () => {
      const value = 'https://example.com/13206/strefa-przedsiebiorcy.html'

      expect(skycmsHandler.match(value, siteHtml, skycmsHeaders)).toBe(false)
    })

    it('should not match the home page', () => {
      expect(skycmsHandler.match('https://example.com/', bipHtml, skycmsHeaders)).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return empty array for a URL that does not parse', () => {
      expect(skycmsHandler.resolve('https://example.com/')).toEqual([])
    })

    it('should return the page feed', () => {
      const value = 'https://example.com/2503/miasto-i-gmina.html'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://example.com/rss/2503/miasto-i-gmina.html',
          hint: { key: 'skycms:page', label: 'Page', format: 'rss' },
        },
      ]

      expect(skycmsHandler.resolve(value)).toEqual(expected)
    })
  })
})
