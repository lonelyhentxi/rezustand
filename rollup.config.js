const path = require('path');
const alias = require('@rollup/plugin-alias');
const babelPlugin = require('@rollup/plugin-babel');
const resolve = require('@rollup/plugin-node-resolve');
const replace = require('@rollup/plugin-replace');
const terser = require('@rollup/plugin-terser');
const typescript = require('@rollup/plugin-typescript');
const { default: esbuild } = require('rollup-plugin-esbuild');
const createBabelConfig = require('./babel.config');

const extensions = ['.js', '.ts', '.tsx'];
const { root } = path.parse(process.cwd());

function external(id) {
  return !id.startsWith('.') && !id.startsWith(root);
}

function getBabelOptions(targets) {
  return {
    ...createBabelConfig({ env: (env) => env === 'build' }, targets),
    extensions,
    comments: false,
    babelHelpers: 'bundled',
  };
}

function getEsbuild(target, env = 'development') {
  return esbuild({
    minify: env === 'production',
    target,
    tsconfig: path.resolve('./tsconfig.json'),
  });
}

function createDeclarationConfig(input, output) {
  return {
    input,
    output: {
      dir: output,
    },
    external,
    plugins: [
      typescript({
        declaration: true,
        emitDeclarationOnly: true,
        outDir: output,
      }),
    ],
  };
}

function createESMConfig(input, output) {
  return {
    input,
    output: { file: output, format: 'esm' },
    external,
    plugins: [
      alias({
        entries: {},
      }),
      resolve({ extensions }),
      replace({
        ...(output.endsWith('.js')
          ? {
              'import.meta.env?.MODE': 'process.env.NODE_ENV',
            }
          : {
              'import.meta.env?.MODE':
                '(import.meta.env && import.meta.env.MODE)',
            }),
        delimiters: ['\\b', '\\b(?!(\\.|/))'],
        preventAssignment: true,
      }),
      getEsbuild('node12'),
    ],
  };
}

function createCommonJSConfig(input, output, options) {
  return {
    input,
    output: {
      file: `${output}.js`,
      format: 'cjs',
      esModule: false,
      outro: options.addModuleExport
        ? [
            `module.exports = ${options.addModuleExport.default};`,
            ...Object.entries(options.addModuleExport)
              .filter(([key]) => key !== 'default')
              .map(([key, value]) => `module.exports.${key} = ${value};`),
            `exports.default = module.exports;`,
          ].join('\n')
        : '',
    },
    external,
    plugins: [
      alias({
        entries: {},
      }),
      resolve({ extensions }),
      replace({
        'import.meta.env?.MODE': 'process.env.NODE_ENV',
        delimiters: ['\\b', '\\b(?!(\\.|/))'],
        preventAssignment: true,
      }),
      babelPlugin(getBabelOptions({ ie: 11 })),
    ],
  };
}

function createUMDConfig(input, output, env) {
  let name = 'zustand';
  const fileName = output.slice('dist/umd/'.length);
  const capitalize = (s) => s.slice(0, 1).toUpperCase() + s.slice(1);
  if (fileName !== 'index') {
    name += fileName.replace(/(\w+)\W*/g, (_, p) => capitalize(p));
  }
  return {
    input,
    output: {
      file: `${output}.${env}.js`,
      format: 'umd',
      name,
      globals: {
        react: 'React',
      },
    },
    external,
    plugins: [
      alias({
        entries: {},
      }),
      resolve({ extensions }),
      replace({
        'import.meta.env?.MODE': JSON.stringify(env),
        delimiters: ['\\b', '\\b(?!(\\.|/))'],
        preventAssignment: true,
      }),
      babelPlugin(getBabelOptions({ ie: 11 })),
      ...(env === 'production' ? [terser()] : []),
    ],
  };
}

function createSystemConfig(input, output, env) {
  return {
    input,
    output: {
      file: `${output}.${env}.js`,
      format: 'system',
    },
    external,
    plugins: [
      alias({
        entries: {},
      }),
      resolve({ extensions }),
      replace({
        'import.meta.env?.MODE': JSON.stringify(env),
        delimiters: ['\\b', '\\b(?!(\\.|/))'],
        preventAssignment: true,
      }),
      getEsbuild('node12', env),
    ],
  };
}

module.exports = function (args) {
  let c = Object.keys(args).find((key) => key.startsWith('config-'));
  if (c) {
    c = c.slice('config-'.length).replace(/_/g, '/');
  } else {
    c = 'index';
  }
  return [
    ...(c === 'index' ? [createDeclarationConfig(`src/${c}.ts`, 'dist')] : []),
    createCommonJSConfig(`src/${c}.ts`, `dist/${c}`, {
      // addModuleExport: {
      //   index: {
      //     default: 'index',
      //   },
      // }[c],
    }),
    createESMConfig(`src/${c}.ts`, `dist/esm/${c}.js`),
    createESMConfig(`src/${c}.ts`, `dist/esm/${c}.mjs`),
    createUMDConfig(`src/${c}.ts`, `dist/umd/${c}`, 'development'),
    createUMDConfig(`src/${c}.ts`, `dist/umd/${c}`, 'production'),
    createSystemConfig(`src/${c}.ts`, `dist/system/${c}`, 'development'),
    createSystemConfig(`src/${c}.ts`, `dist/system/${c}`, 'production'),
  ];
};
