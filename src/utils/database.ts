// 데이터베이스 유틸리티 함수들

import type { Bindings, ExecutivePersona, PaginationOptions, ApiResponse } from '../types'

export class DatabaseHelper {
  private db: D1Database;

  constructor(db: D1Database) {
    this.db = db;
  }

  // UUID 생성 함수
  generateUUID(): string {
    return crypto.randomUUID();
  }

  // 페이지네이션 헬퍼
  async paginate<T>(
    baseQuery: string,
    countQuery: string,
    params: any[] = [],
    options: PaginationOptions = {}
  ): Promise<{ items: T[]; pagination: any }> {
    const page = Math.max(1, options.page || 1);
    const limit = Math.min(100, Math.max(1, options.limit || 20));
    const offset = (page - 1) * limit;

    // 정렬 옵션 추가
    let finalQuery = baseQuery;
    if (options.sort_by) {
      const sortOrder = options.sort_order === 'DESC' ? 'DESC' : 'ASC';
      finalQuery += ` ORDER BY ${options.sort_by} ${sortOrder}`;
    }
    finalQuery += ` LIMIT ? OFFSET ?`;

    // 데이터 조회
    const [itemsResult, countResult] = await Promise.all([
      this.db.prepare(finalQuery).bind(...params, limit, offset).all(),
      this.db.prepare(countQuery).bind(...params).first()
    ]);

    const total = (countResult as any)?.count || 0;
    const totalPages = Math.ceil(total / limit);

    return {
      items: itemsResult.results as T[],
      pagination: {
        page,
        limit,
        total,
        total_pages: totalPages,
        has_next: page < totalPages,
        has_prev: page > 1
      }
    };
  }

  // 검색 조건 추가 헬퍼
  buildSearchCondition(searchFields: string[], searchTerm?: string): { condition: string; params: string[] } {
    if (!searchTerm) {
      return { condition: '', params: [] };
    }

    const conditions = searchFields.map(field => `${field} LIKE ?`);
    const params = searchFields.map(() => `%${searchTerm}%`);

    return {
      condition: ` AND (${conditions.join(' OR ')})`,
      params
    };
  }

  // 페르소나 조회 헬퍼
  async getPersonas(options: PaginationOptions = {}): Promise<{ personas: ExecutivePersona[]; pagination: any }> {
    let baseQuery = `
      SELECT id, name, department, company, rank, version, kpi, evaluation_focus,
             budget_authority, decision_influence, technical_expertise, industry_experience,
             communication_style, risk_tolerance, innovation_openness, team_dynamics,
             strategic_priority, created_at, updated_at
      FROM executive_personas_data
      WHERE 1=1
    `;

    let countQuery = `SELECT COUNT(*) as count FROM executive_personas_data WHERE 1=1`;
    let params: any[] = [];

    // 검색 조건 추가
    if (options.search) {
      const searchCondition = this.buildSearchCondition(
        ['name', 'company', 'rank', 'department'], 
        options.search
      );
      baseQuery += searchCondition.condition;
      countQuery += searchCondition.condition;
      params.push(...searchCondition.params);
    }

    const result = await this.paginate<ExecutivePersona>(
      baseQuery, countQuery, params, options
    );

    return {
      personas: result.items,
      pagination: result.pagination
    };
  }

  // 페르소나 단일 조회
  async getPersonaById(id: string): Promise<ExecutivePersona | null> {
    const result = await this.db.prepare(`
      SELECT * FROM executive_personas_data WHERE id = ?
    `).bind(id).first();

    return result as ExecutivePersona | null;
  }

