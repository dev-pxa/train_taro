import type { UserConfigExport } from "@tarojs/cli";

// const TEST_API_TARGET = 'http://49.232.34.105:8082';
const TEST_API_TARGET = 'https://m1.apifoxmock.com/m1/8000488-7754565-default';

export default {
   logger: {
    quiet: false,
    stats: true
  },
  mini: {},
  h5: {
    devServer: {
      proxy: {
        '/api/app': {
          target: TEST_API_TARGET,
          changeOrigin: true,
          secure: false,
        },
      },
    },
  }
} satisfies UserConfigExport<'webpack5'>
