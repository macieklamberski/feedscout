import { describe, expect, it } from 'bun:test'
import type { DiscoverRef, DiscoverUriEntry, FetchFn } from '../../common/types.js'
import type { FaviconEnricherContext } from '../types.js'
import { pinterestEnricher, pinterestHandler } from './pinterest.js'

const createContext = (responses: Record<string, string>): FaviconEnricherContext => {
  const fetchFn: FetchFn = async (url) => ({
    headers: new Headers(),
    body: responses[url] ?? '',
    url,
    status: url in responses ? 200 : 404,
  })

  return { fetchFn }
}

const createPageHtml = (users: Record<string, unknown>): string => {
  const props = JSON.stringify({ initialReduxState: { users } })

  return `<html><head><script id="__PWS_INITIAL_PROPS__" type="application/json">${props}</script></head></html>`
}

const profileHtml = createPageHtml({
  '': {},
  '142567281862381039': {
    username: 'alice',
    image_medium_url: 'https://i.pinimg.com/75x75_RS/37/a1/75/37a175e6d2431425576f0b8f81389394.jpg',
    image_xlarge_url:
      'https://i.pinimg.com/280x280_RS/37/a1/75/37a175e6d2431425576f0b8f81389394.jpg',
  },
})
const savedHtml = createPageHtml({ '': {} })
const ref: DiscoverRef = {
  platform: 'pinterest',
  id: 'alice',
  url: 'https://www.pinterest.com/alice/_saved/',
}
const expectedIcon: Array<DiscoverUriEntry> = [
  { uri: 'https://i.pinimg.com/280x280_RS/37/a1/75/37a175e6d2431425576f0b8f81389394.jpg' },
]

describe('pinterestHandler', () => {
  describe('match', () => {
    it('should match profile URLs', () => {
      expect(pinterestHandler.match('https://www.pinterest.com/alice')).toBe(true)
      expect(pinterestHandler.match('https://pinterest.com/alice/')).toBe(true)
    })

    it('should match saved pages', () => {
      expect(pinterestHandler.match('https://www.pinterest.com/alice/_saved/')).toBe(true)
    })

    it('should not match board pages', () => {
      expect(pinterestHandler.match('https://www.pinterest.com/alice/recipes/')).toBe(false)
    })

    it('should not match pin pages', () => {
      expect(pinterestHandler.match('https://www.pinterest.com/pin/123456789/')).toBe(false)
    })

    it('should not match excluded paths', () => {
      expect(pinterestHandler.match('https://www.pinterest.com/search')).toBe(false)
      expect(pinterestHandler.match('https://www.pinterest.com/ideas')).toBe(false)
    })

    it('should not match pin.it short links', () => {
      expect(pinterestHandler.match('https://pin.it/abc123')).toBe(false)
    })

    it('should not match the root URL', () => {
      expect(pinterestHandler.match('https://www.pinterest.com/')).toBe(false)
    })

    it('should not match non-Pinterest URLs', () => {
      expect(pinterestHandler.match('https://example.com/alice')).toBe(false)
    })

    it('should not match invalid URLs', () => {
      expect(pinterestHandler.match('not-a-url')).toBe(false)
    })
  })

  describe('resolve', () => {
    describe('happy paths', () => {
      it('should return the avatar from the profile page content', () => {
        const result = pinterestHandler.resolve('https://www.pinterest.com/alice/', profileHtml)

        expect(result).toEqual(expectedIcon)
      })

      it('should return a ref for saved pages', () => {
        const url = 'https://www.pinterest.com/alice/_saved/'
        const expected: Array<DiscoverRef> = [{ platform: 'pinterest', id: 'alice', url }]

        expect(pinterestHandler.resolve(url, savedHtml)).toEqual(expected)
      })

      it('should return a ref for profile pages when content is missing', () => {
        const url = 'https://www.pinterest.com/alice/'
        const expected: Array<DiscoverRef> = [{ platform: 'pinterest', id: 'alice', url }]

        expect(pinterestHandler.resolve(url)).toEqual(expected)
      })
    })

    describe('sad paths', () => {
      it('should return empty array for board pages', () => {
        const result = pinterestHandler.resolve(
          'https://www.pinterest.com/alice/recipes/',
          profileHtml,
        )

        expect(result).toEqual([])
      })

      it('should return empty array for the default avatar', () => {
        const html = createPageHtml({
          '1': {
            username: 'alice',
            image_xlarge_url: 'https://s.pinimg.com/images/user/default_280.png',
          },
        })
        const result = pinterestHandler.resolve('https://www.pinterest.com/alice/', html)

        expect(result).toEqual([])
      })

      it('should return empty array when image_xlarge_url is missing', () => {
        const html = createPageHtml({ '1': { username: 'alice' } })
        const result = pinterestHandler.resolve('https://www.pinterest.com/alice/', html)

        expect(result).toEqual([])
      })

      it('should return empty array when the page lists another user', () => {
        const result = pinterestHandler.resolve('https://www.pinterest.com/bob/', profileHtml)

        expect(result).toEqual([])
      })

      it('should throw when the initial props are not valid JSON', () => {
        const html = '<script id="__PWS_INITIAL_PROPS__" type="application/json">{not-json</script>'
        expect(() => pinterestHandler.resolve('https://www.pinterest.com/alice/', html)).toThrow()
      })

      it('should return empty array when the page has no initial props', () => {
        const result = pinterestHandler.resolve('https://www.pinterest.com/alice/', '<html></html>')

        expect(result).toEqual([])
      })
    })

    describe('edge cases', () => {
      it('should match the username case-insensitively', () => {
        const result = pinterestHandler.resolve('https://www.pinterest.com/Alice/', profileHtml)

        expect(result).toEqual(expectedIcon)
      })
    })
  })
})

