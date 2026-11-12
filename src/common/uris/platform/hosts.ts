import { parseUrl } from 'trousse'
import type { PlatformHandler } from './types.js'

type HostIndex = {
  handlerCount: number
  handlersByHost: Map<string, Array<PlatformHandler>>
  unboundHandlers: Array<PlatformHandler>
}

const hostIndexes = new WeakMap<Array<PlatformHandler>, HostIndex>()

// The host checks in trousse drop a trailing dot and compare a hostname in its punycode form.
const readHostname = (url: string): string => {
  const hostname = parseUrl(url)?.hostname ?? ''

  return hostname.endsWith('.') ? hostname.slice(0, -1) : hostname
}

const buildHostIndex = (handlers: Array<PlatformHandler>): HostIndex => {
  const handlersByHost = new Map<string, Array<PlatformHandler>>()
  const unboundHandlers: Array<PlatformHandler> = []

  for (const handler of handlers) {
    if (!handler.hosts) {
      unboundHandlers.push(handler)
      continue
    }

    for (const host of handler.hosts) {
      const hostname = readHostname(`http://${host}`)
      const hostHandlers = handlersByHost.get(hostname)

      if (!hostHandlers) {
        handlersByHost.set(hostname, [handler])
        continue
      }

      hostHandlers.push(handler)
    }
  }

  return { handlerCount: handlers.length, handlersByHost, unboundHandlers }
}

const getHostIndex = (handlers: Array<PlatformHandler>): HostIndex => {
  const cached = hostIndexes.get(handlers)

  // A caller can push to its handlers array after the index was built.
  if (cached && cached.handlerCount === handlers.length) {
    return cached
  }

  const index = buildHostIndex(handlers)
  hostIndexes.set(handlers, index)

  return index
}

// The handlers, in their order, that can match a URL: those without hosts and those whose hosts
// hold the URL's hostname or a domain above it.
export const selectHostHandlers = (
  handlers: Array<PlatformHandler>,
  url: string,
): Array<PlatformHandler> => {
  const { handlersByHost, unboundHandlers } = getHostIndex(handlers)
  const boundHandlers = new Set<PlatformHandler>()
  let domain = readHostname(url)

  while (domain) {
    for (const handler of handlersByHost.get(domain) ?? []) {
      boundHandlers.add(handler)
    }

    const dotIndex = domain.indexOf('.')
    domain = dotIndex === -1 ? '' : domain.slice(dotIndex + 1)
  }

  if (boundHandlers.size === 0) {
    return unboundHandlers
  }

  return handlers.filter((handler) => !handler.hosts || boundHandlers.has(handler))
}
