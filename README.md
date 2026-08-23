# trellis

A [pi](https://pi.dev) extension.

## Status

Scaffolded. Behavior is ported from a prior project (TODO: link/reference).

## Install

### From this repo (once pushed to GitHub)

```bash
pi install git:github.com/jtaccinelli/trellis
```

Or pin a tag/commit:

```bash
pi install git:github.com/jtaccinelli/trellis@v0.1.0
```

### Local development

```bash
# load for the current run only
pi -e ~/Sites/trellis

# or copy/symlink into auto-discovery for hot-reload via /reload
ln -s ~/Sites/trellis/extensions/index.ts ~/.pi/agent/extensions/trellis.ts
```

## Structure

```
trellis/
├── extensions/
│   └── index.ts      # extension entry point (default factory)
├── package.json      # pi manifest under "pi.extensions"
└── tsconfig.json
```

## Notes

- Runtime deps go in `dependencies`; core pi packages (`@earendil-works/pi-*`, `typebox`)
  should be `peerDependencies` with `"*"` — pi bundles them.
- TypeScript is loaded via [jiti](https://github.com/unjs/jiti), so no build step is needed.
- Extensions run with full system permissions. Review before installing third-party code.
