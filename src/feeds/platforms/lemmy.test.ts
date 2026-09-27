import { describe, expect, it } from 'bun:test'
import type { LemmyUrl } from './lemmy.js'
import { isLemmyHeaders, isLemmyHtml, lemmyHandler, parseLemmyUrl } from './lemmy.js'

const lemmyHtml = '<html><head><meta name="generator" content="Lemmy v0.19.5"></head></html>'
const lemmyHeaders = new Headers({ 'x-powered-by': 'Lemmy' })

describe('parseLemmyUrl', () => {
  it('should return the community for a community page', () => {
    const expected: LemmyUrl = { kind: 'community', community: 'programming' }

    expect(parseLemmyUrl('https://example.com/c/programming')).toEqual(expected)
  })

  it('should return the community for a community subpage', () => {
    const expected: LemmyUrl = { kind: 'community', community: 'programming' }

    expect(parseLemmyUrl('https://example.com/c/programming/hot')).toEqual(expected)
  })

  it('should return a federated community with its instance', () => {
    const expected: LemmyUrl = { kind: 'community', community: 'rust@example.net' }

    expect(parseLemmyUrl('https://example.com/c/rust@example.net')).toEqual(expected)
  })

  it('should return the user for a user page', () => {
    const expected: LemmyUrl = { kind: 'user', username: 'alice' }

    expect(parseLemmyUrl('https://example.com/u/alice')).toEqual(expected)
  })

  it('should return the user for a user subpage', () => {
    const expected: LemmyUrl = { kind: 'user', username: 'alice' }

    expect(parseLemmyUrl('https://example.com/u/alice/posts')).toEqual(expected)
  })

  it('should return a federated user with its instance', () => {
    const expected: LemmyUrl = { kind: 'user', username: 'alice@example.net' }

    expect(parseLemmyUrl('https://example.com/u/alice@example.net')).toEqual(expected)
  })

  it('should return the community on any host', () => {
    const expected: LemmyUrl = { kind: 'community', community: 'worldnews' }

    expect(parseLemmyUrl('https://example.org/c/worldnews')).toEqual(expected)
  })

  it('should return undefined for a prefix without a name', () => {
    expect(parseLemmyUrl('https://example.com/c')).toBeUndefined()
    expect(parseLemmyUrl('https://example.com/c/')).toBeUndefined()
    expect(parseLemmyUrl('https://example.com/u')).toBeUndefined()
    expect(parseLemmyUrl('https://example.com/u/')).toBeUndefined()
  })

  it('should return the community for a capitalized prefix', () => {
    const expected: LemmyUrl = { kind: 'community', community: 'programming' }

    expect(parseLemmyUrl('https://example.com/C/programming')).toEqual(expected)
  })

  it('should return the user for a capitalized prefix', () => {
    const expected: LemmyUrl = { kind: 'user', username: 'alice' }

    expect(parseLemmyUrl('https://example.com/U/alice')).toEqual(expected)
  })

  it('should return undefined for the home page', () => {
    expect(parseLemmyUrl('https://example.com/')).toBeUndefined()
  })

  it('should return undefined for other paths', () => {
    expect(parseLemmyUrl('https://example.com/about')).toBeUndefined()
    expect(parseLemmyUrl('https://example.com/post/123')).toBeUndefined()
  })

  it('should return undefined for an invalid URL', () => {
    expect(parseLemmyUrl('not-a-url')).toBeUndefined()
  })
})

describe('isLemmyHtml', () => {
  it('should return true for Lemmy generator meta tag', () => {
    expect(isLemmyHtml('<meta name="generator" content="Lemmy v0.19.5">')).toBe(true)
    expect(isLemmyHtml('<meta name="generator" content="Lemmy">')).toBe(true)
  })

  it('should return true regardless of attribute order', () => {
    expect(isLemmyHtml('<meta content="Lemmy v0.19.5" name="generator">')).toBe(true)
  })

  it('should return true when embedded in full HTML', () => {
    expect(isLemmyHtml(lemmyHtml)).toBe(true)
  })

  it('should return true for the lemmy-site app root without generator meta', () => {
    expect(isLemmyHtml('<body><div class="lemmy-site" id="app"></div></body>')).toBe(true)
  })

  it('should return true for the lemmy-site app root with another class', () => {
    expect(isLemmyHtml('<body><div class="lemmy-site dark"></div></body>')).toBe(true)
  })

  it('should return false for a lemmy-site substring outside a class attribute', () => {
    expect(isLemmyHtml('<a href="#/#lemmy-space:example.org">room</a>')).toBe(false)
    expect(isLemmyHtml('<p>class lemmy-site</p>')).toBe(false)
  })

  it('should return false for non-Lemmy generator values', () => {
    expect(isLemmyHtml('<meta name="generator" content="Mastodon v4.2.0">')).toBe(false)
    expect(isLemmyHtml('<meta name="generator" content="WordPress 6.4">')).toBe(false)
  })

  it('should return false for empty content', () => {
    expect(isLemmyHtml('')).toBe(false)
  })
})

