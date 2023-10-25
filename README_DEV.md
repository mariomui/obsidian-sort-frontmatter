# Developers Manual

## Summary

The goal of this plugin from a developer's point of view is to create a practical starting point for the development of Markdown Typing. Alphabetizing and sorting the various yaml properties is a good first step in this endeavor.

A thin DSL wrapper is used to wrap esbuild (see fophidian.ts) to create a psuedo Fluent-interface control over how the plugins and pipeline steps are triggered.

### Types

```ts
export type Literal = number | string | unknown;
export type PluralLiteral<T> = T[] | Record<string, T>;
export type Variant = Literal | PluralLiteral<Literal>;

export type RecurseVariant =
  | PluralLiteral<Variant>
  | Record<string, Variant>
  | Literal;
```

The typing above the values that get parsed, and sorted into an object.

## Implementation

The plugin uses `this.app.vault.process` to read the filecontents, before applying custom code to separate the frontmatter from the content portion--much of the code was reverse engineered from
existing code that belongs to `this.app.vault.processFrontmater`. In fact, the core of this plugin is a customized version of processFrontmatter with sorting capability.

After reading the yaml into an object, a custom recursive walking algorithm that defaults to 8 levels of recursion starts to sort. (I've set it to 5 in runtime as well as supplied a defacto sortBy algorithm)

- The parser class houses 3 functions:
  - splitIntoFrontMatterAndContents;
    - 💁 Takes the file contents and split them up into two.
  - replaceFileContentsWithSortedFrontMatter
    - 💁 Takes the split stuff, and applies recursion (using recurseVariant)
  - convertObjToYaml;
  -

The functions are placed on the function prototype object because it's easier to test when the function implementation is outside of a class.

### Running The Plugin

- Set a .env using .env.example as a guide.
- Enable hot reload plugin from pjeby in ObsidianMD-app
- `pnpm i`
- Open the vault, the one pointed to by your .env file
- `pnpm livedev`
- Enable `Sort Frontmatter` plugin in dev vault
- See [[README.md]] for usage details

### Running Tests

`pnpm jest:watch`

### Versioning (WIP)

- Update your `manifest.json` using semantic versioning
- Update your `versions.json` file with `"new-plugin-version": "minimum-obsidian-version"` so older versions of Obsidian can download an older version of your plugin that's compatible.
- Create new GitHub release using your new version number as the "Tag version". Use the exact version number, don't include a prefix `v`. See here for an example: <https://github.com/obsidianmd/obsidian-sample-plugin/releases>
- Upload the files `manifest.json`, `main.js`, `styles.css` as binary attachments.
- > [!Note]: The manifest.json file must be in two places, first the root path of your repository and also in the release.
- Publish the release.

* [ ] Create gulp or esbuild automation with auto-changelog to deal with versioning
  > You can simplify the version bump process by running `npm version patch`, `npm version minor` or `npm version major` after updating `minAppVersion` manually in `manifest.json`.
  > The command will bump version in `manifest.json` and `package.json`, and add the entry for the new version to `versions.json`

### Linting

#### Eslint (WIP)

#### Prettier (WIP)

### Automation (WIP)

#### Husky (WIP)

#### Git Actions (WIP)

##### Adding your plugin to the community plugin list (WIP)

- Check <https://github.com/obsidianmd/obsidian-releases/blob/master/plugin-review.md>
- Publish an initial version.
- Make sure you have a `README.md` file in the root of your repo.
- Make a pull request at <https://github.com/obsidianmd/obsidian-releases> to add your plugin.

---

## Tradeoffs

### Challenges

Because obsidian code is not available to jest testing, importing code will run an error (since it is non existent). The `yaml` dependency is used to fulfill the same function as parseYaml. The trick is to swap obsidian api with existing code so that the tests work.

It would be far easier to runn all this code as commonjs, utilize webpack and babel-jest for advanced tree-shaking but the current esbuild/ts-jest/esbuildkit rollout has less pain points, and a more seamless integration with typescript.

There were three ways of creating obsidian support for jest. The links are below.
The easiest one was to mock obsidian functions with npm packages. The hardest one by far is to create your own runtime and module resolver as a preset to handle the missing functions. A custom preset would be the most scalable, and a nice stable platform to rewrite some of the core obsidian apis. Much of the strategies used below are beyond me---there's even one that implements a custom preset and a websocket server queue! Why? I dunnow.

- https://github.com/obsidian-tasks-group/obsidian-tasks/blob/main/tests/Suggestor/Suggestor.test.ts
- https://github.com/vslinko/obsidian-outliner/blob/main/jest/obsidian-environment.js
- https://github.com/eth-p/jest-environment-obsidian
- https://www.youtube.com/watch?v=3YDiloj8_d0&ab_channel=ChristophNakazawa

### Prospects

The functions are fairly deterministic and each would be fairly easily turned into clis. In fact, the composability of clis often make it a better design decision to be cli-first, allowing one to avoid undue coupling that Typescript often encourages.
.

#### Funding URL

You can include funding URLs where people who use your plugin can financially support it.

The simple way is to set the `fundingUrl` field to your link in your `manifest.json` file:

```json
{
  "fundingUrl": "https://buymeacoffee.com"
}
```

If you have multiple URLs, you can also do:

```json
{
  "fundingUrl": {
    "Buy Me a Coffee": "https://buymeacoffee.com",
    "GitHub Sponsor": "https://github.com/sponsors",
    "Patreon": "https://www.patreon.com/"
  }
}
```
