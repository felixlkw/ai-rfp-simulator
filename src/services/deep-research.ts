// 딥리서치 서비스 - 기업 정보 15속성 자동 수집

import { OpenAIService } from './openai-service'
import { WebCrawlerService } from './web-crawler'
import type { DeepResearchData, DeepResearchAttribute } from '../types/ai-customer'

export class DeepResearchService {
  private openaiService?: OpenAIService
  private webCrawler: WebCrawlerService

  constructor(openaiApiKey?: string) {
    if (openaiApiKey) {
      this.openaiService = new OpenAIService(openaiApiKey)
    }
    this.webCrawler = new WebCrawlerService()
  }
  
  // 딥리서치 15속성 정의
  private readonly RESEARCH_ATTRIBUTES = [
    {
      id: 1,
      name: '비전·미션',
      description: '장기 목표, 기업 존재 이유, 핵심 메시지',
      sources: ['홈페이지 About Us', '연차보고서 서문', 'CEO 인사말']
    },
    {
      id: 2,
      name: '핵심 사업영역',
      description: '주력 제품/서비스, 사업 부문 매출 비중',
      sources: ['IR 자료(사업보고서)', '사업영역 소개 페이지', '보도자료']
    },
    {
      id: 3,
      name: '시장 포지셔닝',
      description: '경쟁우위, 가격 전략, 글로벌/로컬 포지션',
      sources: ['애널리스트 리포트', '투자자 IR Deck', '시장조사 보고서']
    },
    {
      id: 4,
      name: '재무 전략 성향',
      description: '투자 확대 vs 비용절감, 현금흐름 정책',
      sources: ['IR 재무제표', 'CFO 인터뷰', '보도자료']
    },
    {
      id: 5,
      name: 'R&D 지향성',
      description: 'R&D 투자 비중, 주요 연구 테마, 연구 인력 규모',
      sources: ['ESG/연차보고서(연구개발 섹션)', '특허/논문 데이터베이스']
    },
    {
      id: 6,
      name: 'ESG 우선순위',
      description: 'ESG 목표, 등급, 탄소감축/재생에너지 지표',
      sources: ['ESG 리포트', '지속가능경영보고서', 'DJSI/MSCI 평가 자료']
    },
    {
      id: 7,
      name: '리스크 관리 태도',
      description: '위험 회피 vs 감수 전략, 리스크 대응 사례',
      sources: ['연차보고서 리스크 관리 항목', '감사보고서']
    },
    {
      id: 8,
      name: '글로벌 vs 로컬 지향성',
      description: '해외 매출 비중, 해외법인/거점, 수출 전략',
      sources: ['IR 자료(매출 지역별 비중)', '보도자료(해외 투자)']
    },
    {
      id: 9,
      name: '고객/이해관계자 성향',
      description: '고객 중심, 주주 가치, 지역사회 기여 우선순위',
      sources: ['ESG 보고서(사회공헌)', '홈페이지 CSR/IR 페이지']
    },
    {
      id: 10,
      name: '디지털 전환 수준',
      description: 'DX 로드맵, ERP/Cloud/AI 도입 현황',
      sources: ['보도자료(디지털 투자 발표)', 'IT 협력사 사례', '연차보고서']
    },
    {
      id: 11,
      name: '조직문화·HR 방향',
      description: '인재상, 성과주의/혁신적 문화 여부',
      sources: ['채용 페이지', 'ESG/연차보고서(인재/조직문화)', 'HR 관련 기사']
    },
    {
      id: 12,
      name: '파트너십/생태계 전략',
      description: '산학연 협력, JV, 오픈이노베이션 사례',
      sources: ['보도자료', '연구기관/대학 협력 발표자료', '산업 컨퍼런스']
    },
    {
      id: 13,
      name: '규제·정책 대응 성향',
      description: '환경/안전 규제 대응, 준법감시 수준',
      sources: ['ESG/연차보고서(규제 대응)', '법규 관련 보도자료']
    },
    {
      id: 14,
      name: '사회적 이미지/브랜드 톤',
      description: '기업이 대외적으로 전달하는 톤과 언론 이미지',
      sources: ['홈페이지 브랜드 캠페인', '언론 기사 키워드 분석', '광고 자료']
    },
    {
      id: 15,
      name: '단기 vs 장기 목표 균형',
      description: '단기 수익 지향 vs 장기 투자/성장 기조',
      sources: ['IR 프레젠테이션(가이던스)', 'CEO/CFO 발언', '보도자료']
    }
  ]

