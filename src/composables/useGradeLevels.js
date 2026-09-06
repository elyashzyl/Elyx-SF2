import { ref, computed } from 'vue'
import { useAuthStore } from '../stores/auth'

// Shared per-school grade levels + sections.
// Call loadGradeLevels(schoolId?) — defaults to the actor's school (or the
// explicitly selected school for superadmin callers).
export function useGradeLevels() {
  const auth = useAuthStore()
  const levels = ref([])
  const loading = ref(false)

  const grades = computed(() => levels.value.map(l => l.grade))
  const sectionsByGrade = computed(() => {
    const map = {}
    for (const l of levels.value) map[l.grade] = l.sections || []
    return map
  })

  function sectionsFor(grade) {
    return sectionsByGrade.value[grade] || []
  }

  async function loadGradeLevels(schoolId) {
    const sid = schoolId || auth.schoolId || ''
    levels.value = []
    if (!sid) return []
    loading.value = true
    try {
      const params = new URLSearchParams({
        userId: auth.user?.id || '',
        userRole: auth.user?.role || ''
      })
      const res = await fetch(`/api/schools/${sid}/grades?${params}`)
      const data = await res.json()
      levels.value = Array.isArray(data) ? data : []
    } catch {
      levels.value = []
    } finally {
      loading.value = false
    }
    return levels.value
  }

  return { levels, grades, sectionsByGrade, sectionsFor, loading, loadGradeLevels }
}
