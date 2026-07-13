import { defineConfig } from '@tarojs/cli'
import devConfig from './dev'
import prodConfig from './prod'

export default defineConfig<'webpack5'>(async (merge) => {
  const baseConfig = {
    projectName: 'zhu-li-weapp',
    date: '2026-07-13',
    designWidth: 750,
    sourceRoot: 'src',
    outputRoot: 'dist',
    framework: 'react',
    compiler: 'webpack5' as const,
    cache: { enable: false },
    mini: {
      postcss: {
        autoprefixer: { enable: true },
        cssModules: { enable: false }
      }
    }
  }
  return process.env.NODE_ENV === 'development'
    ? merge({}, baseConfig, devConfig)
    : merge({}, baseConfig, prodConfig)
})