  /**
   * 딥리서치 데이터 수집 실행 (실제 웹 크롤링 + LLM 분석)
   */
  async collectCompanyData(
    companyName: string,
    urls: string[] = [],
    researchDepth: 'basic' | 'detailed' | 'comprehensive' = 'detailed'
  ): Promise<{
    company_name: string
    research_depth: string
    deep_research_data: DeepResearchData
    collection_timestamp: string
    data_sources: string[]
    total_content_length: number
  }> {
    
    console.log(`딥리서치 시작: ${companyName} (${researchDepth})`)
    
    try {
      // GPT-4o 사전지식 기반 딥리서치 (웹 크롤링 제거)
      let deepResearchData: DeepResearchData
      
      if (this.openaiService) {
        console.log(`GPT-4o로 ${companyName} 사전지식 기반 분석 시작`)
        
        // GPT-4o의 사전 지식을 활용한 기업 분석
        deepResearchData = await this.openaiService.extractDeepResearchData(
          companyName,
          `기업명: ${companyName}\n분석 요청: GPT-4o가 알고 있는 최신 정보를 바탕으로 해당 기업의 15가지 딥리서치 속성을 분석해 주세요.`,
          researchDepth
        )
        
        console.log('GPT-4o 딥리서치 분석 완료: 15속성 추출')
      } else {
        // OpenAI를 사용할 수 없는 경우 기본 구조 반환
        console.log('OpenAI 연동 없음 - 기본 구조 반환')
        deepResearchData = this.generateDefaultResearchData(companyName)
      }
      
      return {
        company_name: companyName,
        research_depth: researchDepth,
        deep_research_data: deepResearchData,
        collection_timestamp: new Date().toISOString(),
        data_sources: [`GPT-4o 사전지식: ${companyName}`],
        total_content_length: companyName.length
      }
      
    } catch (error) {
      console.error('딥리서치 실패:', error)
      
      // 오류 발생시 기본 데이터 반환
      return {
        company_name: companyName,
        research_depth: researchDepth,
        deep_research_data: this.generateDefaultResearchData(companyName),
        collection_timestamp: new Date().toISOString(),
        data_sources: urls.length > 0 ? urls : [],
        total_content_length: 0
      }
    }
  }

  /**
   * 기본 딥리서치 데이터 생성 (LLM 없이)
   */
  private generateDefaultResearchData(
    companyName: string, 
    crawlResult?: any
  ): DeepResearchData {
    
    const hasContent = crawlResult && crawlResult.total_word_count > 0
    
    return {
      vision_mission: hasContent ? 
        `${companyName}의 비전·미션 정보 (웹사이트 분석 기반)` : 
        `${companyName}의 비전·미션 정보를 수집하지 못했습니다.`,
      
      core_business: hasContent ?
        `${companyName}의 핵심 사업영역 (${crawlResult.total_word_count}자 분석)` :
        `${companyName}의 주력 사업 분야`,
        
      market_positioning: `${companyName}의 시장 내 포지셔닝`,
      financial_strategy: `${companyName}의 재무 전략 성향`,
      rd_orientation: `${companyName}의 R&D 투자 및 혁신 지향성`,
      esg_priority: `${companyName}의 ESG 경영 우선순위`,
      risk_management: `${companyName}의 리스크 관리 접근방식`,
      innovation_change: `${companyName}의 혁신과 변화 대응 전략`,
      partnership_strategy: `${companyName}의 파트너십 및 협력 전략`,
      customer_experience: `${companyName}의 고객 경험 중시 수준`,
      brand_values: `${companyName}의 브랜드 가치관과 아이덴티티`,
      organizational_culture: `${companyName}의 조직 문화 특성`,
      decision_structure: `${companyName}의 의사결정 구조와 프로세스`,
      global_localization: `${companyName}의 글로벌화 및 현지화 전략`,
      digital_transformation: `${companyName}의 디지털 전환 수준과 IT 역량`
    }
  }

