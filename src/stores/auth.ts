import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '@/shared/lib/supabase'
import { PLAN_MODULES } from '@/shared/lib/plans'
import type {
  Profile,
  Company,
  CompanyMember,
  CompanyFeature,
  MemberRole,
  FeatureName,
} from '@/shared/lib/supabase'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<Profile | null>(null)
  const memberships = ref<(CompanyMember & { company: Company })[]>([])
  const activeCompany = ref<Company | null>(null)
  const activeRole = ref<MemberRole | null>(null)
  const companyFeatureOverrides = ref<CompanyFeature[]>([])
  const isLoading = ref(false)

  // Módulos activos = los del plan + overrides del superadmin
  const activeModules = computed((): FeatureName[] => {
    if (!activeCompany.value) return []

    const planModules = PLAN_MODULES[activeCompany.value.plan] as FeatureName[]

    const overrideEnabled = companyFeatureOverrides.value
      .filter(f => f.is_enabled)
      .map(f => f.feature)

    const overrideDisabled = companyFeatureOverrides.value
      .filter(f => !f.is_enabled)
      .map(f => f.feature)

    return [
      ...new Set([...planModules, ...overrideEnabled]),
    ].filter(f => !overrideDisabled.includes(f))
  })

  const hasModule = (feature: FeatureName) => activeModules.value.includes(feature)
  const hasRole = (...roles: MemberRole[]) => activeRole.value !== null && roles.includes(activeRole.value)
  const isAdmin = computed(() => activeRole.value === 'admin')
  const isSeller = computed(() => activeRole.value === 'seller')
  const isDoor = computed(() => activeRole.value === 'door')

  async function loadSession() {
    isLoading.value = true
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) { reset(); return }

      // Cargar profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .single()

      if (!profile) { reset(); return }
      user.value = profile

      // Cargar memberships con datos de company
      const { data: memberData } = await supabase
        .from('company_members')
        .select('*, company:companies(*)')
        .eq('user_id', authUser.id)

      memberships.value = (memberData ?? []) as (CompanyMember & { company: Company })[]
    } finally {
      isLoading.value = false
    }
  }

  async function setActiveCompany(company: Company) {
    const membership = memberships.value.find(m => m.company_id === company.id)
    if (!membership) return

    activeCompany.value = company
    activeRole.value = membership.role

    // Cargar feature overrides de esta company
    const { data } = await supabase
      .from('company_features')
      .select('*')
      .eq('company_id', company.id)

    companyFeatureOverrides.value = data ?? []
  }

  async function login(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    await loadSession()
  }

  async function logout() {
    await supabase.auth.signOut()
    reset()
  }

  function reset() {
    user.value = null
    memberships.value = []
    activeCompany.value = null
    activeRole.value = null
    companyFeatureOverrides.value = []
  }

  return {
    // Estado
    user,
    memberships,
    activeCompany,
    activeRole,
    activeModules,
    isLoading,
    // Computed
    isAdmin,
    isSeller,
    isDoor,
    // Métodos
    hasModule,
    hasRole,
    loadSession,
    setActiveCompany,
    login,
    logout,
  }
})
