-- RFP 시뮬레이터 시드 데이터

-- 1. 루브릭 앵커 데이터 삽입
INSERT OR IGNORE INTO rubric_anchors (metric_name, score_value, anchor_description) VALUES
  -- Clarity (명확성)
  ('clarity', 20, '핵심 메시지가 불명확, 용어 혼동, 전달이 단절적'),
  ('clarity', 40, '메시지는 있으나 설명이 산만, 전문 용어 해설 부족'),
  ('clarity', 60, '전체적으로 명확하나 일부 중복·애매한 표현 존재'),
  ('clarity', 80, '논리적 흐름이 뚜렷하고 누구나 쉽게 이해 가능'),
  ('clarity', 100, '탁월한 명확성, 예시·비유 활용, 모든 청중이 직관적으로 이해'),
  
  -- Expertise (전문성)
  ('expertise', 20, '전문성 근거 거의 없음, 사실 오류 포함'),
  ('expertise', 40, '일부 전문 지식 언급 있으나 구체적 사례 부족'),
  ('expertise', 60, '기본적 전문성 보임, 통상적 업계 용어 활용'),
  ('expertise', 80, '높은 수준의 전문성, 데이터·사례 기반 설명'),
  ('expertise', 100, '최고 수준의 전문성, 최신 연구·레퍼런스·실무 적용까지 반영'),
  
  -- Persuasion (설득력)
  ('persuasion', 20, '주장만 있고 근거 부족, 설득력 매우 약함'),
  ('persuasion', 40, '일부 근거 제시, 그러나 고객 관점 반영 미흡'),
  ('persuasion', 60, '일정 수준의 설득력, 고객 요구와 연결 시도'),
  ('persuasion', 80, '강한 설득력, KPI 달성 논리 제시'),
  ('persuasion', 100, '탁월한 설득력, 고객 가치와 ROI까지 강하게 어필'),
  
  -- Logic (논리성)
  ('logic', 20, '논리적 비약 심각, 전개가 단절적'),
  ('logic', 40, '논리적 흐름 있으나 연결이 약함'),
  ('logic', 60, '기본적 논리 구조 유지, 일부 허점 존재'),
  ('logic', 80, '논리적 일관성 뚜렷, 주장 간 명확한 연결'),
  ('logic', 100, '철저한 논리 전개, 반론까지 선제적으로 대비'),
  
  -- Creativity (창의성)
  ('creativity', 20, '기존 방식 반복, 차별화 전혀 없음'),
  ('creativity', 40, '제한적 차별화, 새로운 아이디어는 있으나 불완전'),
  ('creativity', 60, '일부 차별적 접근, 실현성 낮음'),
  ('creativity', 80, '독창적 접근, 실행 가능성이 충분'),
  ('creativity', 100, '혁신적 아이디어, 시장/업계에서 선도 가능'),
  
  -- Reliability (신뢰성)
  ('reliability', 20, '근거 불충분, 신뢰하기 어려움'),
  ('reliability', 40, '일부 근거 제시, 그러나 모호함 존재'),
  ('reliability', 60, '기본적 신뢰성 확보, 검증된 자료 활용'),
  ('reliability', 80, '높은 신뢰성, 리스크 대비책 명확'),
  ('reliability', 100, '완벽한 신뢰성, 객관적 인증·레퍼런스·사례로 뒷받침');

