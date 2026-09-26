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

    it('should not match hashtag pages', () => {
      expect(noteHandler.match('https://note.com/hashtag/design')).toBe(false)
    })

    it('should not match a magazine under a reserved path', () => {
      expect(noteHandler.match('https://note.com/search/m/m1861fae39074')).toBe(false)
    })

    it('should not match a magazine under a capitalized reserved path', () => {
      expect(noteHandler.match('https://note.com/Search/m/m1861fae39074')).toBe(false)
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

      it('should return a ref with the owner for article pages, ignoring the payload', () => {
        const url = 'https://note.com/alice/n/n1234567890ab'
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
    const throwing = () => noteEnricher(ref, context)

    await expect(throwing()).rejects.toThrow('JSON Parse error: Unexpected identifier "not"')
  })

  it('should reject when fetch throws', async () => {
    const fetchFn: FetchFn = () => {
      throw new Error('Network error')
    }
    const throwing = () => noteEnricher(ref, { fetchFn })

    await expect(throwing()).rejects.toThrow('Network error')
  })

  it('should reject when the response is not 2xx', async () => {
    const throwing = () => noteEnricher(ref, createContext({}))
    const expected = 'Unexpected status 404 from https://note.com/api/v2/creators/alice'

    await expect(throwing()).rejects.toThrow(expected)
  })
})
