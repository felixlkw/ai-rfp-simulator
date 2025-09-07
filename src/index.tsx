import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serveStatic } from 'hono/cloudflare-workers'

// 유틸리티 및 서비스 임포트
import { DeepResearchService } from './services/deep-research'
import { RfpAnalysisService } from './services/rfp-analysis'
import { CustomerGenerationService } from './services/customer-generation'
import { EvaluationService } from './services/evaluation'
import { DatabaseService } from './services/database'
import { DemoDataService } from './services/demo-data'
import { FileParserService } from './services/file-parser'
import { PDFGeneratorService } from './services/pdf-generator'

// 타입 임포트
import type { 
  AIVirtualCustomer, 
  EvaluationSession,
  DeepResearchRequest,
  RfpParsingRequest,
  LLMEvaluationRequest
} from './types/ai-customer'

type Bindings = {
  DB: D1Database;
}

const app = new Hono<{ Bindings: Bindings }>()

// CORS 설정
app.use('/api/*', cors())

// 정적 파일 서빙
app.use('/static/*', serveStatic({ root: './public' }))

// === API 라우트 ===

// 헬스 체크 엔드포인트
app.get('/api/health', (c) => {
  return c.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'RFP AI Virtual Customer Simulator'
  })
})

// 1. AI 가상고객 생성 API
app.get('/api/customers', async (c) => {
  try {
    const db = new DatabaseService(c.env.DB)
    const customers = await db.getAllCustomers()
    
    return c.json({
      success: true,
      data: customers
    })
  } catch (error) {
    return c.json({
      success: false,
      error: error.message
    }, 500)
  }
})

app.post('/api/customers/deep-research', async (c) => {
  try {
    const request: DeepResearchRequest = await c.req.json()
    const deepResearch = new DeepResearchService()
    
    const researchData = await deepResearch.collectCompanyData(
      request.company_name,
      request.urls,
      request.research_depth
    )
    
    return c.json({
      success: true,
      data: researchData
    })
  } catch (error) {
    return c.json({
      success: false,
      error: error.message
    }, 500)
  }
})

app.post('/api/customers/rfp-analysis', async (c) => {
  try {
    const request: RfpParsingRequest = await c.req.json()
    const rfpAnalysis = new RfpAnalysisService()
    
    const analysisData = await rfpAnalysis.parseRfpDocument(
      request.file_path,
      request.file_type,
      request.parsing_mode
    )
    
    return c.json({
      success: true,
      data: analysisData
    })
  } catch (error) {
    return c.json({
      success: false,
      error: error.message
    }, 500)
  }
})

app.post('/api/customers/generate', async (c) => {
  try {
    const { deep_research_data, rfp_analysis_data, company_name, department } = await c.req.json()
    
    const customerGeneration = new CustomerGenerationService()
    const db = new DatabaseService(c.env.DB)
    
    // 30속성 결합 및 페르소나 생성
    const customer = await customerGeneration.generateVirtualCustomer(
      deep_research_data,
      rfp_analysis_data,
      company_name,
      department
    )
    
    // 데이터베이스에 저장
    const customerId = await db.saveCustomer(customer)
    
    return c.json({
      success: true,
      data: { ...customer, id: customerId }
    })
  } catch (error) {
    return c.json({
      success: false,
      error: error.message
    }, 500)
  }
})

// 2. 제안서 평가 API
app.post('/api/evaluations/proposal', async (c) => {
  try {
    const { customer_id, proposal_title, proposal_content } = await c.req.json()
    
    const db = new DatabaseService(c.env.DB)
    const evaluation = new EvaluationService()
    
    // 고객 프로필 로드
    const customer = await db.getCustomerById(customer_id)
    if (!customer) {
      return c.json({
        success: false,
        error: 'Customer not found'
      }, 404)
    }
    
    // LLM 기반 제안서 평가
    const proposalEvaluation = await evaluation.evaluateProposal(
      customer,
      proposal_title,
      proposal_content
    )
    
    // 결과 저장
    const evaluationId = await db.saveProposalEvaluation(proposalEvaluation)
    
    return c.json({
      success: true,
      data: { ...proposalEvaluation, id: evaluationId }
    })
  } catch (error) {
    return c.json({
      success: false,
      error: error.message
    }, 500)
  }
})

// 3. 발표 평가 API
app.post('/api/evaluations/presentation', async (c) => {
  try {
    const { customer_id, presentation_title, audio_file_path } = await c.req.json()
    
    const db = new DatabaseService(c.env.DB)
    const evaluation = new EvaluationService()
    
    // 고객 프로필 로드
    const customer = await db.getCustomerById(customer_id)
    if (!customer) {
      return c.json({
        success: false,
        error: 'Customer not found'
      }, 404)
    }
    
    // STT + LLM 기반 발표 평가
    const presentationEvaluation = await evaluation.evaluatePresentation(
      customer,
      presentation_title,
      audio_file_path
    )
    
    // 결과 저장
    const evaluationId = await db.savePresentationEvaluation(presentationEvaluation)
    
    return c.json({
      success: true,
      data: { ...presentationEvaluation, id: evaluationId }
    })
  } catch (error) {
    return c.json({
      success: false,
      error: error.message
    }, 500)
  }
})

// 3.1 데모 발표 평가 API
app.post('/api/demo/presentation-evaluation', async (c) => {
  try {
    // 샘플 STT 텍스트
    const sampleSTT = "안녕하십니까, PwC 컨설팅의 발표를 시작하겠습니다. 이번 제안의 핵심은 ERP, MES, ESG 시스템을 하나의 플랫폼으로 통합하는 것입니다. 이를 통해 금고석유화학은 글로벌 ESG 규제에 선제적으로 대응하고, 공정 데이터를 경영 의사결정에 직접 연결할 수 있습니다. 또한, 저희는 화학 산업 프로젝트 경험과 글로벌 ESG 대응 노하우를 바탕으로, 안정적인 실행을 보장합니다. 마지막으로, 단계별 PoC를 통해 리스크를 최소화하고, 12개월 내 성공적인 플랫폼 구축을 완수하겠습니다. 감사합니다."
    
    // 샘플 음성 메트릭
    const speechMetrics = {
      duration_seconds: 180,  // 3분
      word_count: 89,
      words_per_minute: 29.7,
      pause_count: 6,
      filler_word_count: 2,
      average_volume_level: 0.75
    }
    
    // 6지표 평가 점수 (샘플)
    const evaluationScores = {
      clarity: {
        score: 4,
        comment: "발표 내용이 명확하고 체계적으로 구성되어 있으나, 기술적 세부사항에 대한 설명이 더 구체적이면 좋겠습니다."
      },
      expertise: {
        score: 5, 
        comment: "화학산업과 ESG 분야의 전문성이 뛰어나게 드러나며, 실제 프로젝트 경험을 바탕으로 한 신뢰할 수 있는 접근법을 제시했습니다."
      },
      persuasiveness: {
        score: 4,
        comment: "고객의 니즈를 정확히 파악하고 해결방안을 논리적으로 제시했으나, 감정적 어필과 스토리텔링 요소가 보강되면 더욱 설득력이 높아질 것입니다."
      },
      logic: {
        score: 4,
        comment: "논리적 흐름이 체계적이고 근거가 타당하나, 각 단계별 연결고리를 더욱 명확히 제시하면 좋겠습니다."
      },
      creativity: {
        score: 3,
        comment: "안정적이고 검증된 접근법이지만, 혁신적이고 차별화된 아이디어가 더 필요합니다. 창의적인 솔루션 요소를 추가하면 경쟁력이 높아질 것입니다."
      },
      credibility: {
        score: 5,
        comment: "PwC의 브랜드 신뢰도와 화학산업 프로젝트 경험, 단계적 실행 방안이 매우 신뢰할 만합니다."
      }
    }
    
    // 점수 변환 함수: 1-5점을 10/20/30/40/50점으로 변환
    const convertTo100Scale = (score) => {
      const mapping = { 1: 10, 2: 20, 3: 30, 4: 40, 5: 50 }
      return mapping[score] || 0
    }
    
    // 100점 만점 점수로 변환
    const convertedScores = {}
    Object.keys(evaluationScores).forEach(key => {
      convertedScores[key] = {
        ...evaluationScores[key],
        score_100: convertTo100Scale(evaluationScores[key].score),
        score_5: evaluationScores[key].score  // 원본 5점 점수도 유지
      }
    })
    
    // 총점 계산 (100점 만점)
    const scores = Object.values(evaluationScores)
    const totalScore5 = scores.reduce((sum, item) => sum + item.score, 0) / scores.length  // 5점 만점
    const totalScore100 = convertTo100Scale(Math.round(totalScore5))  // 100점 만점으로 변환
    
    // 발표 평가 결과 구성
    const presentationEvaluation = {
      customer_id: 'demo-customer',
      presentation_title: '금고석유화학 DX 플랫폼 구축 제안',
      stt_transcript: sampleSTT,
      speech_metrics: speechMetrics,
      scores: convertedScores,  // 변환된 점수 사용 (100점 만점 + 5점 원본)
      total_score_5: totalScore5,      // 5점 만점 총점
      total_score_100: totalScore100,  // 100점 만점 총점
      total_score: totalScore100,      // 기본 총점은 100점 만점
      overall_feedback: `화학산업 전문성과 ESG 대응 역량이 우수하며, 체계적이고 실현가능한 실행 계획을 제시했습니다. 
        발표 스킬 면에서는 명확한 전달력을 보였으나, 더욱 창의적이고 혁신적인 차별화 요소를 강화하면 경쟁력이 높아질 것입니다. 
        전반적으로 신뢰할 수 있는 우수한 발표였습니다.`,
      created_at: new Date().toISOString()
    }
    
    return c.json({
      success: true,
      data: presentationEvaluation,
      message: "데모 발표 평가 완료"
    })
  } catch (error) {
    return c.json({
      success: false,
      error: error.message
    }, 500)
  }
})

