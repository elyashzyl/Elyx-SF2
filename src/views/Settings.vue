<template>
  <div class="management-page">
    <div class="settings-layout">

      <!-- Left Sidebar -->
      <aside class="settings-sidebar">
        <!-- Profile Card -->
        <div class="settings-profile-card">
          <div class="settings-avatar">
            <span>{{ (auth.user?.name || 'U').charAt(0).toUpperCase() }}</span>
          </div>
          <h3 class="settings-profile-name">{{ auth.user?.name || 'User' }}</h3>
          <p class="settings-profile-email">{{ auth.user?.username || '' }}</p>
          <span class="settings-role-badge" :class="'badge-' + (auth.user?.role || 'teacher')">{{ roleLabel }}</span>
        </div>

        <!-- Navigation -->
        <nav class="settings-nav">
          <button
            class="settings-nav-item"
            :class="{ active: activeTab === 'profile' }"
            @click="activeTab = 'profile'"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
            <span>My Profile</span>
          </button>
          <button
            class="settings-nav-item"
            :class="{ active: activeTab === 'appearance' }"
            @click="activeTab = 'appearance'"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="4"/>
              <path d="M12 2v2"/><path d="M12 20v2"/>
              <path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/>
              <path d="M2 12h2"/><path d="M20 12h2"/>
              <path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/>
            </svg>
            <span>Appearance</span>
          </button>
          <button
            class="settings-nav-item"
            :class="{ active: activeTab === 'school' }"
            @click="activeTab = 'school'"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
            <span>School Information</span>
          </button>
          <button
            v-if="auth.isSuperadmin && schools.length > 1"
            class="settings-nav-item"
            :class="{ active: activeTab === 'switchschool' }"
            @click="activeTab = 'switchschool'"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
            <span>Switch School</span>
          </button>
        </nav>
      </aside>

      <!-- Right Content Area -->
      <main class="settings-content">
        <!-- Welcome Header -->
        <div class="settings-welcome">
          <h1>Welcome back, <strong>{{ auth.user?.name || 'User' }}</strong>!</h1>
          <p>Manage your account settings and preferences.</p>
        </div>

        <!-- Quick Stats -->
        <div class="settings-stats-row">
          <div class="settings-stat-card">
            <div class="settings-stat-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/>
              </svg>
            </div>
            <div>
              <div class="settings-stat-value">{{ roleLabel }}</div>
              <div class="settings-stat-label">Current Role</div>
            </div>
          </div>
          <div class="settings-stat-card">
            <div class="settings-stat-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                <polyline points="9 22 9 12 15 12 15 22"/>
              </svg>
            </div>
            <div>
              <div class="settings-stat-value">{{ form.school_short || form.school_name || '—' }}</div>
              <div class="settings-stat-label">School</div>
            </div>
          </div>
          <div class="settings-stat-card">
            <div class="settings-stat-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="4"/>
                <path d="M12 2v2"/><path d="M12 20v2"/>
                <path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/>
                <path d="M2 12h2"/><path d="M20 12h2"/>
              </svg>
            </div>
            <div>
              <div class="settings-stat-value">{{ theme === 'dark' ? 'Dark' : 'Light' }}</div>
              <div class="settings-stat-label">Theme</div>
            </div>
          </div>
        </div>

        <!-- Profile Tab -->
        <div v-if="activeTab === 'profile'" class="table-card">
          <div class="settings-panel-header">
            <h2>My Profile</h2>
            <p>Update your personal information and password.</p>
          </div>
          <form @submit.prevent="saveProfile" class="settings-form">
            <div class="form-row">
              <div class="form-group">
                <label>Full Name</label>
                <input v-model="profile.name" required />
              </div>
              <div class="form-group">
                <label>Username</label>
                <input v-model="profile.username" required />
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>New Password <span class="label-hint">Leave blank to keep current</span></label>
                <input v-model="profile.password" type="text" placeholder="Enter new password" />
              </div>
              <div class="form-group">
                <label>Role</label>
                <input :value="roleLabel" disabled />
              </div>
            </div>
            <div class="form-group" v-if="auth.user?.grade || auth.user?.section">
              <label>Advisory Class</label>
              <input :value="`${auth.user?.grade || '—'} - ${auth.user?.section || '—'}`" disabled />
            </div>
            <div class="form-actions">
              <button type="submit" class="btn-primary" :disabled="savingProfile">
                {{ savingProfile ? 'Saving...' : 'Save Profile' }}
              </button>
            </div>
            <p v-if="profileError" class="error-msg">{{ profileError }}</p>
          </form>
        </div>

        <!-- Appearance Tab -->
        <div v-if="activeTab === 'appearance'" class="table-card">
          <div class="settings-panel-header">
            <h2>Appearance</h2>
            <p>Customize your visual experience.</p>
          </div>
          <div class="settings-theme-options">
            <button
              class="settings-theme-option"
              :class="{ active: theme === 'light' }"
              @click="setTheme('light')"
            >
              <div class="settings-theme-preview theme-light">
                <div class="theme-preview-bar"></div>
                <div class="theme-preview-content">
                  <div class="theme-preview-line" style="width:60%"></div>
                  <div class="theme-preview-line" style="width:40%"></div>
                </div>
              </div>
              <span>Light</span>
            </button>
            <button
              class="settings-theme-option"
              :class="{ active: theme === 'dark' }"
              @click="setTheme('dark')"
            >
              <div class="settings-theme-preview theme-dark">
                <div class="theme-preview-bar"></div>
                <div class="theme-preview-content">
                  <div class="theme-preview-line" style="width:60%"></div>
                  <div class="theme-preview-line" style="width:40%"></div>
                </div>
              </div>
              <span>Dark</span>
            </button>
          </div>
        </div>

        <!-- School Information Tab -->
        <div v-if="activeTab === 'school'" class="table-card">
          <div class="settings-panel-header">
            <h2>School Information</h2>
            <p>{{ canEditSchool ? 'Edit your school details.' : 'View school details.' }}</p>
          </div>
          <form @submit.prevent="save" class="settings-form">
            <div class="form-row">
              <div class="form-group">
                <label>School Name</label>
                <input v-model="form.school_name" :disabled="!canEditSchool" />
              </div>
              <div class="form-group">
                <label>School ID</label>
                <input v-model="form.school_id" :disabled="!canEditSchool" placeholder="e.g. 406219" />
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Short Name / Abbreviation</label>
                <input v-model="form.school_short" :disabled="!canEditSchool" placeholder="e.g. BPHS" />
              </div>
              <div class="form-group">
                <label>Address</label>
                <input v-model="form.school_address" :disabled="!canEditSchool" placeholder="e.g. Baguio City" />
              </div>
            </div>
            <div class="form-actions" v-if="canEditSchool">
              <button type="submit" class="btn-primary" :disabled="saving">
                {{ saving ? 'Saving...' : 'Save School Info' }}
              </button>
            </div>
            <p v-if="error" class="error-msg">{{ error }}</p>
          </form>
        </div>

        <!-- Switch School Tab (Superadmin) -->
        <div v-if="activeTab === 'switchschool'" class="table-card">
          <div class="settings-panel-header">
            <h2>Switch School</h2>
            <p>Select which school to manage.</p>
          </div>
          <div class="form-group" style="max-width: 480px;">
            <label>School</label>
            <select v-model="selectedSchoolId" @change="onSchoolChange">
              <option value="">None</option>
              <option v-for="s in schools" :key="s.id" :value="s.id">{{ s.name }}</option>
            </select>
          </div>
        </div>

      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useAuthStore } from '../stores/auth'
