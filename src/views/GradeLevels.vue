<template>
  <div class="management-page">
    <!-- Page Header -->
    <div class="page-header">
      <div class="page-header-text">
        <div class="dashboard-header-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"/>
            <path d="M8 7h8"/>
            <path d="M8 11h8"/>
            <path d="M8 15h5"/>
          </svg>
        </div>
        <div>
          <h1>Grade Levels &amp; Sections</h1>
          <p>Define this school's grade levels and their sections. Used in every grade/section dropdown, teacher advisory assignments, and validated on student enrollment.</p>
        </div>
      </div>
      <div class="page-header-actions">
        <button @click="addRow" type="button" class="btn-primary" :disabled="savingGrades">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Add Grade Level
        </button>
        <button @click="saveGrades" type="button" class="btn-secondary" :disabled="savingGrades">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
            <polyline points="17 21 17 13 7 13 7 21"/>
            <polyline points="7 3 7 8 15 8"/>
          </svg>
          {{ savingGrades ? 'Saving…' : 'Save Changes' }}
        </button>
      </div>
    </div>

    <!-- Stats Row -->
    <div class="stats-row">
      <div class="stat-card">
        <div class="stat-icon stat-icon--primary">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"/>
            <path d="M6 6h10"/>
            <path d="M6 10h10"/>
          </svg>
        </div>
        <div class="stat-info">
          <span class="stat-value">{{ gradeRows.length }}</span>
          <span class="stat-label">Grade Levels</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon stat-icon--info">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
            <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
        </div>
        <div class="stat-info">
          <span class="stat-value">{{ totalSections }}</span>
          <span class="stat-label">Total Sections</span>
        </div>
      </div>
    </div>

    <!-- Superadmin school selector -->
    <div v-if="auth.isSuperadmin" class="form-card grades-toolbar">
      <div class="form-group" style="margin: 0;">
        <label>School</label>
        <select v-model="selectedSchoolId" @change="loadGrades">
          <option v-for="s in schools" :key="s.id" :value="s.id">
            {{ s.name }}{{ s.school_id ? ' (' + s.school_id + ')' : '' }}
          </option>
        </select>
      </div>
    </div>

    <!-- Empty notice -->
    <div v-if="!gradeRows.length" class="form-card grades-empty">
      <div class="grades-empty-icon">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
          <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"/>
          <path d="M8 7h8"/>
          <path d="M8 11h8"/>
          <path d="M8 15h5"/>
        </svg>
      </div>
      <h3>No grade levels yet</h3>
      <p>Add at least one grade level and section before enrolling students or assigning teachers.</p>
      <button @click="addRow" type="button" class="btn-primary" style="margin-top: 12px;">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="12" y1="5" x2="12" y2="19"/>
          <line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
        Add First Grade Level
      </button>
    </div>

    <!-- Grade Cards -->
    <div v-else class="grades-grid">
      <div v-for="(g, i) in gradeRows" :key="i" class="form-card grade-card">
        <div class="grade-card-header">
          <div class="grade-card-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"/>
              <path d="M8 7h8"/>
              <path d="M8 11h8"/>
              <path d="M8 15h5"/>
            </svg>
          </div>
          <div class="grade-card-title">
            <input
              v-model="g.grade"
              class="grade-card-name-input"
              placeholder="Grade level name"
              aria-label="Grade level name"
            />
            <span class="grade-card-meta">
              {{ g.sections.length }} {{ g.sections.length === 1 ? 'section' : 'sections' }}
            </span>
          </div>
          <button
            type="button"
            @click="removeRow(i)"
            class="table-action-btn table-action-btn--danger"
            title="Remove grade level"
            aria-label="Remove grade level"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M3 6h18"/>
              <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
              <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
            </svg>
          </button>
        </div>

        <div class="grade-card-body">
          <label class="grade-card-label">Sections</label>
          <div class="section-tags" v-if="g.sections.length">
            <span v-for="(s, si) in g.sections" :key="si" class="section-tag">
              {{ s }}
              <button
                type="button"
                class="section-tag-remove"
                @click="removeSection(i, si)"
                :aria-label="`Remove ${s}`"
              >
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M18 6 6 18"/>
                  <path d="m6 6 12 12"/>
                </svg>
              </button>
            </span>
          </div>
          <p v-else class="grade-card-hint">No sections yet. Add at least one — e.g. <strong>STEM-A</strong>.</p>
          <div class="section-input-row">
            <input
              v-model="g.newSection"
              class="section-input"
              :placeholder="g.sections.length ? 'Add another section…' : 'e.g. STEM-A, then press Enter'"
              @keydown.enter.prevent="addSection(i)"
              @keydown.,prevent="addSection(i)"
            />
            <button
              type="button"
              class="btn-sm"
              @click="addSection(i)"
              :disabled="!g.newSection || !g.newSection.trim()"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"/>
                <line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              Add
            </button>
          </div>
        </div>
      </div>
    </div>

    <p v-if="gradesError" class="error-msg grades-error">{{ gradesError }}</p>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useAuthStore } from '../stores/auth'
