import dotenv from "dotenv";
import builtins from "builtin-modules";
import esbuild, { BuildOptions, Plugin } from "esbuild";
import { ensureFile, existsSync } from "fs-extra";
import { createRequire } from "module";
import { basename, dirname, join, resolve } from "path";
import util from "util";
import copyNewer from "copy-newer";

// # Knobs
const prod = process.argv[2] === "prod";
const ARTIFACTS_DIR = "./dist";

const processEnv: { OBSIDIAN_TEST_VAULT?: string } = {};

if (process.argv[2] === "livedev") {
  dotenv.config({ processEnv });
}

// .env takes precedence over NODE_ENV
const OBSIDIAN_TEST_VAULT =
  processEnv?.OBSIDIAN_TEST_VAULT || process.env?.OBSIDIAN_TEST_VAULT;

if (
  (!prod && !OBSIDIAN_TEST_VAULT) ||
  (!prod && !existsSync(OBSIDIAN_TEST_VAULT))
) {
  const message = "Path could not be found. Exiting.";
  logg({ err: `${OBSIDIAN_TEST_VAULT}, ${message}`, message });
  process.exit(1);
}

const originalConfig: BuildOptionSpec = {
  bundle: true,
  color: true,
  entryPoints: {
    main: "src/main.ts",
  },
  external: [
    "obsidian",
    "electron",
    "@codemirror/autocomplete",
    "@codemirror/closebrackets",
    "@codemirror/collab",
    "@codemirror/commands",
    "@codemirror/comment",
    "@codemirror/fold",
    "@codemirror/gutter",
    "@codemirror/highlight",
    "@codemirror/history",
    "@codemirror/language",
    "@codemirror/lint",
    "@codemirror/matchbrackets",
    "@codemirror/panel",
    "@codemirror/rangeset",
    "@codemirror/rectangular-selection",
    "@codemirror/search",
    "@codemirror/state",
    "@codemirror/stream-parser",
    "@codemirror/text",
    "@codemirror/tooltip",
    "@codemirror/view",
    "moment",
    ...builtins,
  ],
  format: "cjs",
  loader: {
    ".png": "dataurl",
    ".jpg": "dataurl",
  },
  logLevel: "info",
  minify: prod,
  outfile: "./dist/main.js",
  plugins: [],
  sourcemap: prod ? false : "inline",
  target: "es2020",
  treeShaking: true,
};

// # helpers
// ## Types

type BuildOptionSpec = BuildOptions;
// eslint-disable-next-line @typescript-eslint/no-unused-vars

/**
 * All Func Specs typically return the DataCarryOverSpec
 */
export type FuncSpec = (
  config: BuildOptionSpec,
  dataCarryover: DataCarryOverSpec
) => DataCarryOverSpec;
export type DataCarryOverSpec = {
  manifestId?: string;
  esbuild_path: string;
  error?: Error | null;
};

export type InitializePipeConfigs = {
  buildOptions: BuildOptions;
  dataCarryOver: DataCarryOverSpec;
};

// A initalize the functions necesary to create a pipe workline. Pipe will be the focus.
export const { Pipe, injectPlugins, apply } = createPipeKit();

Pipe.prototype.tap = function tap(f: FuncSpec) {
  apply(f);
};

// # pipe stages
export function doManifestData() {
  apply((config, dataCarryover) => {
    const require = createRequire(resolve("", dataCarryover.esbuild_path));
    const manifest = require("./manifest.json");
    dataCarryover.manifestId = manifest.id;
    return dataCarryover;
  });
}

export function doMoveArtifactsUsingPlugins() {
  apply((config: BuildOptionSpec, dataCarryover: DataCarryOverSpec) => {
    // if (OBSIDIAN_TEST_VAULT && !prod) {
    if (!dataCarryover?.manifestId) {
      dataCarryover.error = new Error("No manifestid found");
      return dataCarryover;
    }
    const pluginDir = join(
      OBSIDIAN_TEST_VAULT || "",
      ".obsidian/plugins",
      basename(dataCarryover.manifestId)
    );

    const dir = prod ? ARTIFACTS_DIR : pluginDir;
    injectPlugins({
      name: "plugin:move-artifacts",
      setup(build) {
        build.onEnd(copy);
        async function copy() {
          const outDir =
            build?.initialOptions?.outdir ??
            dirname(build?.initialOptions?.outfile || ARTIFACTS_DIR);
          await copyNewer("manifest*.json", dir, {
            verbose: true,
            cwd: ".",
          }).catch(console.log);
          await copyNewer("{main.js,manifest.json,styles.css}", dir, {
            verbose: true,
            cwd: outDir,
          }).catch(console.log);
        }
      },
    });
    // }
    return dataCarryover;
  });
}
export function doHotReload(isHotReload = true): void {
  apply((config, dataCarryover) => {
    const plugin: Plugin = {
      name: "hotreload",
      setup(build) {
        build.onEnd(async () => {
          if (OBSIDIAN_TEST_VAULT) {
            const pluginDir = join(
              OBSIDIAN_TEST_VAULT,
              ".obsidian/plugins",
              basename(dataCarryover.manifestId || "")
            );
            if (isHotReload) await ensureFile(pluginDir + "/.hotreload");
          }
        });
      },
    };
    injectPlugins(plugin);
    return dataCarryover;
  });
}
// ## Default Factories

