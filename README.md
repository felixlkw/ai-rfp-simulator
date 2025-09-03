# RFP 기반 AI 가상고객 제안발표 시뮬레이터

## 프로젝트 개요
- **이름**: RFP 기반 AI 가상고객 제안발표 시뮬레이터 (RFP Presentation Simulator)
- **목표**: AI 기반 실시간/사후 평가로 제안서·발표 품질을 정량화하고, 페르소나(의사결정자) 상태에 맞춘 피드백/예상 Q&A 제공
- **특징**: 
  - 17필드 페르소나 시스템으로 경영진 특성 상세 분석
  - 6대 지표 기반 루브릭 앵커 평가 방식
  - 실시간 영상+STT 분석을 통한 종합 발표 평가
  - 페르소나별 맞춤 피드백 및 예상 Q&A 생성

## 현재 구현된 기능

### ✅ 핵심 시스템 아키텍처
- **데이터베이스 스키마**: Cloudflare D1 기반 15개 테이블 구조 완성
- **페르소나 시스템**: 17개 필드 기반 경영진 페르소나 관리
- **루브릭 앵커**: 6대 평가지표별 5단계 앵커 정의 (20/40/60/80/100점)
- **API 인프라**: RESTful API 8개 엔드포인트 구현

### ✅ 백엔드 API 엔드포인트
| 경로 | 메소드 | 기능 | 상태 |
|------|--------|------|------|
| `/api/health` | GET | 헬스체크 | ✅ |
| `/api/dashboard/stats` | GET | 대시보드 통계 | ✅ |
| `/api/personas` | GET | 페르소나 목록 (페이지네이션, 검색) | ✅ |
| `/api/personas/:id` | GET | 페르소나 단일 조회 | ✅ |
| `/api/personas` | POST | 페르소나 생성 | ✅ |
| `/api/personas/:id` | PUT | 페르소나 업데이트 | ✅ |
| `/api/personas/:id` | DELETE | 페르소나 삭제 | ✅ |
| `/api/rubric-anchors` | GET | 루브릭 앵커 조회 | ✅ |
| `/api/evaluation-mappings` | GET | 평가 매핑 규칙 조회 | ✅ |
| `/api/personas/stats/by-company` | GET | 회사별 페르소나 통계 | ✅ |

### ✅ 프론트엔드 UI/UX
- **메인 대시보드**: PwC 2025 브랜딩이 적용된 반응형 인터페이스
- **통계 카드**: 페르소나, 제안서, 발표, 평균 점수 현황
- **기능 메뉴**: 6개 주요 기능 구역 카드 형태로 배치
- **다국어 지원**: 한국어 기본 (영어 준비 중)
- **반응형 디자인**: 모바일/태블릿/데스크톱 최적화

### ✅ 데이터 모델 및 구조
- **17개 페르소나 필드**: id, name, department, company, rank, version, kpi, evaluation_focus, budget_authority, decision_influence, technical_expertise, industry_experience, communication_style, risk_tolerance, innovation_openness, team_dynamics, strategic_priority
- **6대 평가지표**: 명확성(Clarity), 전문성(Expertise), 설득력(Persuasion), 논리성(Logic), 창의성(Creativity), 신뢰성(Reliability)
- **데모 페르소나**: 삼성전자, LG화학, 한국조선해양, GS칼텍스 경영진 10명 사전 등록

## 아직 구현되지 않은 기능

### 🚧 페르소나 관리 페이지
- [ ] 페르소나 CRUD 인터페이스
- [ ] 17개 필드 입력 폼
- [ ] 페르소나 검색 및 필터링
- [ ] 회사별/직급별 통계 차트

### 🚧 RFP 등록 및 파싱
- [ ] RFP 파일 업로드 (PDF/Word)
- [ ] LLM 기반 RFP 내용 파싱
- [ ] KPI, 평가기준, 예산/거버넌스 신호 추출
- [ ] 페르소나 상태 자동 최신화

### 🚧 제안서 평가 (1차)
- [ ] 제안서 업로드 인터페이스
- [ ] LLM 기반 섹션별 분석 (요약, 방법론, 보안, 가격, 리스크, 팀)
- [ ] 페르소나별 6대 지표 점수 계산
- [ ] 루브릭 앵커 매칭 알고리즘
- [ ] 평가 결과 레이더 차트

### 🚧 발표 평가 (2차)
- [ ] 웹캠/마이크 접근 및 녹화
- [ ] STT(Speech-to-Text) 전사
- [ ] 멀티모달 LLM 기반 영상 분석
- [ ] 오디오 특성 분석 (속도, 휴지, 억양)
- [ ] 발표 품질 종합 점수화