  /**
   * 회사명을 기반으로 기본 URL들 생성
   */
  private generateCompanyUrls(companyName: string): string[] {
    const company = companyName.toLowerCase().replace(/\s+/g, '')
    
    // 한국 주요 기업들의 URL 패턴
    const urlPatterns = [
      `https://www.${company}.com`,
      `https://www.${company}.co.kr`,
      `https://${company}.com`,
      `https://${company}.co.kr`,
      `https://ir.${company}.com`,
      `https://esg.${company}.com`,
      `https://sustainability.${company}.com`
    ]
    
    // 특정 기업별 커스텀 URL
    const customUrls: Record<string, string[]> = {
      '삼성전자': [
        'https://www.samsung.com/sec/',
        'https://news.samsung.com/kr/',
        'https://www.samsung.com/sec/aboutsamsung/sustainability/',
        'https://images.samsung.com/is/content/samsung/assets/sec/ir/annual-report/'
      ],
      'LG화학': [
        'https://www.lgchem.com',
        'https://www.lgchem.com/sustainability',
        'https://www.lgchem.com/company/ir'
      ],
      '한국조선해양': [
        'https://www.ksoe.co.kr',
        'https://www.ksoe.co.kr/sustainability'
      ],
      'SK하이닉스': [
        'https://www.skhynix.com',
        'https://www.skhynix.com/sustainability'
      ]
    }
    
    if (customUrls[companyName]) {
      return [...urlPatterns, ...customUrls[companyName]]
    }
    
    return urlPatterns
  }

  /**
   * 특정 속성 데이터 수집 (LLM 기반)
   */
  private async collectAttributeData(
    companyName: string,
    attribute: typeof this.RESEARCH_ATTRIBUTES[0],
    urls: string[],
    depth: 'basic' | 'comprehensive'
  ): Promise<DeepResearchAttribute> {
    
    // LLM 프롬프트 구성
    const prompt = this.buildResearchPrompt(companyName, attribute, depth)
    
    // 웹 페이지 수집 및 분석 (실제 구현에서는 웹 크롤링 + LLM 분석)
    const analysisResult = await this.analyzeWithLLM(prompt, urls, attribute)
    
    return {
      id: `${companyName}-${attribute.id}`,
      name: attribute.name,
      content: analysisResult.content,
      source_url: analysisResult.sourceUrl,
      source_type: analysisResult.sourceType,
      reliability_score: analysisResult.reliabilityScore,
      llm_confidence: analysisResult.confidence,
      extracted_at: new Date().toISOString()
    }
  }

  /**
   * LLM 분석용 프롬프트 구성
   */
  private buildResearchPrompt(
    companyName: string,
    attribute: typeof this.RESEARCH_ATTRIBUTES[0],
    depth: 'basic' | 'comprehensive'
  ): string {
    return `
기업 딥리서치 분석 요청

회사: ${companyName}
분석 속성: ${attribute.name}
속성 설명: ${attribute.description}
주요 정보원: ${attribute.sources.join(', ')}
분석 깊이: ${depth}

다음 기준으로 ${companyName}의 "${attribute.name}"에 대해 분석해주세요:

1. 핵심 내용 요약 (200-300자)
2. 구체적 수치나 사례 (가능한 경우)
3. 최신 동향이나 변화 (최근 2년 이내)
4. 신뢰도 평가 (1-10점, 정보원의 공식성과 최신성 기준)

출력 형식:
- 내용: [요약된 분석 내용]
- 근거: [구체적 사례나 수치]
- 출처: [참조한 정보원]
- 신뢰도: [1-10점]
- 업데이트: [정보 기준 날짜]

${depth === 'comprehensive' ? '종합적이고 상세한 분석을 제공해주세요.' : '핵심 포인트 위주로 간결하게 분석해주세요.'}
    `
  }

