// AI 가상고객 생성 프론트엔드 스크립트

class CustomerGenerationApp {
  constructor() {
    this.currentStep = 1
    this.deepResearchData = null
    this.rfpAnalysisData = null
    this.generatedCustomer = null
    
    this.init()
  }

  init() {
    this.setupEventListeners()
    this.updateProgressBar()
  }

  setupEventListeners() {
    // 딥리서치 시작 버튼
    document.getElementById('start-research')?.addEventListener('click', () => {
      this.startDeepResearch()
    })

    // 데모 딥리서치 버튼
    document.getElementById('demo-deep-research')?.addEventListener('click', () => {
      this.loadDemoDeepResearch()
    })

    // RFP 파일 업로드
    document.getElementById('rfp-file')?.addEventListener('change', (e) => {
      this.handleRfpUpload(e.target.files[0])
    })

    // 데모 RFP 분석 버튼
    document.getElementById('demo-rfp-analysis')?.addEventListener('click', () => {
      this.loadDemoRfpAnalysis()
    })

    // 가상고객 생성 버튼
    document.getElementById('generate-customer')?.addEventListener('click', () => {
      this.generateCustomer()
    })

    // 드래그 앤 드롭 지원
    this.setupDragDrop()
  }

  setupDragDrop() {
    const dropZone = document.getElementById('rfp-drop-zone')
    if (!dropZone) return

    dropZone.addEventListener('dragover', (e) => {
      e.preventDefault()
      dropZone.classList.add('border-blue-500', 'bg-blue-50')
    })

    dropZone.addEventListener('dragleave', () => {
      dropZone.classList.remove('border-blue-500', 'bg-blue-50')
    })

    dropZone.addEventListener('drop', (e) => {
      e.preventDefault()
      dropZone.classList.remove('border-blue-500', 'bg-blue-50')
      
      const files = e.dataTransfer.files
      if (files.length > 0) {
        this.handleRfpUpload(files[0])
      }
    })
  }

  updateProgressBar() {
    // 진행 단계 업데이트
    const steps = document.querySelectorAll('[class*="w-8 h-8"]')
    steps.forEach((step, index) => {
      if (index + 1 <= this.currentStep) {
        step.className = 'w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium mr-3'
      } else {
        step.className = 'w-8 h-8 bg-gray-300 text-white rounded-full flex items-center justify-center text-sm font-medium mr-3'
      }
    })
  }

  async startDeepResearch() {
    const companyName = document.getElementById('company-name')?.value
    const researchDepth = document.getElementById('research-depth')?.value

    if (!companyName) {
      alert('회사명을 입력해주세요.')
      return
    }

    try {
      this.showLoading('딥리서치 수집 중...')
      
      const response = await axios.post('/api/customers/deep-research', {
        company_name: companyName,
        research_depth: researchDepth || 'basic'
      })

      if (response.data.success) {
        this.deepResearchData = response.data.data
        this.displayResearchResults()
        this.currentStep = 2
        this.updateProgressBar()
        this.checkGenerationReady()
      } else {
        throw new Error(response.data.error || '딥리서치 실패')
      }
    } catch (error) {
      console.error('Deep research failed:', error)
      alert('딥리서치 수집에 실패했습니다: ' + error.message)
    } finally {
      this.hideLoading()
    }
  }

  displayResearchResults() {
    const container = document.getElementById('research-attributes')
    const resultsDiv = document.getElementById('research-results')
    
    if (!container || !this.deepResearchData) return

    resultsDiv?.classList.remove('hidden')
    container.innerHTML = ''

    // 15개 속성 카드 생성
    Object.values(this.deepResearchData).forEach((attr, index) => {
      const card = this.createAttributeCard(attr, 'research')
      container.appendChild(card)
    })
  }

  async handleRfpUpload(file) {
    if (!file) return

    const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain']
    if (!allowedTypes.includes(file.type)) {
      alert('지원되는 파일 형식: PDF, DOCX, TXT')
      return
    }

    try {
      this.showLoading('RFP 문서 분석 중...')

      // 파일 업로드 (실제로는 파일 업로드 API 필요)
      const formData = new FormData()
      formData.append('rfp_file', file)
      
      // 임시로 파일명으로 분석 요청
      const fileType = file.type.includes('pdf') ? 'pdf' : 
                     file.type.includes('wordprocessing') ? 'docx' : 'txt'

      const response = await axios.post('/api/customers/rfp-analysis', {
        file_path: file.name,
        file_type: fileType,
        parsing_mode: 'auto'
      })

      if (response.data.success) {
        this.rfpAnalysisData = response.data.data
        this.displayRfpResults()
        this.checkGenerationReady()
      } else {
        throw new Error(response.data.error || 'RFP 분석 실패')
      }
    } catch (error) {
      console.error('RFP analysis failed:', error)
      alert('RFP 문서 분석에 실패했습니다: ' + error.message)
    } finally {
      this.hideLoading()
    }
  }

