// 零依赖本地预览服务器（只提供静态文件，没有任何接口中转）
// 用途：推到 GitHub 之前，在本机先看一眼页面是否正常。
// 用法：node preview.cjs   然后浏览器打开 http://localhost:4173/
'use strict'
const http = require('http')
const fs = require('fs')
const path = require('path')
const { spawn } = require('child_process')

const ROOT = __dirname
const BASE_PORT = Number(process.env.PORT) || 4173

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.map': 'application/json',
}

const server = http.createServer((req, res) => {
  let urlPath
  try {
    urlPath = decodeURIComponent((req.url || '/').split('?')[0])
  } catch {
    res.writeHead(400)
    res.end('Bad request')
    return
  }
  if (urlPath === '/') urlPath = '/index.html'

  // 防目录穿越
  const filePath = path.normalize(path.join(ROOT, urlPath))
  if (filePath !== ROOT && !filePath.startsWith(ROOT + path.sep)) {
    res.writeHead(403)
    res.end('Forbidden')
    return
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      // 单页应用：找不到的路径也回 index.html
      fs.readFile(path.join(ROOT, 'index.html'), (e2, html) => {
        if (e2) {
          res.writeHead(404)
          res.end('Not found')
        } else {
          res.writeHead(200, { 'Content-Type': MIME['.html'] })
          res.end(html)
        }
      })
      return
    }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(filePath).toLowerCase()] || 'application/octet-stream' })
    res.end(data)
  })
})

function openBrowser(url) {
  if (process.env.NO_OPEN) return
  try {
    const opts = { detached: true, stdio: 'ignore', windowsHide: true }
    if (process.platform === 'win32') spawn('cmd', ['/c', 'start', '', url], opts).unref()
    else if (process.platform === 'darwin') spawn('open', [url], opts).unref()
    else spawn('xdg-open', [url], opts).unref()
  } catch {
    // 打不开浏览器不影响使用，地址已打印在下面
  }
}

function listenFrom(port, left) {
  const onError = (err) => {
    if (err && err.code === 'EADDRINUSE' && left > 0) {
      listenFrom(port + 1, left - 1)
      return
    }
    console.error('[启动失败] 无法监听 127.0.0.1:' + port + ' —— ' + (err && err.message ? err.message : err))
    console.error('可以设置环境变量 PORT 换端口，例如：set PORT=5000 && node preview.cjs')
    process.exit(1)
  }
  server.once('error', onError)
  server.listen(port, '127.0.0.1', () => {
    server.removeListener('error', onError)
    console.log('')
    console.log('  本地预览：http://localhost:' + port + '/')
    if (port !== BASE_PORT) console.log('  （' + BASE_PORT + ' 被占用，已顺延；关掉旧窗口后重启可回到 ' + BASE_PORT + '）')
    console.log('  提示：这只是本机预览，和 GitHub Pages 上跑的是同一份文件。')
    console.log('  按 Ctrl+C 停止。')
    console.log('')
    openBrowser('http://localhost:' + port + '/')
  })
}

listenFrom(BASE_PORT, 9)
