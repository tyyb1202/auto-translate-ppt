# Auto translate PPT

在浏览器里把 PPT 翻译成另一种语言：上传 `.pptx` → 选源语言/目标语言 → 翻译 → 导出新 `.pptx`。
纯前端、无需服务器，可以整个托管在 **GitHub Pages** 上，把网址发给别人就能一起用。

**每个使用者填自己的 API Key，Key 只保存在他自己的浏览器里。本仓库不含任何密钥。**

## 在线使用

**已部署地址**

- 推荐（国内通常更快）：<https://auto-translate-ppt.pages.dev/>
- 备用：<https://tyyb1202.github.io/auto-translate-ppt/>

两个地址都由本仓库 `main` 分支自动发布，push 后 1～2 分钟更新。如果你 fork 或改了仓库名，地址会相应变成 `https://<你的用户名>.github.io/<仓库名>/`。

> 给**普通使用者**的说明看 [使用指南.md](使用指南.md)（接口怎么填、Key 存哪、报错怎么查）；
> 自己部署一个看 [说明书.md](说明书.md)。

打开后点右上角 **⚙ 翻译引擎**，填三项即可开始：

| 字段 | 填什么 |
| --- | --- |
| 接口地址 | `https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions` |
| API Key | 你自己的（阿里云百炼控制台创建，有免费额度） |
| 模型名 | `qwen-turbo` |

> 接口地址必须**完整到 `/chat/completions` 结尾**，少一段就会 404 —— 这是最常见的坑。

其他服务商（DeepSeek、Kimi、硅基流动）的地址见 [说明书.md](说明书.md)。

## 分享给别人

对方**不需要**注册、不需要装软件、不需要仓库权限，把网址发过去就行。

| 方式 | 适合场景 | 怎么做 |
| --- | --- | --- |
| 直接发网址 | 最常用 | 把 <https://auto-translate-ppt.pages.dev/> 发过去，顺手把 [使用指南.md](使用指南.md) 一起发 |
| 发二维码 | 当面扫、发到群里 | 用任意「网址转二维码」工具把网址生成二维码，截图发出 |
| 让对方自己部署一份 | 对方要长期自用、或想绑自己域名 | 发仓库地址，对方 fork 后按本文档部署，得到自己的网址 |
| 打包发文件（离线用） | 对方打不开 pages.dev，或要断网演示 | 整个文件夹打包 zip 发过去，解压后双击 `本地预览.bat`，再打开 `http://localhost:4173/` |

要点：

- 每个使用者填**自己的** Key，互相看不到，也不会消耗你的额度。
- 分享时只发网址和仓库链接，**不要发任何 Key**，也不要在截图里露 Key。
- 直接双击 `index.html`（`file://` 方式）**打不开**，会被浏览器安全策略拦下；必须走网址，或本地跑 `node preview.cjs` / `本地预览.bat`。
- 想让手机在同一 WiFi 下访问你电脑上的预览：把 `preview.cjs` 里的 `server.listen(port, '127.0.0.1', …)` 改成 `'0.0.0.0'`，再用 `http://<电脑IP>:4173/` 打开（只在可信网络里这么干）。

## 部署到 GitHub Pages（3 分钟）

