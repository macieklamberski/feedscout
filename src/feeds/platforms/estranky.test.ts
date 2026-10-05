import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry } from '../../common/types.js'
import { type EstrankyUrl, estrankyHandler, isEstrankyHtml, parseEstrankyUrl } from './estranky.js'

const customDomainPage = `
  <link
    rel="stylesheet"
    href="https://s3a.estranky.cz/css/d1000000011.css?nc=1910677575"
    type="text/css"
  />
  <script
    type="text/javascript"
    src="https://s3c.estranky.cz/js/ui.js?nc=1"
    id="index_script"
  ></script>
`

describe('isEstrankyHtml', () => {
  it('should return true for a page loading the estranky.cz assets', () => {
    expect(isEstrankyHtml(customDomainPage)).toBe(true)
  })

  it('should return true for a page loading only the estranky.sk script', () => {
    const value = '<script src="https://s3c.estranky.sk/js/ui.js?nc=1"></script>'

    expect(isEstrankyHtml(value)).toBe(true)
  })

  it('should return true for a page loading the eoldal.hu assets', () => {
    const value = `
      <link
        rel="stylesheet"
        href="https://s3a.eoldal.hu/css/d1000000021.css?nc=421749158"
        type="text/css"
      />
      <script
        type="text/javascript"
        src="https://s3c.eoldal.hu/js/ui.js?nc=1"
        id="index_script"
      ></script>
    `

    expect(isEstrankyHtml(value)).toBe(true)
  })

  it('should return false for a saved copy loading the eoldal.hu assets by a relative path', () => {
    const value = `
      <link
        rel="stylesheet"
        href="s3a.eoldal.hu/css/d1000000024e444.css?nc=1551285673"
        type="text/css"
      />
      <script
        type="text/javascript"
        src="s3c.eoldal.hu/js/uia1a0.js?nc=1"
      ></script>
    `

    expect(isEstrankyHtml(value)).toBe(false)
  })

  it('should return false for a page linking the Estranky home page', () => {
    const value = '<a href="https://www.estranky.cz/">Estránky.cz</a>'

    expect(isEstrankyHtml(value)).toBe(false)
  })

  it('should return false for a page with an image from the asset host', () => {
    const value = '<img src="https://s3a.estranky.cz/img/logo.png">'

    expect(isEstrankyHtml(value)).toBe(false)
  })
})

describe('parseEstrankyUrl', () => {
  it('should return the site for an estranky.cz subdomain', () => {
    const expected: EstrankyUrl = { kind: 'site' }

    expect(parseEstrankyUrl('https://example.estranky.cz/')).toEqual(expected)
  })

  it('should return the site for an estranky.sk subdomain', () => {
    const expected: EstrankyUrl = { kind: 'site' }

    expect(parseEstrankyUrl('https://example.estranky.sk/')).toEqual(expected)
  })

  it('should return the site for a www-prefixed site host', () => {
    const expected: EstrankyUrl = { kind: 'site' }

    expect(parseEstrankyUrl('http://www.example.estranky.cz/')).toEqual(expected)
  })

  it('should return the site for an article page', () => {
    const expected: EstrankyUrl = { kind: 'site' }

    expect(parseEstrankyUrl('https://example.estranky.cz/clanky/fkd-a/zapas.html')).toEqual(
      expected,
    )
  })

  it('should return undefined for the platform host', () => {
    expect(parseEstrankyUrl('https://www.estranky.cz/')).toBeUndefined()
  })

  it('should return undefined for the site directory', () => {
    expect(parseEstrankyUrl('https://katalog.estranky.cz/')).toBeUndefined()
  })

  it('should return undefined for the help hosts', () => {
    expect(parseEstrankyUrl('https://napoveda.estranky.cz/')).toBeUndefined()
    expect(parseEstrankyUrl('https://nova-napoveda.estranky.cz/')).toBeUndefined()
  })

  it('should return undefined for the apex domain', () => {
    expect(parseEstrankyUrl('https://estranky.sk/')).toBeUndefined()
  })

  it('should return the site for a custom domain', () => {
    const expected: EstrankyUrl = { kind: 'site' }

    expect(parseEstrankyUrl('https://www.example.com/clanky/aktuality/')).toEqual(expected)
  })
})

