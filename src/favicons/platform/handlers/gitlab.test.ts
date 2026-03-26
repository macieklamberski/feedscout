import { describe, expect, it } from 'bun:test'
import type { DiscoverFetchFn, DiscoverUriEntry } from '../../../common/types.js'
import { gitlabHandler } from './gitlab.js'

const gitlabHtml = '<html><head><meta property="og:site_name" content="GitLab"></head></html>'
const gitlabHeaders = new Headers({ 'x-gitlab-meta': '{"version":"1"}' })

const createMockFetch = (responses: Record<string, string>): DiscoverFetchFn => {
  return async (url: string) => ({
    url,
    body: responses[url] ?? '',
    headers: new Headers(),
    status: url in responses ? 200 : 404,
    statusText: url in responses ? 'OK' : 'Not Found',
  })
}

describe('gitlabHandler', () => {
  describe('match', () => {
    it('should match gitlab.com user URLs without content', () => {
      expect(gitlabHandler.match('https://gitlab.com/gitlab-org')).toBe(true)
    })

    it('should match gitlab.com repo URLs without content', () => {
      expect(gitlabHandler.match('https://gitlab.com/gitlab-org/gitlab')).toBe(true)
    })

    it('should match www.gitlab.com without content', () => {
      expect(gitlabHandler.match('https://www.gitlab.com/user')).toBe(true)
    })

    it('should match self-hosted instance with GitLab HTML', () => {
      expect(gitlabHandler.match('https://gitlab.mycompany.com/user', gitlabHtml)).toBe(true)
    })

    it('should match self-hosted instance with GitLab header', () => {
      expect(gitlabHandler.match('https://gitlab.mycompany.com/user', '', gitlabHeaders)).toBe(true)
    })

    it('should not match self-hosted root path even with GitLab HTML', () => {
      expect(gitlabHandler.match('https://gitlab.mycompany.com', gitlabHtml)).toBe(false)
    })

    it('should not match non-GitLab sites', () => {
      expect(gitlabHandler.match('https://github.com/user')).toBe(false)
      expect(gitlabHandler.match('https://example.com/user')).toBe(false)
    })

    it('should not match self-hosted without content or headers', () => {
      expect(gitlabHandler.match('https://gitlab.mycompany.com/user')).toBe(false)
    })

    it('should not match invalid URLs', () => {
      expect(gitlabHandler.match('not-a-url')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return avatar URL from GitLab API for user page', async () => {
      const mockFetch = createMockFetch({
        'https://gitlab.com/api/v4/users?username=alice': JSON.stringify([
          { avatar_url: 'https://gitlab.com/uploads/user/avatar/1/alice.png' },
        ]),
      })
      const value = await gitlabHandler.resolve(
        'https://gitlab.com/alice',
        undefined,
        undefined,
        mockFetch,
      )
      const expected: Array<DiscoverUriEntry> = [
        { uri: 'https://gitlab.com/uploads/user/avatar/1/alice.png' },
      ]

      expect(value).toEqual(expected)
    })

    it('should return avatar from first result when API returns multiple users', async () => {
      const mockFetch = createMockFetch({
        'https://gitlab.com/api/v4/users?username=alice': JSON.stringify([
          { avatar_url: 'https://gitlab.com/uploads/user/avatar/1/alice.png' },
          { avatar_url: 'https://gitlab.com/uploads/user/avatar/2/other.png' },
        ]),
      })
      const value = await gitlabHandler.resolve(
        'https://gitlab.com/alice',
        undefined,
        undefined,
        mockFetch,
      )
      const expected: Array<DiscoverUriEntry> = [
        { uri: 'https://gitlab.com/uploads/user/avatar/1/alice.png' },
      ]

      expect(value).toEqual(expected)
    })

    it('should use origin from self-hosted instance', async () => {
      const mockFetch = createMockFetch({
        'https://gitlab.mycompany.com/api/v4/users?username=alice': JSON.stringify([
          { avatar_url: 'https://gitlab.mycompany.com/uploads/user/avatar/1/alice.png' },
        ]),
      })
      const value = await gitlabHandler.resolve(
        'https://gitlab.mycompany.com/alice',
        undefined,
        undefined,
        mockFetch,
      )
      const expected: Array<DiscoverUriEntry> = [
        { uri: 'https://gitlab.mycompany.com/uploads/user/avatar/1/alice.png' },
      ]

      expect(value).toEqual(expected)
    })

    it('should extract username from repo URL path', async () => {
      const mockFetch = createMockFetch({
        'https://gitlab.com/api/v4/users?username=gitlab-org': JSON.stringify([
          { avatar_url: 'https://gitlab.com/uploads/group/avatar/1/gitlab-org.png' },
        ]),
      })
      const value = await gitlabHandler.resolve(
        'https://gitlab.com/gitlab-org/gitlab',
        undefined,
        undefined,
        mockFetch,
      )
      const expected: Array<DiscoverUriEntry> = [
        { uri: 'https://gitlab.com/uploads/group/avatar/1/gitlab-org.png' },
      ]

      expect(value).toEqual(expected)
    })

    it('should return empty array for excluded paths', async () => {
      const mockFetch = createMockFetch({})
      const value = await gitlabHandler.resolve(
        'https://gitlab.com/explore',
        undefined,
        undefined,
        mockFetch,
      )

      expect(value).toEqual([])
    })

    it('should return empty array when API returns empty array', async () => {
      const mockFetch = createMockFetch({
        'https://gitlab.com/api/v4/users?username=nonexistent': JSON.stringify([]),
      })
      const value = await gitlabHandler.resolve(
        'https://gitlab.com/nonexistent',
        undefined,
        undefined,
        mockFetch,
      )

      expect(value).toEqual([])
    })

    it('should return empty array when avatar_url is empty', async () => {
      const mockFetch = createMockFetch({
        'https://gitlab.com/api/v4/users?username=alice': JSON.stringify([{ avatar_url: '' }]),
      })
      const value = await gitlabHandler.resolve(
        'https://gitlab.com/alice',
        undefined,
        undefined,
        mockFetch,
      )

      expect(value).toEqual([])
    })

    it('should return empty array when API returns invalid JSON', async () => {
      const mockFetch = createMockFetch({
        'https://gitlab.com/api/v4/users?username=alice': 'not-json',
      })
      const value = await gitlabHandler.resolve(
        'https://gitlab.com/alice',
        undefined,
        undefined,
        mockFetch,
      )

      expect(value).toEqual([])
    })

    it('should return empty array when fetchFn is not provided', async () => {
      const value = await gitlabHandler.resolve('https://gitlab.com/alice')

      expect(value).toEqual([])
    })

    it('should return empty array when fetch throws', async () => {
      const mockFetch: DiscoverFetchFn = async () => {
        throw new Error('Network error')
      }
      const value = await gitlabHandler.resolve(
        'https://gitlab.com/alice',
        undefined,
        undefined,
        mockFetch,
      )

      expect(value).toEqual([])
    })

    it('should return empty array for invalid URL', async () => {
      const mockFetch = createMockFetch({})
      const value = await gitlabHandler.resolve('not-a-url', undefined, undefined, mockFetch)

      expect(value).toEqual([])
    })
  })
})
