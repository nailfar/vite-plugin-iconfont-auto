import { dirname, join } from "node:path";
import { existsSync, promises as fs } from "node:fs";
import { IndexHtmlTransformResult, type Plugin } from "vite";

interface Options {
  /**
   * iconfont url
   * 新版本
   * //at.alicdn.com/t/c/
   * 老版本
   * //at.alicdn.com/t/
   *
   * https://at.alicdn.com/t/c/font_39925_q9gvn56eyoe.js
   */
  base: string;

  /**
   * iconfont 标识
   * font_39925_q9gvn56eyoe
   * 也可以指定本地文件夹路径,文件结构保持iconfont下载至本地后的结构一致
   * 可在服务器瘫痪期间改为手动下载后自动化打包使用
   * ./assets/public/iconfont
   */
  url: string;

  /**
   * 开启symbol模式
   */
  symbol: boolean;
  /**
   * 开启css模式
   */
  css: boolean;
  /**
   * 保存自动下载iconfont symbol js css font 资源的路径
   */
  distPath?: string;
  /**
   * iconfont symbol js是否自动注入到index.html
   */
  inject?: boolean;
  /**
   * 是否生成icon类型声明文件，可以为boolean或者具体生成的路径
   */
  dts?: boolean | string;
  /**
   * 自动生成iconfont图标集合
   */
  iconJson?: boolean | string;
}

// type GetType<T> = T extends (arg: infer P) => void ? P : string;
// type StateType = GetType<typeof  >
export default (options: Options): Plugin => {
  const opt: Options = Object.assign(
    {
      url: "",
      base: "//at.alicdn.com/t/c/",
      css: true, // 默认开启css
      symbol: true, // 默认开启symbol模式
      distUrl: "iconfont.js",
      inject: true,
      dts: false,
      iconJson: false,
    },
    options
  );

  if (!opt.url) {
    throw new Error(
      `【vite-plugin-iconfont】 options id parameter is required`
    );
  }

  let config;
  return {
    name: "vite-plugin-iconfont-auto",
    configResolved(resolvedConfig) {
      config = resolvedConfig;
    },
    async transformIndexHtml() {
      const injectArr: IndexHtmlTransformResult = [];
      const IS_DEV = config.mode === "development";
      const isIdMode = !existsSync(opt.url);
      console.info("加载模式", isIdMode, opt.url);
      const baseUrl = opt.base + opt.url;
      let symbolUrl = baseUrl + ".js";
      let cssUrl = baseUrl + ".css";

      const URL_CONTENT = await getURLContent(symbolUrl);
      const CSS_CONETNT = await getURLContent(cssUrl);
      // console.info(CSS_CONETNT);
      const iconList = URL_CONTENT.match(/(?<=id=").+?(?=")/g) || [];

      // 生成下载图标配置
      if (opt.iconJson) {
        const JSON_CONTENT = await getURLContent(baseUrl + ".json");
        const iconJsonPath =
          opt.iconJson !== true ? opt.iconJson : "iconfont.json";
        generateFile(iconJsonPath, JSON_CONTENT);
      }

      // 生成ts类型声明文件
      if (opt.dts) {
        const dtsPath = options.dts !== true ? options.dts : "iconfont.d.ts";
        const iconDts = `declare type Iconfont = "${iconList.join('"|"')}"`;
        generateFile(dtsPath as string, iconDts);
      }

      // 自动下载iconfont symbol js
      if (!opt.inject) {
        if (opt.symbol) {
          generateFile(
            join(process.cwd(), opt.distPath as string, `${opt.url}.js`),
            URL_CONTENT
          );
        }
        if (opt.css) {
          generateFile(
            join(process.cwd(), opt.distPath as string, `${opt.url}.css`),
            CSS_CONETNT
          );
        }
      } else {
        if (!IS_DEV) {
          const { outDir, assetsDir } = config.build;
          if (opt.symbol) {
            symbolUrl = join(
              config.base,
              assetsDir,
              opt.distPath || "",
              `${opt.url}.js`
            )
              .split("\\")
              .join("/");
            generateFile(`${outDir}/${symbolUrl}`, URL_CONTENT);
          }
          if (opt.css) {
            const gurlbase = [config.base, assetsDir, opt.distPath || ""];
            cssUrl = join(...gurlbase, `${opt.url}.css`)
              .split("\\")
              .join("/");

            const woff = join(...gurlbase, `${opt.url}.woff`)
              .split("\\")
              .join("/");

            const ttf = join(...gurlbase, `${opt.url}.ttf`)
              .split("\\")
              .join("/");

            const svg = join(...gurlbase, `${opt.url}.svg`)
              .split("\\")
              .join("/");

            const woffC = await getURLContent(baseUrl + "woff");
            const ttfc = await getURLContent(baseUrl + "ttf");
            const svgc = await getURLContent(baseUrl + "svg");

            console.info(cssUrl);

            const NEW_CSS_CONTENT = CSS_CONETNT.replaceAll(
              "//at.alicdn.com/t/c",
              "."
            );
            generateFile(`${outDir}/${cssUrl}`, NEW_CSS_CONTENT);
            generateFile(`${outDir}/${woff}`, woffC);
            generateFile(`${outDir}/${ttf}`, ttfc);
            generateFile(`${outDir}/${svg}`, svgc);
          }
        }
        injectArr.push({
          tag: "script",
          injectTo: "head",
          attrs: { src: symbolUrl },
        });
        injectArr.push({
          tag: "link",
          injectTo: "head",
          attrs: { href: cssUrl, type: "text/css" },
        });
      }
      return injectArr;
    },
  };
};

