# Contributing

Thanks for helping! Issues labelled **good first issue** are a friendly place to start.

```bash
git clone https://github.com/TigranZakharyan/react-mcp-chatbot
cd react-mcp-chatbot
npm install
npm run typecheck && npm test      # unit tests use mocked providers – no API keys needed
cd demo && npm install && npm run dev
```

- Add or update tests in `test/` for behaviour changes.
- Add a line to `CHANGELOG.md` under an "Unreleased" heading.
- We follow [Semantic Versioning](https://semver.org/): breaking changes only in major releases.
- Please never commit API keys.