  displayRfpResults() {
    const container = document.getElementById('rfp-attributes')
    const resultsDiv = document.getElementById('rfp-results')
    
    if (!container || !this.rfpAnalysisData) return

    resultsDiv?.classList.remove('hidden')
    container.innerHTML = ''

    // 15개 속성 카드 생성
    Object.values(this.rfpAnalysisData).forEach((attr, index) => {
      const card = this.createAttributeCard(attr, 'rfp')
      container.appendChild(card)
    })
  }

  createAttributeCard(attribute, type) {
    const card = document.createElement('div')
    card.className = 'bg-gray-50 border border-gray-200 rounded-lg p-4'
    
    const typeColor = type === 'research' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
    const sourceInfo = type === 'research' 
      ? `${attribute.source_type} (신뢰도: ${attribute.reliability_score}/10)`
      : `${attribute.section_title || 'RFP'} (페이지: ${attribute.page_number || 'N/A'})`

    card.innerHTML = `
      <div class="flex items-center justify-between mb-2">
        <h4 class="font-medium text-gray-900">${attribute.name}</h4>
        <span class="px-2 py-1 text-xs font-medium rounded-full ${typeColor}">
          ${type === 'research' ? '딥리서치' : 'RFP'}
        </span>
      </div>
      <p class="text-sm text-gray-700 mb-2">${attribute.content}</p>
      <div class="text-xs text-gray-500">
        <p>출처: ${sourceInfo}</p>
        ${type === 'research' && attribute.source_url ? 
          `<p>URL: <a href="${attribute.source_url}" target="_blank" class="text-blue-600 hover:underline">${attribute.source_url.substring(0, 50)}...</a></p>` : 
          ''}
        ${type === 'rfp' && attribute.source_snippet ? 
          `<p class="mt-1 italic">"${attribute.source_snippet.substring(0, 100)}..."</p>` : 
          ''}
      </div>
    `

    return card
  }

  checkGenerationReady() {
    const generateBtn = document.getElementById('generate-customer')
    if (this.deepResearchData && this.rfpAnalysisData) {
      generateBtn?.removeAttribute('disabled')
      generateBtn?.classList.remove('bg-gray-400')
      generateBtn?.classList.add('bg-purple-600', 'hover:bg-purple-700')
    }
  }

  async generateCustomer() {
    const companyName = document.getElementById('company-name')?.value
    
    if (!this.deepResearchData || !this.rfpAnalysisData) {
      alert('딥리서치와 RFP 분석을 먼저 완료해주세요.')
      return
    }

    try {
      this.showLoading('AI 가상고객 생성 중...')
      
      const response = await axios.post('/api/customers/generate', {
        deep_research_data: this.deepResearchData,
        rfp_analysis_data: this.rfpAnalysisData,
        company_name: companyName,
        department: '경영진'
      })

      if (response.data.success) {
        this.generatedCustomer = response.data.data
        this.displayCustomerCard()
        this.currentStep = 3
        this.updateProgressBar()
      } else {
        throw new Error(response.data.error || '가상고객 생성 실패')
      }
    } catch (error) {
      console.error('Customer generation failed:', error)
      alert('AI 가상고객 생성에 실패했습니다: ' + error.message)
    } finally {
      this.hideLoading()
    }
  }

