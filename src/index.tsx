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
import { OpenAIService } from './services/openai-service'
import { WebCrawlerService } from './services/web-crawler'
import { PdfParserService } from './services/pdf-parser-service'
import { JsonStorageService } from './services/json-storage'
import { LLMEvaluationService } from './services/llm-evaluation-service'

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
  KV: KVNamespace;
  OPENAI_API_KEY: string;
}

const app = new Hono<{ Bindings: Bindings }>()

// CORS 설정
app.use('/api/*', cors())

// 정적 파일 서빙
app.use('/static/*', serveStatic({ root: './public' }))

// === 헬퍼 함수들 ===

// 기본 RFP 분석 (텍스트 기반 키워드 매칭)
async function generateBasicRfpAnalysis(text: string, fileName: string) {
  const keywords = {
    project_name: ['\ud504\ub85c\uc81d\ud2b8', '\uc0ac\uc5c5', '\uacfc\uc81c', '\uc9c0\uc6d0', '\uacfc\uc81c\uba85'],
    budget_range: ['\uc608\uc0b0', '\ube44\uc6a9', '\uae08\uc561', '\uc6d0', '\ub9cc\uc6d0'],
    timeline: ['\uae30\uac04', '\uc77c\uc815', '\uc644\ub8cc', '\uc885\ub8cc', '\uac1c\uc2dc', '\uc2dc\uc791'],
    requirements: ['\uc694\uad6c\uc0ac\ud56d', '\uc694\uad6c', '\ud544\uc218', '\ud544\uc694', '\uc911\uc694'],
    deliverables: ['\uc0b0\ucd9c\ubb3c', '\uc81c\ucd9c\ubb3c', '\uacb0\uacfc\ubb3c', '\ubcf4\uace0\uc11c', '\ubb38\uc11c'],
    technology: ['\uae30\uc220', '\uc2dc\uc2a4\ud15c', '\ub124\ud2b8\uc6cc\ud06c', 'IT', '\ub514\uc9c0\ud138'],
    qualification: ['\uc790\uaca9', '\uacbd\ud5d8', '\ub2a5\ub825', '\uc804\ubb38\uc131', '\uc778\uc99d']
  }

  const result: any = {
    project_name: '\ubbf8\uc9c0\uc815 \ud504\ub85c\uc81d\ud2b8',
    budget_range: '\ubbf8\uc9c0\uc815',
    timeline: '\ubbf8\uc9c0\uc815',
    requirements: [],
    deliverables: [],
    technology_stack: [],
    qualification_criteria: [],
    evaluation_criteria: [],
    company_info: {
      name: '\ubbf8\uc9c0\uc815 \uae30\uc5c5',
      industry: '\ubbf8\uc9c0\uc815',
      size: '\ubbf8\uc9c0\uc815'
    },
    project_scope: '\ubbf8\uc9c0\uc815',
    success_factors: [],
    constraints: [],
    stakeholders: [],
    risk_factors: [],
    innovation_level: '\ubcf4\ud1b5'
  }

  // 간\ub2e8\ud55c 키\uc6cc\ub4dc \ub9e4\uce6d \ub85c\uc9c1
  const lines = text.split('\n')
  
  for (const line of lines) {
    // \ud504\ub85c\uc81d\ud2b8\uba85 \ucd94\ucd9c
    if (keywords.project_name.some(k => line.includes(k)) && line.length < 100) {
      result.project_name = line.trim() || result.project_name
    }
    
    // \uc608\uc0b0 \uc815\ubcf4 \ucd94\ucd9c
    if (keywords.budget_range.some(k => line.includes(k))) {
      const budgetMatch = line.match(/([0-9,]+)\s*\ub9cc?\uc6d0/)
      if (budgetMatch) {
        result.budget_range = budgetMatch[0]
      }
    }
    
    // \uae30\uac04 \uc815\ubcf4
    if (keywords.timeline.some(k => line.includes(k))) {
      const timeMatch = line.match(/([0-9]+)\s*\uac1c\uc6d4|([0-9]+)\s*\uc8fc|([0-9]+)\s*\uc77c/)
      if (timeMatch) {
        result.timeline = timeMatch[0]
      }
    }
  }

  // \uae30\ubcf8 \uc694\uad6c\uc0ac\ud56d \ucd94\uac00
  result.requirements = ['\uae30\uc220 \uc804\ubb38\uc131', '\ud504\ub85c\uc81d\ud2b8 \uacbd\ud5d8', '\uc608\uc0b0 \ud6a8\uc728\uc131']
  result.deliverables = ['\uc81c\uc548\uc11c', '\uc0ac\uc5c5\uacc4\ud68d\uc11c', '\ucd5c\uc885 \ubcf4\uace0\uc11c']
  result.technology_stack = ['\uc2dc\uc2a4\ud15c \uad6c\ucd95', '\ub370\uc774\ud130 \uc5f0\ub3d9', '\ubcf4\uc548 \uc2dc\uc2a4\ud15c']
  
  return result
}

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
    const storage = new JsonStorageService(c.env.KV)
    const customers = await storage.getAllVirtualCustomers()
    
    return c.json({
      success: true,
      data: customers
    })
  } catch (error) {
    console.error('고객 목록 조회 오류:', error)
    return c.json({
      success: false,
      error: error.message || '고객 목록 조회 중 오류가 발생했습니다.'
    }, 500)
  }
})

// 1.1 AI 가상고객 상세 조회 API
app.get('/api/customers/:id', async (c) => {
  try {
    const customerId = c.req.param('id')
    const storage = new JsonStorageService(c.env.KV)
    
    const customer = await storage.getVirtualCustomer(customerId)
    if (!customer) {
      return c.json({
        success: false,
        error: 'AI 가상고객을 찾을 수 없습니다.'
      }, 404)
    }
    
    return c.json({
      success: true,
      data: customer
    })
  } catch (error) {
    console.error('고객 상세 조회 오류:', error)
    return c.json({
      success: false,
      error: error.message || '고객 상세 조회 중 오륙가 발생했습니다.'
    }, 500)
  }
})

app.post('/api/customers/deep-research', async (c) => {
  try {
    const request: DeepResearchRequest = await c.req.json()
    const { env } = c
    
    // OpenAI API 키가 있으면 LLM 연동, 없으면 기본 모드
    const deepResearch = new DeepResearchService(env.OPENAI_API_KEY)
    const storage = new JsonStorageService(env.KV)
    
    console.log(`딥리서치 요청: ${request.company_name}`)
    
    const researchData = await deepResearch.collectCompanyData(
      request.company_name,
      request.urls || [],
      request.research_depth || 'detailed'
    )
    
    // 결과 저장 (KV 스토리지)
    const storageKey = `deep_research:${request.company_name}:${Date.now()}`
    if (env.KV) {
      await env.KV.put(storageKey, JSON.stringify(researchData), {
        metadata: {
          type: 'deep_research',
          company: request.company_name,
          timestamp: new Date().toISOString()
        }
      })
    }
    
    console.log(`딥리서치 완료: ${researchData.total_content_length}자 분석`)
    
    return c.json({
      success: true,
      data: researchData,
      storage_key: storageKey
    })
    
  } catch (error) {
    console.error('딥리서치 API 오류:', error)
    return c.json({
      success: false,
      error: error.message || '딥리서치 처리 중 오류가 발생했습니다'
    }, 500)
  }
})

app.post('/api/customers/rfp-analysis', async (c) => {
  try {
    const formData = await c.req.formData()
    const { env } = c
    
    const rfpFile = formData.get('rfp_file') as File
    const fileName = formData.get('file_name') as string || rfpFile.name
    const parsingMode = formData.get('parsing_mode') as string || 'detailed'
    
    if (!rfpFile) {
      return c.json({
        success: false,
        error: 'RFP 파일이 필요합니다'
      }, 400)
    }
    
    console.log(`RFP 분석 시작: ${fileName}`)
    
    // 파일 버퍼로 변환
    const fileBuffer = await rfpFile.arrayBuffer()
    
    // PDF 파서로 텍스트 추출
    const pdfParser = new PdfParserService()
    const fileValidation = pdfParser.validateFileType(fileBuffer, fileName)
    
    if (!fileValidation.isValid) {
      return c.json({
        success: false,
        error: '지원하지 않는 파일 형식입니다. PDF 또는 DOCX 파일을 업로드해주세요.'
      }, 400)
    }
    
    let extractedText = ''
    
    if (fileValidation.fileType === 'pdf') {
      const pdfResult = await pdfParser.extractTextFromPdf(fileBuffer, fileName)
      extractedText = pdfResult.text
      console.log(`PDF 텍스트 추출 완료: ${extractedText.length}자`)
    } else if (fileValidation.fileType === 'docx') {
      const docxResult = await pdfParser.extractTextFromDocx(fileBuffer, fileName)
      extractedText = docxResult.text
      console.log(`DOCX 텍스트 추출 완료: ${extractedText.length}자`)
    }
    
    // RFP 분석 서비스 실행
    const rfpAnalysis = new RfpAnalysisService(env.OPENAI_API_KEY)
    const storage = new JsonStorageService(env.KV)
    
    let rfpAnalysisData
    
    if (env.OPENAI_API_KEY && extractedText.length > 200) {
      // OpenAI로 실제 분석
      const openai = new OpenAIService(env.OPENAI_API_KEY)
      rfpAnalysisData = await openai.extractRfpAnalysisData(extractedText, fileName)
      console.log('OpenAI RFP 분석 완료')
    } else {
      // 기본 분석 (텍스트 기반 키워드 매칭)
      rfpAnalysisData = await generateBasicRfpAnalysis(extractedText, fileName)
      console.log('기본 RFP 분석 완료')
    }
    
    // 결과 저장
    const storageKey = `rfp_analysis:${fileName}:${Date.now()}`
    const analysisResult = {
      file_name: fileName,
      file_size: fileBuffer.byteLength,
      extracted_text_length: extractedText.length,
      rfp_analysis_data: rfpAnalysisData,
      parsing_mode: parsingMode,
      analysis_timestamp: new Date().toISOString()
    }
    
    if (env.KV) {
      await env.KV.put(storageKey, JSON.stringify(analysisResult), {
        metadata: {
          type: 'rfp_analysis',
          file_name: fileName,
          timestamp: new Date().toISOString()
        }
      })
    }
    
    return c.json({
      success: true,
      data: analysisResult,
      storage_key: storageKey
    })
    
  } catch (error) {
    console.error('RFP 분석 API 오류:', error)
    return c.json({
      success: false,
      error: error.message || 'RFP 분석 중 오류가 발생했습니다'
    }, 500)
  }
})

app.post('/api/customers/generate', async (c) => {
  try {
    const { deep_research_data, rfp_analysis_data, company_name, department } = await c.req.json()
    const { env } = c
    
    const storage = new JsonStorageService(env.KV)
    
    let customer
    
    if (env.OPENAI_API_KEY) {
      // LLM 기반 실제 가상고객 생성
      const openai = new OpenAIService(env.OPENAI_API_KEY)
      
      customer = await openai.generateVirtualCustomer(
        deep_research_data,
        rfp_analysis_data,
        'CTO' // customer type
      )
      console.log('LLM AI 가상고객 생성 완룼')
    } else {
      // 기본 가상고객 생성
      const customerGeneration = new CustomerGenerationService()
      customer = await customerGeneration.generateVirtualCustomer(
        deep_research_data,
        rfp_analysis_data,
        company_name,
        department || '경영기획'
      )
      console.log('기본 AI 가상고객 생성 완룼')
    }
    
    // KV 스토리지에 저장
    const customerId = await storage.saveVirtualCustomer(customer)
    
    return c.json({
      success: true,
      data: { ...customer, id: customerId }
    })
  } catch (error) {
    console.error('AI 가상고객 생성 오류:', error)
    return c.json({
      success: false,
      error: error.message || 'AI 가상고객 생성 중 오류가 발생했습니다.'
    }, 500)
  }
})

// 2. 제안서 평가 API (실제 LLM 통합)
app.post('/api/evaluations/proposal', async (c) => {
  try {
    const { customer_id, proposal_title, proposal_content } = await c.req.json()
    const { env } = c
    
    const storage = new JsonStorageService(env.KV)
    
    // AI 가상고객 로드
    const customer = await storage.getVirtualCustomer(customer_id)
    if (!customer) {
      return c.json({
        success: false,
        error: 'AI 가상고객을 찾을 수 없습니다.'
      }, 404)
    }
    
    let proposalEvaluation
    
    if (env.OPENAI_API_KEY) {
      // LLM 기반 실제 평가
      const llmEvaluation = new LLMEvaluationService(
        env.OPENAI_API_KEY,
        env.KV
      )
      
      proposalEvaluation = await llmEvaluation.evaluateProposal(
        customer_id,
        proposal_content,
        proposal_title
      )
      console.log('LLM 제안서 평가 완료')
    } else {
      // 기본 샘플 평가
      proposalEvaluation = {
        customer_id,
        proposal_title,
        proposal_content,
        scores: {
          clarity: { score: 4, comment: '제안서가 명확하게 구성되어 있습니다.' },
          expertise: { score: 4, comment: '전문성이 잘 드러나지만 더 구체적인 내용이 필요합니다.' },
          persuasiveness: { score: 3, comment: '설득력을 향상시킬 수 있는 요소가 필요합니다.' },
          logic: { score: 4, comment: '논리적 흐름이 좋습니다.' },
          creativity: { score: 3, comment: '창의적 요소를 더 추가하면 좋겠습니다.' },
          credibility: { score: 4, comment: '신뢰할 만한 내용입니다.' }
        },
        total_score: 72,
        overall_feedback: '전반적으로 좌은 제안서입니다. 창의성과 설득력을 향상시키면 더 좋을 것 같습니다.',
        created_at: new Date().toISOString()
      }
      console.log('기본 제안서 평가 완료')
    }
    
    // 결과 저장
    const evaluationId = await storage.saveProposalEvaluation(proposalEvaluation)
    
    return c.json({
      success: true,
      data: { ...proposalEvaluation, id: evaluationId }
    })
  } catch (error) {
    console.error('제안서 평가 오류:', error)
    return c.json({
      success: false,
      error: error.message || '제안서 평가 중 오류가 발생했습니다.'
    }, 500)
  }
})

