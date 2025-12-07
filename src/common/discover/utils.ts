import locales from '../locales.json' with { type: 'json' }
import type {
  DiscoverFetchFn,
  DiscoverInput,
  DiscoverInputObject,
  DiscoverMethodsConfig,
  DiscoverMethodsConfigDefaults,
  DiscoverMethodsConfigInternal,
} from '../types.js'

export const normalizeInput = async (
  input: DiscoverInput,
  fetchFn: DiscoverFetchFn,
): Promise<DiscoverInputObject> => {
  if (typeof input === 'object') {
    return input
  }

  const response = await fetchFn(input)

  return {
    url: response.url,
    // TODO: Support streams here.
    content: typeof response.body === 'string' ? response.body : '',
    headers: response.headers,
  }
}

export const normalizeMethodsConfig = (
  input: DiscoverInputObject,
  methods: DiscoverMethodsConfig,
  defaults: DiscoverMethodsConfigDefaults,
): DiscoverMethodsConfigInternal => {
  // Step 1: Normalize methods (array → object, true → {}).
  const methodsObj = Array.isArray(methods)
    ? Object.fromEntries(methods.map((method) => [method, true]))
    : methods

  // Step 2: Build internal methods config.
  const methodsConfig: DiscoverMethodsConfigInternal = {}

  if (methodsObj.html) {
    if (input.content === undefined) {
      throw new Error(locales.errors.htmlMethodRequiresContent)
    }

    const htmlOptions = methodsObj.html === true ? {} : methodsObj.html

    methodsConfig.html = {
      html: input.content,
      options: {
        ...defaults.html,
        ...htmlOptions,
        baseUrl: input.url,
      },
    }
  }

  if (methodsObj.headers) {
    if (input.headers === undefined) {
      throw new Error(locales.errors.headersMethodRequiresHeaders)
    }

    const headersOptions = methodsObj.headers === true ? {} : methodsObj.headers

    methodsConfig.headers = {
      headers: input.headers,
      options: {
        ...defaults.headers,
        ...headersOptions,
        baseUrl: input.url,
      },
    }
  }

  if (methodsObj.guess) {
    if (!input.url || input.url === '') {
      throw new Error(locales.errors.guessMethodRequiresUrl)
    }

    const guessOptions = methodsObj.guess === true ? {} : methodsObj.guess

    methodsConfig.guess = {
      options: {
        ...defaults.guess,
        ...guessOptions,
        baseUrl: input.url,
      },
    }
  }

  return methodsConfig
}