  displayCustomerCard() {
    if (!this.generatedCustomer) return

    // 가상고객 카드 표시 영역 생성
    const container = document.getElementById('customer-generation-app')
    
    const cardHTML = `
      <div class="bg-white rounded-lg shadow-lg p-8 mt-8">
        <h2 class="text-2xl font-bold text-gray-900 mb-6">
          <i class="fas fa-robot text-purple-600 mr-2"></i>
          생성된 AI 가상고객
        </h2>
        
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <!-- 기본 정보 -->
          <div>
            <h3 class="text-lg font-semibold text-gray-900 mb-4">기본 프로필</h3>
            <div class="space-y-3">
              <div class="flex items-center">
                <span class="w-24 text-sm font-medium text-gray-600">이름:</span>
                <span class="text-gray-900">${this.generatedCustomer.name}</span>
              </div>
              <div class="flex items-center">
                <span class="w-24 text-sm font-medium text-gray-600">회사:</span>
                <span class="text-gray-900">${this.generatedCustomer.company_name}</span>
              </div>
              <div class="flex items-center">
                <span class="w-24 text-sm font-medium text-gray-600">부서:</span>
                <span class="text-gray-900">${this.generatedCustomer.department}</span>
              </div>
              <div class="flex items-center">
                <span class="w-24 text-sm font-medium text-gray-600">버전:</span>
                <span class="text-gray-900">${this.generatedCustomer.version}</span>
              </div>
            </div>
          </div>

          <!-- 페르소나 특성 -->
          <div>
            <h3 class="text-lg font-semibold text-gray-900 mb-4">페르소나 특성</h3>
            <div class="space-y-3">
              <div>
                <span class="block text-sm font-medium text-gray-600 mb-1">한 줄 요약</span>
                <p class="text-gray-900 text-sm">${this.generatedCustomer.persona_summary}</p>
              </div>
              <div>
                <span class="block text-sm font-medium text-gray-600 mb-1">의사결정 방식</span>
                <p class="text-gray-900 text-sm">${this.generatedCustomer.decision_making_style}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Top 3 우선순위 -->
        <div class="mt-6">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">핵심 우선순위 Top 3</h3>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            ${this.generatedCustomer.top3_priorities.map((priority, index) => `
              <div class="bg-gradient-to-r from-purple-100 to-blue-100 rounded-lg p-4">
                <div class="flex items-center mb-2">
                  <span class="w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center text-sm font-medium mr-2">
                    ${index + 1}
                  </span>
                  <span class="font-medium text-gray-900">우선순위 ${index + 1}</span>
                </div>
                <p class="text-sm text-gray-700">${priority}</p>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- 30속성 요약 -->
        <div class="mt-6">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">통합 속성 프로필</h3>
          <div class="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div class="bg-gray-50 rounded p-3 text-center">
              <div class="text-sm font-medium text-gray-600">전략 포커스</div>
              <div class="text-sm text-gray-900 mt-1">${this.generatedCustomer.combined_attributes.strategic_focus}</div>
            </div>
            <div class="bg-gray-50 rounded p-3 text-center">
              <div class="text-sm font-medium text-gray-600">위험 성향</div>
              <div class="text-sm text-gray-900 mt-1">${this.generatedCustomer.combined_attributes.risk_appetite}</div>
            </div>
            <div class="bg-gray-50 rounded p-3 text-center">
              <div class="text-sm font-medium text-gray-600">혁신 선호</div>
              <div class="text-sm text-gray-900 mt-1">${this.generatedCustomer.combined_attributes.innovation_preference}</div>
            </div>
            <div class="bg-gray-50 rounded p-3 text-center">
              <div class="text-sm font-medium text-gray-600">예산 민감도</div>
              <div class="text-sm text-gray-900 mt-1">${this.generatedCustomer.combined_attributes.budget_sensitivity}</div>
            </div>
            <div class="bg-gray-50 rounded p-3 text-center">
              <div class="text-sm font-medium text-gray-600">기술 도입</div>
              <div class="text-sm text-gray-900 mt-1">${this.generatedCustomer.combined_attributes.technology_adoption}</div>
            </div>
          </div>
        </div>

        <!-- 액션 버튼 -->
        <div class="mt-8 flex flex-col sm:flex-row gap-4">
          <button onclick="customerApp.saveCustomer()" class="flex-1 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition-colors">
            <i class="fas fa-save mr-2"></i>가상고객 저장
          </button>
          <button onclick="customerApp.goToProposalEvaluation()" class="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors">
            <i class="fas fa-arrow-right mr-2"></i>제안서 평가 시작
          </button>
          <button onclick="customerApp.exportCustomer()" class="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-medium transition-colors">
            <i class="fas fa-download mr-2"></i>JSON 내보내기
          </button>
        </div>
      </div>
    `
    
    container.insertAdjacentHTML('beforeend', cardHTML)
  }

  async saveCustomer() {
    if (!this.generatedCustomer) return

    try {
      this.showLoading('가상고객 저장 중...')
      
      // 이미 생성 시 저장되므로 성공 메시지만 표시
      alert('AI 가상고객이 성공적으로 저장되었습니다!')
      
    } catch (error) {
      console.error('Customer save failed:', error)
      alert('가상고객 저장에 실패했습니다: ' + error.message)
    } finally {
      this.hideLoading()
    }
  }

  exportCustomer() {
    if (!this.generatedCustomer) return

    const dataStr = JSON.stringify(this.generatedCustomer, null, 2)
    const dataBlob = new Blob([dataStr], {type: 'application/json'})
    
    const link = document.createElement('a')
    link.href = URL.createObjectURL(dataBlob)
    link.download = `ai_customer_${this.generatedCustomer.company_name}_${Date.now()}.json`
    link.click()
  }

  showLoading(message = '처리 중...') {
    const overlay = document.createElement('div')
    overlay.id = 'loading-overlay'
    overlay.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'
    overlay.innerHTML = `
      <div class="bg-white rounded-lg p-6 shadow-xl">
        <div class="flex items-center">
          <i class="fas fa-spinner fa-spin text-blue-600 text-2xl mr-3"></i>
          <span class="text-lg font-medium">${message}</span>
        </div>
      </div>
    `
    document.body.appendChild(overlay)
  }

  hideLoading() {
    const overlay = document.getElementById('loading-overlay')
    if (overlay) {
      overlay.remove()
    }
  }

  // === 데모 기능 추가 ===

  async loadDemoDeepResearch() {
    try {
      this.showLoading('데모 딥리서치 데이터 로딩 중...')
      
      // 회사명을 금고석유화학으로 설정
      const companyNameInput = document.getElementById('company-name')
      if (companyNameInput) {
        companyNameInput.value = '금고석유화학'
      }

      const response = await axios.get('/api/demo/deep-research')

      if (response.data.success) {
        this.deepResearchData = response.data.data
        this.displayResearchResults()
        this.currentStep = 2
        this.updateProgressBar()
        this.checkGenerationReady()
        
        // 성공 메시지 표시
        this.showSuccessMessage('금고석유화학 딥리서치 15속성 데이터가 성공적으로 로드되었습니다!')
      } else {
        throw new Error(response.data.error || '데모 데이터 로드 실패')
      }
    } catch (error) {
      console.error('데모 딥리서치 로드 오류:', error)
      alert('데모 데이터 로드 중 오류가 발생했습니다: ' + error.message)
    } finally {
      this.hideLoading()
    }
  }

  async loadDemoRfpAnalysis() {
    try {
      this.showLoading('데모 RFP 분석 데이터 로딩 중...')

      const response = await axios.get('/api/demo/rfp-analysis')

      if (response.data.success) {
        this.rfpAnalysisData = response.data.data
        this.displayRfpResults()
        this.currentStep = Math.max(this.currentStep, 3)
        this.updateProgressBar()
        this.checkGenerationReady()
        
        // 성공 메시지 표시
        this.showSuccessMessage('DX 프로젝트 RFP 15속성 분석 데이터가 성공적으로 로드되었습니다!')
      } else {
        throw new Error(response.data.error || '데모 RFP 데이터 로드 실패')
      }
    } catch (error) {
      console.error('데모 RFP 분석 로드 오류:', error)
      alert('데모 RFP 데이터 로드 중 오류가 발생했습니다: ' + error.message)
    } finally {
      this.hideLoading()
    }
  }

  showSuccessMessage(message) {
    const successDiv = document.createElement('div')
    successDiv.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 transition-opacity'
    successDiv.innerHTML = `
      <div class="flex items-center">
        <i class="fas fa-check-circle mr-2"></i>
        <span>${message}</span>
      </div>
    `
    
    document.body.appendChild(successDiv)
    
    // 3초 후 자동 제거
    setTimeout(() => {
      successDiv.style.opacity = '0'
      setTimeout(() => {
        if (successDiv.parentNode) {
          successDiv.parentNode.removeChild(successDiv)
        }
      }, 300)
    }, 3000)
  }

  goToProposalEvaluation() {
    if (!this.generatedCustomer || !this.generatedCustomer.id) {
      alert('먼저 AI 가상고객을 생성해주세요.')
      return
    }
    
    // 고객 ID를 URL 파라미터로 전달
    window.location.href = `/proposal-evaluation?customer_id=${this.generatedCustomer.id}`
  }
}

// 앱 초기화
let customerApp
document.addEventListener('DOMContentLoaded', () => {
  customerApp = new CustomerGenerationApp()
})