# Auto translate PPT

在浏览器里把 PPT 翻译成另一种语言：上传 `.pptx` → 选源语言/目标语言 → 翻译 → 导出新 `.pptx`。
纯前端、无需服务器，可以整个托管在 **GitHub Pages** 上，把网址发给别人就能一起用。

**每个使用者填自己的 API Key，Key 只保存在他自己的浏览器里。本仓库不含任何密钥。**

## 在线使用

**已部署地址：<https://tyyb1202.github.io/auto-translate-ppt/>**

这个地址由本仓库 `main` 分支自动发布（每次 push 后约 1 分钟更新）。如果你 fork 或改了仓库名，地址相应变成 `https://<你的用户名>.github.io/<仓库名>/`。

打开后点右上角 **⚙ 翻译引擎**，填三项即可开始：

| 字段 | 填什么 |
| --- | --- |
| 接口地址 | `https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions` |
| API Key | 你自己的（阿里云百炼控制台创建，有免费额度） |
| 模型名 | `qwen-turbo` |

> 接口地址必须**完整到 `/chat/completions` 结尾**，少一段就会 404 —— 这是最常见的坑。

其他服务商（DeepSeek、Kimi、硅基流动）的地址见 [说明书.md](说明书.md)。

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