import { useNotifications } from '../composables/useNotifications'
import { loadPageState, savePageState } from '../composables/usePageState'

const auth = useAuthStore()
const { notify } = useNotifications()
const schools = ref([])
const savedState = loadPageState(auth.user)
const selectedSchoolId = ref(savedState?.school || '')
const gradeRows = ref([])
const savingGrades = ref(false)
const gradesError = ref('')

function gradesSchoolId() {
  return auth.isSuperadmin ? (selectedSchoolId.value || '') : (auth.schoolId || '')
}

const selectedSchoolName = computed(() => {
  if (!auth.isSuperadmin) return auth.school?.name || auth.school?.school_name || '—'
  const s = schools.value.find(x => x.id === selectedSchoolId.value)
  return s?.name || '—'
})

const totalSections = computed(() =>
  gradeRows.value.reduce((sum, g) => sum + g.sections.length, 0)
)

onMounted(async () => {
  if (auth.isSuperadmin) {
    schools.value = await auth.getSchools()
    selectedSchoolId.value = auth.schoolId || schools.value[0]?.id || ''
  } else {
    selectedSchoolId.value = auth.schoolId || ''
  }
  await loadGrades()
})

watch(selectedSchoolId, () => {
  if (auth.user) savePageState(auth.user, { school: selectedSchoolId.value })
})

async function loadGrades() {
  gradesError.value = ''
  gradeRows.value = []
  const sid = gradesSchoolId()
  if (!sid) return
  try {
    const params = new URLSearchParams({
      userId: auth.user?.id || '',
      userRole: auth.user?.role || ''
    })
    const res = await fetch(`/api/schools/${sid}/grades?${params}`)
    const data = await res.json()
    gradeRows.value = (Array.isArray(data) ? data : []).map(g => ({
      grade: g.grade || '',
      sections: Array.isArray(g.sections) ? [...g.sections] : [],
      newSection: ''
    }))
  } catch (e) {
    gradesError.value = e.message
  }
}

function addRow() {
  gradeRows.value.push({ grade: '', sections: [], newSection: '' })
}

function removeRow(i) {
  gradeRows.value.splice(i, 1)
}

function addSection(i) {
  const row = gradeRows.value[i]
  if (!row) return
  const value = (row.newSection || '').trim()
  if (!value) return
  if (row.sections.includes(value)) {
    row.newSection = ''
    return
  }
  row.sections.push(value)
  row.newSection = ''
}

function removeSection(i, si) {
  gradeRows.value[i].sections.splice(si, 1)
}

async function saveGrades() {
  savingGrades.value = true
  gradesError.value = ''
  try {
    const sid = gradesSchoolId()
    if (!sid) throw new Error('No school selected')
    const levels = gradeRows.value
      .map(g => ({
        grade: (g.grade || '').trim(),
        sections: (g.sections || []).map(s => s.trim()).filter(Boolean)
      }))
      .filter(g => g.grade)
    const res = await fetch(
      `/api/schools/${sid}/grades?userId=${auth.user?.id || ''}&userRole=${auth.user?.role || ''}`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: auth.user?.id || '',
          userRole: auth.user?.role || '',
          levels
        })
      }
    )
    const data = await res.json()
    if (!data.success) throw new Error(data.error || 'Failed to save')
    gradeRows.value = (data.levels || []).map(g => ({
      grade: g.grade || '',
      sections: Array.isArray(g.sections) ? [...g.sections] : [],
      newSection: ''
    }))
    notify('Grade levels saved', 'success')
  } catch (e) {
    gradesError.value = e.message
    notify(e.message, 'error')
  } finally {
    savingGrades.value = false
  }
}
</script>

