// OpenAI GPT-4 Turbo API 연동 서비스

import OpenAI from 'openai'
import type { 
  AIVirtualCustomer, 
  DeepResearchData,
  RfpAnalysisData,
  EvaluationScores,
  MetricScore 
} from '../types/ai-customer'

export class OpenAIService {
  private openai: OpenAI
  
  constructor(apiKey: string) {
    this.openai = new OpenAI({
      apiKey: apiKey,
      // Cloudflare Workers 환경에서 필요한 설정
      fetch: globalThis.fetch
    })
  }

  /**
   * 딥리서치 15속성 자동 추출
   */
  async extractDeepResearchData(
    companyName: string, 
    webContent: string, 
    researchDepth: 'basic' | 'detailed' | 'comprehensive' = 'detailed'
  ): Promise<DeepResearchData> {
    
    const prompt = `
당신은 기업 분석 전문가입니다. 다음 기업 정보를 분석하여 15가지 딥리서치 속성을 추출해주세요.

기업명: ${companyName}
웹 콘텐츠: ${webContent}
분석 깊이: ${researchDepth}

다음 15개 속성을 분석해주세요:

1. 비전·미션: 장기 목표, 기업 존재 이유, 핵심 메시지
2. 핵심 사업영역: 주력 제품/서비스, 사업 부문 매출 비중  
3. 시장 포지셔닝: 경쟁우위, 가격 전략, 글로벌/로컬 포지션
4. 재무 전략 성향: 투자 확대 vs 비용절감, 현금흐름 정책
5. R&D 지향성: R&D 투자 비중, 주요 연구 테마, 연구 인력 규모
6. ESG 우선순위: ESG 목표, 등급, 탄소감축/재생에너지 지표
7. 리스크 관리 태도: 위험 회피 vs 감수 전략, 리스크 대응 사례
8. 혁신·변화 성향: 신기술 도입 적극성, 조직 변화 관리
9. 파트너십 전략: 전략적 제휴, M&A 성향, 생태계 구축
10. 고객 경험 중시도: 고객만족도, 서비스 품질, 고객 중심성
11. 브랜드 가치관: 브랜드 아이덴티티, 사회적 가치, 평판 관리
12. 조직 문화 특성: 수평적/수직적, 협업 vs 경쟁, 다양성 포용
13. 의사결정 구조: 집권적/분권적, 의사결정 속도, 절차 복잡성
14. 글로벌·현지화 전략: 해외 진출 전략, 현지화 수준, 글로벌 역량
15. 디지털 전환 수준: IT 인프라, 디지털 혁신, 데이터 활용도

응답 형식: JSON
{
  "vision_mission": "분석 결과...",
  "core_business": "분석 결과...",
  "market_positioning": "분석 결과...",
  "financial_strategy": "분석 결과...",
  "rd_orientation": "분석 결과...",
  "esg_priority": "분석 결과...",
  "risk_management": "분석 결과...", 
  "innovation_change": "분석 결과...",
  "partnership_strategy": "분석 결과...",
  "customer_experience": "분석 결과...",
  "brand_values": "분석 결과...",
  "organizational_culture": "분석 결과...",
  "decision_structure": "분석 결과...",
  "global_localization": "분석 결과...",
  "digital_transformation": "분석 결과..."
}
`

    try {
      const response = await this.openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3,
        max_tokens: 3000,
        response_format: { type: "json_object" }
      })

      const content = response.choices[0].message.content
      if (!content) throw new Error('OpenAI 응답이 비어있습니다')
      