-- 2. 페르소나 필드 구조 정의
INSERT OR IGNORE INTO persona_fields_structure (field_name, field_type, description, data_source, example_values) VALUES
  ('id', 'string', '고유 식별자', '시스템 자동 생성', 'UUID 형태'),
  ('name', 'string', '이름', '고객 인터뷰, 보도자료, 회사 웹사이트 임원 소개', '김철수, 이영희'),
  ('department', 'string', '부서', '인터뷰, 회사 조직도, IR 자료', '기술개발부, 재무부, 경영진'),
  ('company', 'string', '회사', 'RFP, 보도자료, ESG 리포트', '삼성전자, LG화학'),
  ('rank', 'string', '직급', '인터뷰, 보도자료 직급/호칭', 'CTO, CFO, CEO'),
  ('version', 'string', '버전', '내부 관리용', 'v1.0, v2.1'),
  ('kpi', 'string', '핵심 성과 지표', 'ESG 리포트, 연차보고서, IR자료', '매출성장률, R&D투자비율'),
  ('evaluation_focus', 'string', '평가 중점사항', '고객 인터뷰, 발표 피드백, 보고서', '기술혁신, 수익성, 지속가능성'),
  ('budget_authority', 'integer', '예산 권한 (1-10 스케일)', '고객 인터뷰, 보도자료', '1(낮음), 5(중간), 10(높음)'),
  ('decision_influence', 'integer', '의사결정 영향력 (1-10 스케일)', '조직 내 의사결정 구조, 인터뷰', '1(낮음), 5(중간), 10(높음)'),
  ('technical_expertise', 'integer', '기술 전문성 (1-10 스케일)', '인터뷰, LinkedIn 프로필, 논문/기고문', '1(낮음), 5(중간), 10(높음)'),
  ('industry_experience', 'integer', '업계 경험 (연수)', '보도자료, 이력 기사, 인터뷰', '5년, 15년, 25년'),
  ('communication_style', 'string', '커뮤니케이션 스타일', '고객 인터뷰 중 화법/피드백 방식, 보도 인터뷰 톤', '직접적, 협력적, 분석적'),
  ('risk_tolerance', 'integer', '위험 감수성 (1-10 스케일)', 'ESG 리포트, 보도자료', '1(보수적), 5(중간), 10(적극적)'),
  ('innovation_openness', 'integer', '혁신 개방성 (1-10 스케일)', '보도자료, ESG·R&D 보고서', '1(보수적), 5(중간), 10(적극적)'),
  ('team_dynamics', 'string', '팀 역학', '인터뷰, 조직문화 보고서', '협업중심, 수직적, 수평적'),
  ('strategic_priority', 'string', '전략적 우선순위', 'ESG 리포트, 최신동향 리포트, 경영진 인터뷰', '기술혁신, 수익성, ESG경영');

-- 3. 페르소나 평가 매핑 정의
INSERT OR IGNORE INTO persona_evaluation_mapping (evaluation_metric, mapped_fields, description, default_weight, field_weights) VALUES
  ('명확성 (Clarity)', '["communication_style", "evaluation_focus", "department"]', '발표를 얼마나 이해하기 쉽게 하는지, 커뮤니케이션 선호도와 직무 특성이 반영됨', 0.20, '{"communication_style": 0.5, "evaluation_focus": 0.3, "department": 0.2}'),
  ('전문성 (Expertise)', '["technical_expertise", "industry_experience", "rank"]', '기술적 깊이·업계 경험, 직급이 높을수록 전문성을 중시', 0.20, '{"technical_expertise": 0.5, "industry_experience": 0.3, "rank": 0.2}'),
  ('설득력 (Persuasion)', '["decision_influence", "budget_authority", "kpi", "communication_style"]', '예산권·의사결정 영향력이 클수록 설득력 있는 근거 요구', 0.15, '{"decision_influence": 0.4, "budget_authority": 0.3, "kpi": 0.2, "communication_style": 0.1}'),
  ('논리성 (Logic)', '["strategic_priority", "evaluation_focus", "team_dynamics", "rank"]', '전략적 우선순위·팀 논리를 얼마나 충족하는지', 0.15, '{"strategic_priority": 0.4, "evaluation_focus": 0.3, "team_dynamics": 0.2, "rank": 0.1}'),
  ('창의성 (Creativity)', '["innovation_openness", "risk_tolerance", "kpi"]', '혁신·리스크 감수성, KPI와 맞는 창의적 접근 여부', 0.15, '{"innovation_openness": 0.5, "risk_tolerance": 0.3, "kpi": 0.2}'),
  ('신뢰성 (Reliability)', '["industry_experience", "company", "rank", "communication_style", "decision_influence"]', '신뢰도·경험·조직문화적 배경에 따른 안정성 강조', 0.15, '{"industry_experience": 0.3, "company": 0.2, "rank": 0.2, "communication_style": 0.2, "decision_influence": 0.1}');