1. 在 GitHub 新建一个 **Public** 仓库（不要勾选自动生成 README）。
2. 把本文件夹里的**全部文件**传上去，注意 `.github`、`.gitignore` 这两个以点开头的也要传：
   - 推荐用 [GitHub Desktop](https://desktop.github.com/)：`Add local repository` → 选这个文件夹 → `Publish repository`；
   - 或者在仓库页面点 `Add file → Upload files`，把文件夹拖进去。
3. 仓库 **Settings → Pages**，把 `Source` 选成 **GitHub Actions**（只需设一次）。
4. 之后每次 push，Actions 会自动重新发布；到 **Actions** 页面能看到 `部署到 GitHub Pages` 的运行结果，成功后地址就是
   `https://<用户名>.github.io/<仓库名>/`。
5. 打开网址 → 填 Key → 开始翻译。

## 也可以部署到 Cloudflare Pages（国内访问通常比 github.io 快）

仓库自带 `package.json` 和 `scripts/build-static.mjs`，`npm run build` 只是把 `index.html`、`assets/` 原样复制到 `dist/`，不做任何转换。在 Cloudflare Pages 里连接这个仓库后这样填：

| 配置项 | 填什么 |
| --- | --- |
| Framework preset | `None` |
| Build command | `npm run build` |
| Build output directory | `dist` |

不想走构建也可以用：Build command 填 `exit 0`，输出目录填 `/`（直接发布仓库根目录）。

> 如果报 `npm error ENOENT ... open '/opt/buildhome/repo/package.json'`，说明构建命令是 `npm run build` 但仓库里没有 `package.json`——本仓库现在已经有这个文件，在 Cloudflare 里点「重试部署」即可。

### 智谱 GLM 这类"不放行跨域"的服务商

仓库里带了一个 Cloudflare Pages Function：`functions/llm/[[path]].js`。它是**同源中转**——浏览器只跟自己的站点说话，由 Cloudflare 的服务器去请求上游，跨域限制自然就不存在了。用 Git 方式连接仓库部署即可，函数会被自动识别，不用额外配置。

部署好后把接口地址填成相对路径：

| 服务商 | 接口地址 |
| --- | --- |
| 智谱 GLM | `/llm/zhipu` |
| 通义千问 DashScope | `/llm/dashscope` |
| DeepSeek | `/llm/deepseek` |
| Kimi | `/llm/moonshot` |
| 硅基流动 | `/llm/siliconflow` |
| 其他任意服务商 | `/llm?url=https://完整地址/v1/chat/completions` |

API Key 照常填在 Key 栏，页面会以 `Authorization: Bearer ...` 发出去，函数原样转发、不落盘也不打印。

> 这个函数只在 Cloudflare Pages 上生效。GitHub Pages 是纯静态托管，跑不了函数，那边请直接用「说明书 6.1」里 ✅ 的服务商。

## 安全设计

- 仓库里**没有**任何 API Key，代码也不读取 `.env`；Key 由使用者在网页里填写。
- Key 只存进浏览器 `localStorage`（键名 `gf`），不会上传到任何服务器，刷新页面还在，清除浏览器数据会丢。
- 每次部署前会跑 `scripts/check-secrets.mjs`：仓库里一旦出现 `sk-...` 这类密钥，CI **直接失败、不会发布**。
- 发布采用白名单（只打包 `index.html` + `assets/`），即使仓库根目录误放了 `key.txt` 也不会被公开。

## 目录结构

```
index.html                     页面入口（资源用相对路径，放在子路径下也能用）
assets/                        打包好的 JS / CSS
package.json                   只为托管平台的构建命令服务（npm run build）
.github/workflows/deploy.yml   推送到 main 后自动部署到 GitHub Pages
scripts/build-static.mjs       构建脚本：把 index.html + assets 复制到 dist/
scripts/check-secrets.mjs      提交/部署前的密钥扫描
functions/llm/[[path]].js      Cloudflare Pages 同源中转（智谱等不放行跨域的服务商走这里）
preview.cjs                    本地预览用的小服务器（可选，不参与部署）
说明书.md                      完整说明书：部署细节、接口地址、报错排查
```

## 本地预览（可选）

```bash
node preview.cjs
# 然后打开 http://localhost:4173/
```

它只提供静态文件，和线上跑的是同一份代码。Windows 也可以双击 `本地预览.bat`。

## 说明

- 只支持 `.pptx`；老版 `.ppt` 请先另存为 `.pptx`。
- 项目数据（上传的文件、译文）保存在当前浏览器的 IndexedDB 里，换电脑/换浏览器不会同步。
- 从本地 `localhost` 换成 GitHub Pages 域名后属于不同「源」，之前填的 Key 和项目需要重新来一次。
