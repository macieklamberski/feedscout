import { describe, expect, it } from 'bun:test'
import { combine, decide, platformLabel } from './verdict.js'

const uri = (u: string, isValid = true) => ({ uri: u, method: 'html' as const, isValid })

const shape = (over: Partial<Parameters<typeof combine>[0]> = {}) =>
  ({
    shape: 'profile',
    url: 'https://example.com/a',
    preflightStatus: 200,
    botWalled: false,
    authenticated: false,
    state: 'inconclusive' as const,
    flagged: false,
    handlerMatched: false,
    statuses: [],
    generic: [],
    handler: [],
    ...over,
  }) as Parameters<typeof combine>[0]

describe('decide', () => {
  it('should call a handler redundant when generic found everything it emits', () => {
    expect(decide([uri('https://a/f')], [uri('https://a/f')], false).state).toBe('discoverable')
  })

  it('should ignore a wall when both sides found feeds', () => {
    expect(decide([uri('https://a/f')], [uri('https://a/f')], true).state).toBe('discoverable')
  })

  it('should stay inconclusive when a wall could have emptied generic', () => {
    expect(decide([], [uri('https://a/f')], true).state).toBe('inconclusive')
  })

  it('should call a handler partial when generic found only some of its feeds', () => {
    const result = decide(
      [uri('https://a/one')],
      [uri('https://a/one'), uri('https://a/two')],
      false,
    )

    expect(result.state).toBe('partially')
    expect(result.flagged).toBe(false)
  })

  it('should flag a generic feed the handler does not emit', () => {
    const result = decide([uri('https://a/g')], [uri('https://a/h')], false)

    expect(result.state).toBe('not-discoverable')
    expect(result.flagged).toBe(true)
  })

  it('should report a handler that emits nothing valid as dead', () => {
    expect(decide([uri('https://a/g')], [uri('https://a/h', false)], false).state).toBe(
      'handler-dead',
    )
  })
})

describe('combine', () => {
  it('should let a clean pass settle a shape the other pass could not', () => {
    const walled = shape({ statuses: [403], generic: [], handler: [] })
    const clean = shape({
      statuses: [200],
      generic: [uri('https://a/f')],
      handler: [uri('https://a/f')],
    })

    expect(combine(walled, clean).state).toBe('discoverable')
  })

  it('should keep a URI that validated in either pass', () => {
    const first = shape({
      statuses: [200],
      generic: [uri('https://a/f', false)],
      handler: [uri('https://a/f')],
    })
    const second = shape({
      statuses: [200],
      generic: [uri('https://a/f')],
      handler: [uri('https://a/f')],
    })

    expect(combine(first, second).state).toBe('discoverable')
  })

  it('should stay inconclusive when both passes hit a wall', () => {
    const walled = shape({ statuses: [429], generic: [], handler: [uri('https://a/f')] })

    expect(combine(walled, walled).state).toBe('inconclusive')
  })

  it('should keep the reason when both passes failed to fetch the page', () => {
    const failed = shape({ statuses: [0], reason: 'preflight failed' })

    expect(combine(failed, failed).reason).toBe('preflight failed')
  })
})

describe('platformLabel', () => {
  const at = (state: Parameters<typeof combine>[0]['state']) => shape({ state })

  it('should call a platform discoverable only when every shape is', () => {
    expect(platformLabel([at('discoverable'), at('discoverable')])).toBe('discoverable')
  })

  it('should call a platform partial when generic covers some shapes', () => {
    expect(platformLabel([at('discoverable'), at('not-discoverable')])).toBe('partially')
  })

  it('should call a platform not discoverable only when generic covers none', () => {
    expect(platformLabel([at('not-discoverable'), at('not-discoverable')])).toBe('not-discoverable')
  })

  it('should ignore shapes that carry no verdict', () => {
    expect(platformLabel([at('discoverable'), at('inconclusive'), at('handler-dead')])).toBe(
      'discoverable',
    )
  })

  it('should leave a platform unlabelled when no shape was measured', () => {
    expect(platformLabel([at('inconclusive')])).toBe('inconclusive')
  })
})
