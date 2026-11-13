import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry, DiscoverUriHint } from '../../common/types.js'
import { discoverUrisFromPlatform } from '../../common/uris/platform/index.js'
import { defaultPlatformOptions } from '../defaults.js'
import {
  parseStackExchangeUrl,
  type StackExchangeUrl,
  stackExchangeHandler,
} from './stackExchange.js'

describe('parseStackExchangeUrl', () => {
  it('should return the tag with its sort for a tag page', () => {
    const value = 'https://stackoverflow.com/questions/tagged/javascript?tab=Newest'
    const expected: StackExchangeUrl = { kind: 'tag', tag: 'javascript', sort: 'newest' }

    expect(parseStackExchangeUrl(value)).toEqual(expected)
  })

  it('should return a percent-encoded tag whole', () => {
    const expected: StackExchangeUrl = { kind: 'tag', tag: 'c%23', sort: undefined }

    expect(parseStackExchangeUrl('https://stackoverflow.com/questions/tagged/c%23')).toEqual(
      expected,
    )
  })

  it('should return the question for a question page', () => {
    const expected: StackExchangeUrl = { kind: 'question', questionId: '12345' }

    expect(parseStackExchangeUrl('https://stackoverflow.com/questions/12345/title')).toEqual(
      expected,
    )
  })

  it('should return the user for a user page', () => {
    const expected: StackExchangeUrl = { kind: 'user', userId: '42' }

    expect(parseStackExchangeUrl('https://superuser.com/users/42/name')).toEqual(expected)
  })

  it('should return a one-digit question id whole', () => {
    const expected: StackExchangeUrl = { kind: 'question', questionId: '1' }

    expect(parseStackExchangeUrl('https://stackoverflow.com/questions/1')).toEqual(expected)
  })

  it('should return undefined for a question id with a letter', () => {
    expect(parseStackExchangeUrl('https://stackoverflow.com/questions/12345abc')).toBeUndefined()
  })

  it('should return a one-digit user id whole', () => {
    const expected: StackExchangeUrl = { kind: 'user', userId: '1' }

    expect(parseStackExchangeUrl('https://superuser.com/users/1')).toEqual(expected)
  })

  it('should return undefined for a user id with a letter', () => {
    expect(parseStackExchangeUrl('https://superuser.com/users/42abc')).toBeUndefined()
  })

  it('should return the collective for a collective page', () => {
    const expected: StackExchangeUrl = { kind: 'collective', collective: 'google-cloud' }

    expect(parseStackExchangeUrl('https://stackoverflow.com/collectives/google-cloud')).toEqual(
      expected,
    )
  })

  it('should return the home page for the root', () => {
    const expected: StackExchangeUrl = { kind: 'home' }

    expect(parseStackExchangeUrl('https://unix.stackexchange.com/')).toEqual(expected)
  })

  it('should return undefined for another page', () => {
    expect(parseStackExchangeUrl('https://stackoverflow.com/help')).toBeUndefined()
  })

  it('should return the home page for the network host', () => {
    const expected: StackExchangeUrl = { kind: 'home' }

    expect(parseStackExchangeUrl('https://stackexchange.com/')).toEqual(expected)
  })

  it('should return undefined for a user on the network host', () => {
    expect(parseStackExchangeUrl('https://stackexchange.com/users/12345/example')).toBeUndefined()
  })

  it('should return undefined for another host', () => {
    expect(parseStackExchangeUrl('https://example.com/questions/12345')).toBeUndefined()
  })
})

