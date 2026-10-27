import { describe, expect, it } from 'bun:test'
import type { DiscoverRef, FetchFn } from '../../common/types.js'
import type { FaviconEnricherContext } from '../types.js'
import { gitlabEnricher, gitlabHandler } from './gitlab.js'

const gitlabHtml = `
  <html>
    <head>
      <script>window.gon={};gon.features={};</script>
      <script src="/assets/webpack/runtime.ea79027a.bundle.js" defer></script>
    </head>
  </html>
`
const gitlabHeaders = new Headers({ 'x-gitlab-meta': '{"version":"1"}' })

const createContext = (responses: Record<string, string>): FaviconEnricherContext => {
  const fetchFn: FetchFn = async (url) => ({
    headers: new Headers(),
    body: responses[url] ?? '',
    url,
    status: url in responses ? 200 : 404,
  })

  return { fetchFn }
}

const createRef = (url: string, id: string): DiscoverRef => {
  return { platform: 'gitlab', id, url }
}

const aliceRef = createRef('https://gitlab.com/alice', 'alice')

describe('gitlabHandler', () => {
  describe('match', () => {
    it('should match gitlab.com user URLs without content', () => {
      expect(gitlabHandler.match('https://gitlab.com/gitlab-org')).toBe(true)
    })

    it('should match a self-hosted project page with GitLab HTML', () => {
      expect(gitlabHandler.match('https://gitlab.example.com/user/project', gitlabHtml)).toBe(true)
    })

    it('should match a self-hosted project page with GitLab header', () => {
      const value = 'https://gitlab.example.com/user/project'

      expect(gitlabHandler.match(value, '', gitlabHeaders)).toBe(true)
    })

    it('should match a self-hosted group page with GitLab HTML', () => {
      expect(gitlabHandler.match('https://gitlab.example.com/group', gitlabHtml)).toBe(true)
    })

    it('should not match a page with only og:site_name GitLab', () => {
      const content = '<meta property="og:site_name" content="GitLab">'

      expect(gitlabHandler.match('https://example.com/group', content)).toBe(false)
    })

    it('should not match a GitLab subdomain carrying the GitLab site name', () => {
      expect(gitlabHandler.match('https://about.gitlab.com/blog', gitlabHtml)).toBe(false)
    })

    it('should not match self-hosted without content or headers', () => {
      expect(gitlabHandler.match('https://gitlab.example.com/user/project')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return a ref for a user page', async () => {
      expect(await gitlabHandler.resolve('https://gitlab.com/alice')).toEqual([aliceRef])
    })

    it('should return a ref for a self-hosted instance', async () => {
      const url = 'https://gitlab.example.com/alice'

      expect(await gitlabHandler.resolve(url)).toEqual([createRef(url, 'alice')])
    })

    it('should extract username from repo URL path', async () => {
      const url = 'https://gitlab.com/gitlab-org/gitlab'

      expect(await gitlabHandler.resolve(url)).toEqual([createRef(url, 'gitlab-org')])
    })

    it('should extract group name from groups URL path', async () => {
      const url = 'https://gitlab.com/groups/gitlab-org'

      expect(await gitlabHandler.resolve(url)).toEqual([createRef(url, 'gitlab-org')])
    })
  })
})

describe('gitlabEnricher', () => {
  it('should return avatar URL from GitLab API for user page', async () => {
    const context = createContext({
      'https://gitlab.com/api/v4/users?username=alice': JSON.stringify([
        { avatar_url: 'https://gitlab.com/uploads/user/avatar/1/alice.png' },
      ]),
    })

    expect(await gitlabEnricher(aliceRef, context)).toEqual([
      'https://gitlab.com/uploads/user/avatar/1/alice.png',
    ])
  })

  it('should return avatar from first result when API returns multiple users', async () => {
    const context = createContext({
      'https://gitlab.com/api/v4/users?username=alice': JSON.stringify([
        { avatar_url: 'https://gitlab.com/uploads/user/avatar/1/alice.png' },
        { avatar_url: 'https://gitlab.com/uploads/user/avatar/2/other.png' },
      ]),
    })

    expect(await gitlabEnricher(aliceRef, context)).toEqual([
      'https://gitlab.com/uploads/user/avatar/1/alice.png',
    ])
  })

  it('should use origin from self-hosted instance', async () => {
    const context = createContext({
      'https://gitlab.example.com/api/v4/users?username=alice': JSON.stringify([
        { avatar_url: 'https://gitlab.example.com/uploads/user/avatar/1/alice.png' },
      ]),
    })
    const ref = createRef('https://gitlab.example.com/alice', 'alice')

    expect(await gitlabEnricher(ref, context)).toEqual([
      'https://gitlab.example.com/uploads/user/avatar/1/alice.png',
    ])
  })

  it('should fall back to groups API when users API returns empty', async () => {
    const context = createContext({
      'https://gitlab.com/api/v4/users?username=gitlab-org': JSON.stringify([]),
      'https://gitlab.com/api/v4/groups/gitlab-org': JSON.stringify({
        avatar_url: 'https://gitlab.com/uploads/-/system/group/avatar/9970/project_avatar.png',
      }),
    })
    const ref = createRef('https://gitlab.com/gitlab-org', 'gitlab-org')

    expect(await gitlabEnricher(ref, context)).toEqual([
      'https://gitlab.com/uploads/-/system/group/avatar/9970/project_avatar.png',
    ])
  })

  it('should return undefined for a ref of another platform', async () => {
    const ref: DiscoverRef = { platform: 'mastodon', id: 'user', url: 'https://example.com/@user' }

    expect(await gitlabEnricher(ref, createContext({}))).toBeUndefined()
  })

  it('should return empty array when both users and groups API return empty', async () => {
    const context = createContext({
      'https://gitlab.com/api/v4/users?username=nonexistent': JSON.stringify([]),
      'https://gitlab.com/api/v4/groups/nonexistent': JSON.stringify({ avatar_url: '' }),
    })
    const ref = createRef('https://gitlab.com/nonexistent', 'nonexistent')

    expect(await gitlabEnricher(ref, context)).toEqual([])
  })

  it('should return empty array when API returns empty array', async () => {
    const context = createContext({
      'https://gitlab.com/api/v4/users?username=nonexistent': JSON.stringify([]),
      'https://gitlab.com/api/v4/groups/nonexistent': JSON.stringify({ avatar_url: null }),
    })
    const ref = createRef('https://gitlab.com/nonexistent', 'nonexistent')

    expect(await gitlabEnricher(ref, context)).toEqual([])
  })

  it('should return empty array when avatar_url is empty', async () => {
    const context = createContext({
      'https://gitlab.com/api/v4/users?username=alice': JSON.stringify([{ avatar_url: '' }]),
      'https://gitlab.com/api/v4/groups/alice': JSON.stringify({ avatar_url: '' }),
    })

    expect(await gitlabEnricher(aliceRef, context)).toEqual([])
  })

  it('should reject when API returns invalid JSON', () => {
    const context = createContext({
      'https://gitlab.com/api/v4/users?username=alice': 'not-json',
    })
    const throwing = () => gitlabEnricher(aliceRef, context)

    expect(throwing()).rejects.toThrow('JSON Parse error: Unexpected identifier "not"')
  })

  it('should reject when fetch throws', () => {
    const fetchFn: FetchFn = () => {
      throw new Error('Network error')
    }
    const throwing = () => gitlabEnricher(aliceRef, { fetchFn })

    expect(throwing()).rejects.toThrow('Network error')
  })

  it('should return empty array when the groups API does not know the name', async () => {
    const context = createContext({
      'https://gitlab.com/api/v4/users?username=alice': JSON.stringify([]),
    })

    expect(await gitlabEnricher(aliceRef, context)).toEqual([])
  })

  it('should reject when the users API response is not 2xx', () => {
    const throwing = () => gitlabEnricher(aliceRef, createContext({}))
    const expected = 'Unexpected status 404 from https://gitlab.com/api/v4/users?username=alice'

    expect(throwing()).rejects.toThrow(expected)
  })

  it('should reject when the groups API fails with a status other than 404', () => {
    const fetchFn: FetchFn = (url) => {
      const isUsersApi = url.includes('/users?')

      return {
        headers: new Headers(),
        body: isUsersApi ? '[]' : '',
        url,
        status: isUsersApi ? 200 : 500,
      }
    }
    const throwing = () => gitlabEnricher(aliceRef, { fetchFn })
    const expected = 'Unexpected status 500 from https://gitlab.com/api/v4/groups/alice'

    expect(throwing()).rejects.toThrow(expected)
  })
})