// 4. 통합 결과 API
app.post('/api/evaluations/integrate', async (c) => {
  try {
    const { customer_id, proposal_evaluation_id, presentation_evaluation_id, project_title } = await c.req.json()
    
    const db = new DatabaseService(c.env.DB)
    const evaluation = new EvaluationService()
    
    // 제안서/발표 평가 데이터 로드
    const proposalEval = proposal_evaluation_id ? await db.getProposalEvaluation(proposal_evaluation_id) : null
    const presentationEval = presentation_evaluation_id ? await db.getPresentationEvaluation(presentation_evaluation_id) : null
    
    // 통합 결과 생성
    const integratedResult = await evaluation.integrateResults(
      customer_id,
      proposalEval,
      presentationEval,
      project_title
    )
    
    // 결과 저장
    const resultId = await db.saveIntegratedEvaluation(integratedResult)
    
    return c.json({
      success: true,
      data: { ...integratedResult, id: resultId }
    })
  } catch (error) {
    return c.json({
      success: false,
      error: error.message
    }, 500)
  }
})

// 5. 세션 관리 API
app.get('/api/sessions', async (c) => {
  try {
    const db = new DatabaseService(c.env.DB)
    const sessions = await db.getAllSessions()
    
    return c.json({
      success: true,
      data: sessions
    })
  } catch (error) {
    return c.json({
      success: false,
      error: error.message
    }, 500)
  }
})