-- 4. 데모 페르소나 데이터 삽입
INSERT OR IGNORE INTO executive_personas_data (
  id, name, department, company, rank, version, kpi, evaluation_focus, 
  budget_authority, decision_influence, technical_expertise, industry_experience,
  communication_style, risk_tolerance, innovation_openness, team_dynamics, strategic_priority
) VALUES
  -- 삼성전자 경영진
  ('SEC_001', '이재용', '경영진', '삼성전자', '회장', 'v1.0', '글로벌 시장점유율 확대', '기술혁신과 글로벌 경쟁력', 10, 10, 7, 25, '전략적', 8, 9, '수직적', 'AI·반도체 기술 선도'),
  ('SEC_002', '한종희', 'DX부문', '삼성전자', '부회장(공동 대표이사)', 'v1.0', 'DX사업 수익성 개선', '사업 실행력과 성과', 9, 9, 8, 20, '협력적', 7, 8, '협업중심', '가전·모바일 사업 강화'),
  ('SEC_003', '이주형', 'Samsung Research', '삼성전자', '부사장(CTO)', 'v1.0', 'AI 기술 개발 성과', '기술 전문성과 혁신', 7, 7, 10, 15, '분석적', 6, 10, '수평적', '생성형 AI 기술 선도'),
  
  -- LG화학 경영진
  ('LGC_001', '신학철', '경영진', 'LG화학', '대표이사', 'v1.0', '배터리 사업 글로벌 1위', '수익성과 시장 지배력', 10, 10, 8, 30, '직접적', 7, 8, '수직적', '배터리·소재 사업 집중'),
  ('LGC_002', '차동석', '재무부문', 'LG화학', 'CFO', 'v1.0', '재무건전성 및 투자수익률', '재무안정성과 효율성', 9, 8, 6, 20, '분석적', 5, 6, '협업중심', '재무 최적화 및 투자 관리'),
  ('LGC_003', '이종구', '기술개발부문', 'LG화학', '부사장(CTO)', 'v1.0', 'R&D투자 대비 특허 성과', '기술혁신과 연구개발', 8, 7, 10, 18, '분석적', 7, 9, '수평적', '친환경 소재 기술 개발'),
  
  -- 한국조선해양 경영진
  ('HKS_001', '김성준', '경영진', '한국조선해양', '대표이사', 'v1.0', '조선 수주량 및 수익성', '사업 성과와 글로벌 경쟁력', 10, 10, 8, 25, '직접적', 6, 7, '수직적', '친환경 선박 기술 확보'),
  ('HKS_002', '이종윤', '재정부문', '한국조선해양', '전무(CFO)', 'v1.0', '자금조달 성공률 및 재무비율', '재무 안정성과 자금 관리', 8, 7, 5, 22, '협력적', 4, 5, '협업중심', '재무구조 개선 및 투자 최적화'),
  
  -- GS칼텍스 경영진
  ('GSC_001', '허세홍', '경영진', 'GS칼텍스', '대표이사', 'v1.0', '정유사업 수익성 및 에너지 전환', '사업 성과와 지속가능성', 10, 10, 7, 28, '직접적', 6, 8, '수직적', '친환경 에너지 사업 확장'),
  ('GSC_002', '최우진', '재무부문', 'GS칼텍스', 'CFO', 'v1.0', '재무 효율성 및 투자 수익률', '재무안정성과 위험관리', 9, 8, 5, 18, '분석적', 5, 6, '협업중심', '재무 최적화 및 ESG 투자');

-- 5. 인터뷰 질문 프레임워크 (일부 샘플)
INSERT OR IGNORE INTO interview_questions_framework (
  question_id, question_category, interview_question, response_type, scoring_method,
  target_fields, evaluation_metrics_impact, example_responses
) VALUES
  ('Q001', '기본정보', '담당자님의 현재 직책과 주요 업무 영역을 자세히 설명해 주세요.', 'String + 구조화', '직책 레벨(1-10), 업무 영역 복잡도 분석', '["rank", "department", "decision_influence"]', '{"전문성": 0.2, "설득력": 0.4, "신뢰성": 0.2}', 'CTO 기술전략 총괄 전사 디지털혁신 리딩'),
  ('Q002', '기본정보', '이 분야에서 몇 년간 경험을 쌓으셨나요? 주요 경력 이력을 간단히 소개해 주세요.', 'Integer + String', '경력 연수 직접 환산, 주요 성과 가중치', '["industry_experience", "technical_expertise"]', '{"전문성": 0.3, "신뢰성": 0.3}', '15년 삼성→LG 이직 AI 플랫폼 구축 경험'),
  ('Q003', '의사결정권한', '현재 직책에서 예산 승인 권한은 어느 정도 수준까지 가지고 계신가요?', 'Scale (1-10)', '예산 규모별 점수 매핑', '["budget_authority", "decision_influence"]', '{"설득력": 0.3, "논리성": 0.1}', '연간 100억 이상 승인 가능 (9점) 팀 예산만 관리 (5점)');

-- 6. 데모 RFP 문서
INSERT OR IGNORE INTO rfp_documents (id, title, company, content_summary, parsed_signals) VALUES
  ('RFP_001', 'AI 기반 스마트 팩토리 솔루션 구축 사업', '삼성전자', 'AI, IoT, 빅데이터를 활용한 제조업 디지털 전환 솔루션 구축', 
   '{"kpi": ["생산성 향상", "품질 개선", "비용 절감"], "tech_requirements": ["AI/ML", "IoT", "클라우드"], "budget_range": "100억-200억", "innovation_focus": true}');

-- 데이터 무결성 검증을 위한 트리거 생성 (SQLite에서 지원하는 경우)
-- 페르소나 데이터 업데이트 시 updated_at 자동 갱신
CREATE TRIGGER IF NOT EXISTS update_personas_timestamp 
AFTER UPDATE ON executive_personas_data
BEGIN
  UPDATE executive_personas_data SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;