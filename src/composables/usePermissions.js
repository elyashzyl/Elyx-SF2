import { computed } from 'vue'
import { useAuthStore } from '../stores/auth'

/**
 * Centralized RBAC permission helper for ElyTrack.
 * Controls access to administrative modules, sensitive actions, and UI elements.
 */
export function usePermissions() {
  const auth = useAuthStore()

  const role = computed(() => auth.user?.role || '')

  const isSuperadmin = computed(() => role.value === 'superadmin')
  const isAdmin = computed(() => role.value === 'admin' || role.value === 'superadmin')
  const isTeacher = computed(() => role.value === 'teacher')

  // School management
  const canManageSchools = computed(() => isSuperadmin.value)
  const canEditSchoolSettings = computed(() => isAdmin.value)
  const canSwitchSchools = computed(() => isSuperadmin.value)

  // User management
  const canManageUsers = computed(() => isAdmin.value)
  const canCreateAdmins = computed(() => isSuperadmin.value)
  const canAssignAdviser = computed(() => isAdmin.value)

  // Students & enrollment
  const canManageStudents = computed(() => isAdmin.value)
  const canBulkActionStudents = computed(() => isAdmin.value)
  const canWithdrawStudent = computed(() => isAdmin.value)
  const canReenrollStudent = computed(() => isAdmin.value)

  // Attendance
  const canTakeAttendance = computed(() => isTeacher.value || isAdmin.value)
  const canReopenAttendance = computed(() => isAdmin.value)
  const canManageMonthlySF2 = computed(() => isTeacher.value || isAdmin.value)
  const canDeleteMonthlyRecord = computed(() => isAdmin.value || isTeacher.value)

  // Grading & Form 138 (SF9)
  const canEncodeGrades = computed(() => isTeacher.value || isAdmin.value)
  const canManageSubjects = computed(() => isAdmin.value)
  const canViewForm138 = computed(() => isTeacher.value || isAdmin.value)
  const canEditForm138Grades = computed(() => isTeacher.value || isAdmin.value)

  // Reports & Analytics
  const canViewReports = computed(() => isAdmin.value)
  const canViewCrossCampusReports = computed(() => isSuperadmin.value)
  const canExportSF2 = computed(() => isTeacher.value || isAdmin.value)

  // Terms, Calendar & Configuration
  const canManageQuarterlyTerms = computed(() => isAdmin.value)
  const canManageCalendar = computed(() => isAdmin.value)
  const canManageGradeLevels = computed(() => isAdmin.value)

  // Licenses & Subscriptions
  const canViewLicenses = computed(() => isAdmin.value)
  const canApproveLicenses = computed(() => isSuperadmin.value)
  const canManageSubscriptionPlans = computed(() => isSuperadmin.value)

  // Activity logs & Audit
  const canViewAuditLogs = computed(() => isSuperadmin.value)

  // Support / Inquiries
  const canCreateInquiry = computed(() => !!auth.user)
  const canAssignInquiries = computed(() => isSuperadmin.value)
  const canCloseAnyInquiry = computed(() => isSuperadmin.value)

  function canAccessRoute(routeRole) {
    if (!routeRole) return true
    const allowed = Array.isArray(routeRole) ? routeRole : [routeRole]
    if (isSuperadmin.value && allowed.includes('admin')) return true
    return allowed.includes(role.value)
  }

  return {
    role,
    isSuperadmin,
    isAdmin,
    isTeacher,
    canManageSchools,
    canEditSchoolSettings,
    canSwitchSchools,
    canManageUsers,
    canCreateAdmins,
    canAssignAdviser,
    canManageStudents,
    canBulkActionStudents,
    canWithdrawStudent,
    canReenrollStudent,
    canTakeAttendance,
    canReopenAttendance,
    canManageMonthlySF2,
    canDeleteMonthlyRecord,
    canEncodeGrades,
    canManageSubjects,
    canViewForm138,
    canEditForm138Grades,
    canViewReports,
    canViewCrossCampusReports,
    canExportSF2,
    canManageQuarterlyTerms,
    canManageCalendar,
    canManageGradeLevels,
    canViewLicenses,
    canApproveLicenses,
    canManageSubscriptionPlans,
    canViewAuditLogs,
    canCreateInquiry,
    canAssignInquiries,
    canCloseAnyInquiry,
    canAccessRoute
  }
}
