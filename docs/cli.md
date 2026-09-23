---
title: CLI
---

# CLI

Feedscout ships a `feedscout` command that runs the discover functions from a terminal and prints the results as JSON. It is useful for checking what a site exposes before writing any code, or for scripting discovery in a shell.

## Usage

Run it without installing:

::: code-group

```bash [npm]
npx feedscout feeds https://example.com
```

```bash [yarn]
yarn dlx feedscout feeds https://example.com
```

```bash [pnpm]
pnpm dlx feedscout feeds https://example.com
```

```bash [bun]
bunx feedscout feeds https://example.com
```

:::

Or install the package and call `feedscout` directly:

```bash
feedscout <command> <url> [options]
```

## Commands

Each command calls one discover function with the given URL.

| Command | Function | Methods |
|---------|----------|---------|
| `feeds` | [`discoverFeeds`](/reference/discover-feeds) | `platform`, `html`, `headers`, `guess` |
| `blogrolls` | [`discoverBlogrolls`](/reference/discover-blogrolls) | `html`, `headers`, `guess` |
| `favicons` | [`discoverFavicons`](/reference/discover-favicons) | `platform`, `feed`, `html`, `headers`, `guess` |
| `hubs` | [`discoverHubs`](/reference/discover-hubs) | `headers`, `feed`, `html` |

## Options

Each flag maps to an option of the discover function.

| Flag | Option | Description |
|------|--------|-------------|
| `--methods <list>` | `methods` | Comma-separated methods, from the command's list above |
| `--concurrency <n>` | `concurrency` | Max parallel validations, a positive integer |
| `--stop-on-first` | `stopOnFirstResult` | Stop after the first valid result |
| `--stop-on-first-method` | `stopOnFirstMethod` | Stop after the first method with results |
| `--include-invalid` | `includeInvalid` | Include invalid results |
| `-h`, `--help` | | Show help |

`hubs` accepts only `--methods`. The other flags print a warning and the run continues without them.

## Output

Results go to stdout as a JSON array, in the same shape the discover function returns. With `--include-invalid`, the `error` of an invalid result is printed as its message. When nothing is found, the output is an empty array.

While discovery runs in a terminal, progress is shown on stderr. Stdout stays pure JSON, so the output can be piped to other tools:

```bash
npx feedscout feeds https://example.com | jq -r '.[].url'
```

## Examples

Find feeds using only the HTML and headers methods:

```bash
npx feedscout feeds https://example.com --methods html,headers

# [{
#   "url": "https://example.com/feed.xml",
#   "isValid": true,
#   "format": "rss",
#   "title": "Example Blog",
#   "siteUrl": "https://example.com/",
#   "method": "html"
# }]
```

Get the first favicon and stop:

```bash
npx feedscout favicons https://example.com --stop-on-first

# [{
#   "url": "https://example.com/apple-touch-icon.png",
#   "isValid": true,
#   "method": "html"
# }]
```

Find the WebSub hub of a feed:

```bash
npx feedscout hubs https://example.com/feed.xml

# [{
#   "hub": "https://pubsubhubbub.appspot.com",
#   "topic": "https://example.com/feed.xml"
# }]
```

## Exit Codes

| Code | Meaning |
|------|---------|
| `0` | Discovery finished, even with no results |
| `1` | Invalid arguments, an unknown command or method, or discovery failed |
