// 페르소나 관리 JavaScript

class PersonaManager {
    constructor() {
        this.personas = [];
        this.currentPersona = null;
        this.pagination = {
            page: 1,
            limit: 12,
            total: 0,
            total_pages: 0
        };
        this.filters = {
            search: '',
            company: '',
            rank: '',
            sort_by: 'created_at',
            sort_order: 'DESC'
        };
        
        this.init();
    }

    async init() {
        await this.loadPersonas();
        this.setupEventListeners();
        this.renderPersonas();
        this.setupCompanyFilter();
        this.setupRankFilter();
    }

    setupEventListeners() {
        // 검색
        const searchInput = document.getElementById('persona-search');
        if (searchInput) {
            searchInput.addEventListener('input', this.debounce((e) => {
                this.filters.search = e.target.value;
                this.pagination.page = 1;
                this.loadPersonas();
            }, 300));
        }

        // 필터 변경
        const companyFilter = document.getElementById('company-filter');
        if (companyFilter) {
            companyFilter.addEventListener('change', (e) => {
                this.filters.company = e.target.value;
                this.pagination.page = 1;
                this.loadPersonas();
            });
        }

        const rankFilter = document.getElementById('rank-filter');
        if (rankFilter) {
            rankFilter.addEventListener('change', (e) => {
                this.filters.rank = e.target.value;
                this.pagination.page = 1;
                this.loadPersonas();
            });
        }

        // 정렬
        const sortSelect = document.getElementById('sort-select');
        if (sortSelect) {
            sortSelect.addEventListener('change', (e) => {
                const [sort_by, sort_order] = e.target.value.split('-');
                this.filters.sort_by = sort_by;
                this.filters.sort_order = sort_order;
                this.pagination.page = 1;
                this.loadPersonas();
            });
        }

        // 새 페르소나 추가
        const addBtn = document.getElementById('add-persona-btn');
        if (addBtn) {
            addBtn.addEventListener('click', () => this.showPersonaModal());
        }

        // 모달 닫기
        const modal = document.getElementById('persona-modal');
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal || e.target.classList.contains('modal-close')) {
                    this.hidePersonaModal();
                }
            });
        }

        // 폼 제출
        const form = document.getElementById('persona-form');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.savePersona();
            });
        }
    }

    async loadPersonas() {
        try {
            this.showLoading(true);
            
            const params = new URLSearchParams({
                page: this.pagination.page,
                limit: this.pagination.limit,
                ...this.filters
            });

            // 빈 값 제거
            for (const [key, value] of params.entries()) {
                if (!value) params.delete(key);
            }

            const response = await axios.get(`/api/personas?${params}`);
            
            if (response.data.success) {
                this.personas = response.data.data;
                this.pagination = response.data.pagination;
                this.renderPersonas();
                this.renderPagination();
            } else {
                this.showError('페르소나 목록을 불러오는데 실패했습니다.');
            }
        } catch (error) {
            console.error('Load personas error:', error);
            this.showError('페르소나 목록을 불러오는데 실패했습니다.');
        } finally {
            this.showLoading(false);
        }
    }

    renderPersonas() {
        const container = document.getElementById('personas-grid');
        if (!container) return;

        if (this.personas.length === 0) {
            container.innerHTML = `
                <div class="col-span-full text-center py-12">
                    <i class="fas fa-user-friends text-6xl text-gray-400 mb-4"></i>
                    <h3 class="text-xl font-semibold text-gray-600 mb-2">페르소나가 없습니다</h3>
                    <p class="text-gray-500 mb-4">새로운 페르소나를 추가해보세요.</p>
                    <button class="btn-primary" onclick="personaManager.showPersonaModal()">
                        <i class="fas fa-plus mr-2"></i>페르소나 추가
                    </button>
                </div>
            `;
            return;
        }

        container.innerHTML = this.personas.map(persona => `
            <div class="persona-card bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-all duration-200 cursor-pointer"
                 onclick="personaManager.viewPersona('${persona.id}')">
                <div class="flex items-start justify-between mb-4">
                    <div class="flex-1">
                        <h3 class="text-lg font-semibold text-pwc-dark mb-1">${persona.name}</h3>
                        <p class="text-sm text-gray-600">${persona.company || ''} ${persona.rank || ''}</p>
                        <p class="text-xs text-gray-500">${persona.department || ''}</p>
                    </div>
                    <div class="flex space-x-2">
                        <button class="text-blue-600 hover:text-blue-800 p-1" 
                                onclick="event.stopPropagation(); personaManager.editPersona('${persona.id}')"
                                title="편집">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="text-red-600 hover:text-red-800 p-1" 
                                onclick="event.stopPropagation(); personaManager.deletePersona('${persona.id}')"
                                title="삭제">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>

                <div class="grid grid-cols-2 gap-4 mb-4">
                    <div class="text-center">
                        <div class="text-2xl font-bold text-blue-600">${persona.decision_influence || 0}</div>
                        <div class="text-xs text-gray-500">의사결정력</div>
                    </div>
                    <div class="text-center">
                        <div class="text-2xl font-bold text-green-600">${persona.technical_expertise || 0}</div>
                        <div class="text-xs text-gray-500">기술전문성</div>
                    </div>
                    <div class="text-center">
                        <div class="text-2xl font-bold text-purple-600">${persona.budget_authority || 0}</div>
                        <div class="text-xs text-gray-500">예산권한</div>
                    </div>
                    <div class="text-center">
                        <div class="text-2xl font-bold text-orange-600">${persona.innovation_openness || 0}</div>
                        <div class="text-xs text-gray-500">혁신개방성</div>
                    </div>
                </div>

                <div class="border-t pt-3">
                    <div class="flex items-center justify-between text-sm">
                        <span class="text-gray-600">커뮤니케이션</span>
                        <span class="font-medium">${persona.communication_style || '미정'}</span>
                    </div>
                    <div class="flex items-center justify-between text-sm mt-1">
                        <span class="text-gray-600">위험감수성</span>
                        <span class="font-medium">${persona.risk_tolerance || 0}/10</span>
                    </div>
                </div>

                <div class="mt-3 pt-3 border-t">
                    <p class="text-xs text-gray-500 truncate">
                        ${persona.strategic_priority || '전략적 우선순위 미정'}
                    </p>
                </div>

                <div class="flex items-center justify-between mt-3 text-xs text-gray-400">
                    <span>경력 ${persona.industry_experience || 0}년</span>
                    <span>${this.formatDate(persona.created_at)}</span>
                </div>
            </div>
        `).join('');
    }

    renderPagination() {
        const container = document.getElementById('pagination-container');
        if (!container || this.pagination.total_pages <= 1) {
            if (container) container.innerHTML = '';
            return;
        }

        const { page, total_pages, has_prev, has_next } = this.pagination;
        
        let paginationHTML = '<div class="flex items-center justify-center space-x-2 mt-6">';
        
        // 이전 페이지
        paginationHTML += `
            <button class="px-3 py-2 text-sm border rounded-md ${!has_prev ? 'cursor-not-allowed opacity-50' : 'hover:bg-gray-50'}" 
                    ${has_prev ? `onclick="personaManager.goToPage(${page - 1})"` : 'disabled'}>
                <i class="fas fa-chevron-left"></i>
            </button>
        `;

        // 페이지 번호들
        const startPage = Math.max(1, page - 2);
        const endPage = Math.min(total_pages, page + 2);

        for (let i = startPage; i <= endPage; i++) {
            paginationHTML += `
                <button class="px-3 py-2 text-sm border rounded-md ${i === page ? 'bg-pwc-orange text-white' : 'hover:bg-gray-50'}"
                        onclick="personaManager.goToPage(${i})">
                    ${i}
                </button>
            `;
        }

        // 다음 페이지
        paginationHTML += `
            <button class="px-3 py-2 text-sm border rounded-md ${!has_next ? 'cursor-not-allowed opacity-50' : 'hover:bg-gray-50'}" 
                    ${has_next ? `onclick="personaManager.goToPage(${page + 1})"` : 'disabled'}>
                <i class="fas fa-chevron-right"></i>
            </button>
        `;

        paginationHTML += '</div>';
        
        // 페이지 정보
        paginationHTML += `
            <div class="text-center text-sm text-gray-500 mt-3">
                ${(page - 1) * this.pagination.limit + 1} - ${Math.min(page * this.pagination.limit, this.pagination.total)} / 총 ${this.pagination.total}개
            </div>
        `;

        container.innerHTML = paginationHTML;
    }

    goToPage(page) {
        this.pagination.page = page;
        this.loadPersonas();
    }

    async setupCompanyFilter() {
        try {
            const response = await axios.get('/api/personas/stats/by-company');
            if (response.data.success) {
                const companies = response.data.data.map(stat => stat.company);
                const select = document.getElementById('company-filter');
                if (select) {
                    select.innerHTML = '<option value="">모든 회사</option>' +
                        companies.map(company => `<option value="${company}">${company}</option>`).join('');
                }
            }
        } catch (error) {
            console.error('Load companies error:', error);
        }
    }

    setupRankFilter() {
        const ranks = ['CEO', '대표이사', 'CTO', 'CFO', '부회장', '부사장', '전무', '상무'];
        const select = document.getElementById('rank-filter');
        if (select) {
            select.innerHTML = '<option value="">모든 직급</option>' +
                ranks.map(rank => `<option value="${rank}">${rank}</option>`).join('');
        }
    }

    showPersonaModal(personaId = null) {
        const modal = document.getElementById('persona-modal');
        const form = document.getElementById('persona-form');
        const title = document.getElementById('modal-title');
        
        if (!modal || !form) return;

        this.currentPersona = personaId;
        
        if (personaId) {
            title.textContent = '페르소나 편집';
            this.loadPersonaForEdit(personaId);
        } else {
            title.textContent = '새 페르소나 추가';
            form.reset();
        }

        modal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    }

    hidePersonaModal() {
        const modal = document.getElementById('persona-modal');
        if (modal) {
            modal.classList.add('hidden');
            document.body.style.overflow = 'auto';
            this.currentPersona = null;
        }
    }

    async loadPersonaForEdit(personaId) {
        try {
            const response = await axios.get(`/api/personas/${personaId}`);
            if (response.data.success) {
                const persona = response.data.data;
                const form = document.getElementById('persona-form');
                
                // 폼 필드 채우기
                Object.keys(persona).forEach(key => {
                    const field = form.querySelector(`[name="${key}"]`);
                    if (field && persona[key] !== null) {
                        field.value = persona[key];
                    }
                });
            }
        } catch (error) {
            console.error('Load persona error:', error);
            this.showError('페르소나 정보를 불러오는데 실패했습니다.');
        }
    }

    async savePersona() {
        try {
            const form = document.getElementById('persona-form');
            const formData = new FormData(form);
            const data = {};
            
            for (const [key, value] = formData.entries()) {
                if (value.trim()) {
                    // 숫자 필드 변환
                    if (['budget_authority', 'decision_influence', 'technical_expertise', 
                         'industry_experience', 'risk_tolerance', 'innovation_openness'].includes(key)) {
                        data[key] = parseInt(value) || 0;
                    } else {
                        data[key] = value.trim();
                    }
                }
            }

            let response;
            if (this.currentPersona) {
                response = await axios.put(`/api/personas/${this.currentPersona}`, data);
            } else {
                response = await axios.post('/api/personas', data);
            }

            if (response.data.success) {
                this.showSuccess(this.currentPersona ? '페르소나가 수정되었습니다.' : '페르소나가 추가되었습니다.');
                this.hidePersonaModal();
                this.loadPersonas();
            } else {
                this.showError(response.data.error || '저장에 실패했습니다.');
            }
        } catch (error) {
            console.error('Save persona error:', error);
            this.showError(error.response?.data?.error || '저장에 실패했습니다.');
        }
    }

    viewPersona(personaId) {
        // 페르소나 상세 보기 (향후 구현)
        alert(`페르소나 상세 보기: ${personaId}`);
    }

    editPersona(personaId) {
        this.showPersonaModal(personaId);
    }

    async deletePersona(personaId) {
        if (!confirm('이 페르소나를 삭제하시겠습니까?')) return;

        try {
            const response = await axios.delete(`/api/personas/${personaId}`);
            if (response.data.success) {
                this.showSuccess('페르소나가 삭제되었습니다.');
                this.loadPersonas();
            } else {
                this.showError('삭제에 실패했습니다.');
            }
        } catch (error) {
            console.error('Delete persona error:', error);
            this.showError('삭제에 실패했습니다.');
        }
    }

    // 유틸리티 함수들
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    formatDate(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('ko-KR', {
            year: '2-digit',
            month: 'short',
            day: 'numeric'
        });
    }

    showLoading(show) {
        const overlay = document.getElementById('loading-overlay');
        if (overlay) {
            overlay.style.display = show ? 'flex' : 'none';
        }
    }

    showError(message) {
        this.showAlert(message, 'error');
    }

    showSuccess(message) {
        this.showAlert(message, 'success');
    }

    showAlert(message, type = 'info') {
        const alertDiv = document.createElement('div');
        alertDiv.className = `fixed top-4 right-4 z-50 px-6 py-4 rounded-lg shadow-lg transform transition-all duration-300 translate-x-full`;
        
        if (type === 'error') {
            alertDiv.className += ' bg-red-500 text-white';
        } else if (type === 'success') {
            alertDiv.className += ' bg-green-500 text-white';
        } else {
            alertDiv.className += ' bg-blue-500 text-white';
        }

        alertDiv.innerHTML = `
            <div class="flex items-center">
                <i class="fas fa-${type === 'error' ? 'exclamation-circle' : type === 'success' ? 'check-circle' : 'info-circle'} mr-2"></i>
                <span>${message}</span>
            </div>
        `;

        document.body.appendChild(alertDiv);

        // 슬라이드 인 애니메이션
        setTimeout(() => alertDiv.classList.remove('translate-x-full'), 100);

        // 자동 제거
        setTimeout(() => {
            alertDiv.classList.add('translate-x-full');
            setTimeout(() => alertDiv.remove(), 300);
        }, 3000);
    }
}

// 전역 인스턴스
let personaManager;