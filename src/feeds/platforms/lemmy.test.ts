import { describe, expect, it } from 'bun:test'
import type { LemmyUrl } from './lemmy.js'
import { isLemmyHeaders, isLemmyHtml, lemmyHandler, parseLemmyUrl } from './lemmy.js'

const lemmyHtml = '<html><head><meta name="generator" content="Lemmy v0.19.5"></head></html>'
const lemmyHeaders = new Headers({ 'x-powered-by': 'Lemmy' })

describe('parseLemmyUrl', () => {
  it('should return the community for a community page', () => {
    const expected: LemmyUrl = { kind: 'community', community: 'programming' }

    expect(parseLemmyUrl('https://lemmy.ml/c/programming')).toEqual(expected)
  })

  it('should return the community for a community subpage', () => {
    const expected: LemmyUrl = { kind: 'community', community: 'programming' }

    expect(parseLemmyUrl('https://lemmy.ml/c/programming/hot')).toEqual(expected)
  })

  it('should return a federated community with its instance', () => {
    const expected: LemmyUrl = { kind: 'community', community: 'rust@lemmy.world' }

    expect(parseLemmyUrl('https://lemmy.ml/c/rust@lemmy.world')).toEqual(expected)
  })

  it('should return the user for a user page', () => {
    const expected: LemmyUrl = { kind: 'user', username: 'alice' }

    expect(parseLemmyUrl('https://lemmy.ml/u/alice')).toEqual(expected)
  })

  it('should return the user for a user subpage', () => {
    const expected: LemmyUrl = { kind: 'user', username: 'alice' }

    expect(parseLemmyUrl('https://lemmy.ml/u/alice/posts')).toEqual(expected)
  })

  it('should return a federated user with its instance', () => {
    const expected: LemmyUrl = { kind: 'user', username: 'alice@lemmy.world' }

    expect(parseLemmyUrl('https://lemmy.ml/u/alice@lemmy.world')).toEqual(expected)
  })

  it('should return the community on any host', () => {
    const expected: LemmyUrl = { kind: 'community', community: 'worldnews' }

    expect(parseLemmyUrl('https://beehaw.org/c/worldnews')).toEqual(expected)
  })

  it('should return undefined for a prefix without a name', () => {
    expect(parseLemmyUrl('https://lemmy.ml/c')).toBeUndefined()
    expect(parseLemmyUrl('https://lemmy.ml/c/')).toBeUndefined()
    expect(parseLemmyUrl('https://lemmy.ml/u')).toBeUndefined()
    expect(parseLemmyUrl('https://lemmy.ml/u/')).toBeUndefined()
  })

  it('should return the community for a capitalized prefix', () => {
    const expected: LemmyUrl = { kind: 'community', community: 'programming' }

    expect(parseLemmyUrl('https://lemmy.ml/C/programming')).toEqual(expected)
  })

  it('should return undefined for the home page', () => {
    expect(parseLemmyUrl('https://lemmy.ml/')).toBeUndefined()
  })

  it('should return undefined for other paths', () => {
    expect(parseLemmyUrl('https://lemmy.ml/about')).toBeUndefined()
    expect(parseLemmyUrl('https://lemmy.ml/post/123')).toBeUndefined()
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
    expect(isLemmyHtml('<a href="#/#lemmy-space:matrix.org">room</a>')).toBe(false)
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
      expect(lemmyHandler.match('https://lemmy.ml/c/programming', lemmyHtml)).toBe(true)
    })

    it('should match the home page with Lemmy HTML', () => {
      expect(lemmyHandler.match('https://lemmy.ml/', lemmyHtml)).toBe(true)
    })

    it('should not match the retired /home path', () => {
      expect(lemmyHandler.match('https://lemmy.ml/home', lemmyHtml)).toBe(false)
    })

    it('should match community path with Lemmy server header', () => {
      expect(lemmyHandler.match('https://lemmy.ml/c/programming', '', lemmyHeaders)).toBe(true)
    })

    it('should not match without content or headers', () => {
      expect(lemmyHandler.match('https://lemmy.ml/c/programming')).toBe(false)
    })

    it('should not match non-community, non-user, non-home paths even with Lemmy HTML', () => {
      expect(lemmyHandler.match('https://lemmy.ml/about', lemmyHtml)).toBe(false)
    })

    it('should not match without Lemmy signals', () => {
      const plainHtml = '<html><head></head></html>'

      expect(lemmyHandler.match('https://lemmy.ml/c/programming', plainHtml)).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return community feed URL', () => {
      const value = 'https://lemmy.ml/c/programming'
      const expected = [
        {
          uri: 'https://lemmy.ml/feeds/c/programming.xml',
          hint: { key: 'lemmy:community', label: 'Community' },
        },
      ]

      expect(lemmyHandler.resolve(value)).toEqual(expected)
    })

    it('should return user feed URL', () => {
      const value = 'https://lemmy.ml/u/alice'
      const expected = [
        {
          uri: 'https://lemmy.ml/feeds/u/alice.xml',
          hint: { key: 'lemmy:user', label: 'User' },
        },
      ]

      expect(lemmyHandler.resolve(value)).toEqual(expected)
    })

    it('should preserve the instance origin', () => {
      const value = 'https://beehaw.org/c/worldnews'
      const expected = [
        {
          uri: 'https://beehaw.org/feeds/c/worldnews.xml',
          hint: { key: 'lemmy:community', label: 'Community' },
        },
      ]

      expect(lemmyHandler.resolve(value)).toEqual(expected)
    })

    it('should return site-wide feeds for home path', () => {
      const value = 'https://lemmy.ml/'
      const expected = [
        {
          uri: 'https://lemmy.ml/feeds/all.xml',
          hint: { key: 'lemmy:all', label: 'All' },
        },
        {
          uri: 'https://lemmy.ml/feeds/local.xml',
          hint: { key: 'lemmy:local', label: 'Local' },
        },
      ]

      expect(lemmyHandler.resolve(value)).toEqual(expected)
    })

    it('should forward ?sort= on community feed', () => {
      const value = 'https://lemmy.ml/c/programming?sort=TopWeek'
      const expected = [
        {
          uri: 'https://lemmy.ml/feeds/c/programming.xml?sort=TopWeek',
          hint: { key: 'lemmy:community', label: 'Community' },
        },
      ]

      expect(lemmyHandler.resolve(value)).toEqual(expected)
    })

    it('should forward ?sort= on user feed', () => {
      const value = 'https://lemmy.ml/u/alice?sort=New'
      const expected = [
        {
          uri: 'https://lemmy.ml/feeds/u/alice.xml?sort=New',
          hint: { key: 'lemmy:user', label: 'User' },
        },
      ]

      expect(lemmyHandler.resolve(value)).toEqual(expected)
    })

    it('should forward ?sort= on home feeds', () => {
      const value = 'https://lemmy.ml/?sort=Active'
      const expected = [
        {
          uri: 'https://lemmy.ml/feeds/all.xml?sort=Active',
          hint: { key: 'lemmy:all', label: 'All' },
        },
        {
          uri: 'https://lemmy.ml/feeds/local.xml?sort=Active',
          hint: { key: 'lemmy:local', label: 'Local' },
        },
      ]

      expect(lemmyHandler.resolve(value)).toEqual(expected)
    })

    it('should take the sort the home page advertises', () => {
      const value = 'https://lemmy.ml/'
      const content =
        '<link rel="alternate" type="application/atom+xml" href="/feeds/local.xml?sort=Active">'
      const expected = [
        {
          uri: 'https://lemmy.ml/feeds/all.xml?sort=Active',
          hint: { key: 'lemmy:all', label: 'All' },
        },
        {
          uri: 'https://lemmy.ml/feeds/local.xml?sort=Active',
          hint: { key: 'lemmy:local', label: 'Local' },
        },
      ]

      expect(lemmyHandler.resolve(value, content)).toEqual(expected)
    })

    it('should prefer the ?sort= of the page URL over the advertised sort', () => {
      const value = 'https://lemmy.ml/c/programming?sort=New'
      const content =
        '<link rel="alternate" type="application/atom+xml" href="/feeds/c/programming.xml?sort=Active">'
      const expected = [
        {
          uri: 'https://lemmy.ml/feeds/c/programming.xml?sort=New',
          hint: { key: 'lemmy:community', label: 'Community' },
        },
      ]

      expect(lemmyHandler.resolve(value, content)).toEqual(expected)
    })

    it('should drop unknown ?sort= values', () => {
      const value = 'https://lemmy.ml/c/programming?sort=garbage'
      const expected = [
        {
          uri: 'https://lemmy.ml/feeds/c/programming.xml',
          hint: { key: 'lemmy:community', label: 'Community' },
        },
      ]

      expect(lemmyHandler.resolve(value)).toEqual(expected)
    })

    it('should accept extended sort values', () => {
      const value = 'https://lemmy.ml/c/programming?sort=Controversial'
      const expected = [
        {
          uri: 'https://lemmy.ml/feeds/c/programming.xml?sort=Controversial',
          hint: { key: 'lemmy:community', label: 'Community' },
        },
      ]

      expect(lemmyHandler.resolve(value)).toEqual(expected)
    })

    it('should pass through numeric ?limit= values', () => {
      const value = 'https://lemmy.ml/c/programming?sort=Hot&limit=5'
      const expected = [
        {
          uri: 'https://lemmy.ml/feeds/c/programming.xml?sort=Hot&limit=5',
          hint: { key: 'lemmy:community', label: 'Community' },
        },
      ]

      expect(lemmyHandler.resolve(value)).toEqual(expected)
    })

    it('should drop non-numeric ?limit= values', () => {
      const value = 'https://lemmy.ml/c/programming?limit=garbage'
      const expected = [
        {
          uri: 'https://lemmy.ml/feeds/c/programming.xml',
          hint: { key: 'lemmy:community', label: 'Community' },
        },
      ]

      expect(lemmyHandler.resolve(value)).toEqual(expected)
    })

    it('should pass through ?limit= without sort', () => {
      const value = 'https://lemmy.ml/c/programming?limit=10'
      const expected = [
        {
          uri: 'https://lemmy.ml/feeds/c/programming.xml?limit=10',
          hint: { key: 'lemmy:community', label: 'Community' },
        },
      ]

      expect(lemmyHandler.resolve(value)).toEqual(expected)
    })
  })
})