describe('pinterestEnricher', () => {
  it('should resolve the avatar from the profile page', async () => {
    const context = createContext({ 'https://www.pinterest.com/alice/': profileHtml })
    const expected = [
      'https://i.pinimg.com/280x280_RS/37/a1/75/37a175e6d2431425576f0b8f81389394.jpg',
    ]

    expect(await pinterestEnricher(ref, context)).toEqual(expected)
  })

  it('should return undefined for a ref of another platform', async () => {
    const otherRef: DiscoverRef = {
      platform: 'mastodon',
      id: 'alice',
      url: 'https://example.com/@alice',
    }

    expect(await pinterestEnricher(otherRef, createContext({}))).toBeUndefined()
  })

  it('should return empty array for the default avatar', async () => {
    const html = createPageHtml({
      '1': {
        username: 'alice',
        image_xlarge_url: 'https://s.pinimg.com/images/user/default_280.png',
      },
    })
    const context = createContext({ 'https://www.pinterest.com/alice/': html })

    expect(await pinterestEnricher(ref, context)).toEqual([])
  })

  it('should return empty array when image_xlarge_url is missing', async () => {
    const html = createPageHtml({ '1': { username: 'alice' } })
    const context = createContext({ 'https://www.pinterest.com/alice/': html })

    expect(await pinterestEnricher(ref, context)).toEqual([])
  })

  it('should return empty array when the profile page has no initial props', async () => {
    const context = createContext({ 'https://www.pinterest.com/alice/': '<html></html>' })

    expect(await pinterestEnricher(ref, context)).toEqual([])
  })

  it('should reject when the initial props are not valid JSON', async () => {
    const html = '<script id="__PWS_INITIAL_PROPS__" type="application/json">{not-json</script>'
    const context = createContext({ 'https://www.pinterest.com/alice/': html })

    await expect(pinterestEnricher(ref, context)).rejects.toThrow()
  })

  it('should reject when fetch throws', async () => {
    const fetchFn: FetchFn = () => {
      throw new Error('Network error')
    }

    await expect(pinterestEnricher(ref, { fetchFn })).rejects.toThrow()
  })

  it('should reject when the response is not 2xx', async () => {
    await expect(pinterestEnricher(ref, createContext({}))).rejects.toThrow()
  })
})