describe('estrankyHandler', () => {
  describe('match', () => {
    it('should return true for a site page', () => {
      expect(estrankyHandler.match('https://example.estranky.cz/fotoalbum/')).toBe(true)
    })

    it('should return true for a custom domain loading the Estranky assets', () => {
      expect(estrankyHandler.match('https://www.example.com/', customDomainPage)).toBe(true)
    })

    it('should return false for a custom domain without the Estranky assets', () => {
      expect(estrankyHandler.match('https://www.example.com/', '<html></html>')).toBe(false)
    })

    it('should return false for the site directory loading the Estranky assets', () => {
      expect(estrankyHandler.match('https://katalog.estranky.cz/', customDomainPage)).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return the site feeds', () => {
      const value = 'https://example.estranky.sk/clanky/fkd-a/'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://example.estranky.sk/rss/articles/data.xml',
          hint: { key: 'estranky:posts', label: 'Posts' },
        },
        {
          uri: 'https://example.estranky.sk/rss/photos/data.xml',
          hint: { key: 'estranky:photos', label: 'Photos' },
        },
        {
          uri: 'https://example.estranky.sk/rss/comments/data.xml',
          hint: { key: 'estranky:comments', label: 'Comments' },
        },
        {
          uri: 'https://example.estranky.sk/rss/slices/l/homepage/data.xml',
          hint: { key: 'estranky:homepage-slice', label: 'Home page (Web Slice)' },
        },
        {
          uri: 'https://example.estranky.sk/rss/slices/l/photos/data.xml',
          hint: { key: 'estranky:photos-slice', label: 'Photo album (Web Slice)' },
        },
      ]

      expect(estrankyHandler.resolve(value)).toEqual(expected)
    })

    it('should return the site feeds on a custom domain', () => {
      const value = 'https://www.example.com/fotoalbum/'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://www.example.com/rss/articles/data.xml',
          hint: { key: 'estranky:posts', label: 'Posts' },
        },
        {
          uri: 'https://www.example.com/rss/photos/data.xml',
          hint: { key: 'estranky:photos', label: 'Photos' },
        },
        {
          uri: 'https://www.example.com/rss/comments/data.xml',
          hint: { key: 'estranky:comments', label: 'Comments' },
        },
        {
          uri: 'https://www.example.com/rss/slices/l/homepage/data.xml',
          hint: { key: 'estranky:homepage-slice', label: 'Home page (Web Slice)' },
        },
        {
          uri: 'https://www.example.com/rss/slices/l/photos/data.xml',
          hint: { key: 'estranky:photos-slice', label: 'Photo album (Web Slice)' },
        },
      ]

      expect(estrankyHandler.resolve(value, customDomainPage)).toEqual(expected)
    })

    it('should return the slice feeds on the subdomain the page links', () => {
      const value = 'https://www.example.com/'
      const content = `
        <a
          rel="feedurl"
          href="https://example.estranky.sk/rss/slices/l/homepage/data.xml"
        >
      `
      const expected = [
        {
          uri: 'https://www.example.com/rss/articles/data.xml',
          hint: { key: 'estranky:posts', label: 'Posts' },
        },
        {
          uri: 'https://www.example.com/rss/photos/data.xml',
          hint: { key: 'estranky:photos', label: 'Photos' },
        },
        {
          uri: 'https://www.example.com/rss/comments/data.xml',
          hint: { key: 'estranky:comments', label: 'Comments' },
        },
        {
          uri: 'https://example.estranky.sk/rss/slices/l/homepage/data.xml',
          hint: { key: 'estranky:homepage-slice', label: 'Home page (Web Slice)' },
        },
        {
          uri: 'https://example.estranky.sk/rss/slices/l/photos/data.xml',
          hint: { key: 'estranky:photos-slice', label: 'Photo album (Web Slice)' },
        },
      ]

      expect(estrankyHandler.resolve(value, content)).toEqual(expected)
    })

    it('should ignore a slice link outside the Estranky domains', () => {
      const value = 'https://www.example.com/'
      const content = `
        <a
          rel="feedurl"
          href="https://www.example.org/rss/slices/l/homepage/data.xml"
        >
      `
      const expected = [
        {
          uri: 'https://www.example.com/rss/articles/data.xml',
          hint: { key: 'estranky:posts', label: 'Posts' },
        },
        {
          uri: 'https://www.example.com/rss/photos/data.xml',
          hint: { key: 'estranky:photos', label: 'Photos' },
        },
        {
          uri: 'https://www.example.com/rss/comments/data.xml',
          hint: { key: 'estranky:comments', label: 'Comments' },
        },
        {
          uri: 'https://www.example.com/rss/slices/l/homepage/data.xml',
          hint: { key: 'estranky:homepage-slice', label: 'Home page (Web Slice)' },
        },
        {
          uri: 'https://www.example.com/rss/slices/l/photos/data.xml',
          hint: { key: 'estranky:photos-slice', label: 'Photo album (Web Slice)' },
        },
      ]

      expect(estrankyHandler.resolve(value, content)).toEqual(expected)
    })

    it('should keep the slice feeds on the origin of an eOldal page', () => {
      const value = 'https://www.example.com/'
      const content = `
        <a
          rel="feedurl"
          href="https://example.eoldal.hu/rss/slices/l/homepage/data.xml"
        >
      `
      const expected = [
        {
          uri: 'https://www.example.com/rss/articles/data.xml',
          hint: { key: 'estranky:posts', label: 'Posts' },
        },
        {
          uri: 'https://www.example.com/rss/photos/data.xml',
          hint: { key: 'estranky:photos', label: 'Photos' },
        },
        {
          uri: 'https://www.example.com/rss/comments/data.xml',
          hint: { key: 'estranky:comments', label: 'Comments' },
        },
        {
          uri: 'https://www.example.com/rss/slices/l/homepage/data.xml',
          hint: { key: 'estranky:homepage-slice', label: 'Home page (Web Slice)' },
        },
        {
          uri: 'https://www.example.com/rss/slices/l/photos/data.xml',
          hint: { key: 'estranky:photos-slice', label: 'Photo album (Web Slice)' },
        },
      ]

      expect(estrankyHandler.resolve(value, content)).toEqual(expected)
    })

    it('should ignore an Estranky link that is not the slice link', () => {
      const value = 'https://www.example.com/'
      const content = `
        <a href="http://www.estranky.sk/">Estranky</a>
        <a
          rel="feedurl"
          href="https://example.estranky.sk/rss/slices/l/homepage/data.xml"
        >
      `
      const expected = [
        {
          uri: 'https://www.example.com/rss/articles/data.xml',
          hint: { key: 'estranky:posts', label: 'Posts' },
        },
        {
          uri: 'https://www.example.com/rss/photos/data.xml',
          hint: { key: 'estranky:photos', label: 'Photos' },
        },
        {
          uri: 'https://www.example.com/rss/comments/data.xml',
          hint: { key: 'estranky:comments', label: 'Comments' },
        },
        {
          uri: 'https://example.estranky.sk/rss/slices/l/homepage/data.xml',
          hint: { key: 'estranky:homepage-slice', label: 'Home page (Web Slice)' },
        },
        {
          uri: 'https://example.estranky.sk/rss/slices/l/photos/data.xml',
          hint: { key: 'estranky:photos-slice', label: 'Photo album (Web Slice)' },
        },
      ]

      expect(estrankyHandler.resolve(value, content)).toEqual(expected)
    })
  })
})
