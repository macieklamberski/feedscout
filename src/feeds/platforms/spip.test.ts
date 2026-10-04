import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry } from '../../common/types.js'
import { getSpipPage, isSpipHeaders, type SpipPage, spipHandler } from './spip.js'

const spipHeaders = new Headers({
  'composed-by': 'SPIP 4.4.25 @ www.spip.net + https://example.com/local/config.txt',
  'x-spip-cache': '86400',
})
const otherHeaders = new Headers({ 'x-powered-by': 'PHP/8.2.29' })
const baseHtml = `
  <head>
    <base href="https://example.com/">
  </head>
`

describe('isSpipHeaders', () => {
  it('should return true for the Composed-By header', () => {
    const value = new Headers({ 'composed-by': 'SPIP 2.1.29 @ www.spip.net' })

    expect(isSpipHeaders(value)).toBe(true)
  })

  it('should return true for the Composed-By header without a version', () => {
    const value = new Headers({ 'composed-by': 'SPIP @ www.spip.net' })

    expect(isSpipHeaders(value)).toBe(true)
  })

  it('should return true for the cache header alone', () => {
    const value = new Headers({ 'x-spip-cache': '86400' })

    expect(isSpipHeaders(value)).toBe(true)
  })

  it('should return false for a Composed-By header naming other software', () => {
    const value = new Headers({ 'composed-by': 'Example CMS' })

    expect(isSpipHeaders(value)).toBe(false)
  })

  it('should return false for other software', () => {
    expect(isSpipHeaders(otherHeaders)).toBe(false)
  })
})

describe('getSpipPage', () => {
  it('should return the article of a page URL', () => {
    const expected: SpipPage = {
      kind: 'article',
      scriptUrl: 'https://example.com/spip.php',
      id: '869',
    }

    expect(getSpipPage('https://example.com/spip.php?article869', undefined)).toEqual(expected)
  })

  it('should return the article of a page URL with a language', () => {
    const expected: SpipPage = {
      kind: 'article',
      scriptUrl: 'https://example.com/spip.php',
      id: '807',
    }

    expect(getSpipPage('https://example.com/spip.php?article807&lang=es', undefined)).toEqual(
      expected,
    )
  })

  it('should return the section of a page URL', () => {
    const expected: SpipPage = {
      kind: 'rubrique',
      scriptUrl: 'https://example.com/spip.php',
      id: '1',
    }

    expect(getSpipPage('https://example.com/spip.php?rubrique1', undefined)).toEqual(expected)
  })

  it('should return the keyword of a page URL', () => {
    const expected: SpipPage = { kind: 'mot', scriptUrl: 'https://example.com/spip.php', id: '70' }

    expect(getSpipPage('https://example.com/spip.php?mot70', undefined)).toEqual(expected)
  })

  it('should return the author of a page URL', () => {
    const expected: SpipPage = {
      kind: 'auteur',
      scriptUrl: 'https://example.com/spip.php',
      id: '413',
    }

    expect(getSpipPage('https://example.com/spip.php?auteur413', undefined)).toEqual(expected)
  })

  it('should return the article of an html URL', () => {
    const expected: SpipPage = {
      kind: 'article',
      scriptUrl: 'https://example.com/spip.php',
      id: '12',
    }

    expect(getSpipPage('https://example.com/article12.html', undefined)).toEqual(expected)
  })

  it('should return the article of a template URL', () => {
    const value = 'https://example.com/spip.php?page=article&id_article=25'
    const expected: SpipPage = {
      kind: 'article',
      scriptUrl: 'https://example.com/spip.php',
      id: '25',
    }

    expect(getSpipPage(value, undefined)).toEqual(expected)
  })

  it('should return the article of a page URL with a capitalised route word', () => {
    const expected: SpipPage = {
      kind: 'article',
      scriptUrl: 'https://example.com/spip.php',
      id: '869',
    }

    expect(getSpipPage('https://example.com/spip.php?Article869', undefined)).toEqual(expected)
  })

  it('should return the script of a site under a sub-path', () => {
    const expected: SpipPage = {
      kind: 'rubrique',
      scriptUrl: 'https://example.com/spip/spip.php',
      id: '14',
    }

    expect(getSpipPage('https://example.com/spip/spip.php?rubrique14', undefined)).toEqual(expected)
  })

  it('should return the home page for a rewritten URL', () => {
    const value = 'https://example.com/legitime-defense-pour-les-forces-de-l-ordre'
    const expected: SpipPage = { kind: 'home', scriptUrl: 'https://example.com/spip.php' }

    expect(getSpipPage(value, undefined)).toEqual(expected)
  })

  it('should return the home page for a not-found page', () => {
    const value = 'https://example.com/spip.php?rubrique99999'
    const content = '<html class="page_404 sans_composition ltr fr"><body></body></html>'
    const expected: SpipPage = { kind: 'home', scriptUrl: 'https://example.com/spip.php' }

    expect(getSpipPage(value, content)).toEqual(expected)
  })

  it('should return the section of a page whose class only contains the not-found word', () => {
    const value = 'https://example.com/spip.php?rubrique17'
    const content = '<html class="page_4040 ltr fr"><body></body></html>'
    const expected: SpipPage = {
      kind: 'rubrique',
      scriptUrl: 'https://example.com/spip.php',
      id: '17',
    }

    expect(getSpipPage(value, content)).toEqual(expected)
  })

  it('should return the home page for a slug ending in a route word and digits', () => {
    const expected: SpipPage = { kind: 'home', scriptUrl: 'https://example.com/spip.php' }

    expect(getSpipPage('https://example.com/Article2024', undefined)).toEqual(expected)
  })

  it('should return the home page for a template URL without an id', () => {
    const expected: SpipPage = { kind: 'home', scriptUrl: 'https://example.com/spip.php' }

    expect(getSpipPage('https://example.com/spip.php?page=article', undefined)).toEqual(expected)
  })

  it('should return the home page for a template URL with a wrong-case template', () => {
    const value = 'https://example.com/spip.php?page=Article&id_article=25'
    const expected: SpipPage = { kind: 'home', scriptUrl: 'https://example.com/spip.php' }

    expect(getSpipPage(value, undefined)).toEqual(expected)
  })

  it('should return the home page for a template URL with a non-numeric id', () => {
    const value = 'https://example.com/spip.php?page=article&id_article=abc'
    const expected: SpipPage = { kind: 'home', scriptUrl: 'https://example.com/spip.php' }

    expect(getSpipPage(value, undefined)).toEqual(expected)
  })

  it('should return the script at the base href of a rewritten URL with folders', () => {
    const value = 'https://example.com/la-bas-magazine/au-fil-de-la-bas/tous-nos-articles-sur-gaza'
    const expected: SpipPage = { kind: 'home', scriptUrl: 'https://example.com/spip.php' }

    expect(getSpipPage(value, baseHtml)).toEqual(expected)
  })

  it('should return the script beside a rewritten URL with no base href', () => {
    const expected: SpipPage = { kind: 'home', scriptUrl: 'https://example.com/spip/spip.php' }

    expect(getSpipPage('https://example.com/spip/Some-Title', undefined)).toEqual(expected)
  })

  it('should return undefined for an unparsable URL', () => {
    expect(getSpipPage('not-a-url', undefined)).toBeUndefined()
  })
})

