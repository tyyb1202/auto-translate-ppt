/**
 * 把「要公开的网站文件」收集到 dist/ 目录里。
 *
 * 为什么需要它：Cloudflare Pages / Vercel 这类托管平台默认会执行 `npm run build`，
 * 然后只发布构建输出目录（通常是 dist/）。本仓库是纯静态文件、没有打包步骤，
 * 直接跑 `npm run build` 会因为找不到构建脚本而失败（报错 ENOENT package.json）。
 *
 * 这个脚本不做任何转换，只是把 index.html 和 assets/ 复制过去，
 * 这样既能满足平台「必须有构建命令」的要求，又能保证 README、说明书等文件
 * 不会被发布到公网。
 */
import { cp, mkdir, rm } from 'node:fs/promises'
import { existsSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const dist = path.join(root, 'dist')

const NEEDED = ['index.html', 'assets']

for (const item of NEEDED) {
  if (!existsSync(path.join(root, item))) {
    console.error(`[build] 找不到 ${item}，仓库不完整`)
    process.exit(1)
  }
}

await rm(dist, { recursive: true, force: true })
await mkdir(dist, { recursive: true })

for (const item of NEEDED) {
  await cp(path.join(root, item), path.join(dist, item), { recursive: true })
}

const files = []
function walk(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name)
    if (entry.isDirectory()) walk(p)
    else files.push(p)
  }
}
walk(dist)

console.log('[build] 输出目录: ' + dist)
for (const f of files) {
  console.log('  ' + path.relative(dist, f) + '  ' + statSync(f).size + ' 字节')
}
console.log(`[build] 共 ${files.length} 个文件，可以直接部署`)
