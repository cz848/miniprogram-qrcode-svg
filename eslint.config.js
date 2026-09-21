import { configs, plugins } from 'eslint-config-airbnb-extended';
import promise from 'eslint-plugin-promise';

export default [
  // 插件注册
  plugins.stylistic,
  plugins.importX,
  // airbnb 基础规则
  ...configs.base.recommended,
  // promise 推荐规则
  promise.configs['flat/recommended'],
  {
    languageOptions: {
      // 使用es模块
      sourceType: 'module',
      parserOptions: {
        // 指定es版本
        ecmaVersion: 2019,
      },
      globals: {
        // for 小程序全局变量
        App: 'writable',
        Page: 'writable',
        Component: 'readonly',
        getApp: 'writable',
        getCurrentPages: 'readonly',
        Behavior: 'readonly',
        requirePlugin: 'writable',
        getDate: 'writable',
        getRegExp: 'writable',
        wx: 'writable',
        my: 'writable',
        swan: 'writable',
        tt: 'writable',
      },
    },
  },
  {
    // 配置文件运行于 Node 环境
    files: ['eslint.config.js'],
    languageOptions: {
      globals: {
        process: 'readonly',
      },
    },
  },
  {
    rules: {
      // 要求箭头函数的参数在需要时使用圆括号
      '@stylistic/arrow-parens': ['error', 'as-needed'],
      // 允许函数根据代码分支有不同的return行为
      'consistent-return': 'off',
      // 要求或禁止命名的 function 表达式
      'func-names': ['error', 'as-needed'],
      // 一行最大长度
      '@stylistic/max-len': ['error', {
        code: 120,
        tabWidth: 2,
        ignoreUrls: true,
        ignoreComments: false,
        ignoreRegExpLiterals: true,
        ignoreStrings: true,
        ignoreTemplateLiterals: true,
      }],
      // 禁用console
      'no-console': 'off',
      // 禁用debugger
      'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'off',
      // 禁止对 function 的参数进行重新赋值
      'no-param-reassign': ['error', {
        props: false,
      }],
      // 除for循环外不允许++写法
      'no-plusplus': ['error', { allowForLoopAfterthoughts: true }],
      // 强制大括号内换行符的一致性
      '@stylistic/object-curly-newline': ['error', {
        multiline: true,
        consistent: true,
      }],
      // 以下为import模块规则
      // 相对导入必须写出扩展名，Node 的 ESM 解析不支持省略
      'import-x/extensions': ['error', 'ignorePackages', { js: 'always' }],
      // 关闭「把 ../index.js 简写为 ..」的行为：Node ESM 不支持目录导入，会抛 ERR_UNSUPPORTED_DIR_IMPORT
      'import-x/no-useless-path-segments': ['error', { noUselessIndex: false, commonjs: true }],
      // 确保导入的文件/模块可以解析为本地文件系统上的模块
      'import-x/no-unresolved': 'off',
    },
  },
];
