// 提交前/部署前检查：仓库里有没有混进 API Key。
// 用法：node scripts/check-secrets.mjs
// CI 里会在部署之前跑一次，一旦发现疑似密钥就直接失败，不会发布上线。
import fs from 'node:fs'
import path from 'node:path'

const ROOT = process.cwd()
const SKIP_DIRS = new Set(['.git', 'node_modules', '_site', 'dist', '.vite', '.DS_Store'])
const SKIP_EXT = new Set([
  '.png', '.jpg', '.jpeg', '.gif', '.ico', '.woff', '.woff2', '.ttf',
  '.pptx', '.docx', '.zip', '.pdf', '.map', '.exe',
])

const RULES = [
  { name: 'sk- 开头的密钥', re: /\bsk-[A-Za-z0-9_-]{16,}/g },
  { name: '赋值写法的密钥', re: /\b(?:api[_-]?key|apikey|access[_-]?key|secret|token|password)\b\s*[:=]\s*["'`]([A-Za-z0-9_\-.]{20,})["'`]/gi },
  { name: '云厂商 AK', re: /\b(?:(?:AKIA|ASIA)[0-9A-Z]{16}|LTAI[0-9A-Za-z]{12,})\b/g },
  { name: '内联 Bearer Token', re: /\bBearer\s+([A-Za-z0-9_\-.]{30,})/g },
]

const hits = []

function scan(file) {
  const rel = path.relative(ROOT, file).split(path.sep).join('/')
  if (SKIP_EXT.has(path.extname(file).toLowerCase())) return
  let text
  try {
    const stat = fs.statSync(file)
    if (stat.size > 4 * 1024 * 1024) return
    text = fs.readFileSync(file, 'utf8')
  } catch {
    return
  }
  if (text.includes('\u0000')) return // 二进制

  const lines = text.split(/\r?\n/)
  lines.forEach((line, i) => {
    if (line.includes('secret-scan:ignore')) return
    for (const rule of RULES) {
      rule.re.lastIndex = 0
      if (rule.re.test(line)) hits.push({ rel, line: i + 1, rule: rule.name, text: line.trim().slice(0, 120) })
    }
  })
}

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.') && entry.name !== '.github') continue
    if (SKIP_DIRS.has(entry.name)) continue
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) walk(full)
    else if (entry.isFile()) scan(full)
  }
}

walk(ROOT)

if (hits.length === 0) {
  console.log('✅ 没发现 API Key。可以安全提交 / 部署。')
  process.exit(0)
}

console.error('❌ 检测到疑似 API Key，已阻止部署：\n')
for (const h of hits) {
  console.error('  ' + h.rel + ':' + h.line + '  [' + h.rule + ']')
  console.error('      ' + h.text)
}
console.error('\n处理办法：')
console.error('  1. 把 Key 从文件里删掉——本项目不需要在代码里写任何 Key，')
console.error('     使用者在网页的「⚙ 翻译引擎」里自己填，存在他的浏览器里。')
console.error('  2. 如果 Key 已经推到过 GitHub，请立刻去服务商控制台吊销并重新生成。')
console.error('  3. 确认无误想跳过某一行，可在该行加注释：secret-scan:ignore')
process.exit(1)