app.post('/api/sessions', async (c) => {
  try {
    const { session_name } = await c.req.json()
    const db = new DatabaseService(c.env.DB)
    
    const session: EvaluationSession = {
      id: crypto.randomUUID(),
      session_name,
      current_stage: 'customer_generation',
      progress: {
        customer_completed: false,
        proposal_completed: false,
        presentation_completed: false,
        results_completed: false
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    
    const sessionId = await db.saveSession(session)
    
    return c.json({
      success: true,
      data: { ...session, id: sessionId }
    })
  } catch (error) {
    return c.json({
      success: false,
      error: error.message
    }, 500)
  }
})

// === 데모 API 엔드포인트 ===

// 데모 딥리서치 데이터 조회
app.get('/api/demo/deep-research', (c) => {
  try {
    const demoData = DemoDataService.getSampleDeepResearchData()
    return c.json({
      success: true,
      data: demoData,
      message: "금고석유화학 샘플 딥리서치 데이터 (15속성)"
    })
  } catch (error) {
    return c.json({
      success: false,
      error: error.message
    }, 500)
  }
})

// 데모 RFP 분석 데이터 조회
app.get('/api/demo/rfp-analysis', (c) => {
  try {
    const demoData = DemoDataService.getSampleRfpAnalysisData()
    return c.json({
      success: true,
      data: demoData,
      message: "DX 프로젝트 샘플 RFP 분석 데이터 (15속성)"
    })
  } catch (error) {
    return c.json({
      success: false,
      error: error.message
    }, 500)
  }
})

// 데모 AI 가상고객 생성
app.post('/api/demo/generate-customer', async (c) => {
  try {
    const db = new DatabaseService(c.env.DB)
    const demoCustomer = DemoDataService.getSampleAIVirtualCustomer()
    
    // 데이터베이스에 저장
    const customerId = await db.saveCustomer(demoCustomer)
    
    return c.json({
      success: true,
      data: { ...demoCustomer, id: customerId },
      message: "데모 AI 가상고객이 성공적으로 생성되었습니다"
    })
  } catch (error) {
    return c.json({
      success: false,
      error: error.message
    }, 500)
  }
})

// 데모 제안서 평가 실행
app.post('/api/demo/evaluate-proposal', async (c) => {
  try {
    const { customer_id } = await c.req.json()
    const db = new DatabaseService(c.env.DB)
    
    const demoProposalEval = DemoDataService.getSampleProposalEvaluation()
    demoProposalEval.customer_id = customer_id
    
    // 데이터베이스에 저장
    const evaluationId = await db.saveProposalEvaluation(demoProposalEval)
    
    return c.json({
      success: true,
      data: { ...demoProposalEval, id: evaluationId },
      message: "데모 제안서 평가가 완료되었습니다"
    })
  } catch (error) {
    return c.json({
      success: false,
      error: error.message
    }, 500)
  }
})

// 데모 발표 평가 실행  
app.post('/api/demo/evaluate-presentation', async (c) => {
  try {
    const { customer_id } = await c.req.json()
    const db = new DatabaseService(c.env.DB)
    
    const demoPresentationEval = DemoDataService.getSamplePresentationEvaluation()
    demoPresentationEval.customer_id = customer_id
    
    // 데이터베이스에 저장
    const evaluationId = await db.savePresentationEvaluation(demoPresentationEval)
    
    return c.json({
      success: true,  
      data: { ...demoPresentationEval, id: evaluationId },
      message: "데모 발표 평가가 완료되었습니다"
    })
  } catch (error) {
    return c.json({
      success: false,
      error: error.message
    }, 500)
  }
})

// === 파일 업로드 및 파싱 API ===

// 파일 업로드 처리 (multipart/form-data)
app.post('/api/upload/file', async (c) => {
  try {
    // Cloudflare Workers에서는 FormData를 직접 처리
    const formData = await c.req.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return c.json({
        success: false,
        error: '파일이 업로드되지 않았습니다.'
      }, 400)
    }

    // 파일 크기 검증 (50MB 제한)
    if (file.size > 50 * 1024 * 1024) {
      return c.json({
        success: false,
        error: '파일 크기가 50MB를 초과합니다.'
      }, 400)
    }

    // 파일 형식 검증
    const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain']
    const allowedExtensions = ['.pdf', '.docx', '.txt']
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase()
    
    if (!allowedExtensions.includes(fileExtension)) {
      return c.json({
        success: false,
        error: '지원하지 않는 파일 형식입니다. PDF, DOCX, TXT 파일만 업로드 가능합니다.'
      }, 400)
    }

    // 파일 파싱
    const fileParser = new FileParserService()
    const parsedDocument = await fileParser.parseFile(file)
    
    // 파일 정보 반환 (실제로는 Cloudflare R2나 다른 스토리지에 저장)
    return c.json({
      success: true,
      data: {
        file_id: crypto.randomUUID(),
        file_name: file.name,
        file_size: file.size,
        file_type: fileExtension,
        parsed_content: parsedDocument,
        uploaded_at: new Date().toISOString()
      },
      message: '파일이 성공적으로 업로드되고 파싱되었습니다.'
    })

  } catch (error) {
    console.error('파일 업로드 오류:', error)
    return c.json({
      success: false,
      error: '파일 처리 중 오류가 발생했습니다: ' + error.message
    }, 500)
  }
})

// RFP 파일 분석
app.post('/api/parse/rfp', async (c) => {
  try {
    const { file_data, file_name } = await c.req.json()
    
    // Base64 디코딩 또는 파일 데이터 처리
    const fileParser = new FileParserService()
    
    // 시뮬레이션된 파싱 결과
    const simulatedFile = new File([file_data || ''], file_name || 'rfp.pdf')
    const parsedDocument = await fileParser.parseFile(simulatedFile)
    
    // RFP 속성 추출
    const rfpAttributes = fileParser.extractRfpAttributes(parsedDocument)
    
    return c.json({
      success: true,
      data: {
        parsed_document: parsedDocument,
        rfp_attributes: rfpAttributes
      },
      message: 'RFP 파일이 성공적으로 분석되었습니다.'
    })

  } catch (error) {
    return c.json({
      success: false,
      error: '파일 분석 중 오류가 발생했습니다: ' + error.message
    }, 500)
  }
})

// 제안서 파일 분석
app.post('/api/parse/proposal', async (c) => {
  try {
    const { file_data, file_name } = await c.req.json()
    
    const fileParser = new FileParserService()
    
    // 시뮬레이션된 파싱 결과
    const simulatedFile = new File([file_data || ''], file_name || 'proposal.pdf')
    const parsedDocument = await fileParser.parseFile(simulatedFile)
    
    // 제안서 내용 추출
    const proposalContent = fileParser.extractProposalContent(parsedDocument)
    
    return c.json({
      success: true,
      data: {
        parsed_document: parsedDocument,
        proposal_content: proposalContent
      },
      message: '제안서 파일이 성공적으로 분석되었습니다.'
    })

  } catch (error) {
    return c.json({
      success: false,
      error: '제안서 분석 중 오류가 발생했습니다: ' + error.message
    }, 500)
  }
})

// === PDF 리포트 생성 API ===

// PDF 리포트 생성
app.post('/api/report/generate', async (c) => {
  try {
    const { customer_id, proposal_evaluation_id, presentation_evaluation_id } = await c.req.json()
    
    const db = new DatabaseService(c.env.DB)
    const pdfGenerator = new PDFGeneratorService()

    // 고객 정보 조회
    const customer = await db.getCustomerById(customer_id)
    if (!customer) {
      return c.json({
        success: false,
        error: 'AI 가상고객을 찾을 수 없습니다.'
      }, 404)
    }

    // 평가 정보 조회
    let proposalEval = null
    let presentationEval = null
    
    if (proposal_evaluation_id) {
      proposalEval = await db.getProposalEvaluation(proposal_evaluation_id)
    }
    
    if (presentation_evaluation_id) {
      presentationEval = await db.getPresentationEvaluation(presentation_evaluation_id)
    }

    // 리포트 데이터 생성
    const reportData = pdfGenerator.generateReportData(customer, proposalEval, presentationEval)
    
    // HTML 리포트 생성
    const htmlReport = pdfGenerator.generateHTMLReport(reportData)

    return c.json({
      success: true,
      data: {
        report_data: reportData,
        html_content: htmlReport,
        download_filename: `RFP평가리포트_${customer.name}_${new Date().toISOString().split('T')[0]}.html`
      },
      message: 'PDF 리포트가 성공적으로 생성되었습니다.'
    })

  } catch (error) {
    console.error('PDF 리포트 생성 오류:', error)
    return c.json({
      success: false,
      error: '리포트 생성 중 오류가 발생했습니다: ' + error.message
    }, 500)
  }
})

// 데모 리포트 생성
app.get('/api/report/demo', async (c) => {
  try {
    const pdfGenerator = new PDFGeneratorService()
    
    // 데모 데이터 사용
    const demoCustomer = DemoDataService.getSampleAIVirtualCustomer()
    const demoProposalEval = DemoDataService.getSampleProposalEvaluation()
    const demoPresentationEval = DemoDataService.getSamplePresentationEvaluation()
    
    // 리포트 생성
    const reportData = pdfGenerator.generateReportData(demoCustomer, demoProposalEval, demoPresentationEval)
    const htmlReport = pdfGenerator.generateHTMLReport(reportData)

    return c.json({
      success: true,
      data: {
        report_data: reportData,
        html_content: htmlReport,
        download_filename: `데모_RFP평가리포트_${new Date().toISOString().split('T')[0]}.html`
      },
      message: '데모 리포트가 생성되었습니다.'
    })

  } catch (error) {
    console.error('데모 리포트 생성 오류:', error)
    return c.json({
      success: false,
      error: '데모 리포트 생성 중 오류가 발생했습니다: ' + error.message
    }, 500)
  }
})

// === 웹 페이지 라우트 ===

// 메인 대시보드
app.get('/', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="ko">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>RFP기반 AI가상고객 제안 평가 시뮬레이터</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <script>
          tailwind.config = {
            theme: {
              extend: {
                colors: {
                  'primary': '#2563eb',
                  'secondary': '#f1f5f9'
                }
              }
            }
          }
        </script>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;700&display=swap');
          body { font-family: 'Noto Sans KR', sans-serif; }
        </style>
    </head>
    <body class="bg-gray-100 min-h-screen">
        <!-- 헤더 -->
        <header class="bg-white shadow-sm border-b">
            <div class="container mx-auto px-4 py-6">
                <div class="flex items-center justify-between">
                    <div class="flex items-center space-x-4">
                        <i class="fas fa-robot text-primary text-3xl"></i>
                        <div>
                            <h1 class="text-2xl font-bold text-gray-900">RFP기반 AI가상고객 제안 평가 시뮬레이터</h1>
                            <p class="text-gray-600 text-sm">딥리서치 + RFP 분석으로 가상고객 생성 → 제안/발표 평가 → 통합 결과</p>
                        </div>
                    </div>
                    <div class="flex items-center space-x-2">
                        <span class="bg-primary text-white px-3 py-1 rounded-full text-sm font-medium">v2.0</span>
                    </div>
                </div>
            </div>
        </header>

        <!-- 진행 단계 -->
        <div class="container mx-auto px-4 py-8">
            <div class="bg-white rounded-lg shadow-sm p-6 mb-8">
                <h2 class="text-lg font-semibold text-gray-900 mb-4">평가 프로세스</h2>
                <div class="flex items-center justify-between">
                    <div class="flex flex-col items-center">
                        <div class="w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center mb-2">
                            <i class="fas fa-user-plus"></i>
                        </div>
                        <span class="text-sm font-medium text-gray-700">AI 가상고객 생성</span>
                        <span class="text-xs text-gray-500">딥리서치 15 + RFP 15</span>
                    </div>
                    <div class="flex-1 h-px bg-gray-300 mx-4"></div>
                    <div class="flex flex-col items-center">
                        <div class="w-12 h-12 bg-gray-300 text-white rounded-full flex items-center justify-center mb-2">
                            <i class="fas fa-file-alt"></i>
                        </div>
                        <span class="text-sm font-medium text-gray-700">제안서 평가</span>
                        <span class="text-xs text-gray-500">6대 지표 루브릭</span>
                    </div>
                    <div class="flex-1 h-px bg-gray-300 mx-4"></div>
                    <div class="flex flex-col items-center">
                        <div class="w-12 h-12 bg-gray-300 text-white rounded-full flex items-center justify-center mb-2">
                            <i class="fas fa-microphone"></i>
                        </div>
                        <span class="text-sm font-medium text-gray-700">발표 평가</span>
                        <span class="text-xs text-gray-500">STT + 음성분석</span>
                    </div>
                    <div class="flex-1 h-px bg-gray-300 mx-4"></div>
                    <div class="flex flex-col items-center">
                        <div class="w-12 h-12 bg-gray-300 text-white rounded-full flex items-center justify-center mb-2">
                            <i class="fas fa-chart-radar"></i>
                        </div>
                        <span class="text-sm font-medium text-gray-700">통합 결과</span>
                        <span class="text-xs text-gray-500">레이더 차트 + 피드백</span>
                    </div>
                </div>
            </div>

            <!-- 기능 카드들 -->
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div class="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow cursor-pointer" onclick="window.location.href='/customer-generation'">
                    <div class="flex items-center mb-4">
                        <div class="bg-blue-100 p-3 rounded-full mr-4">
                            <i class="fas fa-user-plus text-blue-600 text-xl"></i>
                        </div>
                        <h3 class="text-lg font-semibold text-gray-900">AI 가상고객 생성</h3>
                    </div>
                    <p class="text-gray-600 text-sm mb-4">딥리서치와 RFP 분석으로 30속성 가상고객 생성</p>
                    <ul class="text-xs text-gray-500 space-y-1">
                        <li>• 딥리서치 15속성 수집</li>
                        <li>• RFP 문서 15속성 분석</li>
                        <li>• 30속성 통합 페르소나 생성</li>
                    </ul>
                </div>

                <div class="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow cursor-pointer" onclick="window.location.href='/proposal-evaluation'">
                    <div class="flex items-center mb-4">
                        <div class="bg-green-100 p-3 rounded-full mr-4">
                            <i class="fas fa-file-alt text-green-600 text-xl"></i>
                        </div>
                        <h3 class="text-lg font-semibold text-gray-900">제안서 평가</h3>
                    </div>
                    <p class="text-gray-600 text-sm mb-4">6대 지표 루브릭 기반 AI 평가</p>
                    <ul class="text-xs text-gray-500 space-y-1">
                        <li>• 명확성·전문성·설득력</li>
                        <li>• 논리성·창의성·신뢰성</li>
                        <li>• 점수 + 상세 코멘트</li>
                    </ul>
                </div>

                <div class="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow cursor-pointer" onclick="window.location.href='/presentation-evaluation'">
                    <div class="flex items-center mb-4">
                        <div class="bg-purple-100 p-3 rounded-full mr-4">
                            <i class="fas fa-microphone text-purple-600 text-xl"></i>
                        </div>
                        <h3 class="text-lg font-semibold text-gray-900">발표 평가</h3>
                    </div>
                    <p class="text-gray-600 text-sm mb-4">STT + 음성 분석 기반 발표 평가</p>
                    <ul class="text-xs text-gray-500 space-y-1">
                        <li>• 실시간 음성 인식</li>
                        <li>• 발표 내용 6지표 평가</li>
                        <li>• 말속도·휴지·톤 분석</li>
                    </ul>
                </div>

                <div class="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow cursor-pointer" onclick="window.location.href='/results'">
                    <div class="flex items-center mb-4">
                        <div class="bg-red-100 p-3 rounded-full mr-4">
                            <i class="fas fa-chart-radar text-red-600 text-xl"></i>
                        </div>
                        <h3 class="text-lg font-semibold text-gray-900">통합 결과</h3>
                    </div>
                    <p class="text-gray-600 text-sm mb-4">레이더 차트와 종합 피드백</p>
                    <ul class="text-xs text-gray-500 space-y-1">
                        <li>• 6각형 레이더 차트</li>
                        <li>• 강점·보완·총평</li>
                        <li>• PDF 결과 내보내기</li>
                    </ul>
                </div>
            </div>

            <!-- 시작하기 버튼 -->
            <div class="text-center">
                <button onclick="window.location.href='/customer-generation'" class="bg-primary hover:bg-blue-700 text-white px-8 py-4 rounded-lg text-lg font-medium transition-colors">
                    <i class="fas fa-play mr-2"></i>평가 시작하기
                </button>
            </div>


        </div>

        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <script>
            // 페이지 스크립트는 여기에 추가할 수 있습니다

        </script>
    </body>
    </html>
  `)
})

// 제안서 평가 페이지
app.get('/proposal-evaluation', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="ko">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>제안서 평가 - RFP 평가 시뮬레이터</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;700&display=swap');
          body { font-family: 'Noto Sans KR', sans-serif; }
        </style>
    </head>
    <body class="bg-gray-100 min-h-screen">
        <!-- 헤더 -->
        <header class="bg-white shadow-sm border-b">
            <div class="container mx-auto px-4 py-4">
                <div class="flex items-center justify-between">
                    <div class="flex items-center space-x-4">
                        <a href="/" class="text-blue-600 hover:text-blue-700">
                            <i class="fas fa-arrow-left text-xl"></i>
                        </a>
                        <h1 class="text-2xl font-bold text-gray-900">제안서 평가</h1>
                        <span class="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">2단계</span>
                    </div>
                </div>
            </div>
        </header>

        <div class="container mx-auto px-4 py-8">
            <!-- AI 가상고객 선택 -->
            <div class="bg-white rounded-lg shadow-sm p-6 mb-8">
                <h2 class="text-xl font-semibold text-gray-900 mb-4">
                    <i class="fas fa-user-circle mr-2 text-blue-600"></i>AI 가상고객 선택
                </h2>
                
                <div class="grid grid-cols-1 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">평가할 AI 가상고객</label>
                        <select id="customer-select" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500">
                            <option value="">AI 가상고객을 선택하세요</option>
                        </select>
                    </div>
                </div>

                <!-- 선택된 고객 정보 표시 -->
                <div id="selected-customer-info" class="hidden mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <h3 class="font-medium text-blue-900 mb-2">선택된 AI 가상고객</h3>
                    <div id="customer-details" class="text-sm text-blue-800">
                        <!-- 동적으로 채워짐 -->
                    </div>
                </div>
            </div>

            <!-- 제안서 업로드 -->
            <div class="bg-white rounded-lg shadow-sm p-6 mb-8">
                <h2 class="text-xl font-semibold text-gray-900 mb-4">
                    <i class="fas fa-file-upload mr-2 text-green-600"></i>제안서 업로드
                </h2>
                
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">제안서 제목</label>
                        <input type="text" id="proposal-title" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500" 
                               placeholder="예: 금고석유화학 DX 전략 수립 및 실행">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">제안사명</label>
                        <input type="text" id="proposal-company" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                               placeholder="예: PwC 컨설팅">
                    </div>
                </div>

                <div class="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center" id="proposal-drop-zone">
                    <i class="fas fa-cloud-upload-alt text-4xl text-gray-400 mb-4"></i>
                    <p class="text-lg font-medium text-gray-700 mb-2">제안서 파일을 업로드하세요</p>
                    <p class="text-gray-500 mb-4">PDF, DOCX, TXT 형식 지원 (최대 50MB)</p>
                    <input type="file" id="proposal-file" accept=".pdf,.docx,.txt" class="hidden">
                    <div class="flex justify-center space-x-4">
                        <button onclick="document.getElementById('proposal-file').click()" class="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-md transition-colors">
                            파일 선택
                        </button>
                        <button id="demo-proposal-load" class="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-md transition-colors">
                            <i class="fas fa-rocket mr-2"></i>데모 제안서 로드
                        </button>
                    </div>
                </div>

                <!-- 업로드된 파일 정보 -->
                <div id="uploaded-file-info" class="hidden mt-6 p-4 bg-green-50 rounded-lg border border-green-200">
                    <h3 class="font-medium text-green-900 mb-2">업로드된 제안서</h3>
                    <div id="file-details" class="text-sm text-green-800">
                        <!-- 동적으로 채워짐 -->
                    </div>
                </div>
            </div>

            <!-- 평가 진행 -->
            <div class="bg-white rounded-lg shadow-sm p-6 mb-8">
                <h2 class="text-xl font-semibold text-gray-900 mb-4">
                    <i class="fas fa-clipboard-check mr-2 text-purple-600"></i>6대 지표 평가
                </h2>

                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                    <div class="text-center p-4 border rounded-lg">
                        <div class="text-2xl font-bold text-blue-600">명확성</div>
                        <div class="text-sm text-gray-600">목적·범위·효과의 명확성</div>
                    </div>
                    <div class="text-center p-4 border rounded-lg">
                        <div class="text-2xl font-bold text-green-600">전문성</div>
                        <div class="text-sm text-gray-600">실무 지식의 깊이와 정확성</div>
                    </div>
                    <div class="text-center p-4 border rounded-lg">
                        <div class="text-2xl font-bold text-yellow-600">설득력</div>
                        <div class="text-sm text-gray-600">고객 관점 이해와 설득 논리</div>
                    </div>
                    <div class="text-center p-4 border rounded-lg">
                        <div class="text-2xl font-bold text-indigo-600">논리성</div>
                        <div class="text-sm text-gray-600">추론의 타당성과 근거 체계성</div>
                    </div>
                    <div class="text-center p-4 border rounded-lg">
                        <div class="text-2xl font-bold text-pink-600">창의성</div>
                        <div class="text-sm text-gray-600">차별화된 접근법과 혁신성</div>
                    </div>
                    <div class="text-center p-4 border rounded-lg">
                        <div class="text-2xl font-bold text-red-600">신뢰성</div>
                        <div class="text-sm text-gray-600">실현 가능성과 객관적 근거</div>
                    </div>
                </div>

                <button id="start-evaluation" class="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 px-6 rounded-lg text-lg font-medium transition-colors disabled:bg-gray-400" disabled>
                    <i class="fas fa-play mr-2"></i>AI 평가 시작
                </button>
            </div>

            <!-- 평가 결과 -->
            <div id="evaluation-results" class="hidden bg-white rounded-lg shadow-sm p-6">
                <h2 class="text-xl font-semibold text-gray-900 mb-6">
                    <i class="fas fa-chart-line mr-2 text-green-600"></i>평가 결과
                </h2>

                <!-- 점수 차트 -->
                <div class="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
                    <div class="text-center p-4 bg-blue-50 rounded-lg">
                        <div class="text-3xl font-bold text-blue-600" id="clarity-score">-</div>
                        <div class="text-sm font-medium text-blue-800">명확성</div>
                    </div>
                    <div class="text-center p-4 bg-green-50 rounded-lg">
                        <div class="text-3xl font-bold text-green-600" id="expertise-score">-</div>
                        <div class="text-sm font-medium text-green-800">전문성</div>
                    </div>
                    <div class="text-center p-4 bg-yellow-50 rounded-lg">
                        <div class="text-3xl font-bold text-yellow-600" id="persuasiveness-score">-</div>
                        <div class="text-sm font-medium text-yellow-800">설득력</div>
                    </div>
                    <div class="text-center p-4 bg-indigo-50 rounded-lg">
                        <div class="text-3xl font-bold text-indigo-600" id="logic-score">-</div>
                        <div class="text-sm font-medium text-indigo-800">논리성</div>
                    </div>
                    <div class="text-center p-4 bg-pink-50 rounded-lg">
                        <div class="text-3xl font-bold text-pink-600" id="creativity-score">-</div>
                        <div class="text-sm font-medium text-pink-800">창의성</div>
                    </div>
                    <div class="text-center p-4 bg-red-50 rounded-lg">
                        <div class="text-3xl font-bold text-red-600" id="credibility-score">-</div>
                        <div class="text-sm font-medium text-red-800">신뢰성</div>
                    </div>
                </div>

                <!-- 총점 -->
                <div class="text-center p-6 bg-gray-50 rounded-lg mb-8">
                    <div class="text-4xl font-bold text-gray-900" id="total-score">-</div>
                    <div class="text-lg text-gray-600">총점 (100점 만점)</div>
                </div>

                <!-- 상세 코멘트 -->
                <div class="space-y-4 mb-8">
                    <div class="p-4 border border-gray-200 rounded-lg">
                        <h4 class="font-medium text-gray-900 mb-2">종합 평가</h4>
                        <p id="overall-comment" class="text-gray-700">-</p>
                    </div>
                </div>

                <!-- 다음 단계 버튼 -->
                <div class="text-center">
                    <button onclick="window.location.href='/presentation-evaluation'" class="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg text-lg font-medium transition-colors">
                        <i class="fas fa-microphone mr-2"></i>발표 평가 시작
                    </button>
                </div>
            </div>
        </div>

        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <script src="/static/proposal-evaluation.js"></script>
    </body>
    </html>
  `)
})

