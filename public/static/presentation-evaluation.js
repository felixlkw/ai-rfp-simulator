// 발표 평가 프론트엔드 스크립트

class PresentationEvaluationApp {
  constructor() {
    this.selectedCustomer = null
    this.mediaStream = null
    this.mediaRecorder = null
    this.recordedChunks = []
    this.isRecording = false
    this.recordingStartTime = null
    this.timerInterval = null
    this.audioContext = null
    this.audioAnalyser = null
    this.audioDataArray = null
    this.animationId = null
    
    // STT 관련
    this.recognition = null
    this.sttText = ''
    this.speechMetrics = {
      wordCount: 0,
      pauseCount: 0,
      fillerCount: 0,
      startTime: null
    }
    
    this.init()
  }

  init() {
    this.setupEventListeners()
    this.loadCustomers()
    this.setupSpeechRecognition()
  }

  setupEventListeners() {
    // 고객 선택
    document.getElementById('customer-select')?.addEventListener('change', (e) => {
      this.selectCustomer(e.target.value)
    })

    // 미디어 요청
    document.getElementById('request-media')?.addEventListener('click', () => {
      this.requestMediaAccess()
    })

    // 녹화 컨트롤
    document.getElementById('start-recording')?.addEventListener('click', () => {
      this.startRecording()
    })

    document.getElementById('stop-recording')?.addEventListener('click', () => {
      this.stopRecording()
    })

    // 데모 평가
    document.getElementById('demo-presentation-eval')?.addEventListener('click', () => {
      this.runDemoEvaluation()
    })
  }

  async loadCustomers() {
    try {
      if (typeof axios === 'undefined') {
        throw new Error('Axios가 로드되지 않았습니다.')
      }
      
      const response = await axios.get('/api/customers')
      
      if (response.data.success) {
        const select = document.getElementById('customer-select')
        const customers = response.data.data

        customers.forEach(customer => {
          const option = document.createElement('option')
          option.value = customer.id
          option.textContent = `${customer.name} (${customer.company_name})`
          select.appendChild(option)
        })

        // URL 파라미터에서 고객 ID 확인
        const urlParams = new URLSearchParams(window.location.search)
        const customerId = urlParams.get('customer_id')
        if (customerId) {
          select.value = customerId
          this.selectCustomer(customerId)
        }
      }
    } catch (error) {
      console.error('고객 목록 로드 오류:', error)
      alert('고객 목록을 불러오는 중 오류가 발생했습니다: ' + error.message)
    }
  }

  selectCustomer(customerId) {
    if (!customerId) {
      this.selectedCustomer = null
      return
    }

    const select = document.getElementById('customer-select')
    const selectedOption = select.options[select.selectedIndex]
    
    this.selectedCustomer = {
      id: customerId,
      name: selectedOption.textContent
    }
  }

  async requestMediaAccess() {
    try {
      this.showLoading('카메라와 마이크에 접근 중...')

      // 미디어 스트림 요청
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      })

      this.mediaStream = stream
      
      // 비디오 프리뷰 설정
      const videoPreview = document.getElementById('preview-video')
      videoPreview.srcObject = stream

      // 오디오 분석 설정
      this.setupAudioAnalysis(stream)

      // UI 업데이트
      document.getElementById('media-setup').classList.add('hidden')
      document.getElementById('video-preview').classList.remove('hidden')