import { useTheme } from '../composables/useTheme'
import { useNotifications } from '../composables/useNotifications'
import { useActiveSchool } from '../composables/useActiveSchool'

const auth = useAuthStore()
const { notify } = useNotifications()
const { theme, setTheme } = useTheme()
const { setActiveSchool, clearActiveSchool, noneSelected } = useActiveSchool()

const activeTab = ref('profile')
const saving = ref(false)
const error = ref('')
const schools = ref([])
const selectedSchoolId = ref('')
const form = reactive({
  school_name: '',
  school_id: '',
  school_short: '',
  school_address: ''
})
const profile = reactive({ name: '', username: '', password: '' })
const savingProfile = ref(false)
const profileError = ref('')

const canEditSchool = computed(() => auth.isSuperadmin || auth.user?.role === 'admin')
const roleLabel = computed(() => {
  const r = auth.user?.role
  return r === 'superadmin' ? 'Superadmin' : r === 'admin' ? 'Administrator' : 'Teacher'
})

onMounted(async () => {
  profile.name = auth.user?.name || ''
  profile.username = auth.user?.username || ''
  if (auth.isSuperadmin) {
    schools.value = await auth.getSchools()
    selectedSchoolId.value = noneSelected.value ? '' : (auth.schoolId || schools.value[0]?.id || '')
  } else {
    selectedSchoolId.value = auth.schoolId || ''
  }
  await loadSchool()
})

async function onSchoolChange() {
  if (!selectedSchoolId.value) {
    form.school_name = ''
    form.school_id = ''
    form.school_short = ''
    form.school_address = ''
    clearActiveSchool()
    notify('No school selected', 'info')
    return
  }
  await loadSchool()
  const school = schools.value.find(s => s.id === selectedSchoolId.value)
  if (school) {
    setActiveSchool({
      id: school.id,
      name: school.name,
      school_name: school.name,
      short: school.short,
      school_short: school.short,
      school_id: school.school_id,
    })
    notify(`Switched to ${school.name || 'school'}`, 'success')
  }
}

async function loadSchool() {
  if (!selectedSchoolId.value) {
    form.school_name = ''
    form.school_id = ''
    form.school_short = ''
    form.school_address = ''
    return
  }
  const data = await auth.getSchoolInfo(auth.isSuperadmin ? selectedSchoolId.value : undefined)
  const fallback = auth.user?.school || null
  if (data || fallback) {
    form.school_name = data?.school_name || fallback?.name || fallback?.school_name || ''
    form.school_id = data?.school_id || fallback?.school_id || ''
    form.school_short = data?.school_short || fallback?.short || fallback?.school_short || ''
    form.school_address = data?.school_address || fallback?.address || fallback?.school_address || ''
  }
}

async function saveProfile() {
  savingProfile.value = true
  profileError.value = ''
  try {
    const payload = { name: profile.name, username: profile.username }
    if (profile.password) payload.password = profile.password
    await auth.updateUser(auth.user.id, payload)
    profile.password = ''
    notify('Profile updated', 'success')
  } catch (e) {
    profileError.value = e.message
    notify(e.message, 'error')
  } finally {
    savingProfile.value = false
  }
}

async function save() {
  saving.value = true
  error.value = ''
  if (auth.isSuperadmin && !selectedSchoolId.value) {
    saving.value = false
    error.value = 'Select a school first'
    return
  }
  try {
    await auth.saveSchoolInfo({ ...form }, auth.isSuperadmin ? (selectedSchoolId.value || undefined) : undefined)
    notify('School settings saved', 'success')
  } catch (e) {
    error.value = e.message
    notify(e.message, 'error')
  } finally {
    saving.value = false
  }
}
</script>