// AI 가상고객 생성 페이지
app.get('/customer-generation', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="ko">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>AI 가상고객 생성 - RFP 평가 시뮬레이터</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;700&display=swap');
          body { font-family: 'Noto Sans KR', sans-serif; }
        </style>
    </head>
    <body class="bg-gray-100 min-h-screen">
        <div id="customer-generation-app" class="container mx-auto px-4 py-8">
            <h1 class="text-3xl font-bold text-gray-900 mb-8">AI 가상고객 생성</h1>
            
            <!-- 진행 단계 표시 -->
            <div class="bg-white rounded-lg shadow-sm p-6 mb-8">
                <div class="flex items-center justify-between mb-4">
                    <div class="flex items-center">
                        <div class="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium mr-3">1</div>
                        <span class="font-medium">딥리서치 수집</span>
                    </div>
                    <div class="flex items-center">
                        <div class="w-8 h-8 bg-gray-300 text-white rounded-full flex items-center justify-center text-sm font-medium mr-3">2</div>
                        <span class="text-gray-500">RFP 분석</span>
                    </div>
                    <div class="flex items-center">
                        <div class="w-8 h-8 bg-gray-300 text-white rounded-full flex items-center justify-center text-sm font-medium mr-3">3</div>
                        <span class="text-gray-500">페르소나 생성</span>
                    </div>
                </div>
            </div>

            <!-- 딥리서치 섹션 -->
            <div class="bg-white rounded-lg shadow-sm p-6 mb-8">
                <h2 class="text-xl font-semibold text-gray-900 mb-4">
                    <i class="fas fa-search mr-2 text-blue-600"></i>딥리서치 수집 (15속성)
                </h2>
                
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">회사명</label>
                        <input type="text" id="company-name" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500" placeholder="예: 삼성전자">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">분석 깊이</label>
                        <select id="research-depth" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500">
                            <option value="basic">기본 분석</option>
                            <option value="comprehensive">종합 분석</option>
                        </select>
                    </div>
                </div>

                <div class="flex space-x-4">
                    <button id="start-research" class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md transition-colors">
                        <i class="fas fa-play mr-2"></i>딥리서치 시작
                    </button>
                    <button id="demo-deep-research" class="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-md transition-colors">
                        <i class="fas fa-rocket mr-2"></i>데모 데이터 로드
                    </button>
                </div>

                <div id="research-results" class="mt-6 hidden">
                    <h3 class="text-lg font-medium text-gray-900 mb-4">수집된 속성</h3>
                    <div id="research-attributes" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <!-- 동적으로 생성됨 -->
                    </div>
                </div>
            </div>

            <!-- RFP 분석 섹션 -->
            <div class="bg-white rounded-lg shadow-sm p-6 mb-8">
                <h2 class="text-xl font-semibold text-gray-900 mb-4">
                    <i class="fas fa-file-upload mr-2 text-green-600"></i>RFP 문서 분석 (15속성)
                </h2>
                
                <div class="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center" id="rfp-drop-zone">
                    <i class="fas fa-cloud-upload-alt text-4xl text-gray-400 mb-4"></i>
                    <p class="text-lg font-medium text-gray-700 mb-2">RFP 파일을 업로드하세요</p>
                    <p class="text-gray-500 mb-4">PDF, DOCX, TXT 형식 지원</p>
                    <input type="file" id="rfp-file" accept=".pdf,.docx,.txt" class="hidden">
                    <div class="flex space-x-4 justify-center">
                        <button onclick="document.getElementById('rfp-file').click()" class="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-md transition-colors">
                            파일 선택
                        </button>
                        <button id="demo-rfp-analysis" class="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-md transition-colors">
                            <i class="fas fa-rocket mr-2"></i>데모 RFP 로드
                        </button>
                    </div>
                </div>

                <div id="rfp-results" class="mt-6 hidden">
                    <h3 class="text-lg font-medium text-gray-900 mb-4">추출된 속성</h3>
                    <div id="rfp-attributes" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <!-- 동적으로 생성됨 -->
                    </div>
                </div>
            </div>

            <!-- 가상고객 생성 버튼 -->
            <div class="text-center">
                <button id="generate-customer" class="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3 rounded-lg text-lg font-medium transition-colors disabled:bg-gray-400" disabled>
                    <i class="fas fa-robot mr-2"></i>AI 가상고객 생성
                </button>
            </div>
        </div>

        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <script src="/static/customer-generation.js"></script>
    </body>
    </html>
  `)
})

// 발표 평가 페이지  
app.get('/presentation-evaluation', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="ko">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>발표 평가 - RFP 평가 시뮬레이터</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;700&display=swap');
          body { font-family: 'Noto Sans KR', sans-serif; }
          .recording { 
            animation: pulse 1.5s ease-in-out infinite alternate;
          }
          @keyframes pulse {
            from { opacity: 0.6; }
            to { opacity: 1; }
          }
        </style>
    </head>
    <body class="bg-gray-100 min-h-screen">
        <!-- 헤더 -->
        <header class="bg-white shadow-sm border-b">
            <div class="container mx-auto px-4 py-4">
                <div class="flex items-center justify-between">
                    <div class="flex items-center space-x-4">
                        <a href="/proposal-evaluation" class="text-blue-600 hover:text-blue-700">
                            <i class="fas fa-arrow-left text-xl"></i>
                        </a>
                        <h1 class="text-2xl font-bold text-gray-900">발표 평가</h1>
                        <span class="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-medium">3단계</span>
                    </div>
                </div>
            </div>
        </header>

        <div class="container mx-auto px-4 py-8">
            <!-- AI 가상고객 선택 -->
            <div class="bg-white rounded-lg shadow-sm p-6 mb-8">
                <h2 class="text-xl font-semibold text-gray-900 mb-4">
                    <i class="fas fa-user-circle mr-2 text-blue-600"></i>AI 가상고객 선택
                </h2>
                
                <div class="grid grid-cols-1 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">평가할 AI 가상고객</label>
                        <select id="customer-select" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500">
                            <option value="">AI 가상고객을 선택하세요</option>
                        </select>
                    </div>
                </div>
            </div>

            <!-- 발표 설정 -->
            <div class="bg-white rounded-lg shadow-sm p-6 mb-8">
                <h2 class="text-xl font-semibold text-gray-900 mb-4">
                    <i class="fas fa-cog mr-2 text-green-600"></i>발표 설정
                </h2>
                
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">발표 제목</label>
                        <input type="text" id="presentation-title" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500" 
                               placeholder="예: 금고석유화학 DX 플랫폼 구축 제안">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">예상 발표 시간 (분)</label>
                        <select id="presentation-duration" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500">
                            <option value="5">5분</option>
                            <option value="10" selected>10분</option>
                            <option value="15">15분</option>
                            <option value="20">20분</option>
                        </select>
                    </div>
                </div>
            </div>

            <!-- 녹화 섹션 -->
            <div class="bg-white rounded-lg shadow-sm p-6 mb-8">
                <h2 class="text-xl font-semibold text-gray-900 mb-4">
                    <i class="fas fa-video mr-2 text-red-600"></i>발표 녹화
                </h2>

                <!-- 미디어 접근 권한 요청 -->
                <div id="media-setup" class="text-center py-8">
                    <i class="fas fa-camera text-4xl text-gray-400 mb-4"></i>
                    <p class="text-gray-600 mb-6">발표 녹화를 위해 카메라와 마이크 권한이 필요합니다.</p>
                    
                    <div class="space-x-4">
                        <button id="request-media" class="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-medium transition-colors">
                            <i class="fas fa-play mr-2"></i>카메라/마이크 시작
                        </button>
                        
                        <button id="demo-presentation-eval" class="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition-colors">
                            <i class="fas fa-magic mr-2"></i>데모 평가 실행
                        </button>
                    </div>
                    
                    <div class="mt-4 p-4 bg-blue-50 rounded-lg">
                        <p class="text-sm text-blue-800">
                            <i class="fas fa-info-circle mr-1"></i>
                            <strong>데모 모드:</strong> 샘플 발표 데이터를 이용하여 즉시 평가 결과를 확인할 수 있습니다.
                        </p>
                    </div>
                </div>

                <!-- 비디오 프리뷰 -->
                <div id="video-preview" class="hidden">
                    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div>
                            <h3 class="font-medium text-gray-900 mb-3">비디오 프리뷰</h3>
                            <div class="relative bg-gray-900 rounded-lg overflow-hidden">
                                <video id="preview-video" autoplay muted class="w-full h-48 object-cover"></video>
                                <div id="recording-indicator" class="hidden absolute top-2 left-2 bg-red-600 text-white px-2 py-1 rounded text-sm recording">
                                    <i class="fas fa-circle mr-1"></i>녹화 중
                                </div>
                            </div>
                        </div>
                        <div>
                            <h3 class="font-medium text-gray-900 mb-3">음성 레벨</h3>
                            <div class="bg-gray-100 p-4 rounded-lg">
                                <div class="mb-2 text-sm text-gray-600">마이크 입력</div>
                                <div class="w-full bg-gray-300 rounded-full h-3">
                                    <div id="audio-level" class="bg-green-500 h-3 rounded-full transition-all duration-100" style="width: 0%"></div>
                                </div>
                                <div class="mt-2 text-xs text-gray-500">소리를 내보세요. 초록색 바가 움직이면 정상입니다.</div>
                            </div>
                        </div>
                    </div>

                    <!-- 녹화 컨트롤 -->
                    <div class="mt-6 text-center space-x-4">
                        <button id="start-recording" class="bg-red-600 hover:bg-red-700 text-white px-8 py-3 rounded-lg font-medium transition-colors">
                            <i class="fas fa-record-vinyl mr-2"></i>녹화 시작
                        </button>
                        <button id="stop-recording" class="hidden bg-gray-600 hover:bg-gray-700 text-white px-8 py-3 rounded-lg font-medium transition-colors">
                            <i class="fas fa-stop mr-2"></i>녹화 중지
                        </button>
                        <button id="demo-presentation-eval" class="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg font-medium transition-colors">
                            <i class="fas fa-rocket mr-2"></i>데모 평가
                        </button>
                    </div>

                    <!-- 녹화 시간 표시 -->
                    <div id="recording-timer" class="hidden mt-4 text-center">
                        <div class="text-2xl font-mono text-red-600" id="timer-display">00:00</div>
                        <div class="text-sm text-gray-600">녹화 시간</div>
                    </div>
                </div>
            </div>

            <!-- 실시간 STT 결과 -->
            <div id="stt-section" class="hidden bg-white rounded-lg shadow-sm p-6 mb-8">
                <h2 class="text-xl font-semibold text-gray-900 mb-4">
                    <i class="fas fa-microphone-alt mr-2 text-blue-600"></i>실시간 음성 인식 (STT)
                </h2>
                
                <div class="bg-gray-50 rounded-lg p-4 min-h-32">
                    <div class="text-sm text-gray-500 mb-2">인식된 텍스트:</div>
                    <div id="stt-text" class="text-gray-900 leading-relaxed">
                        음성 인식을 시작하려면 녹화를 시작하세요...
                    </div>
                </div>

                <div class="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div class="text-center p-3 bg-blue-50 rounded">
                        <div class="font-medium text-blue-900">말속도</div>
                        <div id="speech-speed" class="text-blue-600">- WPM</div>
                    </div>
                    <div class="text-center p-3 bg-green-50 rounded">
                        <div class="font-medium text-green-900">휴지 빈도</div>
                        <div id="pause-frequency" class="text-green-600">- 회/분</div>
                    </div>
                    <div class="text-center p-3 bg-yellow-50 rounded">
                        <div class="font-medium text-yellow-900">군더더기어</div>
                        <div id="filler-words" class="text-yellow-600">- 개</div>
                    </div>
                </div>
            </div>

            <!-- 평가 결과 -->
            <div id="evaluation-results" class="hidden bg-white rounded-lg shadow-sm p-6 mb-8">
                <h2 class="text-xl font-semibold text-gray-900 mb-6">
                    <i class="fas fa-chart-line mr-2 text-green-600"></i>발표 평가 결과
                </h2>

                <!-- 점수 차트 -->
                <div class="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
                    <div class="text-center p-4 bg-blue-50 rounded-lg">
                        <div class="text-3xl font-bold text-blue-600" id="clarity-score">-</div>
                        <div class="text-sm font-medium text-blue-800">명확성</div>
                    </div>
                    <div class="text-center p-4 bg-green-50 rounded-lg">
                        <div class="text-3xl font-bold text-green-600" id="expertise-score">-</div>
                        <div class="text-sm font-medium text-green-800">전문성</div>
                    </div>
                    <div class="text-center p-4 bg-yellow-50 rounded-lg">
                        <div class="text-3xl font-bold text-yellow-600" id="persuasiveness-score">-</div>
                        <div class="text-sm font-medium text-yellow-800">설득력</div>
                    </div>
                    <div class="text-center p-4 bg-indigo-50 rounded-lg">
                        <div class="text-3xl font-bold text-indigo-600" id="logic-score">-</div>
                        <div class="text-sm font-medium text-indigo-800">논리성</div>
                    </div>
                    <div class="text-center p-4 bg-pink-50 rounded-lg">
                        <div class="text-3xl font-bold text-pink-600" id="creativity-score">-</div>
                        <div class="text-sm font-medium text-pink-800">창의성</div>
                    </div>
                    <div class="text-center p-4 bg-red-50 rounded-lg">
                        <div class="text-3xl font-bold text-red-600" id="credibility-score">-</div>
                        <div class="text-sm font-medium text-red-800">신뢰성</div>
                    </div>
                </div>

                <!-- 총점 -->
                <div class="text-center p-6 bg-gray-50 rounded-lg mb-8">
                    <div class="text-4xl font-bold text-gray-900" id="total-score">-</div>
                    <div class="text-lg text-gray-600">총점 (100점 만점)</div>
                </div>

                <!-- 다음 단계 버튼 -->
                <div class="text-center">
                    <button onclick="window.location.href='/results'" class="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg text-lg font-medium transition-colors">
                        <i class="fas fa-chart-radar mr-2"></i>통합 결과 보기
                    </button>
                </div>
            </div>
        </div>

        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <script src="/static/presentation-evaluation.js?v=2.0"></script>
    </body>
    </html>
  `)
})

