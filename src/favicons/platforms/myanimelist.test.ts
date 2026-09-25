import { describe, expect, it } from 'bun:test'
import type { DiscoverRef, DiscoverUriEntry, FetchFn } from '../../common/types.js'
import type { FaviconEnricherContext } from '../types.js'
import { myanimelistEnricher, myanimelistHandler } from './myanimelist.js'

const avatarUrl =
  'https://cdn.myanimelist.net/s/common/userimages/c3f4dc4a-ef1f-48d2-970b-cd23a8cc37ad_225w?s=012c053fba954194fcef80b68f1e13c3'

const profilePage = `
  <div class="user-profile">
    <div class="user-image mb8">
      <img
        class="lazyload"
        data-src="${avatarUrl}"
      >
    </div>
  </div>
`

const profilePageWithoutAvatar = `
  <div class="user-profile">
    <div class="user-image mb8">
      <div class="btn-detail-add-picture nolink">
        <i class="fa-solid fa-camera fs48"></i>
        <br>
        <span class="text">No Picture</span>
      </div>
    </div>
  </div>
`

const createContext = (responses: Record<string, string>): FaviconEnricherContext => {
  const fetchFn: FetchFn = async (url) => ({
    headers: new Headers(),
    body: responses[url] ?? '',
    url,
    status: url in responses ? 200 : 404,
  })

  return { fetchFn }
}

const createRef = (url: string): DiscoverRef => {
  return { platform: 'myanimelist', id: 'example', url }
}

describe('myanimelistHandler', () => {
  describe('match', () => {
    it('should match a profile page', () => {
      expect(myanimelistHandler.match('https://myanimelist.net/profile/example')).toBe(true)
    })

    it('should match an anime list page', () => {
      expect(myanimelistHandler.match('https://myanimelist.net/animelist/example')).toBe(true)
    })

    it('should match a manga list page', () => {
      expect(myanimelistHandler.match('https://myanimelist.net/mangalist/example')).toBe(true)
    })

    it('should match a profile page on www', () => {
      expect(myanimelistHandler.match('https://www.myanimelist.net/profile/example')).toBe(true)
    })

    it('should not match the news page', () => {
      expect(myanimelistHandler.match('https://myanimelist.net/news')).toBe(false)
    })

    it('should not match an anime page', () => {
      expect(myanimelistHandler.match('https://myanimelist.net/anime/1/Cowboy_Bebop')).toBe(false)
    })

    it('should not match the root', () => {
      expect(myanimelistHandler.match('https://myanimelist.net/')).toBe(false)
    })

    it('should not match other hosts', () => {
      expect(myanimelistHandler.match('https://example.com/profile/example')).toBe(false)
    })

    it('should not match invalid URLs', () => {
      expect(myanimelistHandler.match('not-a-url')).toBe(false)
    })
  })

  describe('resolve', () => {
    describe('happy paths', () => {
      it('should return the avatar from the profile page content', () => {
        const value = 'https://myanimelist.net/profile/example'
        const expected: Array<DiscoverUriEntry> = [{ uri: avatarUrl }]

        expect(myanimelistHandler.resolve(value, profilePage)).toEqual(expected)
      })

      it('should return the avatar when another class comes before user-image', () => {
        const value = 'https://myanimelist.net/profile/example'
        const content = profilePage.replace('class="user-image mb8"', 'class="mb8 user-image"')
        const expected: Array<DiscoverUriEntry> = [{ uri: avatarUrl }]

        expect(myanimelistHandler.resolve(value, content)).toEqual(expected)
      })

      it('should return a ref for an anime list page', () => {
        const value = 'https://myanimelist.net/animelist/example'
        const expected: Array<DiscoverRef> = [createRef(value)]

        expect(myanimelistHandler.resolve(value, '<html></html>')).toEqual(expected)
      })

      it('should return a ref for a manga list page', () => {
        const value = 'https://myanimelist.net/mangalist/example'
        const expected: Array<DiscoverRef> = [createRef(value)]

        expect(myanimelistHandler.resolve(value, '<html></html>')).toEqual(expected)
      })

      it('should return a ref for a profile page passed without its content', () => {
        const value = 'https://myanimelist.net/profile/example'
        const expected: Array<DiscoverRef> = [createRef(value)]

        expect(myanimelistHandler.resolve(value)).toEqual(expected)
      })
    })

    describe('sad paths', () => {
      it('should return empty array for a user without an avatar', () => {
        const value = 'https://myanimelist.net/profile/example'

        expect(myanimelistHandler.resolve(value, profilePageWithoutAvatar)).toEqual([])
      })

      it('should return empty array for a generic image in place of the avatar', () => {
        const value = 'https://myanimelist.net/profile/example'
        const content = `
          <div class="user-image mb8">
            <img data-src="https://cdn.myanimelist.net/images/questionmark_50.gif">
          </div>
        `

        expect(myanimelistHandler.resolve(value, content)).toEqual([])
      })

      it('should return empty array for an unmatched URL', () => {
        expect(myanimelistHandler.resolve('https://myanimelist.net/news', profilePage)).toEqual([])
      })
    })

    describe('edge cases', () => {
      it('should return a ref for a page below the profile', () => {
        const value = 'https://myanimelist.net/profile/example/reviews'
        const expected: Array<DiscoverRef> = [createRef(value)]

        expect(myanimelistHandler.resolve(value, profilePage)).toEqual(expected)
      })
    })
  })
})

describe('myanimelistEnricher', () => {
  it('should return the avatar from the profile page', async () => {
    const context = createContext({ 'https://myanimelist.net/profile/example': profilePage })
    const ref = createRef('https://myanimelist.net/animelist/example')

    expect(await myanimelistEnricher(ref, context)).toEqual([avatarUrl])
  })

  it('should return undefined for a ref of another platform', async () => {
    const ref: DiscoverRef = {
      platform: 'mastodon',
      id: 'example',
      url: 'https://mastodon.example.com/@example',
    }

    expect(await myanimelistEnricher(ref, createContext({}))).toBeUndefined()
  })

  it('should return empty array when the profile page has no avatar', async () => {
    const context = createContext({
      'https://myanimelist.net/profile/example': profilePageWithoutAvatar,
    })
    const ref = createRef('https://myanimelist.net/animelist/example')

    expect(await myanimelistEnricher(ref, context)).toEqual([])
  })

  it('should reject when the body is a stream', async () => {
    const fetchFn: FetchFn = async (url) => ({
      headers: new Headers(),
      body: new ReadableStream(),
      url,
      status: 200,
    })
    const ref = createRef('https://myanimelist.net/animelist/example')

    await expect(myanimelistEnricher(ref, { fetchFn })).rejects.toThrow('Unexpected stream body')
  })

  it('should reject when fetch throws', async () => {
    const fetchFn: FetchFn = () => {
      throw new Error('Network error')
    }
    const ref = createRef('https://myanimelist.net/animelist/example')

    await expect(myanimelistEnricher(ref, { fetchFn })).rejects.toThrow()
  })

  it('should reject when the response is not 2xx', async () => {
    const ref = createRef('https://myanimelist.net/animelist/example')

    await expect(myanimelistEnricher(ref, createContext({}))).rejects.toThrow()
  })
})
