// Railway 배포용 Node.js 서버
import { serve } from '@hono/node-server'
import { serveStatic } from '@hono/node-server/serve-static'
import app from './src/index.js'

// Railway 환경에서 정적 파일 서빙을 위한 설정
// Cloudflare Workers와 달리 Node.js 환경에서는 @hono/node-server 사용
app.use('/static/*', serveStatic({ root: './public' }))
app.use('/*', serveStatic({ 
  root: './public',
  onNotFound: (path, c) => {
    console.log(`File not found: ${path}`)
  }
}))

// Railway PORT 환경변수 사용 (기본값: 3000)
const port = parseInt(process.env.PORT) || 3000

console.log(`🚀 RFP AI Virtual Customer Simulator starting on port ${port}`)
console.log(`📦 Environment: ${process.env.NODE_ENV || 'development'}`)
console.log(`🌐 Railway URL: ${process.env.RAILWAY_STATIC_URL || 'localhost'}`)

serve({
  fetch: app.fetch,
  port: port,
  hostname: '0.0.0.0'
})

console.log(`✅ Server running on port ${port}`)
console.log(`🔗 Health check: http://localhost:${port}/api/health`)