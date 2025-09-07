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

    // 데모 가상고객 생성 버튼
    document.getElementById('demo-generate-customer')?.addEventListener('click', () => {
      this.loadDemoCustomerGeneration()
    })

    // 드래그 앤 드롭 지원
    this.setupDragDrop()
  }

  setupDragDrop() {
    const dropZone = document.getElementById('rfp-drop-zone')
    if (!dropZone) return

    dropZone.addEventListener('dragover', (e) => {
      e.preventDefault()
      dropZone.style.borderColor = 'var(--pwc-blue)'
      dropZone.style.backgroundColor = 'var(--pwc-blue-light)'
    })

    dropZone.addEventListener('dragleave', () => {
      dropZone.style.borderColor = 'var(--neutral-300)'
      dropZone.style.backgroundColor = 'var(--neutral-50)'
    })

    dropZone.addEventListener('drop', (e) => {
      e.preventDefault()
      dropZone.style.borderColor = 'var(--neutral-300)'
      dropZone.style.backgroundColor = 'var(--neutral-50)'
      
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

    resultsDiv.style.display = 'block'
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

      const response = await axios.post('/api/customers/rfp-analysis', formData)

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

    resultsDiv.style.display = 'block'
    container.innerHTML = ''

    // 15개 속성 카드 생성
    Object.values(this.rfpAnalysisData).forEach((attr, index) => {
      const card = this.createAttributeCard(attr, 'rfp')
      container.appendChild(card)
    })
  }

  createAttributeCard(attribute, type) {
    const card = document.createElement('div')
    card.style.cssText = `
      background: var(--neutral-50); 
      border: 2px solid var(--neutral-200); 
      border-radius: var(--border-radius-md); 
      padding: var(--spacing-md);
      transition: all 0.3s ease;
      cursor: pointer;
    `
    
    // 호버 효과 추가
    card.addEventListener('mouseenter', () => {
      card.style.borderColor = type === 'research' ? 'var(--pwc-blue)' : 'var(--success-color)'
      card.style.boxShadow = 'var(--shadow-md)'
    })
    card.addEventListener('mouseleave', () => {
      card.style.borderColor = 'var(--neutral-200)'
      card.style.boxShadow = 'none'
    })
    
    const typeColor = type === 'research' ? 
      'background: var(--pwc-blue-light); color: var(--pwc-blue);' : 
      'background: var(--success-color-light); color: var(--success-color);'
    const typeIcon = type === 'research' ? 'fa-search' : 'fa-file-contract'
    
    const sourceInfo = type === 'research' 
      ? `${attribute.source_type} (신뢰도: ${attribute.reliability_score}/10)`
      : `${attribute.section_title || 'RFP'} (페이지: ${attribute.page_number || 'N/A'})`

    card.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: var(--spacing-sm);">
        <h4 style="font-weight: 600; color: var(--pwc-navy); margin: 0; word-break: keep-all;">${attribute.name}</h4>
        <span style="padding: var(--spacing-xs) var(--spacing-sm); font-size: 0.75rem; font-weight: 600; border-radius: 20px; ${typeColor} display: flex; align-items: center; gap: var(--spacing-xs); word-break: keep-all;">
          <i class="fas ${typeIcon}"></i>
          ${type === 'research' ? '딥리서치' : 'RFP'}
        </span>
      </div>
      <p style="font-size: 0.875rem; color: var(--text-color); margin-bottom: var(--spacing-sm); line-height: 1.4; word-break: keep-all;">${attribute.content}</p>
      <div style="font-size: 0.75rem; color: var(--text-muted);">
        <p style="margin-bottom: var(--spacing-xs); word-break: keep-all;"><i class="fas fa-info-circle" style="margin-right: var(--spacing-xs);"></i>출처: ${sourceInfo}</p>
        ${type === 'research' && attribute.source_url ? 
          `<p style="margin-bottom: var(--spacing-xs);"><i class="fas fa-link" style="margin-right: var(--spacing-xs);"></i>URL: <a href="${attribute.source_url}" target="_blank" style="color: var(--pwc-blue); text-decoration: none; word-break: break-all;" onmouseover="this.style.textDecoration='underline'" onmouseout="this.style.textDecoration='none'">${attribute.source_url.substring(0, 50)}...</a></p>` : 
          ''}
        ${type === 'rfp' && attribute.source_snippet ? 
          `<p style="margin-top: var(--spacing-xs); font-style: italic; padding: var(--spacing-xs); background: var(--neutral-100); border-radius: var(--border-radius-sm); word-break: keep-all;">"${attribute.source_snippet.substring(0, 100)}..."</p>` : 
          ''}
      </div>
    `

    return card
  }

  checkGenerationReady() {
    const generateBtn = document.getElementById('generate-customer')
    if (this.deepResearchData && this.rfpAnalysisData) {
      generateBtn?.removeAttribute('disabled')
      generateBtn.style.backgroundColor = 'var(--pwc-navy)'
      generateBtn.style.cursor = 'pointer'
      generateBtn.style.opacity = '1'
      
      // 호버 효과
      generateBtn.onmouseenter = () => {
        generateBtn.style.backgroundColor = 'var(--pwc-navy-light)'
      }
      generateBtn.onmouseleave = () => {
        generateBtn.style.backgroundColor = 'var(--pwc-navy)'
      }
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

    // 가상고객 카드 표시
    const container = document.getElementById('generated-customer')
    const personaContainer = document.getElementById('customer-persona')
    
    if (!container || !personaContainer) return
    
    // 생성된 고객 컨테이너 표시
    container.style.display = 'block'
    
    const cardHTML = `
        <div class="pwc-grid pwc-grid-2" style="margin-bottom: var(--spacing-xl);">
          <!-- 기본 정보 -->
          <div style="background: var(--neutral-50); border-radius: var(--border-radius-md); padding: var(--spacing-lg); border: 2px solid var(--pwc-orange-light);">
            <h3 style="font-weight: 600; color: var(--pwc-navy); margin-bottom: var(--spacing-lg); display: flex; align-items: center; gap: var(--spacing-sm);">
              <i class="fas fa-id-card" style="color: var(--pwc-orange);"></i>기본 프로필
            </h3>
            <div style="display: flex; flex-direction: column; gap: var(--spacing-md);">
              <div style="display: flex; align-items: center;">
                <span style="min-width: 80px; font-weight: 500; color: var(--text-muted); word-break: keep-all;">이름:</span>
                <span style="color: var(--pwc-navy); font-weight: 600;">${this.generatedCustomer.name}</span>
              </div>
              <div style="display: flex; align-items: center;">
                <span style="min-width: 80px; font-weight: 500; color: var(--text-muted); word-break: keep-all;">회사:</span>
                <span style="color: var(--pwc-navy); font-weight: 600;">${this.generatedCustomer.company_name}</span>
              </div>
              <div style="display: flex; align-items: center;">
                <span style="min-width: 80px; font-weight: 500; color: var(--text-muted); word-break: keep-all;">부서:</span>
                <span style="color: var(--pwc-navy); font-weight: 600;">${this.generatedCustomer.department}</span>
              </div>
              <div style="display: flex; align-items: center;">
                <span style="min-width: 80px; font-weight: 500; color: var(--text-muted); word-break: keep-all;">버전:</span>
                <span style="color: var(--pwc-navy); font-weight: 600;">${this.generatedCustomer.version}</span>
              </div>
            </div>
          </div>

          <!-- 페르소나 특성 -->
          <div style="background: var(--neutral-50); border-radius: var(--border-radius-md); padding: var(--spacing-lg); border: 2px solid var(--pwc-blue-light);">
            <h3 style="font-weight: 600; color: var(--pwc-navy); margin-bottom: var(--spacing-lg); display: flex; align-items: center; gap: var(--spacing-sm);">
              <i class="fas fa-brain" style="color: var(--pwc-blue);"></i>페르소나 특성
            </h3>
            <div style="display: flex; flex-direction: column; gap: var(--spacing-md);">
              <div>
                <span style="display: block; font-weight: 600; color: var(--text-muted); margin-bottom: var(--spacing-xs); word-break: keep-all;">한 줄 요약</span>
                <p style="color: var(--text-color); line-height: 1.4; word-break: keep-all;">${this.generatedCustomer.persona_summary}</p>
              </div>
              <div>
                <span style="display: block; font-weight: 600; color: var(--text-muted); margin-bottom: var(--spacing-xs); word-break: keep-all;">의사결정 방식</span>
                <p style="color: var(--text-color); line-height: 1.4; word-break: keep-all;">${this.generatedCustomer.decision_making_style}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Top 3 우선순위 -->
        <div style="margin-bottom: var(--spacing-xl);">
          <h3 style="font-weight: 600; color: var(--pwc-navy); margin-bottom: var(--spacing-lg); display: flex; align-items: center; gap: var(--spacing-sm);">
            <i class="fas fa-trophy" style="color: var(--pwc-orange);"></i>핵심 우선순위 Top 3
          </h3>
          <div class="pwc-grid pwc-grid-3" style="gap: var(--spacing-md);">
            ${this.generatedCustomer.top3_priorities.map((priority, index) => `
              <div style="background: linear-gradient(135deg, var(--pwc-orange-light), var(--pwc-blue-light)); border-radius: var(--border-radius-md); padding: var(--spacing-lg); color: var(--pwc-navy); position: relative; overflow: hidden;">
                <div style="display: flex; align-items: center; margin-bottom: var(--spacing-sm);">
                  <span style="width: 24px; height: 24px; background: var(--pwc-orange); color: var(--pwc-white); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; margin-right: var(--spacing-sm);">
                    ${index + 1}
                  </span>
                  <span style="font-weight: 600; word-break: keep-all;">우선순위 ${index + 1}</span>
                </div>
                <p style="font-size: 0.875rem; line-height: 1.4; word-break: keep-all;">${priority}</p>
                <i class="fas fa-star" style="position: absolute; top: var(--spacing-sm); right: var(--spacing-sm); color: var(--pwc-orange); opacity: 0.3; font-size: 1.2rem;"></i>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- 30속성 요약 -->
        <div style="margin-bottom: var(--spacing-xl);">
          <h3 style="font-weight: 600; color: var(--pwc-navy); margin-bottom: var(--spacing-lg); display: flex; align-items: center; gap: var(--spacing-sm);">
            <i class="fas fa-chart-pie" style="color: var(--success-color);"></i>통합 속성 프로필
          </h3>
          <div class="pwc-grid" style="grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: var(--spacing-md);">
            <div style="background: var(--neutral-100); border-radius: var(--border-radius-md); padding: var(--spacing-md); text-align: center; border: 1px solid var(--neutral-200);">
              <div style="font-weight: 600; color: var(--text-muted); margin-bottom: var(--spacing-xs); font-size: 0.875rem; word-break: keep-all;">전략 포커스</div>
              <div style="color: var(--pwc-navy); font-weight: 600; word-break: keep-all;">${this.generatedCustomer.combined_attributes.strategic_focus}</div>
            </div>
            <div style="background: var(--neutral-100); border-radius: var(--border-radius-md); padding: var(--spacing-md); text-align: center; border: 1px solid var(--neutral-200);">
              <div style="font-weight: 600; color: var(--text-muted); margin-bottom: var(--spacing-xs); font-size: 0.875rem; word-break: keep-all;">위험 성향</div>
              <div style="color: var(--pwc-navy); font-weight: 600; word-break: keep-all;">${this.generatedCustomer.combined_attributes.risk_appetite}</div>
            </div>
            <div style="background: var(--neutral-100); border-radius: var(--border-radius-md); padding: var(--spacing-md); text-align: center; border: 1px solid var(--neutral-200);">
              <div style="font-weight: 600; color: var(--text-muted); margin-bottom: var(--spacing-xs); font-size: 0.875rem; word-break: keep-all;">혁신 선호</div>
              <div style="color: var(--pwc-navy); font-weight: 600; word-break: keep-all;">${this.generatedCustomer.combined_attributes.innovation_preference}</div>
            </div>
            <div style="background: var(--neutral-100); border-radius: var(--border-radius-md); padding: var(--spacing-md); text-align: center; border: 1px solid var(--neutral-200);">
              <div style="font-weight: 600; color: var(--text-muted); margin-bottom: var(--spacing-xs); font-size: 0.875rem; word-break: keep-all;">예산 민감도</div>
              <div style="color: var(--pwc-navy); font-weight: 600; word-break: keep-all;">${this.generatedCustomer.combined_attributes.budget_sensitivity}</div>
            </div>
            <div style="background: var(--neutral-100); border-radius: var(--border-radius-md); padding: var(--spacing-md); text-align: center; border: 1px solid var(--neutral-200);">
              <div style="font-weight: 600; color: var(--text-muted); margin-bottom: var(--spacing-xs); font-size: 0.875rem; word-break: keep-all;">기술 도입</div>
              <div style="color: var(--pwc-navy); font-weight: 600; word-break: keep-all;">${this.generatedCustomer.combined_attributes.technology_adoption}</div>
            </div>
          </div>
        </div>
    `
    
    personaContainer.innerHTML = cardHTML
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
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9999;
    `
    overlay.innerHTML = `
      <div style="
        background: var(--pwc-white);
        border-radius: var(--border-radius-lg);
        padding: var(--spacing-xl);
        box-shadow: var(--shadow-xl);
        border: 3px solid var(--pwc-orange);
      ">
        <div style="display: flex; align-items: center; gap: var(--spacing-md);">
          <i class="fas fa-spinner fa-spin" style="color: var(--pwc-orange); font-size: 1.5rem;"></i>
          <span style="font-size: 1.125rem; font-weight: 600; color: var(--pwc-navy);">${message}</span>
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
    successDiv.style.cssText = `
      position: fixed;
      top: var(--spacing-lg);
      right: var(--spacing-lg);
      background: linear-gradient(135deg, var(--success-color), var(--pwc-success));
      color: var(--pwc-white);
      padding: var(--spacing-lg);
      border-radius: var(--border-radius-md);
      box-shadow: var(--shadow-lg);
      z-index: 9999;
      transition: opacity 0.3s ease;
      border: 2px solid var(--success-color-light);
      max-width: 400px;
      word-break: keep-all;
    `
    successDiv.innerHTML = `
      <div style="display: flex; align-items: center; gap: var(--spacing-sm);">
        <i class="fas fa-check-circle" style="font-size: 1.25rem;"></i>
        <span style="font-weight: 600;">${message}</span>
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

  async loadDemoCustomerGeneration() {
    try {
      this.showLoading('AI 가상고객 생성 데모 로딩 중...')
      
      // 1단계: 데모 딥리서치 데이터 자동 로드
      const deepResearchResponse = await axios.get('/api/demo/deep-research')
      if (deepResearchResponse.data.success) {
        this.deepResearchData = deepResearchResponse.data.data
        this.displayResearchResults()
        
        // 회사명 자동 입력
        const companyNameInput = document.getElementById('company-name')
        if (companyNameInput) {
          companyNameInput.value = '금고석유화학'
        }
      }

      // 1초 대기 (사용자 경험)
      await new Promise(resolve => setTimeout(resolve, 1000))

      // 2단계: 데모 RFP 분석 데이터 자동 로드
      const rfpResponse = await axios.get('/api/demo/rfp-analysis')
      if (rfpResponse.data.success) {
        this.rfpAnalysisData = rfpResponse.data.data
        this.displayRfpResults()
      }

      // 1초 대기 (사용자 경험)
      await new Promise(resolve => setTimeout(resolve, 1000))

      // 3단계: AI 가상고객 생성
      const customerResponse = await axios.post('/api/demo/generate-customer', {
        company_name: '금고석유화학',
        project_type: 'ERP-MES-ESG 통합 DX 플랫폼'
      })

      if (customerResponse.data.success) {
        this.generatedCustomer = customerResponse.data.customer || customerResponse.data.data
        this.displayGeneratedCustomer()
        this.currentStep = 3
        this.updateProgressBar()
        
        // 성공 메시지
        this.showSuccessMessage('🎉 AI 가상고객 생성 데모가 완료되었습니다! 이제 제안서 평가로 이동할 수 있습니다.')
        
        // 자동으로 다음 단계 버튼 활성화
        this.showNextStepButton()
      }

      this.hideLoading()
    } catch (error) {
      console.error('데모 가상고객 생성 오류:', error)
      this.hideLoading()
      this.showErrorMessage('데모 AI 가상고객 생성 중 오류가 발생했습니다: ' + error.message)
    }
  }

  showNextStepButton() {
    // 다음 단계 이동 버튼 표시
    const customerSection = document.getElementById('generated-customer')
    if (customerSection) {
      const nextButton = customerSection.querySelector('.pwc-text-center button')
      if (nextButton) {
        nextButton.style.display = 'inline-flex'
        nextButton.style.animation = 'pulse 2s infinite'
      }
    }
  }
}

// 앱 초기화
let customerApp
document.addEventListener('DOMContentLoaded', () => {
  customerApp = new CustomerGenerationApp()
})