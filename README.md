# ⚡vite-plugin-iconfont

[![npm](https://img.shields.io/npm/v/vite-plugin-iconfont-auto)](https://www.npmjs.com/package/vite-plugin-iconfont-auto) [![npm](https://img.shields.io/npm/dt/vite-plugin-iconfont-auto)](https://www.npmjs.com/package/vite-plugin-iconfont-auto)

这是一个自动下载iconfont symbol css font 到项目的vite 插件，支持以下特性：

- 自动下载iconfont symbol js css font 到本地。
- 自动生成iconfont json配置。
- 自动生成iconfont TypeScript类型声明文件。
- 支持构建时自动注入index.html。

## 安装

```shell
npm install -D vite-plugin-iconfont-auto
// 或
yarn add -D vite-plugin-iconfont-auto
// 或
pnpm install -D vite-plugin-iconfont-auto
```

## 使用方法

添加插件到`vite.config.js`

```js
import { defineConfig } from 'vite';
import Iconfont from 'vite-plugin-iconfont-auto';
export default defineConfig({
  plugins: [Iconfont({ url: 'font_3303_220hwi541tl8'})]
});
```

## 配置选项(options)

### url

TODO 直接加载下载到本地的iconfont文件夹，以便于在iconfont 瘫痪后兜底线上项目的打包流程

iconfont 的唯一标识ID。

- **Type :** `string`
- **Default :** ''
- **Required :**`true`

### css 

是否开启css 引入方式，默认开启，如若只需要symbol 模式 可设为false 关闭

- **Type :** `string`
- **Default :** `true`
- **Required :**`false`

### symbol

是否开启symbol 引入方式，默认开启，可关闭；

- **Type :** `string`
- **Default :** `true`
- **Required :**`false`

### distPath

保存iconfont到项目相对目录地址。

- **Type :** `string`
- **Required :**`true`

### iconJson

生成iconfont json配置路径，默认文件名称：`iconfont.json` 。

- **Type :** `boolean|string`
- **Default :** `false`
- **Required :**`false`

### inject

iconfont symbol js是否自动注入到`index.html`文件。

- **Type :** `boolean`
- **Default :** `true`
- **Required :**`false`

### dts

生成TypeScript 类型声明文件,`false`不生成，也可以是具体生成类型声明文件的文件路径地址，默认文件名称：`iconfont.d.ts`。

- **Type :** `boolean|string`
- **Default :** `false`
- **Required :**`false`

>注意：要获得eslint的支持请在eslint配置文件中增加如下配置：

```js
{
  globals: {
    Iconfont: true,
  },
  ...
}
```

## 示例

```js
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import Iconfont from 'vite-plugin-iconfont-auto';
// https://vitejs.dev/config/
export default () => {
  return defineConfig({
    plugins: [
      vue(),
      Iconfont({
        base:'//at.alicdn.com/t/c/'
        css:false,
        symbol:true,
        url: 'font_3303_22xx541xxxxxtlx8',
        distUrl: './public/assets/fonts/',
        iconJson: './public/iconfont.json',
        dts: './types/iconfont.d.ts',
        inject:false
      }),
    ]
  });
};

```
