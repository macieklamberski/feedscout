import { describe, expect, it } from 'bun:test'
import type { DiscoverRef, DiscoverUriEntry, FetchFn } from '../../../common/types.js'
import type { FaviconEnricherContext } from '../../types.js'
import { pixelfedEnricher, pixelfedHandler } from './pixelfed.js'

const createContext = (responses: Record<string, string>): FaviconEnricherContext => {
  const fetchFn: FetchFn = async (url) => ({
    headers: new Headers(),
    body: responses[url] ?? '',
    url,
    status: url in responses ? 200 : 404,
  })

  return { fetchFn }
}

const lookupUrl = 'https://example.com/api/v1/accounts/lookup?acct=alice'
const ref: DiscoverRef = { platform: 'pixelfed', id: 'alice', url: 'https://example.com/alice' }

const pixelfedHtml = '<html><head><meta name="generator" content="pixelfed"></head></html>'
const profileHtml = `
  <html>
    <head>
      <meta
        property="og:image"
        content="https://example.com/storage/avatars/000/000/000/002/abc_avatar.jpg?v=57"
      >
      <meta property="og:image:width" content="200">
      <meta name="application-name" content="Pixelfed">
      <meta name="generator" content="pixelfed">
    </head>
  </html>
`

describe('pixelfedHandler', () => {
  describe('match', () => {
    it('should match /{user} with Pixelfed content', () => {
      expect(pixelfedHandler.match('https://example.com/alice', pixelfedHtml)).toBe(true)
    })

    it('should match /users/{user} with Pixelfed content', () => {
      expect(pixelfedHandler.match('https://example.com/users/alice', pixelfedHtml)).toBe(true)
    })

    it('should not match profile path without Pixelfed content', () => {
      const value = '<meta name="generator" content="WordPress 6.0">'

      expect(pixelfedHandler.match('https://example.com/alice', value)).toBe(false)
    })

    it('should not match without content', () => {
      expect(pixelfedHandler.match('https://example.com/alice')).toBe(false)
    })

    it('should not match excluded paths', () => {
      expect(pixelfedHandler.match('https://example.com/discover', pixelfedHtml)).toBe(false)
      expect(pixelfedHandler.match('https://example.com/settings', pixelfedHtml)).toBe(false)
    })

    it('should not match post paths', () => {
      expect(pixelfedHandler.match('https://example.com/p/alice/123', pixelfedHtml)).toBe(false)
    })

    it('should not match invalid URLs', () => {
      expect(pixelfedHandler.match('not-a-url', pixelfedHtml)).toBe(false)
    })
  })

  describe('resolve', () => {
    describe('happy paths', () => {
      it('should resolve avatar from og:image on /{user}', () => {
        const result = pixelfedHandler.resolve('https://example.com/alice', profileHtml)
        const expected: Array<DiscoverUriEntry> = [
          { uri: 'https://example.com/storage/avatars/000/000/000/002/abc_avatar.jpg?v=57' },
        ]

        expect(result).toEqual(expected)
      })

      it('should resolve avatar from og:image on /users/{user}', () => {
        const result = pixelfedHandler.resolve('https://example.com/users/alice', profileHtml)
        const expected: Array<DiscoverUriEntry> = [
          { uri: 'https://example.com/storage/avatars/000/000/000/002/abc_avatar.jpg?v=57' },
        ]

        expect(result).toEqual(expected)
      })
    })

    describe('sad paths', () => {
      it('should return empty array for excluded path', () => {
        const result = pixelfedHandler.resolve('https://example.com/discover', profileHtml)

        expect(result).toEqual([])
      })

      it('should return empty array for invalid URL', () => {
        const result = pixelfedHandler.resolve('not-a-url', profileHtml)

        expect(result).toEqual([])
      })

      it('should return a ref without content', () => {
        const result = pixelfedHandler.resolve('https://example.com/alice')
        const expected: Array<DiscoverRef> = [
          { platform: 'pixelfed', id: 'alice', url: 'https://example.com/alice' },
        ]

        expect(result).toEqual(expected)
      })

      it('should return a ref when page has no og:image', () => {
        const result = pixelfedHandler.resolve('https://example.com/alice', pixelfedHtml)
        const expected: Array<DiscoverRef> = [
          { platform: 'pixelfed', id: 'alice', url: 'https://example.com/alice' },
        ]

        expect(result).toEqual(expected)
      })

      it('should return a ref on /users/{user} when page has no og:image', () => {
        const url = 'https://example.com/users/alice'
        const result = pixelfedHandler.resolve(url, pixelfedHtml)
        const expected: Array<DiscoverRef> = [{ platform: 'pixelfed', id: 'alice', url }]

        expect(result).toEqual(expected)
      })
    })

    describe('edge cases', () => {
      it('should return a ref for default avatar in og:image', () => {
        const value = `
          <meta
            property="og:image"
            content="https://example.com/storage/avatars/default.jpg"
          >
        `
        const result = pixelfedHandler.resolve('https://example.com/alice', value)
        const expected: Array<DiscoverRef> = [
          { platform: 'pixelfed', id: 'alice', url: 'https://example.com/alice' },
        ]

        expect(result).toEqual(expected)
      })

      it('should return a ref for default avatar with query in og:image', () => {
        const value = `
          <meta
            property="og:image"
            content="https://example.com/storage/avatars/default.png?v=0"
          >
        `
        const result = pixelfedHandler.resolve('https://example.com/alice', value)
        const expected: Array<DiscoverRef> = [
          { platform: 'pixelfed', id: 'alice', url: 'https://example.com/alice' },
        ]

        expect(result).toEqual(expected)
      })
    })
  })
})