// ### KNOBS
const ENTRY_POINT = {
  main: "src/main.ts",
};

const ESBUILD_CONFIG_PATH = resolve("./", "esbuild.config.ts");
export function manuInitializePipeConfigs(): InitializePipeConfigs {
  return {
    buildOptions: {
      // entryFile path will be handled by entryFile config within esbuild
      entryPoints: ENTRY_POINT,
      plugins: [],
    },
    dataCarryOver: {
      // esbuild_path is used by createRequire and requires a full path
      esbuild_path: ESBUILD_CONFIG_PATH,
      error: null,
    },
  };
}

// ##

// function extractPathsFromPipeConfigs(
// 	target_specnames: string[],
// 	initialPipeConfigs: ReturnType<typeof manuInitializePipeConfigs>
// ) {}

// function checkPath(path: string) {
// 	return existsSync(path);
// }
/**
 * @desc Initialize Pipe With Required Data
 */
export function createInitializePipe(
  pipeConfigs = manuInitializePipeConfigs()
) {
  return function () {
    doInitializePipe(
      Object.assign({}, manuInitializePipeConfigs(), pipeConfigs)
    );
  };
}
export function doInitializePipe(
  initializePipeConfigs = manuInitializePipeConfigs()
) {
  apply((config, customData) => {
    const { buildOptions, dataCarryOver } = initializePipeConfigs;
    let key: keyof BuildOptionSpec;
    for (key in buildOptions) {
      (config[key] as unknown) = buildOptions[key];
    }
    let customDataKey: keyof DataCarryOverSpec;
    for (customDataKey in dataCarryOver) {
      (customData[customDataKey] as unknown) = dataCarryOver[customDataKey];
    }

    return customData;
  });
}

export function createPipeKit() {
  const config = originalConfig;
  const collectedContext = Object.assign({});

  /**
   * @desc Inverts control so that data configuration can be closer to point of need.
   */
  function apply(f: FuncSpec) {
    return f(config, collectedContext);
  }
  /**
   * @desc Provides quick and dirty webpack-merge-like functionanlity
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  function assign(payload: BuildOptionSpec) {
    apply((config, custom) => {
      Object.assign(config, payload);
      return custom;
    });
  }
  /**
   * @desc Provides plugin injection
   * inserts plugins into esbuild config
   * see https://github.com/evanw/esbuild/blob/4e11b50fe3178ed0a78c077df78788d66304d379/lib/shared/types.ts#L288
   */
  function injectPlugins(...plugins: Plugin[]) {
    apply((config, custom) => {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      config.plugins!.push(...plugins);
      return custom;
    });
  }

  type Easydo = (...args: any) => Promise<void> | void;

  /**
   * Provides quick way to frontload pipe tasks.
   * There is an assumption here that the manifest json wont be hotswapped.
   */
  function getPrimingPipers(): Easydo[] {
    const doCopyManifestToSlab = () =>
      injectPlugins({
        name: "copy-manifest-to-dist",
        setup(build) {
          build.onEnd(async () => {
            const outDir =
              build.initialOptions.outdir ??
              dirname(build.initialOptions.outfile || ARTIFACTS_DIR);
            await copyNewer("manifest*.json", outDir, {
              verbose: true,
              cwd: ".",
            });
          });
        },
      });
    return [doCopyManifestToSlab];
  }

  // Pipeline containing the Taskfn "copy-manifest-to-dist"
  const primers = getPrimingPipers();

  type PipeSpec = {
    devPipers: Easydo[];
    prodPipers: Easydo[];
  };
  // Pipe should be capitlaized here as it is a toolBox constructor
  function Pipe({ devPipers, prodPipers }: PipeSpec) {
    this.devPipers = devPipers;
    this.prodPipers = prodPipers;
    const funcs = prod ? prodPipers : devPipers;
    const _funcs = [...primers, ...funcs];
    for (let i = 0; i < _funcs.length; i++) {
      const func = _funcs[i];
      const isThenable = "AsyncFunction" === func.constructor.name;
      if (isThenable) {
        (async function () {
          await func(originalConfig, collectedContext);
        })();
      } else {
        Object.assign(collectedContext, func());
      }
    }
  }
  // # Api candidates

  return {
    Pipe,
    injectPlugins,
    apply,
  };
}

/**
 * @desc Inverted builder
 */
export function createGenBuild(wrapperConfig = { silent: true }) {
  return async function (config: BuildOptionSpec, custom: DataCarryOverSpec) {
    if (!wrapperConfig.silent) {
      logg(config, custom);
    }
    try {
      await genBuild(config, custom);
    } catch (err) {
      logg(err);
    }
  };
}
export async function genBuild(
  config: BuildOptionSpec,
  custom: DataCarryOverSpec
) {
  const context = await esbuild.context(config).catch((err) => {
    const message = "Esbuild build api error";
    throw new Error(JSON.stringify({ err, message }));
  });
  if (!prod) {
    return await context.watch();
  }
  if (prod) {
    context.rebuild();
    return await context.dispose();
  }
}

// utils
export function logg(...items: any[]) {
  for (const item of items) {
    console.log(util.inspect(item, true, null, true));
  }
}
