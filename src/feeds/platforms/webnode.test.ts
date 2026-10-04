import { describe, expect, it } from 'bun:test'
import { isWebnodeHtml, parseWebnodeUrl, type WebnodeUrl, webnodeHandler } from './webnode.js'

const classicHtml = `
  <meta name="generator" content="Webnode">
  <script
    type="text/javascript"
    src="https://d11bh4d8fhuq47.cloudfront.net/_system/client/js/compressed/frontend.package.1-3-108.js?ph=03275d5974"
  ></script>
`
const webnode2Html = `
  <meta name="generator" content="Webnode 2">
  <link
    rel="icon"
    href="https://duyn491kcolsw.cloudfront.net/files/03/03l/03lww0.svg?ph=1b3b02f8e7"
  >
`

describe('isWebnodeHtml', () => {
  it('should return true for the classic editor client script', () => {
    expect(isWebnodeHtml(classicHtml)).toBe(true)
  })

  it('should return false for a Webnode 2 page', () => {
    expect(isWebnodeHtml(webnode2Html)).toBe(false)
  })

  it('should return false for a script from another host', () => {
    const value = '<script src="https://duyn491kcolsw.cloudfront.net/client/js/app.js"></script>'

    expect(isWebnodeHtml(value)).toBe(false)
  })

  it('should return false for the client script host named in text', () => {
    expect(isWebnodeHtml('<p>https://d11bh4d8fhuq47.cloudfront.net/_system/client/</p>')).toBe(
      false,
    )
  })
})

describe('parseWebnodeUrl', () => {
  it('should return the section for a top-level page', () => {
    const expected: WebnodeUrl = { kind: 'section', section: 'quienes-somos-' }

    expect(parseWebnodeUrl('https://crcesteslu.webnode.es/quienes-somos-/')).toEqual(expected)
  })

  it('should return the last segment for a nested page', () => {
    const expected: WebnodeUrl = { kind: 'section', section: 'associate' }

    expect(parseWebnodeUrl('https://vietnam-concierge.webnode.vn/our-team/associate/')).toEqual(
      expected,
    )
  })

  it('should keep a percent-encoded slug as the page spells it', () => {
    const value =
      'https://paravakkottai.webnode.page/%e0%ae%95%e0%ae%9f%e0%af%8d%e0%ae%9f%e0%af%81%e0%ae%b0%e0%af%88/'
    const expected: WebnodeUrl = {
      kind: 'section',
      section: '%e0%ae%95%e0%ae%9f%e0%af%8d%e0%ae%9f%e0%af%81%e0%ae%b0%e0%af%88',
    }

    expect(parseWebnodeUrl(value)).toEqual(expected)
  })

  it('should return the site for the home page', () => {
    const expected: WebnodeUrl = { kind: 'site' }

    expect(parseWebnodeUrl('https://prisovice.knihovna.cz/')).toEqual(expected)
  })

  it('should return the site for an article', () => {
    const expected: WebnodeUrl = { kind: 'site' }

    expect(parseWebnodeUrl('https://hurbanovohasici.webnode.sk/news/hasic/')).toEqual(expected)
  })

  it('should return the site for a product', () => {
    const expected: WebnodeUrl = { kind: 'site' }

    expect(parseWebnodeUrl('https://www.edumax.cz/products/petra/')).toEqual(expected)
  })

  it('should return the site for an article archive', () => {
    const expected: WebnodeUrl = { kind: 'site' }

    expect(parseWebnodeUrl('https://kurt-knispel.webnode.cz/archive/news/')).toEqual(expected)
  })
})

describe('webnodeHandler', () => {
  describe('match', () => {
    it('should match a classic Webnode page', () => {
      expect(webnodeHandler.match('https://prisovice.knihovna.cz/', classicHtml)).toBe(true)
    })

    it('should not match a Webnode 2 page', () => {
      const value = 'https://davaronline.webnode.page/'
      const headers = new Headers({ server: 'webnode' })

      expect(webnodeHandler.match(value, webnode2Html, headers)).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return the section feed and the site feed on a section page', () => {
      const value = 'https://paravakkottai.webnode.page/blog/'
      const expected = [
        {
          uri: 'https://paravakkottai.webnode.page/rss/blog.xml',
          hint: { key: 'webnode:section', label: 'Section articles' },
        },
        {
          uri: 'https://paravakkottai.webnode.page/rss/all.xml',
          hint: { key: 'webnode:articles', label: 'All articles' },
        },
      ]

      expect(webnodeHandler.resolve(value)).toEqual(expected)
    })

    it('should return the site feed on the home page', () => {
      const value = 'https://prisovice.knihovna.cz/'
      const expected = [
        {
          uri: 'https://prisovice.knihovna.cz/rss/all.xml',
          hint: { key: 'webnode:articles', label: 'All articles' },
        },
      ]

      expect(webnodeHandler.resolve(value)).toEqual(expected)
    })
  })
})