describe('pixelfedEnricher', () => {
  it('should resolve avatar from Pixelfed API', async () => {
    const context = createContext({
      [lookupUrl]: JSON.stringify({
        username: 'alice',
        avatar: 'https://example.com/storage/avatars/561598194146945883/krwzqr.jpg?v=1',
      }),
    })
    const expected = ['https://example.com/storage/avatars/561598194146945883/krwzqr.jpg?v=1']

    expect(await pixelfedEnricher(ref, context)).toEqual(expected)
  })

  it('should build API URL from the origin of the profile URL', async () => {
    const context = createContext({
      'https://example.com:8080/api/v1/accounts/lookup?acct=alice': JSON.stringify({
        avatar: 'https://cdn.example.com/cache/avatars/550096353336233985/avatar_lyn3g6.png',
      }),
    })
    const portRef: DiscoverRef = {
      platform: 'pixelfed',
      id: 'alice',
      url: 'https://example.com:8080/users/alice',
    }
    const expected = ['https://cdn.example.com/cache/avatars/550096353336233985/avatar_lyn3g6.png']

    expect(await pixelfedEnricher(portRef, context)).toEqual(expected)
  })

  it('should return undefined for a ref of another platform', async () => {
    const otherRef: DiscoverRef = {
      platform: 'mastodon',
      id: 'alice',
      url: 'https://example.com/@alice',
    }

    expect(await pixelfedEnricher(otherRef, createContext({}))).toBeUndefined()
  })

  it('should return empty array for default jpg avatar', async () => {
    const context = createContext({
      [lookupUrl]: JSON.stringify({ avatar: 'https://example.com/storage/avatars/default.jpg' }),
    })

    expect(await pixelfedEnricher(ref, context)).toEqual([])
  })

  it('should return empty array for default png avatar with query', async () => {
    const context = createContext({
      [lookupUrl]: JSON.stringify({
        avatar: 'https://example.com/storage/avatars/default.png?v=0',
      }),
    })

    expect(await pixelfedEnricher(ref, context)).toEqual([])
  })

  it('should return empty array when avatar is empty string', async () => {
    const context = createContext({ [lookupUrl]: JSON.stringify({ avatar: '' }) })

    expect(await pixelfedEnricher(ref, context)).toEqual([])
  })

  it('should return empty array when API returns no avatar', async () => {
    const context = createContext({ [lookupUrl]: JSON.stringify({ username: 'alice' }) })

    expect(await pixelfedEnricher(ref, context)).toEqual([])
  })

  it('should return empty array when API returns invalid JSON', async () => {
    const context = createContext({ [lookupUrl]: '<html>Not Found</html>' })

    expect(await pixelfedEnricher(ref, context)).toEqual([])
  })

  it('should return empty array when fetch throws', async () => {
    const fetchFn: FetchFn = () => {
      throw new Error('Network error')
    }

    expect(await pixelfedEnricher(ref, { fetchFn })).toEqual([])
  })
})