describe('isLemmyHeaders', () => {
  it('should return true for x-powered-by: Lemmy header', () => {
    expect(isLemmyHeaders(new Headers({ 'x-powered-by': 'Lemmy' }))).toBe(true)
  })

  it('should return true case-insensitively', () => {
    expect(isLemmyHeaders(new Headers({ 'x-powered-by': 'lemmy' }))).toBe(true)
    expect(isLemmyHeaders(new Headers({ 'x-powered-by': 'LEMMY' }))).toBe(true)
  })

  it('should return false when header is absent', () => {
    expect(isLemmyHeaders(new Headers())).toBe(false)
    expect(isLemmyHeaders(new Headers({ server: 'nginx' }))).toBe(false)
  })

  it('should return false for non-Lemmy x-powered-by values', () => {
    expect(isLemmyHeaders(new Headers({ 'x-powered-by': 'Express' }))).toBe(false)
  })
})

describe('lemmyHandler', () => {
  describe('match', () => {
    it('should match community path with Lemmy HTML', () => {
      expect(lemmyHandler.match('https://example.com/c/programming', lemmyHtml)).toBe(true)
    })

    it('should match the home page with Lemmy HTML', () => {
      expect(lemmyHandler.match('https://example.com/', lemmyHtml)).toBe(true)
    })

    it('should not match the retired /home path', () => {
      expect(lemmyHandler.match('https://example.com/home', lemmyHtml)).toBe(false)
    })

    it('should match community path with Lemmy server header', () => {
      expect(lemmyHandler.match('https://example.com/c/programming', '', lemmyHeaders)).toBe(true)
    })

    it('should not match without content or headers', () => {
      expect(lemmyHandler.match('https://example.com/c/programming')).toBe(false)
    })

    it('should not match non-community, non-user, non-home paths even with Lemmy HTML', () => {
      expect(lemmyHandler.match('https://example.com/about', lemmyHtml)).toBe(false)
    })

    it('should not match without Lemmy signals', () => {
      const plainHtml = '<html><head></head></html>'

      expect(lemmyHandler.match('https://example.com/c/programming', plainHtml)).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return community feed URL', () => {
      const value = 'https://example.com/c/programming'
      const expected = [
        {
          uri: 'https://example.com/feeds/c/programming.xml',
          hint: { key: 'lemmy:community', label: 'Community' },
        },
      ]

      expect(lemmyHandler.resolve(value)).toEqual(expected)
    })

    it('should return user feed URL', () => {
      const value = 'https://example.com/u/alice'
      const expected = [
        {
          uri: 'https://example.com/feeds/u/alice.xml',
          hint: { key: 'lemmy:user', label: 'User' },
        },
      ]

      expect(lemmyHandler.resolve(value)).toEqual(expected)
    })

    it('should preserve the instance origin', () => {
      const value = 'https://example.org/c/worldnews'
      const expected = [
        {
          uri: 'https://example.org/feeds/c/worldnews.xml',
          hint: { key: 'lemmy:community', label: 'Community' },
        },
      ]

      expect(lemmyHandler.resolve(value)).toEqual(expected)
    })

    it('should return site-wide feeds for home path', () => {
      const value = 'https://example.com/'
      const expected = [
        {
          uri: 'https://example.com/feeds/all.xml',
          hint: { key: 'lemmy:all', label: 'All' },
        },
        {
          uri: 'https://example.com/feeds/local.xml',
          hint: { key: 'lemmy:local', label: 'Local' },
        },
      ]

      expect(lemmyHandler.resolve(value)).toEqual(expected)
    })

    it('should forward ?sort= on community feed', () => {
      const value = 'https://example.com/c/programming?sort=TopWeek'
      const expected = [
        {
          uri: 'https://example.com/feeds/c/programming.xml?sort=TopWeek',
          hint: { key: 'lemmy:community', label: 'Community' },
        },
      ]

      expect(lemmyHandler.resolve(value)).toEqual(expected)
    })

    it('should forward ?sort= on user feed', () => {
      const value = 'https://example.com/u/alice?sort=New'
      const expected = [
        {
          uri: 'https://example.com/feeds/u/alice.xml?sort=New',
          hint: { key: 'lemmy:user', label: 'User' },
        },
      ]

      expect(lemmyHandler.resolve(value)).toEqual(expected)
    })

    it('should forward ?sort= on home feeds', () => {
      const value = 'https://example.com/?sort=Active'
      const expected = [
        {
          uri: 'https://example.com/feeds/all.xml?sort=Active',
          hint: { key: 'lemmy:all', label: 'All' },
        },
        {
          uri: 'https://example.com/feeds/local.xml?sort=Active',
          hint: { key: 'lemmy:local', label: 'Local' },
        },
      ]

      expect(lemmyHandler.resolve(value)).toEqual(expected)
    })

    it('should take the sort the home page advertises', () => {
      const value = 'https://example.com/'
      const content = `
        <link
          rel="alternate"
          type="application/atom+xml"
          href="/feeds/local.xml?sort=Active"
        >
      `
      const expected = [
        {
          uri: 'https://example.com/feeds/all.xml?sort=Active',
          hint: { key: 'lemmy:all', label: 'All' },
        },
        {
          uri: 'https://example.com/feeds/local.xml?sort=Active',
          hint: { key: 'lemmy:local', label: 'Local' },
        },
      ]

      expect(lemmyHandler.resolve(value, content)).toEqual(expected)
    })

    it('should prefer the ?sort= of the page URL over the advertised sort', () => {
      const value = 'https://example.com/c/programming?sort=New'
      const content = `
        <link
          rel="alternate"
          type="application/atom+xml"
          href="/feeds/c/programming.xml?sort=Active"
        >
      `
      const expected = [
        {
          uri: 'https://example.com/feeds/c/programming.xml?sort=New',
          hint: { key: 'lemmy:community', label: 'Community' },
        },
      ]

      expect(lemmyHandler.resolve(value, content)).toEqual(expected)
    })

    it('should take the advertised sort when the page URL sort is unknown', () => {
      const value = 'https://example.com/?sort=bogus'
      const content = `
        <link
          rel="alternate"
          type="application/atom+xml"
          href="/feeds/local.xml?sort=Active"
        >
      `
      const expected = [
        {
          uri: 'https://example.com/feeds/all.xml?sort=Active',
          hint: { key: 'lemmy:all', label: 'All' },
        },
        {
          uri: 'https://example.com/feeds/local.xml?sort=Active',
          hint: { key: 'lemmy:local', label: 'Local' },
        },
      ]

      expect(lemmyHandler.resolve(value, content)).toEqual(expected)
    })

    it('should take the advertised sort when the page URL sort has the wrong case', () => {
      const value = 'https://example.com/?sort=hot'
      const content = `
        <link
          rel="alternate"
          type="application/atom+xml"
          href="/feeds/local.xml?sort=Active"
        >
      `
      const expected = [
        {
          uri: 'https://example.com/feeds/all.xml?sort=Active',
          hint: { key: 'lemmy:all', label: 'All' },
        },
        {
          uri: 'https://example.com/feeds/local.xml?sort=Active',
          hint: { key: 'lemmy:local', label: 'Local' },
        },
      ]

      expect(lemmyHandler.resolve(value, content)).toEqual(expected)
    })

    it('should drop an unknown advertised sort', () => {
      const value = 'https://example.com/c/programming'
      const content = `
        <link
          rel="alternate"
          type="application/atom+xml"
          href="/feeds/c/programming.xml?sort=bogus"
        >
      `
      const expected = [
        {
          uri: 'https://example.com/feeds/c/programming.xml',
          hint: { key: 'lemmy:community', label: 'Community' },
        },
      ]

      expect(lemmyHandler.resolve(value, content)).toEqual(expected)
    })

    it('should drop unknown ?sort= values', () => {
      const value = 'https://example.com/c/programming?sort=garbage'
      const expected = [
        {
          uri: 'https://example.com/feeds/c/programming.xml',
          hint: { key: 'lemmy:community', label: 'Community' },
        },
      ]

      expect(lemmyHandler.resolve(value)).toEqual(expected)
    })

    it('should accept extended sort values', () => {
      const value = 'https://example.com/c/programming?sort=Controversial'
      const expected = [
        {
          uri: 'https://example.com/feeds/c/programming.xml?sort=Controversial',
          hint: { key: 'lemmy:community', label: 'Community' },
        },
      ]

      expect(lemmyHandler.resolve(value)).toEqual(expected)
    })

    it('should pass through numeric ?limit= values', () => {
      const value = 'https://example.com/c/programming?sort=Hot&limit=5'
      const expected = [
        {
          uri: 'https://example.com/feeds/c/programming.xml?sort=Hot&limit=5',
          hint: { key: 'lemmy:community', label: 'Community' },
        },
      ]

      expect(lemmyHandler.resolve(value)).toEqual(expected)
    })

    it('should drop non-numeric ?limit= values', () => {
      const value = 'https://example.com/c/programming?limit=garbage'
      const expected = [
        {
          uri: 'https://example.com/feeds/c/programming.xml',
          hint: { key: 'lemmy:community', label: 'Community' },
        },
      ]

      expect(lemmyHandler.resolve(value)).toEqual(expected)
    })

    it('should pass through ?limit= without sort', () => {
      const value = 'https://example.com/c/programming?limit=10'
      const expected = [
        {
          uri: 'https://example.com/feeds/c/programming.xml?limit=10',
          hint: { key: 'lemmy:community', label: 'Community' },
        },
      ]

      expect(lemmyHandler.resolve(value)).toEqual(expected)
    })
  })
})