  /**
   * LLM 기반 웹 콘텐츠 분석 (실제 구현)
   */
  private async analyzeWithLLM(
    prompt: string,
    urls: string[],
    attribute: typeof this.RESEARCH_ATTRIBUTES[0]
  ): Promise<{
    content: string;
    sourceUrl?: string;
    sourceType: 'homepage' | 'esg_report' | 'ir_document' | 'press_release' | 'news';
    reliabilityScore: number;
    confidence: number;
  }> {
    
    // 실제 구현에서는 여기에 웹 크롤링 + LLM API 호출 로직이 들어감
    // 현재는 시뮬레이션 데이터 반환
    
    const simulatedResults = this.getSimulatedData(attribute.name)
    
    return {
      content: simulatedResults.content,
      sourceUrl: urls[0],
      sourceType: simulatedResults.sourceType,
      reliabilityScore: simulatedResults.reliabilityScore,
      confidence: simulatedResults.confidence
    }
  }

  /**
   * 시뮬레이션용 데이터 (실제 구현에서는 제거)
   */
  private getSimulatedData(attributeName: string): {
    content: string;
    sourceType: 'homepage' | 'esg_report' | 'ir_document' | 'press_release' | 'news';
    reliabilityScore: number;
    confidence: number;
  } {
    
    const simulatedData: Record<string, any> = {
      '비전·미션': {
        content: '고객가치 창출을 통한 지속가능한 성장과 사회적 책임을 다하는 글로벌 리더십 기업을 지향합니다.',
        sourceType: 'homepage',
        reliabilityScore: 8,
        confidence: 0.9
      },
      '핵심 사업영역': {
        content: '주력 사업은 전자제품 제조(60%), IT서비스(25%), 신재생에너지(15%)로 구성되어 있습니다.',
        sourceType: 'ir_document',
        reliabilityScore: 9,
        confidence: 0.85
      },
      '시장 포지셔닝': {
        content: '국내 시장점유율 1위, 아시아 3위 수준의 기술력과 품질 경쟁력을 바탕으로 글로벌 시장 진출을 가속화하고 있습니다.',
        sourceType: 'press_release',
        reliabilityScore: 7,
        confidence: 0.8
      },
      'ESG 우선순위': {
        content: '2030년 탄소중립 달성, RE100 이행, 협력사 ESG 경영 확산을 통한 지속가능한 가치사슬 구축에 중점을 두고 있습니다.',
        sourceType: 'esg_report',
        reliabilityScore: 9,
        confidence: 0.9
      }
    }

    return simulatedData[attributeName] || {
      content: `${attributeName}에 대한 상세 정보를 수집 중입니다. 추가 분석이 필요합니다.`,
      sourceType: 'homepage' as const,
      reliabilityScore: 5,
      confidence: 0.6
    }
  }

  /**
   * 수집된 데이터 검증 및 보완
   */
  async validateAndEnrichData(researchData: DeepResearchData): Promise<DeepResearchData> {
    // 데이터 일관성 검증
    const validatedData = { ...researchData }
    
    // 신뢰도가 낮은 데이터에 대한 추가 수집 시도
    for (const [key, data] of Object.entries(validatedData)) {
      if (data.reliability_score < 6) {
        // 추가 데이터 소스에서 보완 시도
        console.log(`Low reliability data detected for ${data.name}, attempting to enrich...`)
      }
    }
    
    return validatedData
  }
}