import { describe, expect, it } from 'bun:test'
import { stackExchangeHandler } from './stackExchange.js'

describe('stackExchangeHandler', () => {
  describe('match', () => {
    const cases = [
      ['https://stackoverflow.com/questions/tagged/javascript', true],
      ['https://www.stackoverflow.com/questions/12345', true],
      ['https://serverfault.com/users/123', true],
      ['https://superuser.com/', true],
      ['https://askubuntu.com/questions/tagged/apt', true],
      ['https://stackapps.com/', true],
      ['https://mathoverflow.net/questions/tagged/algebra', true],
      ['https://www.stackoverflow.com/questions/12345', true],
      ['https://meta.stackoverflow.com/', true],
      ['https://es.stackoverflow.com/', true],
      ['https://meta.mathoverflow.net/', true],
      ['https://math.stackexchange.com/questions/tagged/calculus', true],
      ['https://gaming.stackexchange.com/', true],
      ['https://example.com/questions', false],
    ] as const

    it.each(cases)('%s -> %s', (url, expected) => {
      expect(stackExchangeHandler.match(url)).toBe(expected)
    })
  })

  describe('resolve', () => {
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

    it('should return empty array for homepage', () => {
      expect(stackExchangeHandler.resolve('https://stackoverflow.com/')).toEqual([])
    })

    it('should return empty array for unrecognized path', () => {
      expect(stackExchangeHandler.resolve('https://stackoverflow.com/company')).toEqual([])
    })
  })
})
