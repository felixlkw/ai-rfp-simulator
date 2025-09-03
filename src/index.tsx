import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serveStatic } from 'hono/cloudflare-workers'
import { renderer } from './renderer'
import type { Bindings } from './types'
import { DatabaseHelper, createApiResponse, validatePersona } from './utils/database'

const app = new Hono<{ Bindings: Bindings }>()

// CORS 설정
app.use('/api/*', cors())

// 정적 파일 서비스
app.use('/static/*', serveStatic({ root: './public' }))

// 렌더러 설정
app.use(renderer)

// 메인 페이지
app.get('/', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="ko">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>RFP 기반 AI 가상고객 제안발표 시뮬레이터</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <script>
          tailwind.config = {
            theme: {
              extend: {
                colors: {
                  'pwc-orange': '#ff6b1a',
                  'pwc-dark': '#1a1a1a',
                  'pwc-gray': '#f8f9fa'
                }
              }
            }
          }
        </script>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;700&display=swap');
          body { font-family: 'Noto Sans KR', sans-serif; }
          .word-break-keep-all { word-break: keep-all; }
        </style>
    </head>
    <body class="bg-gray-100 min-h-screen">
        <!-- 헤더 -->
        <header class="bg-pwc-dark text-white shadow-lg">
            <div class="container mx-auto px-4 py-6">
                <div class="flex items-center justify-between">
                    <div class="flex items-center space-x-4">
                        <i class="fas fa-presentation text-pwc-orange text-3xl"></i>
                        <div>
                            <h1 class="text-2xl font-bold word-break-keep-all">RFP 기반 AI 가상고객 제안발표 시뮬레이터</h1>
                            <p class="text-gray-300 text-sm">AI 기반 실시간/사후 평가로 제안서·발표 품질을 정량화</p>
                        </div>
                    </div>
                    <div class="flex items-center space-x-2">
                        <span class="bg-pwc-orange text-white px-3 py-1 rounded-full text-sm font-medium">PwC 2025</span>
                    </div>
                </div>
            </div>
        </header>

        <!-- 메인 컨텐츠 -->
        <main class="container mx-auto px-4 py-8">
            <!-- 대시보드 카드 -->
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div class="bg-white rounded-lg shadow-md p-6">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-gray-600 text-sm font-medium">총 페르소나</p>
                            <p class="text-3xl font-bold text-pwc-dark" id="total-personas">-</p>
                        </div>
                        <div class="bg-blue-100 p-3 rounded-full">
                            <i class="fas fa-users text-blue-600 text-xl"></i>
                        </div>
                    </div>
                </div>

                <div class="bg-white rounded-lg shadow-md p-6">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-gray-600 text-sm font-medium">총 제안서</p>
                            <p class="text-3xl font-bold text-pwc-dark" id="total-proposals">-</p>
                        </div>
                        <div class="bg-green-100 p-3 rounded-full">
                            <i class="fas fa-file-alt text-green-600 text-xl"></i>
                        </div>
                    </div>
                </div>

                <div class="bg-white rounded-lg shadow-md p-6">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-gray-600 text-sm font-medium">총 발표</p>
                            <p class="text-3xl font-bold text-pwc-dark" id="total-presentations">-</p>
                        </div>
                        <div class="bg-purple-100 p-3 rounded-full">
                            <i class="fas fa-video text-purple-600 text-xl"></i>
                        </div>
                    </div>
                </div>

                <div class="bg-white rounded-lg shadow-md p-6">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-gray-600 text-sm font-medium">평균 점수</p>
                            <p class="text-3xl font-bold text-pwc-orange" id="average-score">-</p>
                        </div>
                        <div class="bg-orange-100 p-3 rounded-full">
                            <i class="fas fa-chart-line text-pwc-orange text-xl"></i>
                        </div>
                    </div>
                </div>
            </div>

            <!-- 기능 메뉴 -->
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                <!-- 페르소나 관리 -->
                <div class="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer"
                     onclick="navigateTo('/personas')">
                    <div class="flex items-center mb-4">
                        <div class="bg-blue-100 p-3 rounded-full mr-4">
                            <i class="fas fa-user-tie text-blue-600 text-xl"></i>
                        </div>
                        <h3 class="text-xl font-semibold text-pwc-dark">페르소나 관리</h3>
                    </div>
                    <p class="text-gray-600 mb-4 word-break-keep-all">
                        17필드 페르소나 시스템으로 경영진 특성을 상세 분석하고 관리합니다.
                    </p>
                    <ul class="text-sm text-gray-500 space-y-1">
                        <li>• 딥리서치 + 고객인터뷰 반영</li>
                        <li>• 17개 필드 자동 보정</li>
                        <li>• 삼성전자, LG화학, 한국조선해양 기본 탑재</li>
                    </ul>
                </div>

                <!-- RFP 등록 및 파싱 -->
                <div class="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer"
                     onclick="navigateTo('/rfp')">
                    <div class="flex items-center mb-4">
                        <div class="bg-green-100 p-3 rounded-full mr-4">
                            <i class="fas fa-file-upload text-green-600 text-xl"></i>
                        </div>
                        <h3 class="text-xl font-semibold text-pwc-dark">RFP 등록·파싱</h3>
                    </div>
                    <p class="text-gray-600 mb-4 word-break-keep-all">
                        RFP 문서를 업로드하여 핵심 신호를 추출하고 페르소나를 자동 최신화합니다.
                    </p>
                    <ul class="text-sm text-gray-500 space-y-1">
                        <li>• KPI, 평가기준, 예산/거버넌스 추출</li>
                        <li>• 기술요건, 전략테마, 리스크/규제 분석</li>
                        <li>• 페르소나 17필드 weights/thresholds 조정</li>
                    </ul>
                </div>

                <!-- 제안서 평가 -->
                <div class="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer"
                     onclick="navigateTo('/proposal-evaluation')">
                    <div class="flex items-center mb-4">
                        <div class="bg-purple-100 p-3 rounded-full mr-4">
                            <i class="fas fa-clipboard-check text-purple-600 text-xl"></i>
                        </div>
                        <h3 class="text-xl font-semibold text-pwc-dark">제안서 평가 (1차)</h3>
                    </div>
                    <p class="text-gray-600 mb-4 word-break-keep-all">
                        페르소나 기반 6대 지표로 제안서를 평가하고 루브릭 앵커 방식을 적용합니다.
                    </p>
                    <ul class="text-sm text-gray-500 space-y-1">
                        <li>• 명확성·전문성·설득력·논리성·창의성·신뢰성</li>
                        <li>• 루브릭 앵커 방식 점수화</li>
                        <li>• 근거 요약 + 페르소나별 피드백</li>
                    </ul>
                </div>

                <!-- 발표 평가 -->
                <div class="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer"
                     onclick="navigateTo('/presentation-evaluation')">
                    <div class="flex items-center mb-4">
                        <div class="bg-red-100 p-3 rounded-full mr-4">
                            <i class="fas fa-video text-red-600 text-xl"></i>
                        </div>
                        <h3 class="text-xl font-semibold text-pwc-dark">발표 평가 (2차)</h3>
                    </div>
                    <p class="text-gray-600 mb-4 word-break-keep-all">
                        영상 분석과 STT 기반으로 발표 품질을 종합 평가합니다.
                    </p>
                    <ul class="text-sm text-gray-500 space-y-1">
                        <li>• 영상 분석: 시선·제스처·표정·슬라이드 일치율</li>
                        <li>• STT 분석: 속도·휴지·충전어·억양·키워드</li>
                        <li>• 융합 점수 산출</li>
                    </ul>
                </div>

                <!-- 최종 결과 -->
                <div class="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer"
                     onclick="navigateTo('/final-results')">
                    <div class="flex items-center mb-4">
                        <div class="bg-yellow-100 p-3 rounded-full mr-4">
                            <i class="fas fa-trophy text-yellow-600 text-xl"></i>
                        </div>
                        <h3 class="text-xl font-semibold text-pwc-dark">최종 결과</h3>
                    </div>
                    <p class="text-gray-600 mb-4 word-break-keep-all">
                        1·2차 통합 점수와 페르소나별 예상 Q&A를 제공합니다.
                    </p>
                    <ul class="text-sm text-gray-500 space-y-1">
                        <li>• 6각형 레이더 차트 결과</li>
                        <li>• 페르소나별 피드백 + 예상 질문</li>
                        <li>• 권장 답변 + PDF 다운로드</li>
                    </ul>
                </div>

                <!-- 설정 및 관리 -->
                <div class="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer"
                     onclick="navigateTo('/settings')">
                    <div class="flex items-center mb-4">
                        <div class="bg-gray-100 p-3 rounded-full mr-4">
                            <i class="fas fa-cog text-gray-600 text-xl"></i>
                        </div>
                        <h3 class="text-xl font-semibold text-pwc-dark">설정 및 관리</h3>
                    </div>
                    <p class="text-gray-600 mb-4 word-break-keep-all">
                        루브릭 앵커, 평가 가중치, 시스템 설정을 관리합니다.
                    </p>
                    <ul class="text-sm text-gray-500 space-y-1">
                        <li>• 루브릭 앵커 정의 관리</li>
                        <li>• 평가 지표 가중치 조정</li>
                        <li>• 다국어 지원 (한국어/영어)</li>
                    </ul>
                </div>
            </div>

            <!-- 최근 활동 -->
            <div class="bg-white rounded-lg shadow-md p-6">
                <h2 class="text-xl font-semibold text-pwc-dark mb-4">최근 활동</h2>
                <div id="recent-activities">
                    <div class="text-center py-8 text-gray-500">
                        <i class="fas fa-spinner fa-spin text-2xl mb-2"></i>
                        <p>데이터를 불러오는 중...</p>
                    </div>
                </div>
            </div>
        </main>

        <!-- 푸터 -->
        <footer class="bg-pwc-dark text-white py-6 mt-12">
            <div class="container mx-auto px-4 text-center">
                <p class="text-gray-400">
                    © 2025 PwC Korea. RFP 기반 AI 가상고객 제안발표 시뮬레이터. All rights reserved.
                </p>
            </div>
        </footer>

        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <script>
            // 페이지 네비게이션
            function navigateTo(path) {
                // SPA 라우팅 구현 예정
                alert('기능 구현 중: ' + path);
            }

            // 대시보드 데이터 로드
            async function loadDashboardData() {
                try {
                    const response = await axios.get('/api/dashboard/stats');
                    const data = response.data.data;
                    
                    document.getElementById('total-personas').textContent = data.total_personas;
                    document.getElementById('total-proposals').textContent = data.total_proposals;
                    document.getElementById('total-presentations').textContent = data.total_presentations;
                    
                    const avgScore = Object.values(data.average_scores)
                        .reduce((sum, score) => sum + score, 0) / 6;
                    document.getElementById('average-score').textContent = Math.round(avgScore);
                    
                } catch (error) {
                    console.error('대시보드 데이터 로드 실패:', error);
                    document.getElementById('total-personas').textContent = '0';
                    document.getElementById('total-proposals').textContent = '0';
                    document.getElementById('total-presentations').textContent = '0';
                    document.getElementById('average-score').textContent = '0';
                }
            }

            // 최근 활동 로드
            async function loadRecentActivities() {
                try {
                    // 구현 예정
                    document.getElementById('recent-activities').innerHTML = 
                        '<p class="text-gray-500 text-center py-4">최근 활동이 없습니다.</p>';
                } catch (error) {
                    console.error('최근 활동 로드 실패:', error);
                }
            }

            // 페이지 로드 시 데이터 초기화
            document.addEventListener('DOMContentLoaded', function() {
                loadDashboardData();
                loadRecentActivities();
            });
        </script>
    </body>
    </html>
  `)
})

// =============================================================================
// API 라우트들
// =============================================================================

// 대시보드 통계 API
app.get('/api/dashboard/stats', async (c) => {
  try {
    const db = new DatabaseHelper(c.env.DB);
    const stats = await db.getDashboardStats();
    return c.json(createApiResponse(true, stats));
  } catch (error) {
    console.error('Dashboard stats error:', error);
    return c.json(createApiResponse(false, null, null, '통계 데이터를 불러올 수 없습니다.'), 500);
  }
})

// 페르소나 목록 조회 API
app.get('/api/personas', async (c) => {
  try {
    const db = new DatabaseHelper(c.env.DB);
    const page = parseInt(c.req.query('page') || '1');
    const limit = parseInt(c.req.query('limit') || '20');
    const search = c.req.query('search');
    const sortBy = c.req.query('sort_by') || 'created_at';
    const sortOrder = (c.req.query('sort_order') || 'DESC') as 'ASC' | 'DESC';

    const result = await db.getPersonas({
      page, limit, search, sort_by: sortBy, sort_order: sortOrder
    });

    return c.json(createApiResponse(true, result.personas, null, null, result.pagination));
  } catch (error) {
    console.error('Get personas error:', error);
    return c.json(createApiResponse(false, null, null, '페르소나 목록을 불러올 수 없습니다.'), 500);
  }
})

// 페르소나 단일 조회 API
app.get('/api/personas/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const db = new DatabaseHelper(c.env.DB);
    const persona = await db.getPersonaById(id);
    
    if (!persona) {
      return c.json(createApiResponse(false, null, null, '페르소나를 찾을 수 없습니다.'), 404);
    }

    return c.json(createApiResponse(true, persona));
  } catch (error) {
    console.error('Get persona error:', error);
    return c.json(createApiResponse(false, null, null, '페르소나 정보를 불러올 수 없습니다.'), 500);
  }
})

// 페르소나 생성 API
app.post('/api/personas', async (c) => {
  try {
    const body = await c.req.json();
    const errors = validatePersona(body);
    
    if (errors.length > 0) {
      return c.json(createApiResponse(false, null, null, errors.join(', ')), 400);
    }

    const db = new DatabaseHelper(c.env.DB);
    const id = await db.createPersona(body);
    const persona = await db.getPersonaById(id);

    return c.json(createApiResponse(true, persona, '페르소나가 성공적으로 생성되었습니다.'), 201);
  } catch (error) {
    console.error('Create persona error:', error);
    return c.json(createApiResponse(false, null, null, '페르소나 생성에 실패했습니다.'), 500);
  }
})

// 페르소나 업데이트 API
app.put('/api/personas/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const body = await c.req.json();
    const errors = validatePersona(body);
    
    if (errors.length > 0) {
      return c.json(createApiResponse(false, null, null, errors.join(', ')), 400);
    }

    const db = new DatabaseHelper(c.env.DB);
    const success = await db.updatePersona(id, body);
    
    if (!success) {
      return c.json(createApiResponse(false, null, null, '페르소나를 찾을 수 없습니다.'), 404);
    }

    const persona = await db.getPersonaById(id);
    return c.json(createApiResponse(true, persona, '페르소나가 성공적으로 업데이트되었습니다.'));
  } catch (error) {
    console.error('Update persona error:', error);
    return c.json(createApiResponse(false, null, null, '페르소나 업데이트에 실패했습니다.'), 500);
  }
})

// 페르소나 삭제 API
app.delete('/api/personas/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const db = new DatabaseHelper(c.env.DB);
    const success = await db.deletePersona(id);
    
    if (!success) {
      return c.json(createApiResponse(false, null, null, '페르소나를 찾을 수 없습니다.'), 404);
    }

    return c.json(createApiResponse(true, null, '페르소나가 성공적으로 삭제되었습니다.'));
  } catch (error) {
    console.error('Delete persona error:', error);
    return c.json(createApiResponse(false, null, null, '페르소나 삭제에 실패했습니다.'), 500);
  }
})

// 루브릭 앵커 조회 API
app.get('/api/rubric-anchors', async (c) => {
  try {
    const metricName = c.req.query('metric');
    const db = new DatabaseHelper(c.env.DB);
    const anchors = await db.getRubricAnchors(metricName);
    
    return c.json(createApiResponse(true, anchors));
  } catch (error) {
    console.error('Get rubric anchors error:', error);
    return c.json(createApiResponse(false, null, null, '루브릭 앵커를 불러올 수 없습니다.'), 500);
  }
})

// 페르소나 평가 매핑 조회 API
app.get('/api/evaluation-mappings', async (c) => {
  try {
    const db = new DatabaseHelper(c.env.DB);
    const mappings = await db.getEvaluationMappings();
    
    return c.json(createApiResponse(true, mappings));
  } catch (error) {
    console.error('Get evaluation mappings error:', error);
    return c.json(createApiResponse(false, null, null, '평가 매핑을 불러올 수 없습니다.'), 500);
  }
})

// 회사별 페르소나 통계 API
app.get('/api/personas/stats/by-company', async (c) => {
  try {
    const db = new DatabaseHelper(c.env.DB);
    const stats = await db.getPersonaStatsByCompany();
    
    return c.json(createApiResponse(true, stats));
  } catch (error) {
    console.error('Get persona stats by company error:', error);
    return c.json(createApiResponse(false, null, null, '회사별 통계를 불러올 수 없습니다.'), 500);
  }
})

// 헬스체크 API
app.get('/api/health', (c) => {
  return c.json(createApiResponse(true, { 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  }));
})

export default app