      return JSON.parse(content) as DeepResearchData
      
    } catch (error) {
      console.error('딥리서치 데이터 추출 오류:', error)
      throw new Error(`딥리서치 분석 실패: ${error.message}`)
    }
  }

  /**
   * RFP 문서 15속성 자동 추출
   */
  async extractRfpAnalysisData(
    rfpContent: string,
    fileName: string
  ): Promise<RfpAnalysisData> {
    
    const prompt = `
당신은 RFP(Request for Proposal) 분석 전문가입니다. 다음 RFP 문서를 분석하여 15가지 속성을 추출해주세요.

RFP 파일명: ${fileName}
RFP 내용: ${rfpContent}

다음 15개 속성을 추출해주세요:

1. 발주사명: 발주 기관/기업명
2. 담당 부서: 프로젝트 담당 부서/팀
3. 프로젝트 배경: 사업 추진 배경, 필요성, 현황
4. 목표: 프로젝트 목표, 기대효과, 성과지표  
5. 범위: 사업 범위, 대상 시스템, 포함/제외 사항
6. 기간: 프로젝트 기간, 단계별 일정, 마일스톤
7. 예산 규모: 총 예산, 예산 범위, 비용 구조
8. 평가 기준: 평가 항목, 가중치, 배점 방식
9. 기술 요구사항: 필수 기술, 성능 요구사항, 표준 준수
10. 제약 사항: 기술적/법적/정책적 제약, 준수 사항
11. 납품 조건: 납품물, 인도 조건, 검수 기준
12. 운영 요구사항: 운영 지원, 유지보수, 교육 요구사항
13. 보안 요구사항: 보안 정책, 인증 요구사항, 개인정보보호
14. 법적 요구사항: 관련 법규, 규제 준수, 계약 조건
15. 기타 특이사항: 특별 조건, 우대사항, 기타 요구사항

응답 형식: JSON
{
  "client_company": "추출 결과...",
  "department": "추출 결과...",
  "project_background": "추출 결과...",
  "objectives": "추출 결과...",
  "scope": "추출 결과...",
  "timeline": "추출 결과...",
  "budget": "추출 결과...",
  "evaluation_criteria": "추출 결과...",
  "technical_requirements": "추출 결과...",
  "constraints": "추출 결과...",
  "delivery_conditions": "추출 결과...",
  "operational_requirements": "추출 결과...",
  "security_requirements": "추출 결과...",
  "legal_requirements": "추출 결과...",
  "special_conditions": "추출 결과..."
}
`

    try {
      const response = await this.openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.2,
        max_tokens: 3000,
        response_format: { type: "json_object" }
      })

      const content = response.choices[0].message.content
      if (!content) throw new Error('OpenAI 응답이 비어있습니다')
      
      return JSON.parse(content) as RfpAnalysisData
      
    } catch (error) {
      console.error('RFP 분석 오류:', error)
      throw new Error(`RFP 분석 실패: ${error.message}`)
    }
  }

  /**
   * 30속성 통합 AI 가상고객 페르소나 생성
   */
  async generateVirtualCustomer(
    deepResearch: DeepResearchData,
    rfpAnalysis: RfpAnalysisData,
    customerType: 'CTO' | 'CFO' | 'CEO' | 'PM' = 'CTO'
  ): Promise<AIVirtualCustomer> {
    
    const prompt = `
당신은 AI 가상고객 페르소나 생성 전문가입니다. 딥리서치 15속성과 RFP분석 15속성을 통합하여 ${customerType} 역할의 AI 가상고객을 생성해주세요.

딥리서치 데이터:
${JSON.stringify(deepResearch, null, 2)}

RFP 분석 데이터:
${JSON.stringify(rfpAnalysis, null, 2)}

요청 고객 유형: ${customerType}

다음 구조로 AI 가상고객을 생성해주세요:

1. 통합 분석을 통한 Top3 우선순위 도출
2. 의사결정 스타일 분류 (데이터 중심형, 관계 중심형, 직관형, 신중형 등)  
3. 페르소나 요약 (배경, 관심사, 우려사항, 평가 관점)
4. 평가 가중치 (6대 지표별 중요도)

응답 형식: JSON
{
  "customer_id": "고유 ID (UUID 형식)",
  "customer_type": "${customerType}",
  "company_name": "회사명",
  "project_name": "프로젝트명",
  "deep_research_data": 딥리서치_데이터_객체,
  "rfp_analysis_data": RFP분석_데이터_객체,
  "integrated_persona": {
    "top3_priorities": ["1순위", "2순위", "3순위"],
    "decision_style": "의사결정 스타일",
    "persona_summary": "페르소나 요약",
    "key_concerns": ["주요 우려사항1", "우려사항2", "우려사항3"],
    "evaluation_weights": {
      "clarity": 0.15,
      "expertise": 0.25,  
      "persuasiveness": 0.20,
      "logic": 0.20,
      "creativity": 0.10,
      "credibility": 0.10
    }
  },
  "created_at": "2024-01-01T00:00:00Z"
}
`

    try {
      const response = await this.openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.4,
        max_tokens: 4000,
        response_format: { type: "json_object" }
      })

      const content = response.choices[0].message.content
      if (!content) throw new Error('OpenAI 응답이 비어있습니다')
      
      const result = JSON.parse(content) as AIVirtualCustomer
      
      // ID와 타임스탬프 보정
      result.customer_id = result.customer_id || crypto.randomUUID()
      result.created_at = result.created_at || new Date().toISOString()
      
      return result
      
    } catch (error) {
      console.error('가상고객 생성 오류:', error)
      throw new Error(`가상고객 생성 실패: ${error.message}`)
    }
  }

  /**
   * 6대 지표 루브릭 기반 제안서/발표 평가
   */
  async evaluateWithRubric(
    customer: AIVirtualCustomer,
    content: string,
    contentType: 'proposal' | 'presentation',
    additionalContext?: string
  ): Promise<EvaluationScores> {
    
    const rubricAnchors = {
      clarity: {
        1: "목적·범위·효과가 모호하거나 누락, 핵심 전달 실패",
        2: "일부 명확하나 전체적으로 불분명, 구조가 흐트러짐",
        3: "기본 흐름은 명확하나 세부 설명 부족, 중복/모호 표현 존재",
        4: "목적·범위·효과가 잘 드러나고, 전체 구조가 이해 가능", 
        5: "모든 메시지가 직관적으로 명확, 구조적·간결하며 완결성 확보"
      },
      expertise: {
        1: "업계/기술 근거 전혀 없음, 피상적 주장",
        2: "일부 용어나 개념만 언급, 최신성·정확성 부족",
        3: "기본적인 전문 지식·사례는 있으나 깊이가 부족",
        4: "업계 표준·최신 트렌드·레퍼런스를 적절히 활용",
        5: "최신 기술·글로벌 레퍼런스 풍부, 깊이와 폭 모두 뛰어남"
      },
      persuasiveness: {
        1: "주장만 있고 근거·사례 없음, 고객 요구와 불일치",
        2: "제한된 근거 제시, 설득력 약함",
        3: "근거는 있으나 고객 Pain Point와 연결성이 약함",
        4: "데이터·사례를 통해 고객 요구와 논리적으로 연결",
        5: "강력한 데이터·사례·스토리텔링으로 고객 확신 유발"
      },
      logic: {
        1: "구조 없음, 아이디어가 단절·모순적",
        2: "부분적 논리만 존재, 전개 과정에서 비약·누락 발생", 
        3: "기본 구조(문제→목표→해결책)는 있으나 불완전",
        4: "일관된 논리 전개, 단계별 근거 설명 충실",
        5: "매우 체계적, 모든 단계가 명확히 연결, 모순·비약 없음"
      },
      creativity: {
        1: "기존 접근법 반복, 차별성 전혀 없음",
        2: "소폭 차별화 있으나 기존과 유사, 참신성 낮음",
        3: "기본적인 차별화는 있으나 독창성 부족",
        4: "새로운 아이디어나 방법론 제시, 실행 가능성 확보",
        5: "혁신적이고 차별적인 아이디어, 고객 맥락에 최적화"
      },
      credibility: {
        1: "실행 가능성 전혀 없음, 레퍼런스 부재",
        2: "제한적 실행 가능성, 근거 부족",
        3: "일부 실행 근거 제시, 보완 필요",
        4: "유사 프로젝트 경험·리스크 관리·규제 준수 근거 제시",
        5: "실행력 완벽 검증, 풍부한 레퍼런스와 리스크 대비책 확보"
      }
    }

    const prompt = `
당신은 ${customer.customer_type} 역할의 전문 평가자입니다. 

고객 페르소나:
- 회사: ${customer.company_name}
- 프로젝트: ${customer.project_name}  
- 의사결정 스타일: ${customer.integrated_persona.decision_style}
- 주요 우선순위: ${customer.integrated_persona.top3_priorities.join(', ')}
- 주요 우려사항: ${customer.integrated_persona.key_concerns.join(', ')}

평가 대상 (${contentType}):
${content}

${additionalContext ? `추가 컨텍스트: ${additionalContext}` : ''}

다음 6대 지표를 1-5점 루브릭 기준으로 엄격하게 평가해주세요:

명확성 (1-5점):
${Object.entries(rubricAnchors.clarity).map(([score, desc]) => `${score}점: ${desc}`).join('\n')}

전문성 (1-5점):  
${Object.entries(rubricAnchors.expertise).map(([score, desc]) => `${score}점: ${desc}`).join('\n')}

설득력 (1-5점):
${Object.entries(rubricAnchors.persuasiveness).map(([score, desc]) => `${score}점: ${desc}`).join('\n')}

논리성 (1-5점):
${Object.entries(rubricAnchors.logic).map(([score, desc]) => `${score}점: ${desc}`).join('\n')}

창의성 (1-5점):
${Object.entries(rubricAnchors.creativity).map(([score, desc]) => `${score}점: ${desc}`).join('\n')}

신뢰성 (1-5점):
${Object.entries(rubricAnchors.credibility).map(([score, desc]) => `${score}점: ${desc}`).join('\n')}

${customer.customer_type} 관점에서 고객사의 우선순위와 우려사항을 고려하여 평가하되, 루브릭 기준을 엄격하게 적용하세요.

응답 형식: JSON
{
  "clarity": {
    "score": 점수(1-5),
    "rationale": "평가 근거 (200자 내외)",
    "improvement_suggestions": "개선 방안 (150자 내외)"
  },
  "expertise": {
    "score": 점수(1-5), 
    "rationale": "평가 근거",
    "improvement_suggestions": "개선 방안"
  },
  "persuasiveness": {
    "score": 점수(1-5),
    "rationale": "평가 근거", 
    "improvement_suggestions": "개선 방안"
  },
  "logic": {
    "score": 점수(1-5),
    "rationale": "평가 근거",
    "improvement_suggestions": "개선 방안"
  },
  "creativity": {
    "score": 점수(1-5),
    "rationale": "평가 근거",
    "improvement_suggestions": "개선 방안"
  },
  "credibility": {
    "score": 점수(1-5),
    "rationale": "평가 근거",
    "improvement_suggestions": "개선 방안"
  },
  "overall_summary": "종합 평가 (300자 내외)",
  "key_strengths": ["강점1", "강점2", "강점3"],
  "priority_improvements": ["개선점1", "개선점2", "개선점3"]
}
`

    try {
      const response = await this.openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3,
        max_tokens: 4000,
        response_format: { type: "json_object" }
      })

      const content_response = response.choices[0].message.content
      if (!content_response) throw new Error('OpenAI 응답이 비어있습니다')
      
      const evaluation = JSON.parse(content_response)
      
      // 점수 계산
      const scores = [
        evaluation.clarity.score,
        evaluation.expertise.score,
        evaluation.persuasiveness.score, 
        evaluation.logic.score,
        evaluation.creativity.score,
        evaluation.credibility.score
      ]
      
      const averageScore = scores.reduce((sum, score) => sum + score, 0) / scores.length
      const scaledScore = Math.round((averageScore / 5) * 100) // 100점 만점으로 환산
      
      // 가중치 적용 점수
      const weights = customer.integrated_persona.evaluation_weights
      const weightedScore = Math.round(
        evaluation.clarity.score * weights.clarity * 20 +
        evaluation.expertise.score * weights.expertise * 20 +
        evaluation.persuasiveness.score * weights.persuasiveness * 20 +
        evaluation.logic.score * weights.logic * 20 +
        evaluation.creativity.score * weights.creativity * 20 +
        evaluation.credibility.score * weights.credibility * 20
      )

      return {
        ...evaluation,
        overall_score: scaledScore,
        weighted_score: weightedScore,
        evaluation_date: new Date().toISOString()
      } as EvaluationScores
      
    } catch (error) {
      console.error('AI 평가 오류:', error)
      throw new Error(`AI 평가 실패: ${error.message}`)
    }
  }

  /**
   * 제안서 내용 요약 및 핵심 포인트 추출
   */
  async summarizeProposal(proposalContent: string): Promise<{
    executive_summary: string
    key_points: string[]
    technical_approach: string
    business_value: string
  }> {
    
    const prompt = `
다음 제안서 내용을 분석하여 핵심 요약을 작성해주세요:

${proposalContent}

응답 형식: JSON
{
  "executive_summary": "전체 제안서 요약 (300자 내외)",
  "key_points": ["핵심 포인트1", "핵심 포인트2", "핵심 포인트3", "핵심 포인트4", "핵심 포인트5"],
  "technical_approach": "기술적 접근방식 요약 (200자 내외)", 
  "business_value": "비즈니스 가치 제안 (200자 내외)"
}
`

    try {
      const response = await this.openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3,
        max_tokens: 2000,
        response_format: { type: "json_object" }
      })

      const content = response.choices[0].message.content
      if (!content) throw new Error('OpenAI 응답이 비어있습니다')
      
      return JSON.parse(content)
      
    } catch (error) {
      console.error('제안서 요약 오류:', error)
      throw new Error(`제안서 요약 실패: ${error.message}`)
    }
  }
}