// favicon 처리
app.get('/favicon.ico', (c) => {
  return c.text('', 204) // No Content
})

// 통합 결과 페이지
app.get('/results', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="ko">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>통합 결과 - RFP 평가 시뮬레이터</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;700&display=swap');
          body { font-family: 'Noto Sans KR', sans-serif; }
        </style>
    </head>
    <body class="bg-gray-100 min-h-screen">
        <!-- 헤더 -->
        <header class="bg-white shadow-sm border-b">
            <div class="container mx-auto px-4 py-4">
                <div class="flex items-center justify-between">
                    <div class="flex items-center space-x-4">
                        <a href="/presentation-evaluation" class="text-blue-600 hover:text-blue-700">
                            <i class="fas fa-arrow-left text-xl"></i>
                        </a>
                        <h1 class="text-2xl font-bold text-gray-900">통합 결과</h1>
                        <span class="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">완료</span>
                    </div>
                </div>
            </div>
        </header>

        <div class="container mx-auto px-4 py-8">
            <!-- 종합 점수 -->
            <div class="bg-white rounded-lg shadow-sm p-6 mb-8 text-center">
                <h2 class="text-2xl font-bold text-gray-900 mb-4">최종 종합 점수</h2>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div class="p-4 bg-blue-50 rounded-lg">
                        <div class="text-3xl font-bold text-blue-600">40점</div>
                        <div class="text-sm text-blue-800">제안서 평가 (70%)</div>
                    </div>
                    <div class="p-4 bg-purple-50 rounded-lg">
                        <div class="text-3xl font-bold text-purple-600">40점</div>
                        <div class="text-sm text-purple-800">발표 평가 (30%)</div>
                    </div>
                    <div class="p-4 bg-green-50 rounded-lg">
                        <div class="text-4xl font-bold text-green-600">40점</div>
                        <div class="text-sm text-green-800">최종 통합 점수 (100점 만점)</div>
                    </div>
                </div>
            </div>

            <!-- 레이더 차트 및 상세 분석 -->
            <div class="bg-white rounded-lg shadow-sm p-6 mb-8">
                <h2 class="text-xl font-semibold text-gray-900 mb-4">6대 지표별 상세 분석</h2>
                
                <!-- 차트 컨테이너 -->
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                    <div class="flex justify-center">
                        <div style="position: relative; height: 400px; width: 400px;">
                            <canvas id="radarChart"></canvas>
                        </div>
                    </div>
                    
                    <!-- 지표별 상세 비교표 -->
                    <div class="space-y-4">
                        <div class="border border-gray-200 rounded-lg overflow-hidden">
                            <table class="w-full">
                                <thead class="bg-gray-50">
                                    <tr>
                                        <th class="px-4 py-2 text-left text-sm font-medium text-gray-900">지표</th>
                                        <th class="px-4 py-2 text-center text-sm font-medium text-blue-600">제안서</th>
                                        <th class="px-4 py-2 text-center text-sm font-medium text-purple-600">발표</th>
                                        <th class="px-4 py-2 text-center text-sm font-medium text-gray-900">차이</th>
                                    </tr>
                                </thead>
                                <tbody class="divide-y divide-gray-200">
                                    <tr>
                                        <td class="px-4 py-2 font-medium text-gray-900">명확성</td>
                                        <td class="px-4 py-2 text-center">
                                            <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                40점
                                            </span>
                                        </td>
                                        <td class="px-4 py-2 text-center">
                                            <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                                40점
                                            </span>
                                        </td>
                                        <td class="px-4 py-2 text-center">
                                            <span class="text-gray-500">0.0</span>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td class="px-4 py-2 font-medium text-gray-900">전문성</td>
                                        <td class="px-4 py-2 text-center">
                                            <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                50점 <i class="fas fa-star ml-1 text-yellow-500"></i>
                                            </span>
                                        </td>
                                        <td class="px-4 py-2 text-center">
                                            <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                                50점 <i class="fas fa-star ml-1 text-yellow-500"></i>
                                            </span>
                                        </td>
                                        <td class="px-4 py-2 text-center">
                                            <span class="text-gray-500">0.0</span>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td class="px-4 py-2 font-medium text-gray-900">설득력</td>
                                        <td class="px-4 py-2 text-center">
                                            <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                40점
                                            </span>
                                        </td>
                                        <td class="px-4 py-2 text-center">
                                            <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                                40점
                                            </span>
                                        </td>
                                        <td class="px-4 py-2 text-center">
                                            <span class="text-gray-500">0.0</span>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td class="px-4 py-2 font-medium text-gray-900">논리성</td>
                                        <td class="px-4 py-2 text-center">
                                            <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                40점
                                            </span>
                                        </td>
                                        <td class="px-4 py-2 text-center">
                                            <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                                40점
                                            </span>
                                        </td>
                                        <td class="px-4 py-2 text-center">
                                            <span class="text-gray-500">0.0</span>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td class="px-4 py-2 font-medium text-gray-900">창의성</td>
                                        <td class="px-4 py-2 text-center">
                                            <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                                30점 <i class="fas fa-exclamation-triangle ml-1"></i>
                                            </span>
                                        </td>
                                        <td class="px-4 py-2 text-center">
                                            <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                                30점 <i class="fas fa-exclamation-triangle ml-1"></i>
                                            </span>
                                        </td>
                                        <td class="px-4 py-2 text-center">
                                            <span class="text-gray-500">0.0</span>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td class="px-4 py-2 font-medium text-gray-900">신뢰성</td>
                                        <td class="px-4 py-2 text-center">
                                            <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                50점 <i class="fas fa-star ml-1 text-yellow-500"></i>
                                            </span>
                                        </td>
                                        <td class="px-4 py-2 text-center">
                                            <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                                50점 <i class="fas fa-star ml-1 text-yellow-500"></i>
                                            </span>
                                        </td>
                                        <td class="px-4 py-2 text-center">
                                            <span class="text-gray-500">0.0</span>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                        
                        <!-- 통계 요약 -->
                        <div class="grid grid-cols-2 gap-4">
                            <div class="bg-blue-50 rounded-lg p-3">
                                <div class="text-sm text-blue-600 font-medium">제안서 평균</div>
                                <div class="text-xl font-bold text-blue-800">40점</div>
                            </div>
                            <div class="bg-purple-50 rounded-lg p-3">
                                <div class="text-sm text-purple-600 font-medium">발표 평균</div>
                                <div class="text-xl font-bold text-purple-800">40점</div>
                            </div>
                        </div>
                        
                        <!-- 지표별 성과 분석 -->
                        <div class="bg-gray-50 rounded-lg p-4">
                            <h4 class="font-medium text-gray-900 mb-2">성과 분석</h4>
                            <ul class="space-y-1 text-sm text-gray-700">
                                <li class="flex items-center">
                                    <i class="fas fa-check-circle text-green-500 mr-2"></i>
                                    <strong>최고 점수:</strong> 전문성, 신뢰성 (50점)
                                </li>
                                <li class="flex items-center">
                                    <i class="fas fa-chart-line text-yellow-500 mr-2"></i>
                                    <strong>개선 필요:</strong> 창의성 (30점)
                                </li>
                                <li class="flex items-center">
                                    <i class="fas fa-balance-scale text-blue-500 mr-2"></i>
                                    <strong>평가 일관성:</strong> 제안서와 발표 점수 차이 없음
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>

            <!-- 성과 요약 및 진행률 바 -->
            <div class="bg-white rounded-lg shadow-sm p-6 mb-8">
                <h2 class="text-xl font-semibold text-gray-900 mb-4">지표별 성과 요약</h2>
                
                <div class="space-y-4">
                    <!-- 명확성 -->
                    <div class="space-y-2">
                        <div class="flex justify-between items-center">
                            <span class="text-sm font-medium text-gray-900">명확성</span>
                            <span class="text-sm text-gray-600">40 / 50점</span>
                        </div>
                        <div class="w-full bg-gray-200 rounded-full h-2">
                            <div class="bg-blue-600 h-2 rounded-full" style="width: 80%"></div>
                        </div>
                    </div>
                    
                    <!-- 전문성 -->
                    <div class="space-y-2">
                        <div class="flex justify-between items-center">
                            <span class="text-sm font-medium text-gray-900">전문성</span>
                            <span class="text-sm text-green-600 font-semibold">50 / 50점 ⭐</span>
                        </div>
                        <div class="w-full bg-gray-200 rounded-full h-2">
                            <div class="bg-green-500 h-2 rounded-full" style="width: 100%"></div>
                        </div>
                    </div>
                    
                    <!-- 설득력 -->
                    <div class="space-y-2">
                        <div class="flex justify-between items-center">
                            <span class="text-sm font-medium text-gray-900">설득력</span>
                            <span class="text-sm text-gray-600">40 / 50점</span>
                        </div>
                        <div class="w-full bg-gray-200 rounded-full h-2">
                            <div class="bg-blue-600 h-2 rounded-full" style="width: 80%"></div>
                        </div>
                    </div>
                    
                    <!-- 논리성 -->
                    <div class="space-y-2">
                        <div class="flex justify-between items-center">
                            <span class="text-sm font-medium text-gray-900">논리성</span>
                            <span class="text-sm text-gray-600">40 / 50점</span>
                        </div>
                        <div class="w-full bg-gray-200 rounded-full h-2">
                            <div class="bg-blue-600 h-2 rounded-full" style="width: 80%"></div>
                        </div>
                    </div>
                    
                    <!-- 창의성 -->
                    <div class="space-y-2">
                        <div class="flex justify-between items-center">
                            <span class="text-sm font-medium text-gray-900">창의성</span>
                            <span class="text-sm text-yellow-600">30 / 50점 ⚠️</span>
                        </div>
                        <div class="w-full bg-gray-200 rounded-full h-2">
                            <div class="bg-yellow-500 h-2 rounded-full" style="width: 60%"></div>
                        </div>
                    </div>
                    
                    <!-- 신뢰성 -->
                    <div class="space-y-2">
                        <div class="flex justify-between items-center">
                            <span class="text-sm font-medium text-gray-900">신뢰성</span>
                            <span class="text-sm text-green-600 font-semibold">50 / 50점 ⭐</span>
                        </div>
                        <div class="w-full bg-gray-200 rounded-full h-2">
                            <div class="bg-green-500 h-2 rounded-full" style="width: 100%"></div>
                        </div>
                    </div>
                </div>
                
                <!-- 성과 등급 -->
                <div class="mt-6 p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border-l-4 border-green-500">
                    <div class="flex items-center">
                        <div class="flex-shrink-0">
                            <i class="fas fa-trophy text-green-500 text-xl"></i>
                        </div>
                        <div class="ml-3">
                            <p class="text-sm font-medium text-green-800">
                                전체 성과 등급: <strong>우수 (B+급)</strong>
                            </p>
                            <p class="text-sm text-green-700">
                                평균 40점(100점 만점)으로 높은 수준의 제안 품질을 보여주었습니다.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- 종합 피드백 -->
            <div class="bg-white rounded-lg shadow-sm p-6 mb-8">
                <h2 class="text-xl font-semibold text-gray-900 mb-6">종합 피드백</h2>
                
                <div class="space-y-6">
                    <div class="p-4 bg-green-50 border border-green-200 rounded-lg">
                        <h3 class="font-medium text-green-900 mb-2">
                            <i class="fas fa-thumbs-up mr-2"></i>강점
                        </h3>
                        <p class="text-green-800">
                            화학산업 전문성과 글로벌 ESG 대응 역량이 뛰어나며, 
                            안정적이고 체계적인 실행 방안을 제시했습니다. 
                            PwC의 브랜드 신뢰도와 실현가능성이 높게 평가됩니다.
                        </p>
                    </div>
                    
                    <div class="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <h3 class="font-medium text-yellow-900 mb-2">
                            <i class="fas fa-lightbulb mr-2"></i>개선 사항
                        </h3>
                        <p class="text-yellow-800">
                            창의적이고 혁신적인 차별화 요소를 더 강화하면 좋겠습니다. 
                            기술적 세부사항의 명확성을 높이고, 
                            더욱 구체적인 실행 타임라인을 제시해주세요.
                        </p>
                    </div>
                    
                    <div class="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <h3 class="font-medium text-blue-900 mb-2">
                            <i class="fas fa-star mr-2"></i>총평
                        </h3>
                        <p class="text-blue-800">
                            금고석유화학의 ESG 경영과 DX 니즈를 정확히 파악한 우수한 제안입니다. 
                            화학산업 전문성과 글로벌 경험을 바탕으로 한 안정적 실행력이 돋보이며, 
                            장기적 파트너십 구축에 적합한 신뢰할 수 있는 제안으로 평가됩니다.
                        </p>
                    </div>
                </div>
            </div>

            <!-- 액션 버튼 -->
            <div class="text-center space-x-4">
                <button onclick="window.location.href='/'" class="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg text-lg font-medium transition-colors">
                    <i class="fas fa-home mr-2"></i>메인으로 돌아가기
                </button>
                <button onclick="downloadReport()" class="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-lg text-lg font-medium transition-colors">
                    <i class="fas fa-download mr-2"></i>PDF 리포트 다운로드
                </button>
            </div>
        </div>

        <script>
            // 차트 애니메이션 및 인터랙션 개선
            const ctx = document.getElementById('radarChart').getContext('2d');
            
            // 제안서와 발표 데이터 (100점 만점)
            const proposalScores = [40, 50, 40, 40, 30, 50];
            const presentationScores = [40, 50, 40, 40, 30, 50];
            const labels = ['명확성', '전문성', '설득력', '논리성', '창의성', '신뢰성'];
            
            // 차트 생성 with 향상된 옵션
            const radarChart = new Chart(ctx, {
                type: 'radar',
                data: {
                    labels: labels,
                    datasets: [{
                        label: '제안서 평가 (70%)',
                        data: proposalScores,
                        backgroundColor: 'rgba(59, 130, 246, 0.15)',
                        borderColor: 'rgba(59, 130, 246, 1)',
                        borderWidth: 3,
                        pointBackgroundColor: 'rgba(59, 130, 246, 1)',
                        pointBorderColor: '#fff',
                        pointBorderWidth: 2,
                        pointRadius: 6,
                        pointHoverRadius: 8
                    }, {
                        label: '발표 평가 (30%)',
                        data: presentationScores,
                        backgroundColor: 'rgba(147, 51, 234, 0.15)',
                        borderColor: 'rgba(147, 51, 234, 1)',
                        borderWidth: 3,
                        pointBackgroundColor: 'rgba(147, 51, 234, 1)',
                        pointBorderColor: '#fff',
                        pointBorderWidth: 2,
                        pointRadius: 6,
                        pointHoverRadius: 8
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    animation: {
                        duration: 2000,
                        easing: 'easeInOutQuart'
                    },
                    interaction: {
                        intersect: false,
                        mode: 'point'
                    },
                    scales: {
                        r: {
                            beginAtZero: true,
                            min: 0,
                            max: 50,
                            ticks: {
                                stepSize: 10,
                                font: {
                                    size: 12
                                },
                                color: '#6B7280',
                                backdropColor: 'transparent'
                            },
                            grid: {
                                color: '#E5E7EB'
                            },
                            angleLines: {
                                color: '#E5E7EB'
                            },
                            pointLabels: {
                                font: {
                                    size: 14,
                                    weight: '500'
                                },
                                color: '#374151'
                            }
                        }
                    },
                    plugins: {
                        legend: {
                            position: 'bottom',
                            labels: {
                                padding: 20,
                                font: {
                                    size: 14,
                                    weight: '500'
                                },
                                usePointStyle: true,
                                pointStyle: 'circle'
                            }
                        },
                        tooltip: {
                            backgroundColor: 'rgba(0, 0, 0, 0.8)',
                            titleFont: {
                                size: 14,
                                weight: '600'
                            },
                            bodyFont: {
                                size: 13
                            },
                            padding: 12,
                            cornerRadius: 8,
                            callbacks: {
                                label: function(context) {
                                    return context.dataset.label + ': ' + context.parsed.r + '점 (50점 만점)';
                                },
                                afterLabel: function(context) {
                                    const score = context.parsed.r;
                                    let evaluation;
                                    if (score >= 45) evaluation = '매우 우수';
                                    else if (score >= 35) evaluation = '우수';
                                    else if (score >= 25) evaluation = '보통';
                                    else if (score >= 15) evaluation = '부족';
                                    else evaluation = '매우 부족';
                                    return '평가: ' + evaluation;
                                }
                            }
                        }
                    }
                }
            });

            async function downloadReport() {
                try {
                    // 로딩 표시
                    const button = event.target;
                    const originalText = button.innerHTML;
                    button.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>리포트 생성 중...';
                    button.disabled = true;

                    // 데모 리포트 생성 API 호출
                    const response = await fetch('/api/report/demo');
                    const result = await response.json();

                    if (result.success) {
                        // HTML 리포트를 새 창에서 열기 (인쇄용)
                        const newWindow = window.open('', '_blank');
                        newWindow.document.write(result.data.html_content);
                        newWindow.document.close();
                        
                        // 자동으로 인쇄 대화상자 열기
                        newWindow.onload = function() {
                            newWindow.print();
                        };

                        // 다운로드 링크 생성 (HTML 파일로)
                        const blob = new Blob([result.data.html_content], { type: 'text/html' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = result.data.download_filename;
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        URL.revokeObjectURL(url);

                        alert('리포트가 성공적으로 생성되었습니다!\\n\\n새 창에서 인쇄 가능하며, HTML 파일도 다운로드됩니다.');
                    } else {
                        throw new Error(result.error);
                    }
                } catch (error) {
                    console.error('리포트 생성 오류:', error);
                    alert('리포트 생성 중 오류가 발생했습니다: ' + error.message);
                } finally {
                    // 버튼 상태 복원
                    button.innerHTML = originalText;
                    button.disabled = false;
                }
            }
        </script>
    </body>
    </html>
  `)
})

export default app