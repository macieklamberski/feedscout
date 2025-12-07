---
outline: 2
prev: HTTP Adapters
next: URL Normalization
---

# Custom Extractors

By default, Feedscout uses [Feedsmith](https://feedsmith.dev) to parse and validate discovered feed URLs. You can provide a custom extractor to change how feeds are validated or to extract additional metadata.

## How Extractors Work

After discovering potential feed URLs, Feedscout fetches each URL and passes the content to an extractor function. The extractor determines if the content is a valid feed and extracts metadata. See the [DiscoverExtractFn](/reference/types#discoverextractfn) type for the interface.

## Use Cases

Custom extractors can be used for:

- **Adding custom metadata** — Extract additional fields like language, images, or items
- **Custom validation** — Reject feeds with no items, old feeds, or based on other criteria
- **Using a different parser** — Replace the default Feedsmith parser with another library
- **Blogroll extractors** — Custom extractors also work with `discoverBlogrolls`

## Example

```typescript
import type { DiscoverExtractFn, DiscoverResult } from 'feedscout'
import { parseFeed } from 'feedsmith'

type CustomFeedResult = {
  format: string
  title?: string
  itemCount: number
}

const customExtractor: DiscoverExtractFn<CustomFeedResult> = async ({ url, content }) => {
  try {
    const { format, feed } = parseFeed(content)

    return {
      url,
      isValid: true,
      format,
      title: feed.title,
      itemCount: feed.items?.length ?? 0,
    }
  } catch (error) {
    return { url, isValid: false, error }
  }
}

const feeds = await discoverFeeds(url, {
  methods: ['html', 'guess'],
  extractFn: customExtractor,
})

// [{
//   url: 'https://example.com/feed.xml',
//   isValid: true,
//   format: 'rss',
//   title: 'Example Blog',
//   itemCount: 10,
// }]
```
