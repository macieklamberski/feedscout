import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry } from '../../common/types.js'
import { getTypechoPage, isTypechoHtml, type TypechoPage, typechoHandler } from './typecho.js'

const themeHtml = `
  <link
    rel="stylesheet"
    href="https://example.com/usr/themes/default/style.css"
  >
`
const relativeThemeHtml = `
  <link
    rel="apple-touch-icon-precomposed"
    href="/usr/themes/default/img/home.png"
  />
`
const pluginHtml = `
  <script
    type="text/javascript"
    src="https://example.com/usr/plugins/QuietBeautify/assets/js/console.js"
  ></script>
`
const subPathThemeHtml = `
  <link
    rel="stylesheet"
    href="https://example.com/blog/usr/themes/default/style.css"
  >
`
const textHtml = '<p>The theme files live in /usr/themes/default/ on the server.</p>'
const gravHtml = '<link href="/user/themes/quark/css/theme.css">'

describe('isTypechoHtml', () => {
  it('should return true for a theme stylesheet', () => {
    expect(isTypechoHtml(themeHtml)).toBe(true)
  })

  it('should return true for a theme asset linked by a relative path', () => {
    expect(isTypechoHtml(relativeThemeHtml)).toBe(true)
  })

  it('should return true for a plugin script', () => {
    expect(isTypechoHtml(pluginHtml)).toBe(true)
  })

  it('should return false for the path in text', () => {
    expect(isTypechoHtml(textHtml)).toBe(false)
  })

  it('should return false for a Grav theme asset', () => {
    expect(isTypechoHtml(gravHtml)).toBe(false)
  })

  it('should return false for empty content', () => {
    expect(isTypechoHtml('')).toBe(false)
  })
})

describe('getTypechoPage', () => {
  it('should return the home page for the root', () => {
    const expected: TypechoPage = { kind: 'home', siteUrl: 'https://example.com' }

    expect(getTypechoPage('https://example.com/', themeHtml)).toEqual(expected)
  })

  it('should return the home page for home pagination', () => {
    const expected: TypechoPage = { kind: 'home', siteUrl: 'https://example.com' }

    expect(getTypechoPage('https://example.com/page/2/', themeHtml)).toEqual(expected)
  })

  it('should return the home page for home pagination through the script', () => {
    const expected: TypechoPage = { kind: 'home', siteUrl: 'https://example.com' }

    expect(getTypechoPage('https://example.com/index.php/page/2/', themeHtml)).toEqual(expected)
  })

  it('should return the home page for the bare script', () => {
    const expected: TypechoPage = { kind: 'home', siteUrl: 'https://example.com' }

    expect(getTypechoPage('https://example.com/index.php', themeHtml)).toEqual(expected)
  })

  it('should return the path of a post', () => {
    const value = 'https://example.com/archives/burp-sign-me.html'
    const expected: TypechoPage = {
      kind: 'page',
      siteUrl: 'https://example.com',
      path: '/archives/burp-sign-me.html',
    }

    expect(getTypechoPage(value, themeHtml)).toEqual(expected)
  })

  it('should return the path of a page routed through the script', () => {
    const value = 'https://example.com/index.php/archives/13/'
    const expected: TypechoPage = {
      kind: 'page',
      siteUrl: 'https://example.com',
      path: '/archives/13/',
    }

    expect(getTypechoPage(value, themeHtml)).toEqual(expected)
  })

  it('should return the site root of a blog under a sub-path', () => {
    const value = 'https://example.com/blog/category/notes/'
    const expected: TypechoPage = {
      kind: 'page',
      siteUrl: 'https://example.com/blog',
      path: '/category/notes/',
    }

    expect(getTypechoPage(value, subPathThemeHtml)).toEqual(expected)
  })

  it('should return undefined for a page outside the site root', () => {
    expect(getTypechoPage('https://example.com/about', subPathThemeHtml)).toBeUndefined()
  })

  it('should return undefined without a theme or plugin asset', () => {
    expect(getTypechoPage('https://example.com/', textHtml)).toBeUndefined()
  })
})