describe('spipHandler', () => {
  describe('match', () => {
    it('should match a SPIP page', () => {
      expect(spipHandler.match('https://example.com/spip.php?article869', '', spipHeaders)).toBe(
        true,
      )
    })

    it('should not match without headers', () => {
      expect(spipHandler.match('https://example.com/spip.php?article869', '')).toBe(false)
    })

    it('should not match other software', () => {
      expect(spipHandler.match('https://example.com/spip.php?article869', '', otherHeaders)).toBe(
        false,
      )
    })
  })

  describe('resolve', () => {
    it('should return empty array for a URL that does not parse', () => {
      expect(spipHandler.resolve('not-a-url')).toEqual([])
    })

    it('should return the comment and site feeds for an article', () => {
      const value = 'https://example.com/spip.php?article869'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://example.com/spip.php?page=comments-rss&id_article=869',
          hint: { key: 'spip:article-comments', label: 'Article comments' },
        },
        {
          uri: 'https://example.com/spip.php?page=backend',
          hint: { key: 'spip:articles', label: 'Articles' },
        },
      ]

      expect(spipHandler.resolve(value)).toEqual(expected)
    })

    it('should return the section and site feeds for a section', () => {
      const value = 'https://example.com/spip.php?rubrique1'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://example.com/spip.php?page=backend&id_rubrique=1',
          hint: { key: 'spip:section', label: 'Section' },
        },
        {
          uri: 'https://example.com/spip.php?page=backend',
          hint: { key: 'spip:articles', label: 'Articles' },
        },
      ]

      expect(spipHandler.resolve(value)).toEqual(expected)
    })

    it('should return the keyword and site feeds for a keyword', () => {
      const value = 'https://example.com/spip.php?mot70'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://example.com/spip.php?page=backend&id_mot=70',
          hint: { key: 'spip:keyword', label: 'Keyword' },
        },
        {
          uri: 'https://example.com/spip.php?page=backend',
          hint: { key: 'spip:articles', label: 'Articles' },
        },
      ]

      expect(spipHandler.resolve(value)).toEqual(expected)
    })

    it('should return the author and site feeds for an author', () => {
      const value = 'https://example.com/spip.php?auteur413'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://example.com/spip.php?page=backend&id_auteur=413',
          hint: { key: 'spip:author', label: 'Author' },
        },
        {
          uri: 'https://example.com/spip.php?page=backend',
          hint: { key: 'spip:articles', label: 'Articles' },
        },
      ]

      expect(spipHandler.resolve(value)).toEqual(expected)
    })

    it('should return the site feed for the home page', () => {
      const value = 'https://example.com/spip/'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://example.com/spip/spip.php?page=backend',
          hint: { key: 'spip:articles', label: 'Articles' },
        },
      ]

      expect(spipHandler.resolve(value)).toEqual(expected)
    })
  })
})