async function injectHtml(config, opt: Options) {
  const { outDir, assetsDir } = config.build;

  const baseUrl = opt.base + opt.url;
  let symbolUrl = baseUrl + ".js";
  let cssUrl = baseUrl + ".css";

  const URL_CONTENT = await getURLContent(symbolUrl);
  const CSS_CONETNT = await getURLContent(cssUrl);

  let url = join(config.base, assetsDir, opt.distPath || "")
    .split("\\")
    .join("/");
  generateFile(`${outDir}/${url}`, URL_CONTENT);
}

/**
 * 获取地址，如果是相对协议地址自动添加https
 * @param url
 * @returns
 */
function getURL(url) {
  return /http/.test(url) ? url : `https:${url}`;
}

/**
 * 判断是否是https地址
 * @param url
 * @returns
 */
function isHttpsURL(url) {
  return /https/.test(url);
}

/**
 * 生成文件
 * @param path
 * @param content
 */
async function generateFile(filepath, content) {
  const originalContent = existsSync(filepath)
    ? await fs.readFile(filepath, "utf-8")
    : "";
  originalContent !== content && writeFile(filepath, content);
}

/**
 * 写文件
 * @param filePath
 * @param content
 * @returns
 */
async function writeFile(filePath: string, content = "") {
  await fs.mkdir(dirname(filePath), { recursive: true });
  return await fs.writeFile(filePath, content, "utf-8");
}

/**
 * 获取指定url地址的内容
 * @param url
 * @returns
 */
let contentCACHE = {};
async function getURLContent(url): Promise<string> {
  if (contentCACHE[url]) {
    console.info("cache hit", url);
    return Promise.resolve(contentCACHE[url]);
  }
  const targetURL = getURL(url);
  let http;
  try {
    http = isHttpsURL(targetURL) ? await import("https") : await import("http");
  } catch (err) {
    console.log("https support is disabled!");
  }
  return new Promise((resolve, reject) => {
    http
      .get(targetURL, (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk.toString()));
        res.on("end", () => {
          resolve(data);
          contentCACHE[url] = data;
        });
      })
      .on("error", (err) => {
        reject(err);
      });
  });
}