describe('typechoHandler', () => {
  describe('match', () => {
    it('should match a Typecho page', () => {
      expect(typechoHandler.match('https://example.com/archives/13/', themeHtml)).toBe(true)
    })

    it('should not match a page that mentions the path in text', () => {
      expect(typechoHandler.match('https://example.com/', textHtml)).toBe(false)
    })

    it('should not match without content', () => {
      expect(typechoHandler.match('https://example.com/')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return empty array without a theme or plugin asset', () => {
      expect(typechoHandler.resolve('https://example.com/', textHtml)).toEqual([])
    })

    it('should return the posts feeds for the home page', () => {
      const value = 'https://example.com/'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: ['https://example.com/feed/', 'https://example.com/index.php/feed/'],
          hint: { key: 'typecho:posts', label: 'Posts', format: 'rss' },
        },
        {
          uri: ['https://example.com/feed/rss/', 'https://example.com/index.php/feed/rss/'],
          hint: { key: 'typecho:posts', label: 'Posts', format: 'rdf' },
        },
        {
          uri: ['https://example.com/feed/atom/', 'https://example.com/index.php/feed/atom/'],
          hint: { key: 'typecho:posts', label: 'Posts', format: 'atom' },
        },
        {
          uri: [
            'https://example.com/feed/comments/',
            'https://example.com/index.php/feed/comments/',
          ],
          hint: { key: 'typecho:comments', label: 'Comments', format: 'rss' },
        },
        {
          uri: [
            'https://example.com/feed/rss/comments/',
            'https://example.com/index.php/feed/rss/comments/',
          ],
          hint: { key: 'typecho:comments', label: 'Comments', format: 'rdf' },
        },
        {
          uri: [
            'https://example.com/feed/atom/comments/',
            'https://example.com/index.php/feed/atom/comments/',
          ],
          hint: { key: 'typecho:comments', label: 'Comments', format: 'atom' },
        },
      ]

      expect(typechoHandler.resolve(value, themeHtml)).toEqual(expected)
    })

    it('should return the page feeds before the posts feeds', () => {
      const value = 'https://example.com/blog/index.php/archives/13/'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: [
            'https://example.com/blog/feed/archives/13/',
            'https://example.com/blog/index.php/feed/archives/13/',
          ],
          hint: { key: 'typecho:page', label: 'Page', format: 'rss' },
        },
        {
          uri: [
            'https://example.com/blog/feed/rss/archives/13/',
            'https://example.com/blog/index.php/feed/rss/archives/13/',
          ],
          hint: { key: 'typecho:page', label: 'Page', format: 'rdf' },
        },
        {
          uri: [
            'https://example.com/blog/feed/atom/archives/13/',
            'https://example.com/blog/index.php/feed/atom/archives/13/',
          ],
          hint: { key: 'typecho:page', label: 'Page', format: 'atom' },
        },
        {
          uri: ['https://example.com/blog/feed/', 'https://example.com/blog/index.php/feed/'],
          hint: { key: 'typecho:posts', label: 'Posts', format: 'rss' },
        },
        {
          uri: [
            'https://example.com/blog/feed/rss/',
            'https://example.com/blog/index.php/feed/rss/',
          ],
          hint: { key: 'typecho:posts', label: 'Posts', format: 'rdf' },
        },
        {
          uri: [
            'https://example.com/blog/feed/atom/',
            'https://example.com/blog/index.php/feed/atom/',
          ],
          hint: { key: 'typecho:posts', label: 'Posts', format: 'atom' },
        },
        {
          uri: [
            'https://example.com/blog/feed/comments/',
            'https://example.com/blog/index.php/feed/comments/',
          ],
          hint: { key: 'typecho:comments', label: 'Comments', format: 'rss' },
        },
        {
          uri: [
            'https://example.com/blog/feed/rss/comments/',
            'https://example.com/blog/index.php/feed/rss/comments/',
          ],
          hint: { key: 'typecho:comments', label: 'Comments', format: 'rdf' },
        },
        {
          uri: [
            'https://example.com/blog/feed/atom/comments/',
            'https://example.com/blog/index.php/feed/atom/comments/',
          ],
          hint: { key: 'typecho:comments', label: 'Comments', format: 'atom' },
        },
      ]

      expect(typechoHandler.resolve(value, subPathThemeHtml)).toEqual(expected)
    })
  })
})