  // 페르소나 생성
  async createPersona(persona: Omit<ExecutivePersona, 'id' | 'created_at' | 'updated_at'>): Promise<string> {
    const id = this.generateUUID();
    const now = new Date().toISOString();

    await this.db.prepare(`
      INSERT INTO executive_personas_data (
        id, name, department, company, rank, version, kpi, evaluation_focus,
        budget_authority, decision_influence, technical_expertise, industry_experience,
        communication_style, risk_tolerance, innovation_openness, team_dynamics,
        strategic_priority, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id, persona.name, persona.department, persona.company, persona.rank, 
      persona.version || 'v1.0', persona.kpi, persona.evaluation_focus,
      persona.budget_authority, persona.decision_influence, persona.technical_expertise,
      persona.industry_experience, persona.communication_style, persona.risk_tolerance,
      persona.innovation_openness, persona.team_dynamics, persona.strategic_priority,
      now, now
    ).run();

    return id;
  }

  // 페르소나 업데이트
  async updatePersona(id: string, updates: Partial<ExecutivePersona>): Promise<boolean> {
    const now = new Date().toISOString();
    
    const fields: string[] = [];
    const values: any[] = [];

    // 동적으로 업데이트할 필드 구성
    Object.entries(updates).forEach(([key, value]) => {
      if (key !== 'id' && key !== 'created_at' && value !== undefined) {
        fields.push(`${key} = ?`);
        values.push(value);
      }
    });

    if (fields.length === 0) {
      return false;
    }

    fields.push('updated_at = ?');
    values.push(now, id);

    const result = await this.db.prepare(`
      UPDATE executive_personas_data 
      SET ${fields.join(', ')}
      WHERE id = ?
    `).bind(...values).run();

    return result.changes > 0;
  }

  // 페르소나 삭제
  async deletePersona(id: string): Promise<boolean> {
    const result = await this.db.prepare(`
      DELETE FROM executive_personas_data WHERE id = ?
    `).bind(id).run();

    return result.changes > 0;
  }

  // 루브릭 앵커 조회
  async getRubricAnchors(metricName?: string) {
    let query = 'SELECT * FROM rubric_anchors';
    const params: any[] = [];

    if (metricName) {
      query += ' WHERE metric_name = ?';
      params.push(metricName);
    }

    query += ' ORDER BY metric_name, score_value';

    const result = await this.db.prepare(query).bind(...params).all();
    return result.results;
  }

  // 페르소나 평가 매핑 조회
  async getEvaluationMappings() {
    const result = await this.db.prepare(`
      SELECT * FROM persona_evaluation_mapping ORDER BY evaluation_metric
    `).all();

    return result.results.map((row: any) => ({
      ...row,
      mapped_fields: JSON.parse(row.mapped_fields || '[]'),
      field_weights: JSON.parse(row.field_weights || '{}')
    }));
  }

  // 회사별 페르소나 통계
  async getPersonaStatsByCompany() {
    const result = await this.db.prepare(`
      SELECT 
        company,
        COUNT(*) as total_personas,
        AVG(budget_authority) as avg_budget_authority,
        AVG(decision_influence) as avg_decision_influence,
        AVG(technical_expertise) as avg_technical_expertise,
        AVG(risk_tolerance) as avg_risk_tolerance,
        AVG(innovation_openness) as avg_innovation_openness
      FROM executive_personas_data
      WHERE company IS NOT NULL
      GROUP BY company
      ORDER BY total_personas DESC
    `).all();

    return result.results;
  }

  // 대시보드 통계
  async getDashboardStats() {
    const [personasCount, proposalsCount, presentationsCount] = await Promise.all([
      this.db.prepare('SELECT COUNT(*) as count FROM executive_personas_data').first(),
      this.db.prepare('SELECT COUNT(*) as count FROM proposals').first(),
      this.db.prepare('SELECT COUNT(*) as count FROM presentations').first()
    ]);

    const avgScores = await this.db.prepare(`
      SELECT 
        AVG(CAST(clarity_score as REAL)) as avg_clarity,
        AVG(CAST(expertise_score as REAL)) as avg_expertise,
        AVG(CAST(persuasion_score as REAL)) as avg_persuasion,
        AVG(CAST(logic_score as REAL)) as avg_logic,
        AVG(CAST(creativity_score as REAL)) as avg_creativity,
        AVG(CAST(reliability_score as REAL)) as avg_reliability
      FROM persona_proposal_scores
      WHERE created_at >= datetime('now', '-30 days')
    `).first();

    return {
      total_personas: (personasCount as any)?.count || 0,
      total_proposals: (proposalsCount as any)?.count || 0,
      total_presentations: (presentationsCount as any)?.count || 0,
      average_scores: {
        clarity: Math.round((avgScores as any)?.avg_clarity || 0),
        expertise: Math.round((avgScores as any)?.avg_expertise || 0),
        persuasion: Math.round((avgScores as any)?.avg_persuasion || 0),
        logic: Math.round((avgScores as any)?.avg_logic || 0),
        creativity: Math.round((avgScores as any)?.avg_creativity || 0),
        reliability: Math.round((avgScores as any)?.avg_reliability || 0)
      }
    };
  }

  // 트랜잭션 헬퍼 (D1에서는 제한적 지원)
  async executeTransaction(queries: Array<{ query: string; params: any[] }>) {
    const results = [];
    
    for (const { query, params } of queries) {
      try {
        const result = await this.db.prepare(query).bind(...params).run();
        results.push(result);
      } catch (error) {
        console.error('Transaction query failed:', error);
        throw error;
      }
    }

    return results;
  }
}

// API 응답 헬퍼
export function createApiResponse<T>(
  success: boolean, 
  data?: T, 
  message?: string, 
  error?: string,
  pagination?: any
): ApiResponse<T> {
  const response: ApiResponse<T> = { success };
  
  if (data !== undefined) response.data = data;
  if (message) response.message = message;
  if (error) response.error = error;
  if (pagination) response.pagination = pagination;
  
  return response;
}

// 유효성 검사 헬퍼
export function validatePersona(persona: Partial<ExecutivePersona>): string[] {
  const errors: string[] = [];

  if (!persona.name?.trim()) {
    errors.push('이름은 필수 항목입니다.');
  }

  if (persona.budget_authority && (persona.budget_authority < 1 || persona.budget_authority > 10)) {
    errors.push('예산 권한은 1-10 사이의 값이어야 합니다.');
  }

  if (persona.decision_influence && (persona.decision_influence < 1 || persona.decision_influence > 10)) {
    errors.push('의사결정 영향력은 1-10 사이의 값이어야 합니다.');
  }

  if (persona.technical_expertise && (persona.technical_expertise < 1 || persona.technical_expertise > 10)) {
    errors.push('기술 전문성은 1-10 사이의 값이어야 합니다.');
  }

  if (persona.risk_tolerance && (persona.risk_tolerance < 1 || persona.risk_tolerance > 10)) {
    errors.push('위험 감수성은 1-10 사이의 값이어야 합니다.');
  }

  if (persona.innovation_openness && (persona.innovation_openness < 1 || persona.innovation_openness > 10)) {
    errors.push('혁신 개방성은 1-10 사이의 값이어야 합니다.');
  }

  if (persona.industry_experience && persona.industry_experience < 0) {
    errors.push('업계 경험은 0 이상이어야 합니다.');
  }

  return errors;
}