      this.hideLoading()
      this.showSuccessMessage('카메라와 마이크가 성공적으로 연결되었습니다!')

    } catch (error) {
      console.error('미디어 접근 오류:', error)
      this.hideLoading()
      
      let errorMessage = '카메라와 마이크 접근에 실패했습니다.'
      if (error.name === 'NotAllowedError') {
        errorMessage = '카메라와 마이크 권한을 허용해주세요.'
      } else if (error.name === 'NotFoundError') {
        errorMessage = '카메라 또는 마이크를 찾을 수 없습니다.'
      }
      
      alert(errorMessage)
    }
  }

  setupAudioAnalysis(stream) {
    try {
      // Web Audio API 설정
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)()
      const source = this.audioContext.createMediaStreamSource(stream)
      this.audioAnalyser = this.audioContext.createAnalyser()
      
      this.audioAnalyser.fftSize = 256
      const bufferLength = this.audioAnalyser.frequencyBinCount
      this.audioDataArray = new Uint8Array(bufferLength)
      
      source.connect(this.audioAnalyser)
      
      // 오디오 레벨 시각화 시작
      this.updateAudioLevel()
      
    } catch (error) {
      console.error('오디오 분석 설정 오류:', error)
    }
  }

  updateAudioLevel() {
    if (!this.audioAnalyser) return
    
    this.audioAnalyser.getByteFrequencyData(this.audioDataArray)
    
    // 평균 오디오 레벨 계산
    let sum = 0
    for (let i = 0; i < this.audioDataArray.length; i++) {
      sum += this.audioDataArray[i]
    }
    const average = sum / this.audioDataArray.length
    
    // 레벨 바 업데이트 (0-100%)
    const level = Math.min(100, (average / 128) * 100)
    const audioLevelBar = document.getElementById('audio-level')
    if (audioLevelBar) {
      audioLevelBar.style.width = level + '%'
      
      // 색상 변경 (낮음: 빨강, 중간: 노랑, 높음: 초록)
      if (level < 20) {
        audioLevelBar.className = 'bg-red-500 h-3 rounded-full transition-all duration-100'
      } else if (level < 50) {
        audioLevelBar.className = 'bg-yellow-500 h-3 rounded-full transition-all duration-100'
      } else {
        audioLevelBar.className = 'bg-green-500 h-3 rounded-full transition-all duration-100'
      }
    }
    
    // 애니메이션 계속 실행
    this.animationId = requestAnimationFrame(() => this.updateAudioLevel())
  }

  setupSpeechRecognition() {
    // Web Speech API 설정
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      this.recognition = new SpeechRecognition()
      
      this.recognition.continuous = true
      this.recognition.interimResults = true
      this.recognition.lang = 'ko-KR'
      
      this.recognition.onresult = (event) => {
        let finalTranscript = ''
        let interimTranscript = ''
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript
          
          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' '
            this.analyzeSpecch(transcript)
          } else {
            interimTranscript += transcript
          }
        }
        
        this.sttText += finalTranscript
        this.updateSTTDisplay(this.sttText + interimTranscript)
      }
      
      this.recognition.onerror = (event) => {
        console.error('STT 오류:', event.error)
      }
    } else {
      console.warn('Web Speech API가 지원되지 않습니다.')
    }
  }

  analyzeSpecch(transcript) {
    // 단어 수 계산
    const words = transcript.trim().split(/\s+/).filter(word => word.length > 0)
    this.speechMetrics.wordCount += words.length
    
    // 군더더기어 탐지 (한국어)
    const fillerWords = ['음', '어', '그', '뭐', '저기', '이제', '그래서', '아', '네']
    words.forEach(word => {
      if (fillerWords.includes(word)) {
        this.speechMetrics.fillerCount++
      }
    })
    
    // 휴지 감지 (간단한 방법: 문장 끝 기호 기준)
    if (transcript.match(/[.!?]/)) {
      this.speechMetrics.pauseCount++
    }
    
    this.updateSpeechMetrics()
  }

  updateSTTDisplay(text) {
    const sttTextElement = document.getElementById('stt-text')
    if (sttTextElement) {
      sttTextElement.textContent = text || '음성을 인식하고 있습니다...'
    }
  }

  updateSpeechMetrics() {
    if (!this.speechMetrics.startTime) return
    
    const elapsedMinutes = (Date.now() - this.speechMetrics.startTime) / (1000 * 60)
    const wpm = Math.round(this.speechMetrics.wordCount / elapsedMinutes) || 0
    const pausesPerMinute = Math.round(this.speechMetrics.pauseCount / elapsedMinutes) || 0
    
    document.getElementById('speech-speed').textContent = wpm + ' WPM'
    document.getElementById('pause-frequency').textContent = pausesPerMinute + ' 회/분'
    document.getElementById('filler-words').textContent = this.speechMetrics.fillerCount + ' 개'
  }

  startRecording() {
    if (!this.mediaStream) {
      alert('먼저 카메라와 마이크를 연결해주세요.')
      return
    }

    try {
      // MediaRecorder 설정
      this.mediaRecorder = new MediaRecorder(this.mediaStream, {
        mimeType: 'video/webm;codecs=vp9,opus'
      })
      
      this.recordedChunks = []
      
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.recordedChunks.push(event.data)
        }
      }
      
      this.mediaRecorder.onstop = () => {
        this.processRecording()
      }
      
      // 녹화 시작
      this.mediaRecorder.start(1000) // 1초마다 데이터 수집
      this.isRecording = true
      this.recordingStartTime = Date.now()
      this.speechMetrics.startTime = Date.now()
      
      // STT 시작
      if (this.recognition) {
        this.sttText = ''
        this.recognition.start()
      }
      
      // UI 업데이트
      document.getElementById('start-recording').classList.add('hidden')
      document.getElementById('stop-recording').classList.remove('hidden')
      document.getElementById('recording-indicator').classList.remove('hidden')
      document.getElementById('recording-timer').classList.remove('hidden')
      document.getElementById('stt-section').classList.remove('hidden')
      
      // 타이머 시작
      this.startTimer()
      
      this.showSuccessMessage('녹화가 시작되었습니다!')
      
    } catch (error) {
      console.error('녹화 시작 오류:', error)
      alert('녹화 시작에 실패했습니다: ' + error.message)
    }
  }

  stopRecording() {
    if (!this.mediaRecorder || !this.isRecording) return
    
    try {
      // 녹화 중지
      this.mediaRecorder.stop()
      this.isRecording = false
      
      // STT 중지
      if (this.recognition) {
        this.recognition.stop()
      }
      
      // 타이머 중지
      if (this.timerInterval) {
        clearInterval(this.timerInterval)
      }
      
      // UI 업데이트
      document.getElementById('start-recording').classList.remove('hidden')
      document.getElementById('stop-recording').classList.add('hidden')
      document.getElementById('recording-indicator').classList.add('hidden')
      
      this.showSuccessMessage('녹화가 완료되었습니다!')
      
    } catch (error) {
      console.error('녹화 중지 오류:', error)
      alert('녹화 중지 중 오류가 발생했습니다: ' + error.message)
    }
  }

  startTimer() {
    this.timerInterval = setInterval(() => {
      if (!this.recordingStartTime) return
      
      const elapsed = Math.floor((Date.now() - this.recordingStartTime) / 1000)
      const minutes = Math.floor(elapsed / 60)
      const seconds = elapsed % 60
      
      const timerDisplay = document.getElementById('timer-display')
      if (timerDisplay) {
        timerDisplay.textContent = 
          `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
      }
    }, 1000)
  }

  async processRecording() {
    try {
      this.showLoading('녹화된 발표를 분석 중...')
      
      // 녹화 데이터 처리
      const blob = new Blob(this.recordedChunks, { type: 'video/webm' })
      const recordingUrl = URL.createObjectURL(blob)
      
      // 실제 평가 실행 (또는 데모)
      await this.evaluatePresentation(blob)
      
    } catch (error) {
      console.error('녹화 처리 오류:', error)
      alert('녹화 분석 중 오류가 발생했습니다: ' + error.message)
    } finally {
      this.hideLoading()
    }
  }

  async evaluatePresentation(recordingBlob) {
    if (!this.selectedCustomer) {
      alert('AI 가상고객을 먼저 선택해주세요.')
      return
    }

    try {
      // 데모 발표 평가 API 호출
      const response = await axios.post('/api/demo/presentation-evaluation', {
        customer_id: this.selectedCustomer.id,
        presentation_title: document.getElementById('presentation-title').value || '금고석유화학 DX 플랫폼 구축 제안',
        transcript_text: this.sttText,
        speech_metrics: this.speechMetrics
      })

      if (response.data.success) {
        this.displayEvaluationResults(response.data.data)
      }

    } catch (error) {
      console.error('발표 평가 오류:', error)
      alert('발표 평가 중 오류가 발생했습니다: ' + error.message)
    }
  }

  async runDemoEvaluation() {
    try {
      this.showLoading('데모 발표 평가를 실행 중...')
      
      // 데모 데이터로 STT 텍스트 설정
      const demoSTTText = "안녕하십니까, PwC 컨설팅의 발표를 시작하겠습니다. 이번 제안의 핵심은 ERP, MES, ESG 시스템을 하나의 플랫폼으로 통합하는 것입니다. 이를 통해 금고석유화학은 글로벌 ESG 규제에 선제적으로 대응하고, 공정 데이터를 경영 의사결정에 직접 연결할 수 있습니다. 또한, 저희는 화학 산업 프로젝트 경험과 글로벌 ESG 대응 노하우를 바탕으로, 안정적인 실행을 보장합니다. 마지막으로, 단계별 PoC를 통해 리스크를 최소화하고, 12개월 내 성공적인 플랫폼 구축을 완수하겠습니다. 감사합니다."
      this.sttText = demoSTTText
      
      // STT 섹션 표시 및 텍스트 업데이트
      document.getElementById('stt-section').classList.remove('hidden')
      this.updateSTTDisplay(this.sttText)
      
      // 데모 음성 메트릭 설정
      this.speechMetrics = {
        wordCount: 89,
        pauseCount: 6,
        fillerCount: 2,
        startTime: Date.now() - 180000, // 3분 전
        duration: 180,
        wordsPerMinute: 29.7,
        averageVolumeLevel: 0.75
      }
      this.updateSpeechMetrics()
      
      // 고객 선택 (없으면 첫 번째 고객 자동 선택)
      if (!this.selectedCustomer) {
        const select = document.getElementById('customer-select')
        if (select.options.length > 1) {
          select.selectedIndex = 1
          this.selectCustomer(select.value)
        }
      }
      
      // 발표 제목 설정
      const titleInput = document.getElementById('presentation-title')
      if (!titleInput.value) {
        titleInput.value = '금고석유화학 DX 플랫폼 구축 제안'
      }
      
      // 데모 평가 실행
      await this.evaluatePresentation(null)
      
    } catch (error) {
      console.error('데모 발표 평가 오류:', error)
      alert('데모 평가 중 오류가 발생했습니다: ' + error.message)
    } finally {
      this.hideLoading()
    }
  }

  displayEvaluationResults(evaluationData) {
    // 점수 표시 (100점 만점)
    document.getElementById('clarity-score').textContent = evaluationData.scores.clarity.score_100 + '점'
    document.getElementById('expertise-score').textContent = evaluationData.scores.expertise.score_100 + '점'
    document.getElementById('persuasiveness-score').textContent = evaluationData.scores.persuasiveness.score_100 + '점'
    document.getElementById('logic-score').textContent = evaluationData.scores.logic.score_100 + '점'
    document.getElementById('creativity-score').textContent = evaluationData.scores.creativity.score_100 + '점'
    document.getElementById('credibility-score').textContent = evaluationData.scores.credibility.score_100 + '점'
    
    // 총점 표시 (100점 만점)
    document.getElementById('total-score').textContent = Math.round(evaluationData.total_score_100 || evaluationData.total_score) + '점'
    
    // 결과 섹션 표시
    document.getElementById('evaluation-results').classList.remove('hidden')
    document.getElementById('evaluation-results').scrollIntoView({ behavior: 'smooth' })
    
    this.showSuccessMessage('발표 평가가 완료되었습니다!')
  }

  // 정리 함수
  cleanup() {
    // 미디어 스트림 정리
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop())
    }
    
    // 오디오 컨텍스트 정리
    if (this.audioContext) {
      this.audioContext.close()
    }
    
    // 애니메이션 정리
    if (this.animationId) {
      cancelAnimationFrame(this.animationId)
    }
    
    // 타이머 정리
    if (this.timerInterval) {
      clearInterval(this.timerInterval)
    }
  }

  showLoading(message = '처리 중...') {
    const overlay = document.createElement('div')
    overlay.id = 'loading-overlay'
    overlay.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'
    overlay.innerHTML = `
      <div class="bg-white rounded-lg p-6 shadow-xl max-w-md">
        <div class="flex items-center mb-4">
          <i class="fas fa-spinner fa-spin text-purple-600 text-2xl mr-3"></i>
          <span class="text-lg font-medium">${message}</span>
        </div>
        <div class="w-full bg-gray-200 rounded-full h-2">
          <div class="bg-purple-600 h-2 rounded-full animate-pulse" style="width: 70%"></div>
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
    
    setTimeout(() => {
      successDiv.style.opacity = '0'
      setTimeout(() => {
        if (successDiv.parentNode) {
          successDiv.parentNode.removeChild(successDiv)
        }
      }, 300)
    }, 3000)
  }
}

// 페이지 언로드 시 정리
window.addEventListener('beforeunload', () => {
  if (window.presentationApp) {
    window.presentationApp.cleanup()
  }
})

// 앱 초기화
let presentationApp
document.addEventListener('DOMContentLoaded', () => {
  presentationApp = new PresentationEvaluationApp()
  window.presentationApp = presentationApp
})