<style scoped>
.page-header-text {
  display: flex;
  align-items: flex-start;
  gap: 14px;
}

.dashboard-header-icon {
  width: 42px;
  height: 42px;
  border-radius: var(--radius-md);
  background: var(--primary-bg);
  color: var(--primary);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.grades-toolbar {
  margin-bottom: 24px;
}

.grades-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
  gap: 18px;
}

.grades-empty {
  text-align: center;
  padding: 48px 20px;
}

.grades-empty-icon {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: var(--primary-bg);
  color: var(--primary);
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 14px;
}

.grades-empty h3 {
  margin: 0 0 4px;
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--foreground);
}

.grades-empty p {
  margin: 0;
  font-size: 0.88rem;
  color: var(--muted-foreground);
}

.grades-error {
  margin-top: 16px;
}

.grade-card {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin: 0;
}

.grade-card-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding-bottom: 14px;
  border-bottom: 1px solid var(--border);
}

.grade-card-icon {
  width: 36px;
  height: 36px;
  border-radius: var(--radius-md);
  background: var(--primary-bg);
  color: var(--primary);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.grade-card-title {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.grade-card-name-input {
  border: none;
  background: transparent;
  font-size: 1.02rem;
  font-weight: 700;
  color: var(--foreground);
  padding: 4px 6px;
  margin-left: -6px;
  border-radius: var(--radius-sm);
  width: 100%;
  outline: none;
  transition: background 0.15s ease;
  font-family: inherit;
}

.grade-card-name-input:hover,
.grade-card-name-input:focus {
  background: var(--secondary);
}

.grade-card-name-input::placeholder {
  color: var(--muted-foreground);
  font-weight: 500;
}

.grade-card-meta {
  font-size: 0.75rem;
  color: var(--muted-foreground);
  font-weight: 500;
  padding-left: 6px;
}

.grade-card-body {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.grade-card-label {
  font-size: 0.74rem;
  font-weight: 600;
  color: var(--muted-foreground);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.grade-card-hint {
  margin: 0;
  font-size: 0.82rem;
  color: var(--muted-foreground);
  background: var(--secondary);
  padding: 8px 10px;
  border-radius: var(--radius-md);
  border: 1px dashed var(--border);
}

.grade-card-hint strong {
  color: var(--foreground);
  font-weight: 600;
}

.section-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.section-tag {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 4px 4px 10px;
  background: var(--primary-bg);
  color: var(--primary);
  border: 1px solid transparent;
  border-radius: 9999px;
  font-size: 0.82rem;
  font-weight: 600;
  transition: border-color 0.15s ease;
}

.section-tag:hover {
  border-color: var(--primary);
}

.section-tag-remove {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  border: none;
  background: transparent;
  color: var(--primary);
  border-radius: 9999px;
  cursor: pointer;
  padding: 0;
  transition: background 0.15s ease, color 0.15s ease;
}

.section-tag-remove:hover {
  background: var(--primary);
  color: var(--primary-foreground);
}

.section-input-row {
  display: flex;
  gap: 8px;
  align-items: center;
}

.section-input {
  flex: 1;
  height: 36px;
  padding: 0 12px;
  background: var(--background);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  font-size: 0.85rem;
  color: var(--foreground);
  outline: none;
  font-family: inherit;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}

.section-input:focus {
  border-color: var(--primary);
  box-shadow: 0 0 0 3px var(--primary-bg);
}

.section-input::placeholder {
  color: var(--muted-foreground);
}

@media (max-width: 720px) {
  .grades-grid {
    grid-template-columns: 1fr;
  }
}
</style>
