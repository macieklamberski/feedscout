import type { DiscoverMethod } from '../src/common/types.js'
import { walledStatuses } from './http.js'

export type Uri = { uri: string; method?: DiscoverMethod; isValid: boolean }

export type State =
  | 'discoverable'
  | 'partially'
  | 'not-discoverable'
  | 'inconclusive'
  | 'handler-dead'

export type ShapeResult = {
  shape: string
  url: string
  preflightStatus: number
  botWalled: boolean
  authenticated: boolean
  state: State
  flagged: boolean
  handlerMatched: boolean
  statuses: Array<number>
  reason?: string
  generic: Array<Uri>
  handler: Array<Uri>
}

export type PlatformResult = {
  platform: string
  label: State
  botWalled: boolean
  authenticated: boolean
  shapes: Array<ShapeResult>
}

const valid = (uris: Array<Uri>) => new Set(uris.filter((entry) => entry.isValid).map((e) => e.uri))

// The guess method asks for ten paths that mostly do not exist, so a host that
// answers an unknown path with 403 rather than 404 produces a wall status on
// every shape no matter what was found. A wall only clouds the verdict when it
// could have emptied a set: with both sets populated the comparison stands, and
// the walls landed on paths that were never the answer.
export const decide = (generic: Array<Uri>, handler: Array<Uri>, walled: boolean) => {
  const g = valid(generic)
  const h = valid(handler)

  if (walled && (g.size === 0 || h.size === 0)) {
    return { state: 'inconclusive' as State, flagged: false }
  }

  if (h.size === 0) {
    return { state: 'handler-dead' as State, flagged: false }
  }

  const covered = [...h].filter((uri) => g.has(uri))

  if (covered.length === h.size) {
    return { state: 'discoverable' as State, flagged: false }
  }

  if (covered.length > 0) {
    return { state: 'partially' as State, flagged: false }
  }

  return { state: 'not-discoverable' as State, flagged: g.size > 0 }
}

export const isWalled = (statuses: Array<number>) =>
  statuses.some((status) => status === 0 || walledStatuses.has(status))

const mergeUris = (a: Array<Uri>, b: Array<Uri>): Array<Uri> => {
  const byUri = new Map<string, Uri>()

  for (const entry of [...a, ...b]) {
    const seen = byUri.get(entry.uri)

    // A URI that validated in either pass is valid: a failure to fetch it once
    // says nothing about the feed.
    if (!seen || (entry.isValid && !seen.isValid)) {
      byUri.set(entry.uri, entry)
    }
  }

  return [...byUri.values()].sort((a, b) => a.uri.localeCompare(b.uri))
}

// Two passes, because a wall that clears between them is timing rather than a
// fact about the platform. Evidence is unioned and the shape counts as walled
// only when both passes hit one, so a single clean pass settles the verdict.
export const combine = (first: ShapeResult, second: ShapeResult): ShapeResult => {
  const generic = mergeUris(first.generic, second.generic)
  const handler = mergeUris(first.handler, second.handler)
  const walled = isWalled(first.statuses) && isWalled(second.statuses)

  if (first.reason && second.reason) {
    return { ...first, generic, handler, statuses: [...first.statuses, ...second.statuses] }
  }

  const { state, flagged } = decide(generic, handler, walled)

  return {
    ...(first.reason ? second : first),
    state,
    flagged,
    handlerMatched: first.handlerMatched || second.handlerMatched,
    statuses: [...first.statuses, ...second.statuses],
    generic,
    handler,
    reason: undefined,
  }
}

const labelStates: Array<State> = ['not-discoverable', 'partially', 'discoverable']

// Taking the worst shape would label a platform "not discoverable" while
// generic discovery covers most of its pages, which reads as a flat no to
// someone the comment is meant to inform. A platform is only "not
// discoverable" when generic reaches none of its shapes.
export const platformLabel = (shapes: Array<ShapeResult>): State => {
  const measured = shapes.filter((shape) => labelStates.includes(shape.state))

  if (measured.length === 0) {
    return 'inconclusive'
  }

  if (measured.every((shape) => shape.state === 'discoverable')) {
    return 'discoverable'
  }

  if (measured.every((shape) => shape.state === 'not-discoverable')) {
    return 'not-discoverable'
  }

  return 'partially'
}
