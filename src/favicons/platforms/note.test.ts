import { describe, expect, it } from 'bun:test'
import type { DiscoverRef, DiscoverUriEntry, FetchFn } from '../../common/types.js'
import type { FaviconEnricherContext } from '../types.js'
import { noteEnricher, noteHandler } from './note.js'

const createContext = (responses: Record<string, string>): FaviconEnricherContext => {
  const fetchFn: FetchFn = async (url) => ({
    headers: new Headers(),
    body: responses[url] ?? '',
    url,
    status: url in responses ? 200 : 404,
  })

  return { fetchFn }
}

const avatarUrl =
  'https://assets.st-note.com/production/uploads/images/1234/profile_abc.png?fit=bounds&format=jpeg&quality=85&width=330'
const profileContent = `<script>self.__next_f.push([1,"{\\"urlname\\":\\"alice\\",\\"profileImageUrl\\":\\"https://assets.st-note.com/production/uploads/images/1234/profile_abc.png?fit=bounds\\u0026format=jpeg\\u0026quality=85\\u0026width=330\\"}"])</script>`

describe('noteHandler', () => {
  describe('match', () => {
    it('should match profile URLs', () => {
      expect(noteHandler.match('https://note.com/alice')).toBe(true)
    })

    it('should match profile URLs with trailing slash', () => {
      expect(noteHandler.match('https://note.com/alice/')).toBe(true)
    })

    it('should match www.note.com profile URLs', () => {
      expect(noteHandler.match('https://www.note.com/alice')).toBe(true)
    })

    it('should match magazine URLs', () => {
      expect(noteHandler.match('https://note.com/alice/m/m1861fae39074')).toBe(true)
    })

    it('should not match hashtag pages', () => {
      expect(noteHandler.match('https://note.com/hashtag/design')).toBe(false)
      expect(noteHandler.match('https://note.com/tag/design')).toBe(false)
    })

    it('should not match article pages', () => {
      expect(noteHandler.match('https://note.com/alice/n/n1234567890ab')).toBe(false)
    })

    it('should not match excluded paths', () => {
      expect(noteHandler.match('https://note.com/search')).toBe(false)
    })

    it('should not match root URL', () => {
      expect(noteHandler.match('https://note.com/')).toBe(false)
    })

    it('should not match non-note URLs', () => {
      expect(noteHandler.match('https://example.com/alice')).toBe(false)
    })

    it('should not match invalid URLs', () => {
      expect(noteHandler.match('not-a-url')).toBe(false)
    })
  })

  describe('resolve', () => {
    describe('happy paths', () => {
      it('should return avatar from profile page payload', () => {
        const expected: Array<DiscoverUriEntry> = [{ uri: avatarUrl }]

        expect(noteHandler.resolve('https://note.com/alice', profileContent)).toEqual(expected)
      })

      it('should return a ref when content is absent', () => {
        const url = 'https://note.com/alice'
        const expected: Array<DiscoverRef> = [{ platform: 'note', id: 'alice', url }]

        expect(noteHandler.resolve(url)).toEqual(expected)
      })

      it('should return a ref when page has no payload', () => {
        const url = 'https://note.com/alice'
        const expected: Array<DiscoverRef> = [{ platform: 'note', id: 'alice', url }]

        expect(noteHandler.resolve(url, '<html></html>')).toEqual(expected)
      })

      it('should return a ref with the owner for magazine pages', () => {
        const url = 'https://note.com/alice/m/m1861fae39074'
        const expected: Array<DiscoverRef> = [{ platform: 'note', id: 'alice', url }]

        expect(noteHandler.resolve(url)).toEqual(expected)
      })
    })

    describe('sad paths', () => {
      it('should return a ref when profileImageUrl is not valid JSON', () => {
        const url = 'https://note.com/alice'
        const content = '{\\"profileImageUrl\\":\\"https://example.com/\tprofile.png\\"}'
        const expected: Array<DiscoverRef> = [{ platform: 'note', id: 'alice', url }]

        expect(noteHandler.resolve(url, content)).toEqual(expected)
      })

      it('should return empty array for hashtag pages', () => {
        expect(noteHandler.resolve('https://note.com/hashtag/design')).toEqual([])
      })
    })

    describe('edge cases', () => {
      it('should ignore page payload on magazine pages', () => {
        const url = 'https://note.com/alice/m/m1861fae39074'
        const expected: Array<DiscoverRef> = [{ platform: 'note', id: 'alice', url }]

        expect(noteHandler.resolve(url, profileContent)).toEqual(expected)
      })
    })
  })
})

describe('noteEnricher', () => {
  const ref: DiscoverRef = { platform: 'note', id: 'alice', url: 'https://note.com/alice' }

  it('should return avatar from creators API', async () => {
    const context = createContext({
      'https://note.com/api/v2/creators/alice': JSON.stringify({
        data: { urlname: 'alice', profileImageUrl: avatarUrl },
      }),
    })

    expect(await noteEnricher(ref, context)).toEqual([avatarUrl])
  })

  it('should return undefined for a ref of another platform', async () => {
    const otherRef: DiscoverRef = {
      platform: 'mastodon',
      id: 'alice',
      url: 'https://example.com/@alice',
    }

    expect(await noteEnricher(otherRef, createContext({}))).toBeUndefined()
  })

  it('should return empty array when profileImageUrl is absent', async () => {
    const context = createContext({
      'https://note.com/api/v2/creators/alice': JSON.stringify({ data: {} }),
    })

    expect(await noteEnricher(ref, context)).toEqual([])
  })

  it('should return empty array when creator is not found', async () => {
    const context = createContext({
      'https://note.com/api/v2/creators/alice': JSON.stringify({
        data: 'リソースが見つかりません',
      }),
    })

    expect(await noteEnricher(ref, context)).toEqual([])
  })

  it('should reject when API returns invalid JSON', async () => {
    const context = createContext({
      'https://note.com/api/v2/creators/alice': 'not json',
    })

    await expect(noteEnricher(ref, context)).rejects.toThrow()
  })

  it('should reject when fetch throws', async () => {
    const fetchFn: FetchFn = () => {
      throw new Error('Network error')
    }

    await expect(noteEnricher(ref, { fetchFn })).rejects.toThrow()
  })

  it('should reject when the response is not 2xx', async () => {
    await expect(noteEnricher(ref, createContext({}))).rejects.toThrow()
  })
})