describe('stackExchangeHandler', () => {
  describe('match', () => {
    const values: Array<[boolean, string]> = [
      [true, 'https://stackoverflow.com/questions/tagged/javascript'],
      [true, 'https://www.stackoverflow.com/questions/12345'],
      [true, 'https://serverfault.com/users/123'],
      [true, 'https://superuser.com/'],
      [true, 'https://askubuntu.com/questions/tagged/apt'],
      [true, 'https://stackapps.com/'],
      [true, 'https://mathoverflow.net/questions/tagged/algebra'],
      [true, 'https://meta.stackoverflow.com/'],
      [true, 'https://es.stackoverflow.com/'],
      [true, 'https://meta.mathoverflow.net/'],
      [true, 'https://math.stackexchange.com/questions/tagged/calculus'],
      [true, 'https://gaming.stackexchange.com/'],
      [false, 'https://example.com/questions'],
    ]

    it.each(values)('should return %s for %s', (expected, url) => {
      expect(stackExchangeHandler.match(url)).toBe(expected)
    })

    it('should return false for invalid URL', () => {
      expect(stackExchangeHandler.match('not-a-url')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return empty array for a URL outside Stack Exchange', () => {
      expect(stackExchangeHandler.resolve('https://example.com/')).toEqual([])
    })

    it('should return tag feed for tag page on Stack Overflow', () => {
      const value = 'https://stackoverflow.com/questions/tagged/javascript'
      const expected = [
        {
          uri: 'https://stackoverflow.com/feeds/tag/javascript',
          hint: { key: 'stackexchange:tag', label: 'Tag' },
        },
      ]

      expect(stackExchangeHandler.resolve(value)).toEqual(expected)
    })

    it('should return tag feed for tag page on Stack Overflow with a capitalized questions segment', () => {
      const value = 'https://stackoverflow.com/Questions/tagged/javascript'
      const expected = [
        {
          uri: 'https://stackoverflow.com/feeds/tag/javascript',
          hint: { key: 'stackexchange:tag', label: 'Tag' },
        },
      ]

      expect(stackExchangeHandler.resolve(value)).toEqual(expected)
    })

    it('should return tag feed for combined tags on Stack Overflow', () => {
      const value = 'https://stackoverflow.com/questions/tagged/javascript+typescript'
      const expected = [
        {
          uri: 'https://stackoverflow.com/feeds/tag/javascript+typescript',
          hint: { key: 'stackexchange:tag', label: 'Tag' },
        },
      ]

      expect(stackExchangeHandler.resolve(value)).toEqual(expected)
    })

    it('should return question feed for question page on Stack Overflow', () => {
      const value = 'https://stackoverflow.com/questions/12345/how-to-do-something'
      const expected = [
        {
          uri: 'https://stackoverflow.com/feeds/question/12345',
          hint: { key: 'stackexchange:question', label: 'Question' },
        },
      ]

      expect(stackExchangeHandler.resolve(value)).toEqual(expected)
    })

    it('should return question feed for question page on Stack Overflow with a capitalized questions segment', () => {
      const value = 'https://stackoverflow.com/Questions/12345/how-to-do-something'
      const expected = [
        {
          uri: 'https://stackoverflow.com/feeds/question/12345',
          hint: { key: 'stackexchange:question', label: 'Question' },
        },
      ]

      expect(stackExchangeHandler.resolve(value)).toEqual(expected)
    })

    it('should return user feed for user page on Stack Overflow', () => {
      const value = 'https://stackoverflow.com/users/123/username'
      const expected = [
        {
          uri: 'https://stackoverflow.com/feeds/user/123',
          hint: { key: 'stackexchange:user', label: 'User' },
        },
      ]

      expect(stackExchangeHandler.resolve(value)).toEqual(expected)
    })

    it('should return user feed for user page on Stack Overflow with a capitalized users segment', () => {
      const value = 'https://stackoverflow.com/Users/123/username'
      const expected = [
        {
          uri: 'https://stackoverflow.com/feeds/user/123',
          hint: { key: 'stackexchange:user', label: 'User' },
        },
      ]

      expect(stackExchangeHandler.resolve(value)).toEqual(expected)
    })

    it('should return tag feed with correct origin for Stack Exchange subdomain', () => {
      const value = 'https://math.stackexchange.com/questions/tagged/calculus'
      const expected = [
        {
          uri: 'https://math.stackexchange.com/feeds/tag/calculus',
          hint: { key: 'stackexchange:tag', label: 'Tag' },
        },
      ]

      expect(stackExchangeHandler.resolve(value)).toEqual(expected)
    })

    it('should return question feed for question page on Server Fault', () => {
      const value = 'https://serverfault.com/questions/98765/some-question'
      const expected = [
        {
          uri: 'https://serverfault.com/feeds/question/98765',
          hint: { key: 'stackexchange:question', label: 'Question' },
        },
      ]

      expect(stackExchangeHandler.resolve(value)).toEqual(expected)
    })

    it('should return user feed for user page on Ask Ubuntu', () => {
      const value = 'https://askubuntu.com/users/456/username'
      const expected = [
        {
          uri: 'https://askubuntu.com/feeds/user/456',
          hint: { key: 'stackexchange:user', label: 'User' },
        },
      ]

      expect(stackExchangeHandler.resolve(value)).toEqual(expected)
    })

    it('should return question feed for question page on MathOverflow', () => {
      const value = 'https://mathoverflow.net/questions/54321/some-question'
      const expected = [
        {
          uri: 'https://mathoverflow.net/feeds/question/54321',
          hint: { key: 'stackexchange:question', label: 'Question' },
        },
      ]

      expect(stackExchangeHandler.resolve(value)).toEqual(expected)
    })

    it('should return site-wide newest feed for homepage', () => {
      const value = 'https://stackoverflow.com/'
      const expected = [
        {
          uri: 'https://stackoverflow.com/feeds',
          hint: { key: 'stackexchange:newest', label: 'Newest questions' },
        },
      ]

      expect(stackExchangeHandler.resolve(value)).toEqual(expected)
    })

    it('should return site-wide newest feed for subdomain homepage', () => {
      const value = 'https://math.stackexchange.com/'
      const expected = [
        {
          uri: 'https://math.stackexchange.com/feeds',
          hint: { key: 'stackexchange:newest', label: 'Newest questions' },
        },
      ]

      expect(stackExchangeHandler.resolve(value)).toEqual(expected)
    })

    it('should return collective feed for collectives page', () => {
      const value = 'https://stackoverflow.com/collectives/aws'
      const expected = [
        {
          uri: 'https://stackoverflow.com/feeds/collectives/aws',
          hint: { key: 'stackexchange:collective', label: 'Collective' },
        },
      ]

      expect(stackExchangeHandler.resolve(value)).toEqual(expected)
    })

    it('should return collective feed for collectives page with a capitalized collectives segment', () => {
      const value = 'https://stackoverflow.com/Collectives/aws'
      const expected = [
        {
          uri: 'https://stackoverflow.com/feeds/collectives/aws',
          hint: { key: 'stackexchange:collective', label: 'Collective' },
        },
      ]

      expect(stackExchangeHandler.resolve(value)).toEqual(expected)
    })

    const allowedSortValues: Array<[string, Array<DiscoverUriEntry>]> = [
      [
        'https://stackoverflow.com/questions/tagged/javascript?sort=newest',
        [
          {
            uri: 'https://stackoverflow.com/feeds/tag/javascript?sort=newest',
            hint: { key: 'stackexchange:tag', label: 'Tag' },
          },
        ],
      ],
      [
        'https://stackoverflow.com/questions/tagged/javascript?sort=active',
        [
          {
            uri: 'https://stackoverflow.com/feeds/tag/javascript?sort=active',
            hint: { key: 'stackexchange:tag', label: 'Tag' },
          },
        ],
      ],
      [
        'https://stackoverflow.com/questions/tagged/javascript?sort=votes',
        [
          {
            uri: 'https://stackoverflow.com/feeds/tag/javascript?sort=votes',
            hint: { key: 'stackexchange:tag', label: 'Tag' },
          },
        ],
      ],
      [
        'https://stackoverflow.com/questions/tagged/javascript?sort=creation',
        [
          {
            uri: 'https://stackoverflow.com/feeds/tag/javascript?sort=creation',
            hint: { key: 'stackexchange:tag', label: 'Tag' },
          },
        ],
      ],
      [
        'https://stackoverflow.com/questions/tagged/javascript?sort=month',
        [
          {
            uri: 'https://stackoverflow.com/feeds/tag/javascript?sort=month',
            hint: { key: 'stackexchange:tag', label: 'Tag' },
          },
        ],
      ],
    ]

    it.each(allowedSortValues)(
      'should pass through allowed ?sort= value for %s',
      (url, expected) => {
        expect(stackExchangeHandler.resolve(url)).toEqual(expected)
      },
    )

    it('should pass through ?tab= on tag feed (lowercased) when value is allowed', () => {
      const value = 'https://stackoverflow.com/questions/tagged/javascript?tab=Active'
      const expected = [
        {
          uri: 'https://stackoverflow.com/feeds/tag/javascript?sort=active',
          hint: { key: 'stackexchange:tag', label: 'Tag' },
        },
      ]

      expect(stackExchangeHandler.resolve(value)).toEqual(expected)
    })

    it('should spell a ?sort= value in another case as Stack Exchange does', () => {
      const value = 'https://stackoverflow.com/questions/tagged/javascript?sort=Newest'
      const expected = [
        {
          uri: 'https://stackoverflow.com/feeds/tag/javascript?sort=newest',
          hint: { key: 'stackexchange:tag', label: 'Tag' },
        },
      ]

      expect(stackExchangeHandler.resolve(value)).toEqual(expected)
    })

    it('should pass through hot sort', () => {
      const value = 'https://stackoverflow.com/questions/tagged/javascript?sort=hot'
      const expected = [
        {
          uri: 'https://stackoverflow.com/feeds/tag/javascript?sort=hot',
          hint: { key: 'stackexchange:tag', label: 'Tag' },
        },
      ]

      expect(stackExchangeHandler.resolve(value)).toEqual(expected)
    })

    it('should pass through week sort', () => {
      const value = 'https://stackoverflow.com/questions/tagged/javascript?sort=week'
      const expected = [
        {
          uri: 'https://stackoverflow.com/feeds/tag/javascript?sort=week',
          hint: { key: 'stackexchange:tag', label: 'Tag' },
        },
      ]

      expect(stackExchangeHandler.resolve(value)).toEqual(expected)
    })

    it('should drop disallowed ?tab= values silently', () => {
      const value = 'https://stackoverflow.com/questions/tagged/javascript?tab=Frequent'
      const expected = [
        {
          uri: 'https://stackoverflow.com/feeds/tag/javascript',
          hint: { key: 'stackexchange:tag', label: 'Tag' },
        },
      ]

      expect(stackExchangeHandler.resolve(value)).toEqual(expected)
    })

    it('should drop unknown sort values silently', () => {
      const value = 'https://stackoverflow.com/questions/tagged/javascript?sort=garbage'
      const expected = [
        {
          uri: 'https://stackoverflow.com/feeds/tag/javascript',
          hint: { key: 'stackexchange:tag', label: 'Tag' },
        },
      ]

      expect(stackExchangeHandler.resolve(value)).toEqual(expected)
    })

    it('should return empty array for unrecognized path', () => {
      expect(stackExchangeHandler.resolve('https://stackoverflow.com/company')).toEqual([])
    })
  })

  describe('getFeedHint', () => {
    it('should return the tag hint for a tag feed', () => {
      const value = 'https://askubuntu.com/feeds/tag/shadow'
      const expected: DiscoverUriHint = { key: 'stackexchange:tag', label: 'Tag' }

      expect(stackExchangeHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the tag hint for a sorted tag feed', () => {
      const value = 'https://stackoverflow.com/feeds/tag/javascript?sort=newest'
      const expected: DiscoverUriHint = { key: 'stackexchange:tag', label: 'Tag' }

      expect(stackExchangeHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the tag hint for a percent-encoded tag feed', () => {
      const value = 'https://stackoverflow.com/feeds/tag/c%23'
      const expected: DiscoverUriHint = { key: 'stackexchange:tag', label: 'Tag' }

      expect(stackExchangeHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the question hint for a question feed', () => {
      const value = 'https://askubuntu.com/feeds/question/282319'
      const expected: DiscoverUriHint = { key: 'stackexchange:question', label: 'Question' }

      expect(stackExchangeHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the user hint for a user feed', () => {
      const value = 'https://askubuntu.com/feeds/user/1193941'
      const expected: DiscoverUriHint = { key: 'stackexchange:user', label: 'User' }

      expect(stackExchangeHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the collective hint for a collective feed', () => {
      const value = 'https://stackoverflow.com/feeds/collectives/aws'
      const expected: DiscoverUriHint = { key: 'stackexchange:collective', label: 'Collective' }

      expect(stackExchangeHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the newest hint for the site feed', () => {
      const value = 'https://askubuntu.com/feeds'
      const expected: DiscoverUriHint = { key: 'stackexchange:newest', label: 'Newest questions' }

      expect(stackExchangeHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the newest hint for the site feed on a subdomain of an apex site', () => {
      const value = 'https://meta.stackoverflow.com/feeds'
      const expected: DiscoverUriHint = { key: 'stackexchange:newest', label: 'Newest questions' }

      expect(stackExchangeHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the newest hint for the site feed of a site meta', () => {
      const value = 'https://music.meta.stackexchange.com/feeds'
      const expected: DiscoverUriHint = { key: 'stackexchange:newest', label: 'Newest questions' }

      expect(stackExchangeHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return undefined for the site feed on a nested subdomain', () => {
      const value = 'https://chat.music.meta.stackexchange.com/feeds'

      expect(stackExchangeHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return the newest hint for the network feed', () => {
      const value = 'https://stackexchange.com/feeds'
      const expected: DiscoverUriHint = { key: 'stackexchange:newest', label: 'Newest questions' }

      expect(stackExchangeHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return undefined for a user feed on the network host', () => {
      const value = 'https://stackexchange.com/feeds/user/12345'

      expect(stackExchangeHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for a feed below a user feed', () => {
      const value = 'https://askubuntu.com/feeds/user/93023/responses'

      expect(stackExchangeHandler.getFeedHint?.(value)).toBeUndefined()
    })

    const otherFeeds: Array<[string, DiscoverUriHint]> = [
      [
        'https://apple.stackexchange.com/feeds/week',
        { key: 'stackexchange:newest', label: 'Newest questions' },
      ],
      [
        'https://apple.stackexchange.com/feeds/month',
        { key: 'stackexchange:newest', label: 'Newest questions' },
      ],
      [
        'https://stackoverflow.com/feeds/tag?sort=newest&tagnames=javascript',
        { key: 'stackexchange:tag', label: 'Tag' },
      ],
      [
        'https://ru.meta.stackoverflow.com/feeds/question/12345',
        { key: 'stackexchange:question', label: 'Question' },
      ],
      [
        'https://music.meta.stackexchange.com/feeds/user/12345',
        { key: 'stackexchange:user', label: 'User' },
      ],
      [
        'https://chat.stackexchange.com/feeds/rooms/starred/12345',
        { key: 'stackexchange:chat-starred', label: 'Starred chat messages' },
      ],
      [
        'https://area51.stackexchange.com/feeds/proposal/12345',
        { key: 'stackexchange:proposal', label: 'Area 51 proposal' },
      ],
      [
        'https://stackexchange.com/feeds/tagsets/12345/example?sort=newest',
        { key: 'stackexchange:tagset', label: 'Tag set' },
      ],
    ]

    it.each(otherFeeds)('should return the hint for %s', (value, expected) => {
      expect(stackExchangeHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return undefined for a page', () => {
      const value = 'https://askubuntu.com/questions/282319'

      expect(stackExchangeHandler.getFeedHint?.(value)).toBeUndefined()
    })
  })
})

describe('discoverUrisFromPlatform', () => {
  const ownFeeds: Array<[string, string, string]> = [
    ['https://askubuntu.com/feeds/question/282319', 'stackexchange:question', 'Question'],
    ['https://askubuntu.com/feeds/user/1193941', 'stackexchange:user', 'User'],
    ['https://askubuntu.com/feeds/tag/shadow', 'stackexchange:tag', 'Tag'],
    ['https://stackoverflow.com/feeds/tag/javascript?sort=newest', 'stackexchange:tag', 'Tag'],
    ['https://stackoverflow.com/feeds/collectives/aws', 'stackexchange:collective', 'Collective'],
    ['https://askubuntu.com/feeds', 'stackexchange:newest', 'Newest questions'],
    ['https://stackexchange.com/feeds', 'stackexchange:newest', 'Newest questions'],
    ['http://apple.stackexchange.com/feeds/week/', 'stackexchange:newest', 'Newest questions'],
    ['https://stackoverflow.com/feeds/tag?tagnames=c%2B%2B', 'stackexchange:tag', 'Tag'],
    [
      'https://ru.meta.stackoverflow.com/feeds/question/12345',
      'stackexchange:question',
      'Question',
    ],
    [
      'http://chat.stackexchange.com/feeds/rooms/starred/12345',
      'stackexchange:chat-starred',
      'Starred chat messages',
    ],
    [
      'https://area51.stackexchange.com/feeds/proposal/12345',
      'stackexchange:proposal',
      'Area 51 proposal',
    ],
    [
      'https://stackexchange.com/feeds/tagsets/12345/example?sort=newest',
      'stackexchange:tagset',
      'Tag set',
    ],
  ]

  it.each(ownFeeds)('should return %s itself as %s', async (value, key, label) => {
    const options = {
      ...defaultPlatformOptions,
      handlers: [stackExchangeHandler],
      baseUrl: value,
    }
    const expected: Array<DiscoverUriEntry> = [{ uri: value, hint: { key, label } }]

    expect(await discoverUrisFromPlatform(undefined, undefined, options)).toEqual(expected)
  })
})