// 3. 발표 평가 API (실제 LLM 통합)
app.post('/api/evaluations/presentation', async (c) => {
  try {
    const { customer_id, presentation_title, stt_transcript, speech_metrics } = await c.req.json()
    const { env } = c
    
    const storage = new JsonStorageService(env.KV)
    
    // AI 가상고객 로드
    const customer = await storage.getVirtualCustomer(customer_id)
    if (!customer) {
      return c.json({
        success: false,
        error: 'AI 가상고객을 찾을 수 없습니다.'
      }, 404)
    }
    
    let presentationEvaluation
    
    if (env.OPENAI_API_KEY && stt_transcript) {
      // LLM 기반 실제 평가
      const llmEvaluation = new LLMEvaluationService(
        env.OPENAI_API_KEY,
        env.KV
      )
      
      presentationEvaluation = await llmEvaluation.evaluatePresentation(
        customer_id,
        stt_transcript,
        presentation_title,
        speech_metrics
      )
      console.log('LLM 발표 평가 완료')
    } else {
      // 기본 샘플 평가 (데모와 동일)
      const sampleTranscript = stt_transcript || "안녕하십니까, PwC 컸설팅의 발표를 시작하겠습니다. 이번 제안의 핵심은 ERP, MES, ESG 시스템을 하나의 플랫폼으로 통합하는 것입니다."
      
      presentationEvaluation = {
        customer_id,
        presentation_title,
        stt_transcript: sampleTranscript,
        speech_metrics: speech_metrics || {
          duration_seconds: 180,
          word_count: 89,
          words_per_minute: 29.7,
          pause_count: 6,
          filler_word_count: 2,
          average_volume_level: 0.75
        },
        scores: {
          clarity: { score: 4, comment: '발표 내용이 명확하고 체계적으로 구성되어 있습니다.' },
          expertise: { score: 5, comment: '화학산업과 ESG 분야의 전문성이 뛰어나게 드러납니다.' },
          persuasiveness: { score: 4, comment: '고객의 니즈를 정확히 파악하고 해결방안을 논리적으로 제시했습니다.' },
          logic: { score: 4, comment: '논리적 흐름이 체계적이고 근거가 타당합니다.' },
          creativity: { score: 3, comment: '안정적이고 검증된 접근법이지만, 혁신적이고 차별화된 아이디어가 더 필요합니다.' },
          credibility: { score: 5, comment: 'PwC의 브랜드 신뢰도와 화학산업 프로젝트 경험이 매우 신뢰할 만합니다.' }
        },
        total_score: 84,
        overall_feedback: '화학산업 전문성과 ESG 대응 역량이 우수하며, 체계적이고 실현가능한 실행 계획을 제시했습니다. 발표 스킬 면에서는 명확한 전달력을 보였나, 더욱 창의적이고 혁신적인 차별화 요소를 강화하면 경쟁력이 높아질 것입니다. 전반적으로 신뢰할 수 있는 우수한 발표였습니다.',
        created_at: new Date().toISOString()
      }
      console.log('기본 발표 평가 완료')
    }
    
    // 결과 저장
    const evaluationId = await storage.savePresentationEvaluation(presentationEvaluation)
    
    return c.json({
      success: true,
      data: { ...presentationEvaluation, id: evaluationId }
    })
  } catch (error) {
    console.error('발표 평가 오류:', error)
    return c.json({
      success: false,
      error: error.message || '발표 평가 중 오류가 발생했습니다.'
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
    function convertTo100Scale(score: number): number {
      const mapping: Record<number, number> = { 1: 10, 2: 20, 3: 30, 4: 40, 5: 50 }
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

// 4. 통합 결과 API (실제 LLM 통합)
// 4.0 개별 평가 조회 API
app.get('/api/evaluations/proposal/:id', async (c) => {
  try {
    const evaluationId = c.req.param('id')
    const storage = new JsonStorageService(c.env.KV)
    
    const evaluation = await storage.getProposalEvaluation(evaluationId)
    if (!evaluation) {
      return c.json({
        success: false,
        error: '제안서 평가 결과를 찾을 수 없습니다.'
      }, 404)
    }
    
    return c.json({
      success: true,
      data: evaluation
    })
  } catch (error) {
    console.error('제안서 평가 조회 오류:', error)
    return c.json({
      success: false,
      error: error.message || '제안서 평가 조회 중 오륙가 발생했습니다.'
    }, 500)
  }
})

app.get('/api/evaluations/presentation/:id', async (c) => {
  try {
    const evaluationId = c.req.param('id')
    const storage = new JsonStorageService(c.env.KV)
    
    const evaluation = await storage.getPresentationEvaluation(evaluationId)
    if (!evaluation) {
      return c.json({
        success: false,
        error: '발표 평가 결과를 찾을 수 없습니다.'
      }, 404)
    }
    
    return c.json({
      success: true,
      data: evaluation
    })
  } catch (error) {
    console.error('발표 평가 조회 오륙:', error)
    return c.json({
      success: false,
      error: error.message || '발표 평가 조회 중 오륙가 발생했습니다.'
    }, 500)
  }
})

app.get('/api/evaluations/integrated/:id', async (c) => {
  try {
    const evaluationId = c.req.param('id')
    const storage = new JsonStorageService(c.env.KV)
    
    const evaluation = await storage.getIntegratedEvaluation(evaluationId)
    if (!evaluation) {
      return c.json({
        success: false,
        error: '통합 평가 결과를 찾을 수 없습니다.'
      }, 404)
    }
    
    return c.json({
      success: true,
      data: evaluation
    })
  } catch (error) {
    console.error('통합 평가 조회 오륙:', error)
    return c.json({
      success: false,
      error: error.message || '통합 평가 조회 중 오륙가 발생했습니다.'
    }, 500)
  }
})

// 4.1 통합 결과 생성 API
app.post('/api/evaluations/integrate', async (c) => {
  try {
    const { customer_id, proposal_evaluation_id, presentation_evaluation_id, project_title } = await c.req.json()
    const { env } = c
    
    const storage = new JsonStorageService(env.KV)
    
    // 제안서/발표 평가 데이터 로드
    const proposalEval = proposal_evaluation_id ? await storage.getProposalEvaluation(proposal_evaluation_id) : null
    const presentationEval = presentation_evaluation_id ? await storage.getPresentationEvaluation(presentation_evaluation_id) : null
    
    let integratedResult
    
    if (env.OPENAI_API_KEY) {
      // LLM 기반 실제 통합
      const llmEvaluation = new LLMEvaluationService(
        env.OPENAI_API_KEY,
        env.KV
      )
      
      integratedResult = await llmEvaluation.generateIntegratedResult(
        customer_id,
        proposalEval,
        presentationEval,
        project_title
      )
      console.log('LLM 통합 결과 생성 완료')
    } else {
      // 기본 통합 결과
      const proposalScore = proposalEval?.total_score || 0
      const presentationScore = presentationEval?.total_score || 0
      const finalScore = Math.round(proposalScore * 0.7 + presentationScore * 0.3)
      
      integratedResult = {
        customer_id,
        project_title: project_title || '프로젝트 제안',
        proposal_evaluation: proposalEval,
        presentation_evaluation: presentationEval,
        final_score: finalScore,
        weighted_scores: {
          proposal_weighted: Math.round(proposalScore * 0.7),
          presentation_weighted: Math.round(presentationScore * 0.3)
        },
        strengths: ['전문성 우수', '신뢰도 높음', '체계적 접근'],
        improvements: ['창의적 요소 보강', '설득력 향상', '차별화 요소 추가'],
        overall_feedback: `전문성과 신뢰도 측면에서 우수한 평가를 받았습니다. 창의적 요소와 차별화 전략을 보강하면 더욱 경쟁력 있는 제안이 될 것입니다. (최종 점수: ${finalScore}점)`,
        created_at: new Date().toISOString()
      }
      console.log('기본 통합 결과 생성 완료')
    }
    
    // 결과 저장
    const resultId = await storage.saveIntegratedEvaluation(integratedResult)
    
    return c.json({
      success: true,
      data: { ...integratedResult, id: resultId }
    })
  } catch (error) {
    console.error('통합 결과 오류:', error)
    return c.json({
      success: false,
      error: error.message || '통합 결과 생성 중 오류가 발생했습니다.'
    }, 500)
  }
})

// 5. 세션 관리 API
app.get('/api/sessions', async (c) => {
  try {
    const storage = new JsonStorageService(c.env.KV)
    const sessions = await storage.getAllSessions()
    
    return c.json({
      success: true,
      data: sessions
    })
  } catch (error) {
    console.error('세션 목록 조회 오류:', error)
    return c.json({
      success: false,
      error: error.message || '세션 목록 조회 중 오류가 발생했습니다.'
    }, 500)
  }
})

app.post('/api/sessions', async (c) => {
  try {
    const { session_name } = await c.req.json()
    const storage = new JsonStorageService(c.env.KV)
    
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
    
    const sessionId = await storage.saveSession(session)
    
    return c.json({
      success: true,
      data: { ...session, id: sessionId }
    })
  } catch (error) {
    console.error('세션 생성 오류:', error)
    return c.json({
      success: false,
      error: error.message || '세션 생성 중 오류가 발생했습니다.'
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

// RFP 문서 분석 (텍스트 기반)
app.post('/api/parse/rfp', async (c) => {
  try {
    const { text, file_name } = await c.req.json()
    const { env } = c
    
    if (!text) {
      return c.json({
        success: false,
        error: 'RFP 텍스트 내용이 필요합니다.'
      }, 400)
    }
    
    // OpenAI API로 RFP 분석 (실제 분석)
    if (env.OPENAI_API_KEY && text.length > 100) {
      const openai = new OpenAIService(env.OPENAI_API_KEY)
      const rfpAnalysisData = await openai.extractRfpAnalysisData(text, file_name || 'rfp.txt')
      
      return c.json({
        success: true,
        data: {
          parsed_document: {
            title: file_name || 'RFP 문서',
            content: text,
            word_count: text.length,
            parsed_at: new Date().toISOString()
          },
          rfp_analysis_data: rfpAnalysisData
        },
        message: 'RFP 문서가 성공적으로 분석되었습니다 (OpenAI GPT-4o).'
      })
    }
    
    // 기본 키워드 매칭 분석 (fallback)
    const basicAnalysis = await generateBasicRfpAnalysis(text, file_name || 'rfp.txt')
    
    return c.json({
      success: true,
      data: {
        parsed_document: {
          title: file_name || 'RFP 문서',
          content: text,
          word_count: text.length,
          parsed_at: new Date().toISOString()
        },
        rfp_analysis_data: basicAnalysis
      },
      message: 'RFP 문서가 분석되었습니다 (키워드 매칭).'
    })

  } catch (error) {
    console.error('RFP 문서 분석 오류:', error)
    return c.json({
      success: false,
      error: `RFP 문서 분석에 실패했습니다: ${error.message}`
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
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <link href="/static/pwc-global.css?v=3.0" rel="stylesheet">
    </head>
    <body>
        <!-- PwC 스타일 헤더 -->
        <header class="pwc-header">
            <div class="pwc-container">
                <h1>
                    <div class="pwc-logo">
                        <i class="fas fa-robot"></i>
                    </div>
                    RFP기반 AI가상고객 제안 평가 시뮬레이터
                </h1>
                <p style="color: var(--pwc-gray-200); margin-top: var(--spacing-sm); font-size: 1rem;">
                    딥리서치 + RFP 분석으로 가상고객 생성 → 제안/발표 평가 → 통합 결과
                </p>
            </div>
        </header>

        <!-- 네비게이션 -->
        <nav class="pwc-nav">
            <div class="pwc-container">
                <ul class="pwc-nav-list">
                    <li class="pwc-nav-item"><a href="/" class="active">홈</a></li>
                    <li class="pwc-nav-item"><a href="/customer-generation">AI 가상고객</a></li>
                    <li class="pwc-nav-item"><a href="/proposal-evaluation">제안서 평가</a></li>
                    <li class="pwc-nav-item"><a href="/presentation-evaluation">발표 평가</a></li>
                    <li class="pwc-nav-item"><a href="/results">통합 결과</a></li>
                </ul>
            </div>
        </nav>

        <main class="pwc-container" style="padding-top: var(--spacing-lg); padding-bottom: var(--spacing-xl);">
            <!-- 진행 단계 카드 -->
            <div class="pwc-card">
                <div class="pwc-card-header">
                    <h2 class="pwc-card-title">
                        <i class="fas fa-route" style="color: var(--pwc-orange); margin-right: var(--spacing-sm);"></i>
                        평가 프로세스
                    </h2>
                    <p class="pwc-card-subtitle">전문적인 4단계 평가 시스템으로 완벽한 제안 분석</p>
                </div>
                
                <div class="pwc-flex pwc-flex-between pwc-flex-mobile-col" style="gap: var(--spacing-lg);">
                    <div class="pwc-flex pwc-flex-col pwc-flex-center" style="text-align: center; min-width: 140px;">
                        <div style="width: 60px; height: 60px; background: linear-gradient(135deg, var(--pwc-orange), var(--pwc-orange-dark)); color: var(--pwc-white); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-bottom: var(--spacing-md); box-shadow: var(--shadow-md);">
                            <i class="fas fa-user-plus" style="font-size: 1.5rem;"></i>
                        </div>
                        <h4 style="font-size: 0.9rem; font-weight: 600; color: var(--pwc-navy); margin-bottom: var(--spacing-xs); word-break: keep-all;">AI 가상고객 생성</h4>
                        <p style="font-size: 0.75rem; color: var(--pwc-gray-600); word-break: keep-all;">딥리서치 15 + RFP 15</p>
                    </div>
                    
                    <div class="pwc-mobile-hidden" style="height: 2px; background: linear-gradient(90deg, var(--pwc-gray-300), var(--pwc-orange)); flex: 1; align-self: center; margin: 0 var(--spacing-md);"></div>
                    
                    <div class="pwc-flex pwc-flex-col pwc-flex-center" style="text-align: center; min-width: 140px;">
                        <div style="width: 60px; height: 60px; background: linear-gradient(135deg, var(--pwc-navy), var(--pwc-navy-light)); color: var(--pwc-white); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-bottom: var(--spacing-md); box-shadow: var(--shadow-md);">
                            <i class="fas fa-file-alt" style="font-size: 1.5rem;"></i>
                        </div>
                        <h4 style="font-size: 0.9rem; font-weight: 600; color: var(--pwc-navy); margin-bottom: var(--spacing-xs); word-break: keep-all;">제안서 평가</h4>
                        <p style="font-size: 0.75rem; color: var(--pwc-gray-600); word-break: keep-all;">6대 지표 루브릭</p>
                    </div>
                    
                    <div class="pwc-mobile-hidden" style="height: 2px; background: linear-gradient(90deg, var(--pwc-gray-300), var(--pwc-orange)); flex: 1; align-self: center; margin: 0 var(--spacing-md);"></div>
                    
                    <div class="pwc-flex pwc-flex-col pwc-flex-center" style="text-align: center; min-width: 140px;">
                        <div style="width: 60px; height: 60px; background: linear-gradient(135deg, var(--pwc-blue), var(--pwc-navy-light)); color: var(--pwc-white); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-bottom: var(--spacing-md); box-shadow: var(--shadow-md);">
                            <i class="fas fa-microphone" style="font-size: 1.5rem;"></i>
                        </div>
                        <h4 style="font-size: 0.9rem; font-weight: 600; color: var(--pwc-navy); margin-bottom: var(--spacing-xs); word-break: keep-all;">발표 평가</h4>
                        <p style="font-size: 0.75rem; color: var(--pwc-gray-600); word-break: keep-all;">STT + 음성분석</p>
                    </div>
                    
                    <div class="pwc-mobile-hidden" style="height: 2px; background: linear-gradient(90deg, var(--pwc-gray-300), var(--pwc-orange)); flex: 1; align-self: center; margin: 0 var(--spacing-md);"></div>
                    
                    <div class="pwc-flex pwc-flex-col pwc-flex-center" style="text-align: center; min-width: 140px;">
                        <div style="width: 60px; height: 60px; background: linear-gradient(135deg, var(--pwc-success), #007d3c); color: var(--pwc-white); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-bottom: var(--spacing-md); box-shadow: var(--shadow-md);">
                            <i class="fas fa-chart-line" style="font-size: 1.5rem;"></i>
                        </div>
                        <h4 style="font-size: 0.9rem; font-weight: 600; color: var(--pwc-navy); margin-bottom: var(--spacing-xs); word-break: keep-all;">통합 결과</h4>
                        <p style="font-size: 0.75rem; color: var(--pwc-gray-600); word-break: keep-all;">레이더 차트 + 피드백</p>
                    </div>
                </div>
            </div>

            <!-- 기능 카드들 -->
            <div class="pwc-grid pwc-grid-2" style="margin-bottom: var(--spacing-lg);">
                <div class="pwc-card" style="cursor: pointer;" onclick="window.location.href='/customer-generation'">
                    <div class="pwc-flex" style="align-items: flex-start; margin-bottom: var(--spacing-lg);">
                        <div style="background: linear-gradient(135deg, var(--pwc-orange), var(--pwc-orange-dark)); padding: var(--spacing-lg); border-radius: var(--radius-lg); margin-right: var(--spacing-lg); min-width: 64px; display: flex; align-items: center; justify-content: center;">
                            <i class="fas fa-user-plus" style="color: var(--pwc-white); font-size: 1.5rem;"></i>
                        </div>
                        <div style="flex: 1;">
                            <h3 class="pwc-card-title" style="margin-bottom: var(--spacing-sm);">AI 가상고객 생성</h3>
                            <p style="color: var(--pwc-gray-600); margin-bottom: var(--spacing-md); word-break: keep-all;">딥리서치와 RFP 분석으로 30속성 가상고객 생성</p>
                        </div>
                    </div>
                    <ul style="list-style: none; color: var(--pwc-gray-600); font-size: 0.875rem; line-height: 1.6; padding-left: var(--spacing-lg);">
                        <li style="margin-bottom: var(--spacing-xs);">
                            <i class="fas fa-check" style="color: var(--pwc-orange); margin-right: var(--spacing-sm);"></i>
                            딥리서치 15속성 수집
                        </li>
                        <li style="margin-bottom: var(--spacing-xs);">
                            <i class="fas fa-check" style="color: var(--pwc-orange); margin-right: var(--spacing-sm);"></i>
                            RFP 문서 15속성 분석
                        </li>
                        <li>
                            <i class="fas fa-check" style="color: var(--pwc-orange); margin-right: var(--spacing-sm);"></i>
                            30속성 통합 페르소나 생성
                        </li>
                    </ul>
                </div>

                <div class="pwc-card" style="cursor: pointer;" onclick="window.location.href='/proposal-evaluation'">
                    <div class="pwc-flex" style="align-items: flex-start; margin-bottom: var(--spacing-lg);">
                        <div style="background: linear-gradient(135deg, var(--pwc-success), #007d3c); padding: var(--spacing-lg); border-radius: var(--radius-lg); margin-right: var(--spacing-lg); min-width: 64px; display: flex; align-items: center; justify-content: center;">
                            <i class="fas fa-file-alt" style="color: var(--pwc-white); font-size: 1.5rem;"></i>
                        </div>
                        <div style="flex: 1;">
                            <h3 class="pwc-card-title" style="margin-bottom: var(--spacing-sm);">제안서 평가</h3>
                            <p style="color: var(--pwc-gray-600); margin-bottom: var(--spacing-md); word-break: keep-all;">6대 지표 루브릭 기반 AI 평가</p>
                        </div>
                    </div>
                    <ul style="list-style: none; color: var(--pwc-gray-600); font-size: 0.875rem; line-height: 1.6; padding-left: var(--spacing-lg);">
                        <li style="margin-bottom: var(--spacing-xs);">
                            <i class="fas fa-check" style="color: var(--pwc-success); margin-right: var(--spacing-sm);"></i>
                            명확성·전문성·설득력
                        </li>
                        <li style="margin-bottom: var(--spacing-xs);">
                            <i class="fas fa-check" style="color: var(--pwc-success); margin-right: var(--spacing-sm);"></i>
                            논리성·창의성·신뢰성
                        </li>
                        <li>
                            <i class="fas fa-check" style="color: var(--pwc-success); margin-right: var(--spacing-sm);"></i>
                            100점 척도 + 상세 코멘트
                        </li>
                    </ul>
                </div>

                <div class="pwc-card" style="cursor: pointer;" onclick="window.location.href='/presentation-evaluation'">
                    <div class="pwc-flex" style="align-items: flex-start; margin-bottom: var(--spacing-lg);">
                        <div style="background: linear-gradient(135deg, var(--pwc-blue), var(--pwc-navy-light)); padding: var(--spacing-lg); border-radius: var(--radius-lg); margin-right: var(--spacing-lg); min-width: 64px; display: flex; align-items: center; justify-content: center;">
                            <i class="fas fa-microphone" style="color: var(--pwc-white); font-size: 1.5rem;"></i>
                        </div>
                        <div style="flex: 1;">
                            <h3 class="pwc-card-title" style="margin-bottom: var(--spacing-sm);">발표 평가</h3>
                            <p style="color: var(--pwc-gray-600); margin-bottom: var(--spacing-md); word-break: keep-all;">STT + 음성 분석 기반 발표 평가</p>
                        </div>
                    </div>
                    <ul style="list-style: none; color: var(--pwc-gray-600); font-size: 0.875rem; line-height: 1.6; padding-left: var(--spacing-lg);">
                        <li style="margin-bottom: var(--spacing-xs);">
                            <i class="fas fa-check" style="color: var(--pwc-blue); margin-right: var(--spacing-sm);"></i>
                            실시간 음성 인식
                        </li>
                        <li style="margin-bottom: var(--spacing-xs);">
                            <i class="fas fa-check" style="color: var(--pwc-blue); margin-right: var(--spacing-sm);"></i>
                            발표 내용 6지표 평가
                        </li>
                        <li>
                            <i class="fas fa-check" style="color: var(--pwc-blue); margin-right: var(--spacing-sm);"></i>
                            말속도·휴지·톤 분석
                        </li>
                    </ul>
                </div>

                <div class="pwc-card" style="cursor: pointer;" onclick="window.location.href='/results'">
                    <div class="pwc-flex" style="align-items: flex-start; margin-bottom: var(--spacing-lg);">
                        <div style="background: linear-gradient(135deg, var(--pwc-navy), var(--pwc-navy-light)); padding: var(--spacing-lg); border-radius: var(--radius-lg); margin-right: var(--spacing-lg); min-width: 64px; display: flex; align-items: center; justify-content: center; position: relative; overflow: hidden;">
                            <i class="fas fa-chart-line" style="color: var(--pwc-white); font-size: 1.5rem; z-index: 2; position: relative;"></i>
                            <!-- 차트 시각화 요소들 -->
                            <div style="position: absolute; top: 12px; right: 12px; width: 8px; height: 8px; background: var(--pwc-orange); border-radius: 50%; animation: pulse 2s infinite;"></div>
                            <div style="position: absolute; bottom: 12px; left: 12px; width: 6px; height: 6px; background: rgba(255, 255, 255, 0.8); border-radius: 50%;"></div>
                            <div style="position: absolute; top: 20px; left: 15px; width: 4px; height: 4px; background: var(--pwc-orange-light); border-radius: 50%; opacity: 0.6;"></div>
                            <!-- 배경 패턴 -->
                            <div style="position: absolute; bottom: 0; left: 0; right: 0; height: 3px; background: linear-gradient(90deg, transparent, var(--pwc-orange), transparent); opacity: 0.4;"></div>
                        </div>
                        <div style="flex: 1;">
                            <h3 class="pwc-card-title" style="margin-bottom: var(--spacing-sm);">통합 결과</h3>
                            <p style="color: var(--pwc-gray-600); margin-bottom: var(--spacing-md); word-break: keep-all;">레이더 차트와 종합 피드백</p>
                        </div>
                    </div>
                    <ul style="list-style: none; color: var(--pwc-gray-600); font-size: 0.875rem; line-height: 1.6; padding-left: var(--spacing-lg);">
                        <li style="margin-bottom: var(--spacing-xs);">
                            <i class="fas fa-chart-pie" style="color: var(--pwc-navy); margin-right: var(--spacing-sm);"></i>
                            6각형 레이더 차트
                        </li>
                        <li style="margin-bottom: var(--spacing-xs);">
                            <i class="fas fa-thumbs-up" style="color: var(--pwc-success); margin-right: var(--spacing-sm);"></i>
                            강점·보완·총평
                        </li>
                        <li>
                            <i class="fas fa-file-pdf" style="color: var(--pwc-error); margin-right: var(--spacing-sm);"></i>
                            PDF 결과 내보내기
                        </li>
                    </ul>
                </div>
            </div>

            <!-- 시작하기 버튼 -->
            <div class="pwc-text-center">
                <button onclick="window.location.href='/customer-generation'" class="pwc-btn pwc-btn-primary pwc-btn-lg">
                    <i class="fas fa-play"></i>
                    평가 시작하기
                </button>
            </div>
        </main>

        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
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
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <link href="/static/pwc-global.css?v=3.0" rel="stylesheet">
    </head>
    <body>
        <!-- PwC 스타일 헤더 -->
        <header class="pwc-header">
            <div class="pwc-container">
                <h1>
                    <a href="/" style="color: var(--pwc-white); text-decoration: none; margin-right: var(--spacing-lg); display: inline-flex; align-items: center;">
                        <i class="fas fa-arrow-left" style="margin-right: var(--spacing-sm);"></i>
                    </a>
                    <div class="pwc-logo">
                        <i class="fas fa-file-alt"></i>
                    </div>
                    제안서 평가
                    <span style="background-color: var(--pwc-success); color: var(--pwc-white); padding: var(--spacing-xs) var(--spacing-md); border-radius: 20px; font-size: 0.875rem; font-weight: 600; margin-left: var(--spacing-lg);">2단계</span>
                </h1>
                <p style="color: var(--pwc-gray-200); margin-top: var(--spacing-sm); font-size: 1rem;">
                    AI 가상고객 기반 6대 지표 루브릭 평가 (100점 만점)
                </p>
            </div>
        </header>

        <!-- 네비게이션 -->
        <nav class="pwc-nav">
            <div class="pwc-container">
                <ul class="pwc-nav-list">
                    <li class="pwc-nav-item"><a href="/">홈</a></li>
                    <li class="pwc-nav-item"><a href="/customer-generation">AI 가상고객</a></li>
                    <li class="pwc-nav-item"><a href="/proposal-evaluation" class="active">제안서 평가</a></li>
                    <li class="pwc-nav-item"><a href="/presentation-evaluation">발표 평가</a></li>
                    <li class="pwc-nav-item"><a href="/results">통합 결과</a></li>
                </ul>
            </div>
        </nav>

        <main class="pwc-container" style="padding-top: var(--spacing-xl); padding-bottom: var(--spacing-3xl);">
            <!-- AI 가상고객 선택 -->
            <div class="pwc-card">
                <div class="pwc-card-header">
                    <h2 class="pwc-card-title">
                        <i class="fas fa-user-circle" style="color: var(--pwc-orange); margin-right: var(--spacing-sm);"></i>
                        AI 가상고객 선택
                    </h2>
                    <p class="pwc-card-subtitle">평가할 AI 가상고객을 선택해주세요. 딥리서치와 RFP 분석으로 생성된 30속성 페르소나입니다.</p>
                </div>
                
                <div class="pwc-form-group">
                    <label class="pwc-label">평가할 AI 가상고객</label>
                    <select id="customer-select" class="pwc-select">
                        <option value="">AI 가상고객을 선택하세요</option>
                    </select>
                </div>

                <!-- 선택된 고객 정보 표시 -->
                <div id="selected-customer-info" class="pwc-alert pwc-alert-info" style="display: none; margin-top: var(--spacing-lg);">
                    <h4 style="font-weight: 600; margin-bottom: var(--spacing-sm); word-break: keep-all;">
                        <i class="fas fa-check-circle" style="color: var(--pwc-blue); margin-right: var(--spacing-xs);"></i>
                        선택된 AI 가상고객
                    </h4>
                    <div id="customer-details" style="font-size: 0.9rem; line-height: 1.5; word-break: keep-all;">
                        <!-- 동적으로 채워짐 -->
                    </div>
                </div>
            </div>

            <!-- 제안서 업로드 -->
            <div class="pwc-card">
                <div class="pwc-card-header">
                    <h2 class="pwc-card-title">
                        <i class="fas fa-file-upload" style="color: var(--pwc-success); margin-right: var(--spacing-sm);"></i>
                        제안서 업로드
                    </h2>
                    <p class="pwc-card-subtitle">평가할 제안서를 업로드하거나 데모 제안서를 사용하세요. PDF, DOCX, TXT 형식을 지원합니다.</p>
                </div>
                
                <div class="pwc-grid pwc-grid-2">
                    <div class="pwc-form-group">
                        <label class="pwc-label">제안서 제목</label>
                        <input type="text" id="proposal-title" class="pwc-input" 
                               placeholder="예: 금고석유화학 DX 전략 수립 및 실행">
                    </div>
                    <div class="pwc-form-group">
                        <label class="pwc-label">제안사명</label>
                        <input type="text" id="proposal-company" class="pwc-input"
                               placeholder="예: PwC 컨설팅">
                    </div>
                </div>

                <div class="pwc-file-upload" id="proposal-drop-zone" style="margin: var(--spacing-lg) 0;">
                    <i class="fas fa-cloud-upload-alt" style="font-size: 3rem; color: var(--pwc-gray-400); margin-bottom: var(--spacing-lg);"></i>
                    <h4 style="font-size: 1.125rem; font-weight: 600; color: var(--pwc-navy); margin-bottom: var(--spacing-sm); word-break: keep-all;">제안서 파일을 업로드하세요</h4>
                    <p style="color: var(--pwc-gray-600); margin-bottom: var(--spacing-lg); word-break: keep-all;">PDF, DOCX, TXT 형식 지원 (최대 50MB)</p>
                    <input type="file" id="proposal-file" accept=".pdf,.docx,.txt" style="display: none;">
                    <div class="pwc-flex pwc-flex-center pwc-flex-mobile-col" style="gap: var(--spacing-md);">
                        <button onclick="document.getElementById('proposal-file').click()" class="pwc-btn pwc-btn-primary">
                            <i class="fas fa-folder-open"></i>
                            파일 선택
                        </button>
                        <button id="demo-proposal-load" class="pwc-btn pwc-btn-secondary">
                            <i class="fas fa-rocket"></i>
                            데모 제안서 로드
                        </button>
                    </div>
                </div>

                <!-- 업로드된 파일 정보 -->
                <div id="uploaded-file-info" class="pwc-alert pwc-alert-success" style="display: none; margin-top: var(--spacing-lg);">
                    <h4 style="font-weight: 600; margin-bottom: var(--spacing-sm); word-break: keep-all;">
                        <i class="fas fa-check-circle" style="margin-right: var(--spacing-xs);"></i>
                        업로드된 제안서
                    </h4>
                    <div id="file-details" style="font-size: 0.9rem; line-height: 1.5; word-break: keep-all;">
                        <!-- 동적으로 채워짐 -->
                    </div>
                </div>
            </div>

            <!-- 평가 진행 -->
            <div class="pwc-card">
                <div class="pwc-card-header">
                    <h2 class="pwc-card-title">
                        <i class="fas fa-clipboard-check" style="color: var(--pwc-blue); margin-right: var(--spacing-sm);"></i>
                        6대 지표 평가
                    </h2>
                    <p class="pwc-card-subtitle">전문성, 논리성, 창의성 등 6가지 핵심 지표로 AI가 100점 만점으로 평가합니다.</p>
                </div>

                <div class="pwc-grid pwc-grid-3" style="margin-bottom: var(--spacing-xl);">
                    <div style="text-align: center; padding: var(--spacing-lg); border: 2px solid var(--pwc-blue); border-radius: var(--radius-lg); background: linear-gradient(135deg, rgba(0, 115, 230, 0.05), rgba(0, 115, 230, 0.02));">
                        <div style="font-size: 1.5rem; font-weight: 700; color: var(--pwc-blue); margin-bottom: var(--spacing-sm); word-break: keep-all;">명확성</div>
                        <div style="font-size: 0.875rem; color: var(--pwc-gray-600); word-break: keep-all;">목적·범위·효과의 명확성</div>
                    </div>
                    <div style="text-align: center; padding: var(--spacing-lg); border: 2px solid var(--pwc-success); border-radius: var(--radius-lg); background: linear-gradient(135deg, rgba(0, 166, 81, 0.05), rgba(0, 166, 81, 0.02));">
                        <div style="font-size: 1.5rem; font-weight: 700; color: var(--pwc-success); margin-bottom: var(--spacing-sm); word-break: keep-all;">전문성</div>
                        <div style="font-size: 0.875rem; color: var(--pwc-gray-600); word-break: keep-all;">실무 지식의 깊이와 정확성</div>
                    </div>
                    <div style="text-align: center; padding: var(--spacing-lg); border: 2px solid var(--pwc-warning); border-radius: var(--radius-lg); background: linear-gradient(135deg, rgba(255, 184, 0, 0.05), rgba(255, 184, 0, 0.02));">
                        <div style="font-size: 1.5rem; font-weight: 700; color: var(--pwc-warning); margin-bottom: var(--spacing-sm); word-break: keep-all;">설득력</div>
                        <div style="font-size: 0.875rem; color: var(--pwc-gray-600); word-break: keep-all;">고객 관점 이해와 설득 논리</div>
                    </div>
                    <div style="text-align: center; padding: var(--spacing-lg); border: 2px solid var(--pwc-navy); border-radius: var(--radius-lg); background: linear-gradient(135deg, rgba(0, 51, 102, 0.05), rgba(0, 51, 102, 0.02));">
                        <div style="font-size: 1.5rem; font-weight: 700; color: var(--pwc-navy); margin-bottom: var(--spacing-sm); word-break: keep-all;">논리성</div>
                        <div style="font-size: 0.875rem; color: var(--pwc-gray-600); word-break: keep-all;">추론의 타당성과 근거 체계성</div>
                    </div>
                    <div style="text-align: center; padding: var(--spacing-lg); border: 2px solid var(--pwc-orange); border-radius: var(--radius-lg); background: linear-gradient(135deg, rgba(255, 121, 0, 0.05), rgba(255, 121, 0, 0.02));">
                        <div style="font-size: 1.5rem; font-weight: 700; color: var(--pwc-orange); margin-bottom: var(--spacing-sm); word-break: keep-all;">창의성</div>
                        <div style="font-size: 0.875rem; color: var(--pwc-gray-600); word-break: keep-all;">차별화된 접근법과 혁신성</div>
                    </div>
                    <div style="text-align: center; padding: var(--spacing-lg); border: 2px solid var(--pwc-error); border-radius: var(--radius-lg); background: linear-gradient(135deg, rgba(230, 0, 18, 0.05), rgba(230, 0, 18, 0.02));">
                        <div style="font-size: 1.5rem; font-weight: 700; color: var(--pwc-error); margin-bottom: var(--spacing-sm); word-break: keep-all;">신뢰성</div>
                        <div style="font-size: 0.875rem; color: var(--pwc-gray-600); word-break: keep-all;">실현 가능성과 객관적 근거</div>
                    </div>
                </div>

                <button id="start-evaluation" class="pwc-btn pwc-btn-primary" style="width: 100%; font-size: 1.125rem; padding: var(--spacing-lg) var(--spacing-xl);" disabled>
                    <i class="fas fa-play"></i>
                    AI 평가 시작
                </button>
            </div>

            <!-- 평가 결과 -->
            <div id="evaluation-results" class="pwc-card" style="display: none;">
                <div class="pwc-card-header">
                    <h2 class="pwc-card-title">
                        <i class="fas fa-chart-line" style="color: var(--pwc-success); margin-right: var(--spacing-sm);"></i>
                        평가 결과
                    </h2>
                    <p class="pwc-card-subtitle">AI가 6대 지표로 분석한 100점 만점 평가 결과입니다.</p>
                </div>

                <!-- 점수 차트 -->
                <div class="pwc-grid pwc-grid-3" style="margin-bottom: var(--spacing-xl);">
                    <div style="text-align: center; padding: var(--spacing-lg); background: linear-gradient(135deg, rgba(0, 115, 230, 0.1), rgba(0, 115, 230, 0.05)); border-radius: var(--radius-lg); border: 1px solid rgba(0, 115, 230, 0.2);">
                        <div style="font-size: 2rem; font-weight: 700; color: var(--pwc-blue); margin-bottom: var(--spacing-xs);" id="clarity-score">-</div>
                        <div style="font-size: 0.875rem; font-weight: 600; color: var(--pwc-blue); word-break: keep-all;">명확성</div>
                    </div>
                    <div style="text-align: center; padding: var(--spacing-lg); background: linear-gradient(135deg, rgba(0, 166, 81, 0.1), rgba(0, 166, 81, 0.05)); border-radius: var(--radius-lg); border: 1px solid rgba(0, 166, 81, 0.2);">
                        <div style="font-size: 2rem; font-weight: 700; color: var(--pwc-success); margin-bottom: var(--spacing-xs);" id="expertise-score">-</div>
                        <div style="font-size: 0.875rem; font-weight: 600; color: var(--pwc-success); word-break: keep-all;">전문성</div>
                    </div>
                    <div style="text-align: center; padding: var(--spacing-lg); background: linear-gradient(135deg, rgba(255, 184, 0, 0.1), rgba(255, 184, 0, 0.05)); border-radius: var(--radius-lg); border: 1px solid rgba(255, 184, 0, 0.2);">
                        <div style="font-size: 2rem; font-weight: 700; color: var(--pwc-warning); margin-bottom: var(--spacing-xs);" id="persuasiveness-score">-</div>
                        <div style="font-size: 0.875rem; font-weight: 600; color: var(--pwc-warning); word-break: keep-all;">설득력</div>
                    </div>
                    <div style="text-align: center; padding: var(--spacing-lg); background: linear-gradient(135deg, rgba(0, 51, 102, 0.1), rgba(0, 51, 102, 0.05)); border-radius: var(--radius-lg); border: 1px solid rgba(0, 51, 102, 0.2);">
                        <div style="font-size: 2rem; font-weight: 700; color: var(--pwc-navy); margin-bottom: var(--spacing-xs);" id="logic-score">-</div>
                        <div style="font-size: 0.875rem; font-weight: 600; color: var(--pwc-navy); word-break: keep-all;">논리성</div>
                    </div>
                    <div style="text-align: center; padding: var(--spacing-lg); background: linear-gradient(135deg, rgba(255, 121, 0, 0.1), rgba(255, 121, 0, 0.05)); border-radius: var(--radius-lg); border: 1px solid rgba(255, 121, 0, 0.2);">
                        <div style="font-size: 2rem; font-weight: 700; color: var(--pwc-orange); margin-bottom: var(--spacing-xs);" id="creativity-score">-</div>
                        <div style="font-size: 0.875rem; font-weight: 600; color: var(--pwc-orange); word-break: keep-all;">창의성</div>
                    </div>
                    <div style="text-align: center; padding: var(--spacing-lg); background: linear-gradient(135deg, rgba(230, 0, 18, 0.1), rgba(230, 0, 18, 0.05)); border-radius: var(--radius-lg); border: 1px solid rgba(230, 0, 18, 0.2);">
                        <div style="font-size: 2rem; font-weight: 700; color: var(--pwc-error); margin-bottom: var(--spacing-xs);" id="credibility-score">-</div>
                        <div style="font-size: 0.875rem; font-weight: 600; color: var(--pwc-error); word-break: keep-all;">신뢰성</div>
                    </div>
                </div>

                <!-- 총점 -->
                <div style="text-align: center; padding: var(--spacing-xl); background: linear-gradient(135deg, var(--pwc-navy), var(--pwc-navy-light)); border-radius: var(--radius-lg); margin-bottom: var(--spacing-xl); color: var(--pwc-white);">
                    <div style="font-size: 3rem; font-weight: 700; margin-bottom: var(--spacing-sm);" id="total-score">-</div>
                    <div style="font-size: 1.125rem; opacity: 0.9; word-break: keep-all;">총점 (100점 만점)</div>
                </div>

                <!-- 상세 코멘트 -->
                <div class="pwc-alert pwc-alert-info" style="margin-bottom: var(--spacing-xl);">
                    <h4 style="font-weight: 600; margin-bottom: var(--spacing-sm); word-break: keep-all;">
                        <i class="fas fa-comments" style="margin-right: var(--spacing-xs);"></i>
                        종합 평가
                    </h4>
                    <p id="overall-comment" style="line-height: 1.6; word-break: keep-all;">-</p>
                </div>

                <!-- 다음 단계 버튼 -->
                <div class="pwc-text-center">
                    <button onclick="window.location.href='/presentation-evaluation'" class="pwc-btn pwc-btn-primary pwc-btn-lg">
                        <i class="fas fa-microphone"></i>
                        발표 평가 시작
                    </button>
                </div>
            </div>
        </main>

        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <script src="/static/proposal-evaluation.js?v=3.0"></script>
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
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <link href="/static/pwc-global.css?v=3.0" rel="stylesheet">
    </head>
    <body>
        <header class="pwc-header">
            <div class="pwc-container">
                <h1>
                    <a href="/" style="color: var(--pwc-white); text-decoration: none; margin-right: var(--spacing-lg);">
                        <i class="fas fa-arrow-left" style="margin-right: var(--spacing-sm);"></i>
                    </a>
                    <div class="pwc-logo"><i class="fas fa-user-plus"></i></div>
                    AI 가상고객 생성
                    <span style="background-color: var(--pwc-orange); color: var(--pwc-white); padding: var(--spacing-xs) var(--spacing-md); border-radius: 20px; font-size: 0.875rem; font-weight: 600; margin-left: var(--spacing-lg);">1단계</span>
                </h1>
            </div>
        </header>
        <nav class="pwc-nav">
            <div class="pwc-container">
                <ul class="pwc-nav-list">
                    <li class="pwc-nav-item"><a href="/">홈</a></li>
                    <li class="pwc-nav-item"><a href="/customer-generation" class="active">AI 가상고객</a></li>
                    <li class="pwc-nav-item"><a href="/proposal-evaluation">제안서 평가</a></li>
                    <li class="pwc-nav-item"><a href="/presentation-evaluation">발표 평가</a></li>
                    <li class="pwc-nav-item"><a href="/results">통합 결과</a></li>
                </ul>
            </div>
        </nav>
        <main class="pwc-container" style="padding-top: var(--spacing-xl); padding-bottom: var(--spacing-3xl);">
            <!-- 진행 단계 표시 -->
            <div class="pwc-card">
                <div class="pwc-card-header">
                    <h2 class="pwc-card-title">
                        <i class="fas fa-route" style="color: var(--pwc-orange); margin-right: var(--spacing-sm);"></i>
                        AI 가상고객 생성 프로세스
                    </h2>
                    <p class="pwc-card-subtitle">딥리서치와 RFP 분석을 통해 30속성 가상고객을 생성합니다.</p>
                </div>
                
                <div class="pwc-flex pwc-flex-between pwc-flex-mobile-col" style="gap: var(--spacing-lg);">
                    <div class="pwc-flex pwc-flex-col pwc-flex-center" style="text-align: center; flex: 1;">
                        <div style="width: 50px; height: 50px; background: var(--pwc-orange); color: var(--pwc-white); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; margin-bottom: var(--spacing-md); box-shadow: var(--shadow-md);">1</div>
                        <h4 style="font-weight: 600; color: var(--pwc-navy); margin-bottom: var(--spacing-xs); word-break: keep-all;">딥리서치 수집</h4>
                        <p style="font-size: 0.875rem; color: var(--pwc-gray-600); word-break: keep-all;">15속성 기업 분석</p>
                    </div>
                    
                    <div class="pwc-mobile-hidden" style="height: 2px; background: var(--pwc-gray-300); flex: 0.5; align-self: center; margin: 0 var(--spacing-md);"></div>
                    
                    <div class="pwc-flex pwc-flex-col pwc-flex-center" style="text-align: center; flex: 1;">
                        <div style="width: 50px; height: 50px; background: var(--pwc-gray-400); color: var(--pwc-white); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; margin-bottom: var(--spacing-md); box-shadow: var(--shadow-sm);">2</div>
                        <h4 style="font-weight: 600; color: var(--pwc-gray-600); margin-bottom: var(--spacing-xs); word-break: keep-all;">RFP 분석</h4>
                        <p style="font-size: 0.875rem; color: var(--pwc-gray-500); word-break: keep-all;">15속성 요구사항 추출</p>
                    </div>
                    
                    <div class="pwc-mobile-hidden" style="height: 2px; background: var(--pwc-gray-300); flex: 0.5; align-self: center; margin: 0 var(--spacing-md);"></div>
                    
                    <div class="pwc-flex pwc-flex-col pwc-flex-center" style="text-align: center; flex: 1;">
                        <div style="width: 50px; height: 50px; background: var(--pwc-gray-400); color: var(--pwc-white); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; margin-bottom: var(--spacing-md); box-shadow: var(--shadow-sm);">3</div>
                        <h4 style="font-weight: 600; color: var(--pwc-gray-600); margin-bottom: var(--spacing-xs); word-break: keep-all;">페르소나 생성</h4>
                        <p style="font-size: 0.875rem; color: var(--pwc-gray-500); word-break: keep-all;">30속성 통합 고객</p>
                    </div>
                </div>
            </div>

            <!-- 딥리서치 섹션 -->
            <div class="pwc-card">
                <div class="pwc-card-header">
                    <h2 class="pwc-card-title">
                        <i class="fas fa-search" style="color: var(--pwc-blue); margin-right: var(--spacing-sm);"></i>
                        딥리서치 수집 (15속성)
                    </h2>
                    <p class="pwc-card-subtitle">기업의 비즈니스 모델, 조직 문화, 기술 수준 등 15가지 핵심 속성을 자동 수집합니다.</p>
                </div>
                
                <div class="pwc-grid pwc-grid-2">
                    <div class="pwc-form-group">
                        <label class="pwc-label">회사명</label>
                        <input type="text" id="company-name" class="pwc-input" placeholder="예: 금고석유화학">
                    </div>
                    <div class="pwc-form-group">
                        <label class="pwc-label">분석 깊이</label>
                        <select id="research-depth" class="pwc-select">
                            <option value="basic">기본 분석 (5-7속성)</option>
                            <option value="comprehensive" selected>종합 분석 (15속성)</option>
                        </select>
                    </div>
                </div>

                <div class="pwc-flex pwc-flex-mobile-col" style="gap: var(--spacing-md); margin-bottom: var(--spacing-lg);">
                    <button id="start-research" class="pwc-btn pwc-btn-primary">
                        <i class="fas fa-play"></i>
                        딥리서치 시작
                    </button>
                    <button id="demo-deep-research" class="pwc-btn pwc-btn-secondary">
                        <i class="fas fa-rocket"></i>
                        데모 데이터 로드
                    </button>
                </div>

                <div id="research-results" class="pwc-alert pwc-alert-success" style="display: none;">
                    <h4 style="font-weight: 600; margin-bottom: var(--spacing-md); word-break: keep-all;">
                        <i class="fas fa-check-circle" style="margin-right: var(--spacing-xs);"></i>
                        딥리서치 수집 완료 (15속성)
                    </h4>
                    <div id="research-attributes" class="pwc-grid pwc-grid-3" style="margin-top: var(--spacing-md);">
                        <!-- 동적으로 생성됨 -->
                    </div>
                </div>
            </div>

            <!-- RFP 분석 섹션 -->
            <div class="pwc-card">
                <div class="pwc-card-header">
                    <h2 class="pwc-card-title">
                        <i class="fas fa-file-upload" style="color: var(--pwc-success); margin-right: var(--spacing-sm);"></i>
                        RFP 문서 분석 (15속성)
                    </h2>
                    <p class="pwc-card-subtitle">RFP 문서에서 프로젝트 목표, 요구사항, 예산 등 15가지 속성을 자동 추출합니다.</p>
                </div>
                
                <div class="pwc-file-upload" id="rfp-drop-zone">
                    <i class="fas fa-file-contract" style="font-size: 3rem; color: var(--pwc-gray-400); margin-bottom: var(--spacing-lg);"></i>
                    <h4 style="font-size: 1.125rem; font-weight: 600; color: var(--pwc-navy); margin-bottom: var(--spacing-sm); word-break: keep-all;">RFP 문서를 업로드하세요</h4>
                    <p style="color: var(--pwc-gray-600); margin-bottom: var(--spacing-lg); word-break: keep-all;">PDF, DOCX, TXT 형식 지원 (최대 50MB)</p>
                    <input type="file" id="rfp-file" accept=".pdf,.docx,.txt" style="display: none;">
                    <div class="pwc-flex pwc-flex-center pwc-flex-mobile-col" style="gap: var(--spacing-md);">
                        <button onclick="document.getElementById('rfp-file').click()" class="pwc-btn pwc-btn-primary">
                            <i class="fas fa-folder-open"></i>
                            파일 선택
                        </button>
                        <button id="demo-rfp-analysis" class="pwc-btn pwc-btn-secondary">
                            <i class="fas fa-rocket"></i>
                            데모 RFP 로드
                        </button>
                    </div>
                </div>

                <div id="rfp-results" class="pwc-alert pwc-alert-info" style="display: none; margin-top: var(--spacing-lg);">
                    <h4 style="font-weight: 600; margin-bottom: var(--spacing-md); word-break: keep-all;">
                        <i class="fas fa-check-circle" style="margin-right: var(--spacing-xs);"></i>
                        RFP 분석 완료 (15속성)
                    </h4>
                    <div id="rfp-attributes" class="pwc-grid pwc-grid-3" style="margin-top: var(--spacing-md);">
                        <!-- 동적으로 생성됨 -->
                    </div>
                </div>
            </div>

            <!-- 가상고객 생성 섹션 -->
            <div class="pwc-card">
                <div class="pwc-card-header">
                    <h2 class="pwc-card-title">
                        <i class="fas fa-robot" style="color: var(--pwc-navy); margin-right: var(--spacing-sm);"></i>
                        AI 가상고객 생성
                    </h2>
                    <p class="pwc-card-subtitle">딥리서치와 RFP 분석 결과를 바탕으로 30속성 가상고객 페르소나를 생성합니다.</p>
                </div>

                <div class="pwc-text-center">
                    <button id="generate-customer" class="pwc-btn pwc-btn-primary pwc-btn-lg" style="width: 100%; max-width: 400px;" disabled>
                        <i class="fas fa-magic"></i>
                        AI 가상고객 생성
                    </button>
                    <p style="font-size: 0.875rem; color: var(--pwc-gray-600); margin-top: var(--spacing-md);">
                        딥리서치와 RFP 분석을 완료한 후 생성 가능합니다.
                    </p>
                </div>

                <!-- 생성된 고객 결과 -->
                <div id="generated-customer" class="pwc-alert pwc-alert-success" style="display: none; margin-top: var(--spacing-xl);">
                    <h4 style="font-weight: 600; margin-bottom: var(--spacing-md); word-break: keep-all;">
                        <i class="fas fa-user-check" style="margin-right: var(--spacing-xs);"></i>
                        AI 가상고객 생성 완료
                    </h4>
                    <div id="customer-persona" style="margin-top: var(--spacing-lg);">
                        <!-- 동적으로 생성됨 -->
                    </div>
                    <div class="pwc-text-center" style="margin-top: var(--spacing-xl);">
                        <button onclick="window.location.href='/proposal-evaluation'" class="pwc-btn pwc-btn-primary pwc-btn-lg">
                            <i class="fas fa-arrow-right"></i>
                            제안서 평가 시작
                        </button>
                    </div>
                </div>
            </div>
        </main>

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
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <link href="/static/pwc-global.css?v=3.0" rel="stylesheet">
        <style>
          .recording { 
            animation: pulse 1.5s ease-in-out infinite alternate;
          }
          @keyframes pulse {
            from { opacity: 0.6; }
            to { opacity: 1; }
          }
        </style>
    </head>
    <body>
        <!-- PwC 스타일 헤더 -->
        <header class="pwc-header">
            <div class="pwc-container">
                <h1>
                    <a href="/proposal-evaluation" style="color: var(--pwc-white); text-decoration: none; margin-right: var(--spacing-lg); display: inline-flex; align-items: center;">
                        <i class="fas fa-arrow-left" style="margin-right: var(--spacing-sm);"></i>
                    </a>
                    <div class="pwc-logo">
                        <i class="fas fa-microphone"></i>
                    </div>
                    발표 평가
                    <span style="background-color: var(--pwc-blue); color: var(--pwc-white); padding: var(--spacing-xs) var(--spacing-md); border-radius: 20px; font-size: 0.875rem; font-weight: 600; margin-left: var(--spacing-lg);">3단계</span>
                </h1>
                <p style="color: var(--pwc-gray-200); margin-top: var(--spacing-sm); font-size: 1rem;">
                    WebRTC + STT 기반 실시간 발표 녹화 및 AI 평가
                </p>
            </div>
        </header>

        <!-- 네비게이션 -->
        <nav class="pwc-nav">
            <div class="pwc-container">
                <ul class="pwc-nav-list">
                    <li class="pwc-nav-item"><a href="/">홈</a></li>
                    <li class="pwc-nav-item"><a href="/customer-generation">AI 가상고객</a></li>
                    <li class="pwc-nav-item"><a href="/proposal-evaluation">제안서 평가</a></li>
                    <li class="pwc-nav-item"><a href="/presentation-evaluation" class="active">발표 평가</a></li>
                    <li class="pwc-nav-item"><a href="/results">통합 결과</a></li>
                </ul>
            </div>
        </nav>

        <main class="pwc-container" style="padding-top: var(--spacing-xl); padding-bottom: var(--spacing-3xl);">
            <!-- AI 가상고객 선택 -->
            <div class="pwc-card">
                <div class="pwc-card-header">
                    <h2 class="pwc-card-title">
                        <i class="fas fa-user-circle" style="color: var(--pwc-orange); margin-right: var(--spacing-sm);"></i>
                        AI 가상고객 선택
                    </h2>
                    <p class="pwc-card-subtitle">발표를 평가할 AI 가상고객을 선택해주세요.</p>
                </div>
                
                <div class="pwc-form-group">
                    <label class="pwc-label">평가할 AI 가상고객</label>
                    <select id="customer-select" class="pwc-select">
                        <option value="">AI 가상고객을 선택하세요</option>
                    </select>
                </div>
            </div>

            <!-- 발표 설정 -->
            <div class="pwc-card">
                <div class="pwc-card-header">
                    <h2 class="pwc-card-title">
                        <i class="fas fa-cog" style="color: var(--pwc-success); margin-right: var(--spacing-sm);"></i>
                        발표 설정
                    </h2>
                    <p class="pwc-card-subtitle">발표 제목과 예상 시간을 설정해주세요.</p>
                </div>
                
                <div class="pwc-grid pwc-grid-2">
                    <div class="pwc-form-group">
                        <label class="pwc-label">발표 제목</label>
                        <input type="text" id="presentation-title" class="pwc-input" 
                               placeholder="예: 금고석유화학 DX 플랫폼 구축 제안">
                    </div>
                    <div class="pwc-form-group">
                        <label class="pwc-label">예상 발표 시간 (분)</label>
                        <select id="presentation-duration" class="pwc-select">
                            <option value="5">5분</option>
                            <option value="10" selected>10분</option>
                            <option value="15">15분</option>
                            <option value="20">20분</option>
                        </select>
                    </div>
                </div>
            </div>

            <!-- 녹화 섹션 -->
            <div class="pwc-card">
                <div class="pwc-card-header">
                    <h2 class="pwc-card-title">
                        <i class="fas fa-video" style="color: var(--pwc-error); margin-right: var(--spacing-sm);"></i>
                        발표 녹화
                    </h2>
                    <p class="pwc-card-subtitle">WebRTC를 이용한 실시간 발표 녹화 및 음성 분석을 진행합니다.</p>
                </div>

                <!-- 미디어 접근 권한 요청 -->
                <div id="media-setup" class="pwc-text-center" style="padding: var(--spacing-3xl) 0;">
                    <i class="fas fa-video-camera" style="font-size: 4rem; color: var(--pwc-gray-400); margin-bottom: var(--spacing-xl);"></i>
                    <h3 style="font-size: 1.25rem; font-weight: 600; color: var(--pwc-navy); margin-bottom: var(--spacing-lg); word-break: keep-all;">실시간 발표 녹화 및 STT 분석</h3>
                    <p style="color: var(--pwc-gray-600); margin-bottom: var(--spacing-lg); word-break: keep-all;">WebRTC 기술로 발표를 실시간 녹화하고 음성을 텍스트로 변환하여 AI 평가를 진행합니다.</p>
                    
                    <!-- 단계별 프로세스 안내 -->
                    <div style="background: var(--pwc-gray-50); border-radius: var(--radius-lg); padding: var(--spacing-lg); margin-bottom: var(--spacing-xl); text-align: left;">
                        <h4 style="color: var(--pwc-navy); font-weight: 600; margin-bottom: var(--spacing-md);"><i class="fas fa-list-ol" style="color: var(--pwc-orange); margin-right: var(--spacing-sm);"></i>진행 단계</h4>
                        <div style="display: flex; flex-direction: column; gap: var(--spacing-sm);">
                            <div style="display: flex; align-items: center; gap: var(--spacing-sm);">
                                <span style="background: var(--pwc-blue); color: var(--pwc-white); width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.875rem; font-weight: 600;">1</span>
                                <span style="color: var(--pwc-gray-700); word-break: keep-all;">카메라/마이크 시작 버튼 클릭</span>
                            </div>
                            <div style="display: flex; align-items: center; gap: var(--spacing-sm);">
                                <span style="background: var(--pwc-orange); color: var(--pwc-white); width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.875rem; font-weight: 600;">2</span>
                                <span style="color: var(--pwc-gray-700); word-break: keep-all;">브라우저 권한 요청 팝업에서 "허용" 클릭</span>
                            </div>
                            <div style="display: flex; align-items: center; gap: var(--spacing-sm);">
                                <span style="background: var(--pwc-success); color: var(--pwc-white); width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.875rem; font-weight: 600;">3</span>
                                <span style="color: var(--pwc-gray-700); word-break: keep-all;">비디오 프리뷰 확인 후 녹화 시작</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="pwc-flex pwc-flex-center pwc-flex-mobile-col" style="gap: var(--spacing-lg); margin-bottom: var(--spacing-xl);">
                        <div style="text-align: center;">
                            <button id="request-media" class="pwc-btn pwc-btn-primary">
                                <i class="fas fa-video"></i>
                                카메라/마이크 연결
                            </button>
                            <div style="font-size: 0.875rem; color: var(--pwc-gray-600); margin-top: var(--spacing-xs); word-break: keep-all;">브라우저 권한 허용 필요</div>
                        </div>
                        
                        <div style="display: flex; align-items: center; color: var(--pwc-gray-400); font-weight: bold;">또는</div>
                        
                        <div style="text-align: center;">
                            <button id="demo-presentation-eval" class="pwc-btn pwc-btn-orange pwc-btn-lg">
                                <i class="fas fa-rocket"></i>
                                데모 평가 실행
                            </button>
                            <div style="font-size: 0.875rem; color: var(--pwc-orange); margin-top: var(--spacing-xs); word-break: keep-all; font-weight: 600;">권한 없이 즉시 체험!</div>
                        </div>
                    </div>
                    
                    <div class="pwc-alert pwc-alert-info">
                        <p style="word-break: keep-all;">
                            <i class="fas fa-info-circle" style="margin-right: var(--spacing-xs);"></i>
                            <strong>데모 모드:</strong> 샘플 발표 데이터를 이용하여 즉시 평가 결과를 확인할 수 있습니다.
                        </p>
                    </div>

                    <div class="pwc-alert pwc-alert-warning" style="margin-top: var(--spacing-md);">
                        <p style="word-break: keep-all;">
                            <i class="fas fa-exclamation-triangle" style="margin-right: var(--spacing-xs);"></i>
                            <strong>미디어 접근 문제 시:</strong> 브라우저가 카메라/마이크 권한을 차단했다면 <strong>"데모 평가 실행"</strong>으로 동일한 AI 평가를 체험할 수 있습니다.
                        </p>
                    </div>
                </div>

                <!-- 비디오 프리뷰 -->
                <div id="video-preview" class="hidden" style="margin-top: var(--spacing-xl);">
                    <div class="pwc-grid pwc-grid-2" style="gap: var(--spacing-xl);">
                        <div>
                            <h4 style="font-weight: 600; color: var(--pwc-navy); margin-bottom: var(--spacing-md); word-break: keep-all;">
                                <i class="fas fa-video" style="color: var(--pwc-blue); margin-right: var(--spacing-sm);"></i>
                                비디오 프리뷰
                            </h4>
                            <div style="position: relative; background: var(--pwc-gray-900); border-radius: var(--radius-lg); overflow: hidden;">
                                <video id="preview-video" autoplay muted style="width: 100%; height: 240px; object-fit: cover;"></video>
                                <div id="recording-indicator" class="hidden recording" style="position: absolute; top: var(--spacing-sm); left: var(--spacing-sm); background: var(--pwc-error); color: var(--pwc-white); padding: var(--spacing-xs) var(--spacing-sm); border-radius: var(--radius-sm); font-size: 0.875rem;">
                                    <i class="fas fa-circle" style="margin-right: var(--spacing-xs);"></i>녹화 중
                                </div>
                            </div>
                        </div>
                        <div>
                            <h4 style="font-weight: 600; color: var(--pwc-navy); margin-bottom: var(--spacing-md); word-break: keep-all;">
                                <i class="fas fa-microphone" style="color: var(--pwc-success); margin-right: var(--spacing-sm);"></i>
                                음성 레벨 모니터
                            </h4>
                            <div style="background: var(--pwc-gray-100); padding: var(--spacing-lg); border-radius: var(--radius-lg);">
                                <div style="margin-bottom: var(--spacing-sm); font-size: 0.875rem; color: var(--pwc-gray-700); word-break: keep-all;">마이크 입력 레벨</div>
                                <div style="width: 100%; background: var(--pwc-gray-300); border-radius: 10px; height: 12px; overflow: hidden;">
                                    <div id="audio-level" style="background: linear-gradient(90deg, var(--pwc-success), var(--pwc-warning)); height: 100%; border-radius: 10px; transition: width 0.1s ease; width: 0%;"></div>
                                </div>
                                <div style="margin-top: var(--spacing-sm); font-size: 0.75rem; color: var(--pwc-gray-600); word-break: keep-all;">소리를 내보세요. 음성이 인식되면 바가 움직입니다.</div>
                            </div>
                        </div>
                    </div>

                    <!-- 녹화 컨트롤 -->
                    <div class="pwc-flex pwc-flex-center pwc-flex-mobile-col" style="gap: var(--spacing-md); margin-top: var(--spacing-xl);">
                        <button id="start-recording" style="background: var(--pwc-error); color: var(--pwc-white); border: none; padding: var(--spacing-lg) var(--spacing-xl); border-radius: var(--radius-md); font-weight: 600; cursor: pointer; transition: all 0.2s ease;">
                            <i class="fas fa-record-vinyl" style="margin-right: var(--spacing-sm);"></i>녹화 시작
                        </button>
                        <button id="stop-recording" class="hidden" style="background: var(--pwc-gray-600); color: var(--pwc-white); border: none; padding: var(--spacing-lg) var(--spacing-xl); border-radius: var(--radius-md); font-weight: 600; cursor: pointer; transition: all 0.2s ease;">
                            <i class="fas fa-stop" style="margin-right: var(--spacing-sm);"></i>녹화 중지
                        </button>
                        <button id="demo-presentation-eval-alt" class="pwc-btn pwc-btn-secondary">
                            <i class="fas fa-rocket"></i>
                            데모 평가
                        </button>
                    </div>

                    <!-- 녹화 시간 표시 -->
                    <div id="recording-timer" class="hidden pwc-text-center" style="margin-top: var(--spacing-lg);">
                        <div style="font-size: 2rem; font-family: monospace; color: var(--pwc-error); font-weight: 700; margin-bottom: var(--spacing-sm);" id="timer-display">00:00</div>
                        <div style="font-size: 0.875rem; color: var(--pwc-gray-600); word-break: keep-all;">녹화 시간</div>
                    </div>
                </div>
            </div>

            <!-- 실시간 STT 결과 -->
            <div id="stt-section" class="hidden pwc-card">
                <div class="pwc-card-header">
                    <h2 class="pwc-card-title">
                        <i class="fas fa-microphone-alt" style="color: var(--pwc-orange); margin-right: var(--spacing-sm);"></i>실시간 음성 인식 (STT)
                    </h2>
                </div>
                <div class="pwc-card-content">
                    <div style="background: var(--pwc-gray-50); border: 2px solid var(--pwc-gray-200); border-radius: var(--radius-md); padding: var(--spacing-lg); min-height: 120px; margin-bottom: var(--spacing-lg);">
                        <div style="font-size: 0.875rem; color: var(--pwc-gray-600); margin-bottom: var(--spacing-sm); font-weight: 500;">인식된 텍스트:</div>
                        <div id="stt-text" style="color: var(--pwc-navy); line-height: 1.6; font-family: monospace; font-size: 0.95rem; word-break: keep-all; word-wrap: break-word;">
                            음성 인식을 시작하려면 녹화를 시작하세요...
                        </div>
                    </div>

                    <div class="pwc-grid pwc-grid-3" style="gap: var(--spacing-md);">
                        <div style="text-align: center; padding: var(--spacing-md); background: linear-gradient(135deg, var(--pwc-blue), var(--pwc-navy)); border-radius: var(--radius-md); color: var(--pwc-white);">
                            <div style="font-weight: 600; margin-bottom: var(--spacing-xs);">말속도</div>
                            <div id="speech-speed" style="font-size: 1.25rem; font-weight: 700;">- WPM</div>
                        </div>
                        <div style="text-align: center; padding: var(--spacing-md); background: linear-gradient(135deg, var(--pwc-success), var(--pwc-success-dark)); border-radius: var(--radius-md); color: var(--pwc-white);">
                            <div style="font-weight: 600; margin-bottom: var(--spacing-xs);">휴지 빈도</div>
                            <div id="pause-frequency" style="font-size: 1.25rem; font-weight: 700;">- 회/분</div>
                        </div>
                        <div style="text-align: center; padding: var(--spacing-md); background: linear-gradient(135deg, var(--pwc-orange), var(--pwc-orange-dark)); border-radius: var(--radius-md); color: var(--pwc-white);">
                            <div style="font-weight: 600; margin-bottom: var(--spacing-xs);">군더더기어</div>
                            <div id="filler-words" style="font-size: 1.25rem; font-weight: 700;">- 개</div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- 평가 결과 -->
            <div id="evaluation-results" class="hidden pwc-card">
                <div class="pwc-card-header">
                    <h2 class="pwc-card-title">
                        <i class="fas fa-chart-line" style="color: var(--success-color); margin-right: var(--spacing-sm);"></i>발표 평가 결과
                    </h2>
                </div>
                <div class="pwc-card-content">
                    <!-- 점수 차트 -->
                    <div class="pwc-grid pwc-grid-3" style="gap: var(--spacing-md); margin-bottom: var(--spacing-xl);">
                        <div style="text-align: center; padding: var(--spacing-lg); background: linear-gradient(135deg, var(--pwc-blue), var(--pwc-navy-light)); border-radius: var(--radius-lg); color: var(--pwc-white); position: relative; overflow: hidden;">
                            <div style="font-size: 2.5rem; font-weight: 700; margin-bottom: var(--spacing-xs);" id="clarity-score">-</div>
                            <div style="font-weight: 600; font-size: 0.95rem;">명확성</div>
                            <i class="fas fa-eye" style="position: absolute; top: var(--spacing-sm); right: var(--spacing-sm); opacity: 0.3; font-size: 1.5rem;"></i>
                        </div>
                        <div style="text-align: center; padding: var(--spacing-lg); background: linear-gradient(135deg, var(--pwc-success), #007d3c); border-radius: var(--radius-lg); color: var(--pwc-white); position: relative; overflow: hidden;">
                            <div style="font-size: 2.5rem; font-weight: 700; margin-bottom: var(--spacing-xs);" id="expertise-score">-</div>
                            <div style="font-weight: 600; font-size: 0.95rem;">전문성</div>
                            <i class="fas fa-graduation-cap" style="position: absolute; top: var(--spacing-sm); right: var(--spacing-sm); opacity: 0.3; font-size: 1.5rem;"></i>
                        </div>
                        <div style="text-align: center; padding: var(--spacing-lg); background: linear-gradient(135deg, var(--pwc-orange), var(--pwc-orange-dark)); border-radius: var(--radius-lg); color: var(--pwc-white); position: relative; overflow: hidden;">
                            <div style="font-size: 2.5rem; font-weight: 700; margin-bottom: var(--spacing-xs);" id="persuasiveness-score">-</div>
                            <div style="font-weight: 600; font-size: 0.95rem;">설득력</div>
                            <i class="fas fa-handshake" style="position: absolute; top: var(--spacing-sm); right: var(--spacing-sm); opacity: 0.3; font-size: 1.5rem;"></i>
                        </div>
                        <div style="text-align: center; padding: var(--spacing-lg); background: linear-gradient(135deg, var(--pwc-info), var(--pwc-navy)); border-radius: var(--radius-lg); color: var(--pwc-white); position: relative; overflow: hidden;">
                            <div style="font-size: 2.5rem; font-weight: 700; margin-bottom: var(--spacing-xs);" id="logic-score">-</div>
                            <div style="font-weight: 600; font-size: 0.95rem;">논리성</div>
                            <i class="fas fa-brain" style="position: absolute; top: var(--spacing-sm); right: var(--spacing-sm); opacity: 0.3; font-size: 1.5rem;"></i>
                        </div>
                        <div style="text-align: center; padding: var(--spacing-lg); background: linear-gradient(135deg, var(--pwc-warning), #e6a400); border-radius: var(--radius-lg); color: var(--pwc-white); position: relative; overflow: hidden;">
                            <div style="font-size: 2.5rem; font-weight: 700; margin-bottom: var(--spacing-xs);" id="creativity-score">-</div>
                            <div style="font-weight: 600; font-size: 0.95rem;">창의성</div>
                            <i class="fas fa-lightbulb" style="position: absolute; top: var(--spacing-sm); right: var(--spacing-sm); opacity: 0.3; font-size: 1.5rem;"></i>
                        </div>
                        <div style="text-align: center; padding: var(--spacing-lg); background: linear-gradient(135deg, var(--pwc-error), #cc000f); border-radius: var(--radius-lg); color: var(--pwc-white); position: relative; overflow: hidden;">
                            <div style="font-size: 2.5rem; font-weight: 700; margin-bottom: var(--spacing-xs);" id="credibility-score">-</div>
                            <div style="font-weight: 600; font-size: 0.95rem;">신뢰성</div>
                            <i class="fas fa-shield-alt" style="position: absolute; top: var(--spacing-sm); right: var(--spacing-sm); opacity: 0.3; font-size: 1.5rem;"></i>
                        </div>
                    </div>

                    <!-- 총점 -->
                    <div style="text-align: center; padding: var(--spacing-2xl); background: linear-gradient(135deg, var(--pwc-gray-100), var(--pwc-gray-50)); border: 3px solid var(--pwc-orange); border-radius: var(--radius-xl); margin-bottom: var(--spacing-xl); position: relative; overflow: hidden;">
                        <div style="font-size: 4rem; font-weight: 700; color: var(--pwc-navy); margin-bottom: var(--spacing-sm);" id="total-score">-</div>
                        <div style="font-size: 1.25rem; font-weight: 600; color: var(--pwc-navy);">총점 (100점 만점)</div>
                        <i class="fas fa-trophy" style="position: absolute; top: var(--spacing-md); right: var(--spacing-md); color: var(--pwc-orange); font-size: 2rem; opacity: 0.3; animation: pulse 2s infinite;"></i>
                    </div>

                    <!-- 다음 단계 버튼 -->
                    <div class="pwc-text-center">
                        <button onclick="window.location.href='/results'" class="pwc-btn pwc-btn-primary pwc-btn-lg" style="display: inline-flex; align-items: center; gap: var(--spacing-sm); font-size: 1.125rem; padding: var(--spacing-lg) var(--spacing-2xl);">
                            <i class="fas fa-chart-radar"></i>통합 결과 보기
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <script src="/static/presentation-evaluation.js?v=4.0"></script>
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
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <link href="/static/pwc-global.css?v=3.0" rel="stylesheet">
        <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    </head>
    <body>
        <header class="pwc-header">
            <div class="pwc-container">
                <h1>
                    <a href="/presentation-evaluation" style="color: var(--pwc-white); text-decoration: none; margin-right: var(--spacing-lg);">
                        <i class="fas fa-arrow-left" style="margin-right: var(--spacing-sm);"></i>
                    </a>
                    <div class="pwc-logo"><i class="fas fa-chart-line"></i></div>
                    통합 결과
                    <span style="background-color: var(--pwc-success); color: var(--pwc-white); padding: var(--spacing-xs) var(--spacing-md); border-radius: 20px; font-size: 0.875rem; font-weight: 600; margin-left: var(--spacing-lg);">완료</span>
                </h1>
            </div>
        </header>
        <nav class="pwc-nav">
            <div class="pwc-container">
                <ul class="pwc-nav-list">
                    <li class="pwc-nav-item"><a href="/">홈</a></li>
                    <li class="pwc-nav-item"><a href="/customer-generation">AI 가상고객</a></li>
                    <li class="pwc-nav-item"><a href="/proposal-evaluation">제안서 평가</a></li>
                    <li class="pwc-nav-item"><a href="/presentation-evaluation">발표 평가</a></li>
                    <li class="pwc-nav-item"><a href="/results" class="active">통합 결과</a></li>
                </ul>
            </div>
        </nav>

        <main class="pwc-container" style="padding-top: var(--spacing-xl); padding-bottom: var(--spacing-3xl);">
            <!-- 종합 점수 -->
            <div class="pwc-card" style="margin-bottom: var(--spacing-xl); text-align: center;">
                <div class="pwc-card-header">
                    <h2 class="pwc-card-title" style="font-size: 1.75rem; color: var(--pwc-navy); margin-bottom: var(--spacing-lg);">
                        <i class="fas fa-trophy" style="color: var(--pwc-orange); margin-right: var(--spacing-sm);"></i>
                        최종 종합 점수
                    </h2>
                </div>
                <div class="pwc-card-body">
                    <div class="pwc-grid pwc-grid-3" style="gap: var(--spacing-lg);">
                        <div class="pwc-score-card" style="background: linear-gradient(135deg, var(--pwc-blue), var(--pwc-light-blue)); color: var(--pwc-white); border-radius: var(--radius-lg); padding: var(--spacing-lg); position: relative; overflow: hidden;">
                            <div style="position: absolute; top: -10px; right: -10px; width: 60px; height: 60px; background: rgba(255, 255, 255, 0.1); border-radius: 50%;"></div>
                            <div style="font-size: 2.25rem; font-weight: 700; margin-bottom: var(--spacing-sm);">40점</div>
                            <div style="font-size: 0.9rem; font-weight: 500; opacity: 0.9;">제안서 평가 (70%)</div>
                        </div>
                        <div class="pwc-score-card" style="background: linear-gradient(135deg, var(--pwc-purple), var(--pwc-purple-light)); color: var(--pwc-white); border-radius: var(--radius-lg); padding: var(--spacing-lg); position: relative; overflow: hidden;">
                            <div style="position: absolute; top: -10px; right: -10px; width: 60px; height: 60px; background: rgba(255, 255, 255, 0.1); border-radius: 50%;"></div>
                            <div style="font-size: 2.25rem; font-weight: 700; margin-bottom: var(--spacing-sm);">40점</div>
                            <div style="font-size: 0.9rem; font-weight: 500; opacity: 0.9;">발표 평가 (30%)</div>
                        </div>
                        <div class="pwc-score-card" style="background: linear-gradient(135deg, var(--pwc-orange), var(--pwc-orange-light)); color: var(--pwc-white); border-radius: var(--radius-lg); padding: var(--spacing-lg); position: relative; overflow: hidden; border: 3px solid var(--pwc-navy);">
                            <div style="position: absolute; top: -10px; right: -10px; width: 60px; height: 60px; background: rgba(255, 255, 255, 0.2); border-radius: 50%;"></div>
                            <div style="font-size: 2.75rem; font-weight: 700; margin-bottom: var(--spacing-sm); text-shadow: 0 2px 4px rgba(0,0,0,0.2);">40점</div>
                            <div style="font-size: 0.9rem; font-weight: 600; opacity: 0.95;">최종 통합 점수 (100점 만점)</div>
                            <div style="position: absolute; bottom: 5px; right: 10px;">
                                <i class="fas fa-star" style="color: var(--pwc-white); font-size: 1.2rem; opacity: 0.7;"></i>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- 레이더 차트 및 상세 분석 -->
            <div class="pwc-card" style="margin-bottom: var(--spacing-xl);">
                <div class="pwc-card-header">
                    <h2 class="pwc-card-title" style="font-size: 1.5rem; color: var(--pwc-navy); margin-bottom: var(--spacing-lg);">
                        <i class="fas fa-chart-radar" style="color: var(--pwc-orange); margin-right: var(--spacing-sm);"></i>
                        6대 지표별 상세 분석
                    </h2>
                </div>
                <div class="pwc-card-body">
                
                    <!-- 차트 컨테이너 -->
                    <div class="pwc-grid" style="grid-template-columns: 1fr; gap: var(--spacing-xl); align-items: center;">
                        <div class="pwc-grid" style="grid-template-columns: 1fr 1fr; gap: var(--spacing-xl); align-items: center;" data-responsive="lg">
                            <div style="text-align: center;">
                                <div style="position: relative; height: 400px; width: 400px; margin: 0 auto; background: linear-gradient(135deg, var(--pwc-gray-100), var(--pwc-white)); border-radius: 50%; padding: var(--spacing-lg); box-shadow: var(--shadow-lg); border: 3px solid var(--pwc-orange-light);">
                                    <canvas id="radarChart"></canvas>
                                    <div style="position: absolute; bottom: 10px; right: 20px; color: var(--pwc-orange); font-size: 0.8rem; font-weight: 600;">
                                        <i class="fas fa-analytics"></i> PwC Analysis
                                    </div>
                                </div>
                            </div>
                    
                            <!-- 지표별 상세 비교표 -->
                            <div style="display: flex; flex-direction: column; gap: var(--spacing-lg);">
                                <div class="pwc-table-container">
                                    <table class="pwc-table">
                                        <thead style="background: linear-gradient(135deg, var(--pwc-blue-light), var(--pwc-orange-light));">
                                            <tr>
                                                <th style="padding: var(--spacing-md); text-align: left; font-weight: 600; color: var(--pwc-white); word-break: keep-all;">지표</th>
                                                <th style="padding: var(--spacing-md); text-align: center; font-weight: 600; color: var(--pwc-white); word-break: keep-all;">제안서</th>
                                                <th style="padding: var(--spacing-md); text-align: center; font-weight: 600; color: var(--pwc-white); word-break: keep-all;">발표</th>
                                                <th style="padding: var(--spacing-md); text-align: center; font-weight: 600; color: var(--pwc-white); word-break: keep-all;">차이</th>
                                            </tr>
                                        </thead>
                                        <tbody style="background: var(--pwc-white);">
                                            <tr style="border-bottom: 1px solid var(--neutral-200);">
                                                <td style="padding: var(--spacing-md); font-weight: 600; color: var(--pwc-navy); word-break: keep-all;">명확성</td>
                                                <td style="padding: var(--spacing-md); text-align: center;">
                                                    <span class="pwc-badge" style="background: var(--pwc-blue-light); color: var(--pwc-blue);">40점</span>
                                                </td>
                                                <td style="padding: var(--spacing-md); text-align: center;">
                                                    <span class="pwc-badge" style="background: var(--info-color-light); color: var(--info-color);">40점</span>
                                                </td>
                                                <td style="padding: var(--spacing-md); text-align: center; color: var(--text-muted);">0.0</td>
                                            </tr>
                                            <tr style="border-bottom: 1px solid var(--neutral-200);">
                                                <td style="padding: var(--spacing-md); font-weight: 600; color: var(--pwc-navy); word-break: keep-all;">전문성</td>
                                                <td style="padding: var(--spacing-md); text-align: center;">
                                                    <span class="pwc-badge" style="background: var(--success-color-light); color: var(--success-color); display: inline-flex; align-items: center; gap: var(--spacing-xs);">50점 <i class="fas fa-star" style="color: var(--pwc-orange);"></i></span>
                                                </td>
                                                <td style="padding: var(--spacing-md); text-align: center;">
                                                    <span class="pwc-badge" style="background: var(--success-color-light); color: var(--success-color); display: inline-flex; align-items: center; gap: var(--spacing-xs);">50점 <i class="fas fa-star" style="color: var(--pwc-orange);"></i></span>
                                                </td>
                                                <td style="padding: var(--spacing-md); text-align: center; color: var(--text-muted);">0.0</td>
                                            </tr>
                                            <tr style="border-bottom: 1px solid var(--neutral-200);">
                                                <td style="padding: var(--spacing-md); font-weight: 600; color: var(--pwc-navy); word-break: keep-all;">설득력</td>
                                                <td style="padding: var(--spacing-md); text-align: center;">
                                                    <span class="pwc-badge" style="background: var(--pwc-blue-light); color: var(--pwc-blue);">40점</span>
                                                </td>
                                                <td style="padding: var(--spacing-md); text-align: center;">
                                                    <span class="pwc-badge" style="background: var(--info-color-light); color: var(--info-color);">40점</span>
                                                </td>
                                                <td style="padding: var(--spacing-md); text-align: center; color: var(--text-muted);">0.0</td>
                                            </tr>
                                            <tr style="border-bottom: 1px solid var(--neutral-200);">
                                                <td style="padding: var(--spacing-md); font-weight: 600; color: var(--pwc-navy); word-break: keep-all;">논리성</td>
                                                <td style="padding: var(--spacing-md); text-align: center;">
                                                    <span class="pwc-badge" style="background: var(--pwc-blue-light); color: var(--pwc-blue);">40점</span>
                                                </td>
                                                <td style="padding: var(--spacing-md); text-align: center;">
                                                    <span class="pwc-badge" style="background: var(--info-color-light); color: var(--info-color);">40점</span>
                                                </td>
                                                <td style="padding: var(--spacing-md); text-align: center; color: var(--text-muted);">0.0</td>
                                            </tr>
                                            <tr style="border-bottom: 1px solid var(--neutral-200);">
                                                <td style="padding: var(--spacing-md); font-weight: 600; color: var(--pwc-navy); word-break: keep-all;">창의성</td>
                                                <td style="padding: var(--spacing-md); text-align: center;">
                                                    <span class="pwc-badge" style="background: var(--warning-color-light); color: var(--warning-color); display: inline-flex; align-items: center; gap: var(--spacing-xs);">30점 <i class="fas fa-exclamation-triangle"></i></span>
                                                </td>
                                                <td style="padding: var(--spacing-md); text-align: center;">
                                                    <span class="pwc-badge" style="background: var(--warning-color-light); color: var(--warning-color); display: inline-flex; align-items: center; gap: var(--spacing-xs);">30점 <i class="fas fa-exclamation-triangle"></i></span>
                                                </td>
                                                <td style="padding: var(--spacing-md); text-align: center; color: var(--text-muted);">0.0</td>
                                            </tr>
                                            <tr style="border-bottom: 1px solid var(--neutral-200);">
                                                <td style="padding: var(--spacing-md); font-weight: 600; color: var(--pwc-navy); word-break: keep-all;">신뢰성</td>
                                                <td style="padding: var(--spacing-md); text-align: center;">
                                                    <span class="pwc-badge" style="background: var(--success-color-light); color: var(--success-color); display: inline-flex; align-items: center; gap: var(--spacing-xs);">50점 <i class="fas fa-star" style="color: var(--pwc-orange);"></i></span>
                                                </td>
                                                <td style="padding: var(--spacing-md); text-align: center;">
                                                    <span class="pwc-badge" style="background: var(--success-color-light); color: var(--success-color); display: inline-flex; align-items: center; gap: var(--spacing-xs);">50점 <i class="fas fa-star" style="color: var(--pwc-orange);"></i></span>
                                                </td>
                                                <td style="padding: var(--spacing-md); text-align: center; color: var(--text-muted);">0.0</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                                
                                <!-- 통계 요약 -->
                                <div class="pwc-grid pwc-grid-2" style="gap: var(--spacing-md);">
                                    <div style="background: linear-gradient(135deg, var(--pwc-blue), var(--pwc-light-blue)); color: var(--pwc-white); border-radius: var(--radius-md); padding: var(--spacing-md); text-align: center; position: relative; overflow: hidden;">
                                        <div style="position: absolute; top: -20px; right: -20px; width: 80px; height: 80px; background: rgba(255, 255, 255, 0.1); border-radius: 50%;"></div>
                                        <div style="font-weight: 600; margin-bottom: var(--spacing-xs); opacity: 0.9;">제안서 평균</div>
                                        <div style="font-size: 1.5rem; font-weight: 700;">40점</div>
                                        <i class="fas fa-file-alt" style="position: absolute; bottom: 8px; right: 10px; opacity: 0.6; font-size: 1.2rem;"></i>
                                    </div>
                                    <div style="background: linear-gradient(135deg, var(--pwc-purple), var(--pwc-purple-light)); color: var(--pwc-white); border-radius: var(--radius-md); padding: var(--spacing-md); text-align: center; position: relative; overflow: hidden;">
                                        <div style="position: absolute; top: -20px; right: -20px; width: 80px; height: 80px; background: rgba(255, 255, 255, 0.1); border-radius: 50%;"></div>
                                        <div style="font-weight: 600; margin-bottom: var(--spacing-xs); opacity: 0.9;">발표 평균</div>
                                        <div style="font-size: 1.5rem; font-weight: 700;">40점</div>
                                        <i class="fas fa-presentation" style="position: absolute; bottom: 8px; right: 10px; opacity: 0.6; font-size: 1.2rem;"></i>
                                    </div>
                                </div>
                                
                                <!-- 지표별 성과 분석 -->
                                <div style="background: linear-gradient(135deg, var(--pwc-gray-100), var(--pwc-white)); border-radius: var(--radius-md); padding: var(--spacing-lg); border: 2px solid var(--pwc-orange-light); box-shadow: var(--shadow-md);">
                                    <h4 style="font-weight: 600; color: var(--pwc-navy); margin-bottom: var(--spacing-md); display: flex; align-items: center; gap: var(--spacing-sm); border-bottom: 2px solid var(--pwc-orange-light); padding-bottom: var(--spacing-sm);">
                                        <i class="fas fa-chart-line" style="color: var(--pwc-orange);"></i>성과 분석
                                    </h4>
                                    <ul style="display: flex; flex-direction: column; gap: var(--spacing-md); font-size: 0.95rem; color: var(--text-color);">
                                        <li style="display: flex; align-items: center; gap: var(--spacing-sm); word-break: keep-all; background: var(--pwc-success-light); padding: var(--spacing-sm); border-radius: var(--radius-sm); border-left: 4px solid var(--pwc-success);">
                                            <i class="fas fa-trophy" style="color: var(--pwc-success); font-size: 1.1rem;"></i>
                                            <strong style="color: var(--pwc-navy);">최고 점수:</strong> <span style="color: var(--pwc-success); font-weight: 600;">전문성, 신뢰성 (50점)</span>
                                        </li>
                                        <li style="display: flex; align-items: center; gap: var(--spacing-sm); word-break: keep-all; background: var(--pwc-warning-light); padding: var(--spacing-sm); border-radius: var(--radius-sm); border-left: 4px solid var(--pwc-warning);">
                                            <i class="fas fa-exclamation-triangle" style="color: var(--pwc-warning); font-size: 1.1rem;"></i>
                                            <strong style="color: var(--pwc-navy);">개선 필요:</strong> <span style="color: var(--pwc-warning); font-weight: 600;">창의성 (30점)</span>
                                        </li>
                                        <li style="display: flex; align-items: center; gap: var(--spacing-sm); word-break: keep-all; background: var(--pwc-info-light); padding: var(--spacing-sm); border-radius: var(--radius-sm); border-left: 4px solid var(--pwc-info);">
                                            <i class="fas fa-balance-scale" style="color: var(--pwc-info); font-size: 1.1rem;"></i>
                                            <strong style="color: var(--pwc-navy);">평가 일관성:</strong> <span style="color: var(--pwc-info); font-weight: 600;">제안서와 발표 점수 차이 없음</span>
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- 성과 요약 및 진행률 바 -->
            <div class="pwc-card" style="margin-bottom: var(--spacing-xl);">
                <div class="pwc-card-header">
                    <h2 class="pwc-card-title">
                        <i class="fas fa-chart-bar" style="color: var(--pwc-blue); margin-right: var(--spacing-sm);"></i>
                        지표별 성과 요약
                    </h2>
                </div>
                <div class="pwc-card-content">
                    <div style="display: flex; flex-direction: column; gap: var(--spacing-lg);">
                        <!-- 명확성 -->
                        <div style="display: flex; flex-direction: column; gap: var(--spacing-sm);">
                            <div style="display: flex; justify-content: space-between; align-items: center;">
                                <span style="font-weight: 600; color: var(--pwc-navy); word-break: keep-all;">명확성</span>
                                <span style="color: var(--text-muted); font-weight: 500;">40 / 50점</span>
                            </div>
                            <div style="width: 100%; height: 8px; background: var(--neutral-200); border-radius: 4px; overflow: hidden;">
                                <div style="height: 100%; background: linear-gradient(90deg, var(--pwc-blue), var(--pwc-orange)); border-radius: 4px; width: 80%; transition: width 0.3s ease;"></div>
                            </div>
                        </div>
                        
                        <!-- 전문성 -->
                        <div style="display: flex; flex-direction: column; gap: var(--spacing-sm);">
                            <div style="display: flex; justify-content: space-between; align-items: center;">
                                <span style="font-weight: 600; color: var(--pwc-navy); word-break: keep-all;">전문성</span>
                                <span style="color: var(--success-color); font-weight: 700; display: flex; align-items: center; gap: var(--spacing-xs);">50 / 50점 <i class="fas fa-star" style="color: var(--pwc-orange);"></i></span>
                            </div>
                            <div style="width: 100%; height: 8px; background: var(--neutral-200); border-radius: 4px; overflow: hidden;">
                                <div style="height: 100%; background: linear-gradient(90deg, var(--success-color), var(--pwc-orange)); border-radius: 4px; width: 100%; transition: width 0.3s ease;"></div>
                            </div>
                        </div>
                        
                        <!-- 설득력 -->
                        <div style="display: flex; flex-direction: column; gap: var(--spacing-sm);">
                            <div style="display: flex; justify-content: space-between; align-items: center;">
                                <span style="font-weight: 600; color: var(--pwc-navy); word-break: keep-all;">설득력</span>
                                <span style="color: var(--text-muted); font-weight: 500;">40 / 50점</span>
                            </div>
                            <div style="width: 100%; height: 8px; background: var(--neutral-200); border-radius: 4px; overflow: hidden;">
                                <div style="height: 100%; background: linear-gradient(90deg, var(--pwc-blue), var(--pwc-orange)); border-radius: 4px; width: 80%; transition: width 0.3s ease;"></div>
                            </div>
                        </div>
                        
                        <!-- 논리성 -->
                        <div style="display: flex; flex-direction: column; gap: var(--spacing-sm);">
                            <div style="display: flex; justify-content: space-between; align-items: center;">
                                <span style="font-weight: 600; color: var(--pwc-navy); word-break: keep-all;">논리성</span>
                                <span style="color: var(--text-muted); font-weight: 500;">40 / 50점</span>
                            </div>
                            <div style="width: 100%; height: 8px; background: var(--neutral-200); border-radius: 4px; overflow: hidden;">
                                <div style="height: 100%; background: linear-gradient(90deg, var(--pwc-blue), var(--pwc-orange)); border-radius: 4px; width: 80%; transition: width 0.3s ease;"></div>
                            </div>
                        </div>
                        
                        <!-- 창의성 -->
                        <div style="display: flex; flex-direction: column; gap: var(--spacing-sm);">
                            <div style="display: flex; justify-content: space-between; align-items: center;">
                                <span style="font-weight: 600; color: var(--pwc-navy); word-break: keep-all;">창의성</span>
                                <span style="color: var(--warning-color); font-weight: 600; display: flex; align-items: center; gap: var(--spacing-xs);">30 / 50점 <i class="fas fa-exclamation-triangle"></i></span>
                            </div>
                            <div style="width: 100%; height: 8px; background: var(--neutral-200); border-radius: 4px; overflow: hidden;">
                                <div style="height: 100%; background: linear-gradient(90deg, var(--warning-color), var(--pwc-orange)); border-radius: 4px; width: 60%; transition: width 0.3s ease;"></div>
                            </div>
                        </div>
                        
                        <!-- 신뢰성 -->
                        <div style="display: flex; flex-direction: column; gap: var(--spacing-sm);">
                            <div style="display: flex; justify-content: space-between; align-items: center;">
                                <span style="font-weight: 600; color: var(--pwc-navy); word-break: keep-all;">신뢰성</span>
                                <span style="color: var(--success-color); font-weight: 700; display: flex; align-items: center; gap: var(--spacing-xs);">50 / 50점 <i class="fas fa-star" style="color: var(--pwc-orange);"></i></span>
                            </div>
                            <div style="width: 100%; height: 8px; background: var(--neutral-200); border-radius: 4px; overflow: hidden;">
                                <div style="height: 100%; background: linear-gradient(90deg, var(--success-color), var(--pwc-orange)); border-radius: 4px; width: 100%; transition: width 0.3s ease;"></div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- 성과 등급 -->
                    <div style="margin-top: var(--spacing-xl); padding: var(--spacing-lg); background: linear-gradient(135deg, var(--success-color-light), var(--pwc-blue-light)); border-radius: var(--border-radius-lg); border-left: 6px solid var(--success-color); position: relative; overflow: hidden;">
                        <div style="display: flex; align-items: center; gap: var(--spacing-md); z-index: 2; position: relative;">
                            <div style="flex-shrink: 0;">
                                <i class="fas fa-trophy" style="color: var(--success-color); font-size: 1.5rem; animation: pulse 2s infinite;"></i>
                            </div>
                            <div>
                                <p style="font-weight: 600; color: var(--pwc-navy); margin-bottom: var(--spacing-xs); word-break: keep-all;">
                                    전체 성과 등급: <strong style="color: var(--success-color);">우수 (B+급)</strong>
                                </p>
                                <p style="color: var(--text-color); line-height: 1.4; word-break: keep-all;">
                                    평균 40점(100점 만점)으로 높은 수준의 제안 품질을 보여주었습니다.
                                </p>
                            </div>
                        </div>
                        <div style="position: absolute; top: var(--spacing-sm); right: var(--spacing-sm); font-size: 3rem; color: var(--success-color); opacity: 0.1;">
                            <i class="fas fa-award"></i>
                        </div>
                    </div>
                </div>
            </div>

            <!-- 종합 피드백 -->
            <div class="pwc-card" style="margin-bottom: var(--spacing-xl);">
                <div class="pwc-card-header">
                    <h2 class="pwc-card-title">
                        <i class="fas fa-comment-dots" style="color: var(--pwc-orange); margin-right: var(--spacing-sm);"></i>
                        종합 피드백
                    </h2>
                </div>
                <div class="pwc-card-content">
                    <div style="display: flex; flex-direction: column; gap: var(--spacing-lg);">
                        <div class="pwc-alert pwc-alert-success" style="padding: var(--spacing-lg); border-radius: var(--border-radius-md);">
                            <h3 style="font-weight: 600; color: var(--success-color); margin-bottom: var(--spacing-sm); display: flex; align-items: center; gap: var(--spacing-sm);">
                                <i class="fas fa-thumbs-up"></i>강점
                            </h3>
                            <p style="color: var(--success-color); line-height: 1.6; word-break: keep-all;">
                                화학산업 전문성과 글로벌 ESG 대응 역량이 뛰어나며, 
                                안정적이고 체계적인 실행 방안을 제시했습니다. 
                                PwC의 브랜드 신뢰도와 실현가능성이 높게 평가됩니다.
                            </p>
                        </div>
                        
                        <div class="pwc-alert pwc-alert-warning" style="padding: var(--spacing-lg); border-radius: var(--border-radius-md);">
                            <h3 style="font-weight: 600; color: var(--warning-color); margin-bottom: var(--spacing-sm); display: flex; align-items: center; gap: var(--spacing-sm);">
                                <i class="fas fa-lightbulb"></i>개선 사항
                            </h3>
                            <p style="color: var(--warning-color); line-height: 1.6; word-break: keep-all;">
                                창의적이고 혁신적인 차별화 요소를 더 강화하면 좋겠습니다. 
                                기술적 세부사항의 명확성을 높이고, 
                                더욱 구체적인 실행 타임라인을 제시해주세요.
                            </p>
                        </div>
                        
                        <div class="pwc-alert pwc-alert-info" style="padding: var(--spacing-lg); border-radius: var(--border-radius-md);">
                            <h3 style="font-weight: 600; color: var(--info-color); margin-bottom: var(--spacing-sm); display: flex; align-items: center; gap: var(--spacing-sm);">
                                <i class="fas fa-star"></i>총평
                            </h3>
                            <p style="color: var(--info-color); line-height: 1.6; word-break: keep-all;">
                                금고석유화학의 ESG 경영과 DX 니즈를 정확히 파악한 우수한 제안입니다. 
                                화학산업 전문성과 글로벌 경험을 바탕으로 한 안정적 실행력이 돋보이며, 
                                장기적 파트너십 구축에 적합한 신뢰할 수 있는 제안으로 평가됩니다.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- 액션 버튼 -->
            <div class="pwc-text-center" style="display: flex; gap: var(--spacing-lg); justify-content: center; flex-wrap: wrap;">
                <button onclick="window.location.href='/'" class="pwc-btn pwc-btn-primary pwc-btn-lg" style="display: inline-flex; align-items: center; gap: var(--spacing-sm); font-size: 1.125rem; padding: var(--spacing-lg) var(--spacing-2xl);">
                    <i class="fas fa-home"></i>메인으로 돌아가기
                </button>
                <button onclick="downloadReport()" class="pwc-btn pwc-btn-success pwc-btn-lg" style="display: inline-flex; align-items: center; gap: var(--spacing-sm); font-size: 1.125rem; padding: var(--spacing-lg) var(--spacing-2xl);">
                    <i class="fas fa-download"></i>PDF 리포트 다운로드
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