### 🚧 최종 결과 및 리포트
- [ ] 1차+2차 통합 점수 계산
- [ ] 6각형 레이더 차트 시각화
- [ ] 페르소나별 예상 질문 생성
- [ ] 권장 답변 시나리오 제공
- [ ] PDF 보고서 다운로드

### 🚧 LLM 통합
- [ ] OpenAI/Anthropic API 연동
- [ ] 루브릭 앵커 기반 평가 프롬프트
- [ ] 멀티모달 LLM 영상 분석
- [ ] 예상 질문/답변 생성 알고리즘

## URL 및 배포 정보

### 🌐 개발 환경
- **로컬 개발서버**: http://localhost:3000
- **샌드박스 URL**: https://3000-i9nxth45bm312i7sylait-6532622b.e2b.dev
- **헬스체크**: https://3000-i9nxth45bm312i7sylait-6532622b.e2b.dev/api/health

### 🏗️ 배포 상태
- **플랫폼**: Cloudflare Pages (준비 완료)
- **데이터베이스**: Cloudflare D1 (스키마 완료, 마이그레이션 대기)
- **상태**: 🔄 개발 중 (로컬 환경 구동 완료)

## 기술 스택

### 백엔드
- **프레임워크**: Hono.js (경량 웹 프레임워크)
- **런타임**: Cloudflare Workers (엣지 환경)
- **데이터베이스**: Cloudflare D1 (SQLite 기반)
- **언어**: TypeScript

### 프론트엔드
- **스타일링**: TailwindCSS
- **아이콘**: FontAwesome
- **차트**: Chart.js (예정)
- **HTTP 클라이언트**: Axios
- **폰트**: Noto Sans KR

### 인프라 및 도구
- **배포**: Cloudflare Pages
- **프로세스 관리**: PM2
- **빌드 도구**: Vite
- **패키지 매니저**: npm
- **버전 관리**: Git

## 개발 가이드

### 로컬 환경 설정
```bash
# 의존성 설치
npm install

# 프로젝트 빌드
npm run build

# 개발 서버 시작 (PM2 사용)
pm2 start ecosystem.config.cjs

# 데이터베이스 마이그레이션 (Cloudflare API 설정 후)
npm run db:migrate:local
npm run db:seed

# 서비스 상태 확인
curl http://localhost:3000/api/health
```

### 추천 다음 개발 단계
1. **페르소나 관리 UI 구현** - 17개 필드 CRUD 인터페이스
2. **루브릭 앵커 관리 기능** - 평가 기준 커스터마이징
3. **RFP 파일 업로드** - 멀티파트 파일 처리 및 파싱
4. **LLM API 연동** - OpenAI API 기반 평가 시스템
5. **레이더 차트 구현** - Chart.js 기반 시각화
6. **웹캠/마이크 통합** - WebRTC 기반 녹화 기능

## 데이터 아키텍처

### 핵심 테이블 관계
```
persona_fields_structure (스키마 정의)
    ↓
executive_personas_data (실제 페르소나 데이터)
    ↓
persona_evaluation_mapping (평가 매핑 규칙)
    ↓
proposals → persona_proposal_scores (제안서 평가)
presentations → persona_presentation_scores (발표 평가)
    ↓
persona_final_scores (최종 통합 결과)
```

### 루브릭 앵커 시스템
각 평가지표별로 5단계 앵커 정의:
- **20점**: 기본 수준 미달
- **40점**: 기본 요구사항 충족
- **60점**: 일반적 수준
- **80점**: 우수한 수준  
- **100점**: 탁월한 수준

## 사용자 가이드

### 1. 페르소나 관리
- 경영진 특성을 17개 필드로 상세 분석
- 딥리서치 + 고객인터뷰 데이터 반영
- 회사별/직급별 페르소나 그룹 관리

### 2. RFP 등록·파싱  
- PDF/Word 형태 RFP 문서 업로드
- AI가 자동으로 핵심 신호 추출
- 페르소나 상태 실시간 최신화

### 3. 제안서 평가 (1차)
- 제안서 문서 업로드 및 분석
- 6대 지표 기반 페르소나별 평가
- 루브릭 앵커 방식 점수화

### 4. 발표 평가 (2차)  
- 웹캠 기반 발표 녹화
- 영상+음성 멀티모달 분석
- 실시간 피드백 제공

### 5. 최종 결과
- 1차+2차 통합 점수 산출
- 페르소나별 예상 Q&A 생성
- PDF 보고서 다운로드

## 라이선스 및 기여

**© 2025 PwC Korea. All rights reserved.**

이 프로젝트는 PwC Korea의 내부 도구로 개발되었으며, 상업적 사용 시 별도 라이선스가 필요합니다.

---

**마지막 업데이트**: 2025년 9월 3일  
**버전**: v1.0.0 (개발 중)  
**개발자**: RFP Simulator Development Team