import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { User } from '@supabase/supabase-js'
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

let _initPromise: Promise<void> | null = null

export const useAuthStore = defineStore('auth', () => {
  // Auth user de Supabase (sesión) — se setea directo del localStorage, sin queries
  const authUser = ref<User | null>(null)
  // Profile del usuario (desde nuestra tabla profiles)
  const profile = ref<Profile | null>(null)
  const memberships = ref<(CompanyMember & { company: Company })[]>([])
  const activeCompany = ref<Company | null>(null)
  const activeRole = ref<MemberRole | null>(null)
  const companyFeatureOverrides = ref<CompanyFeature[]>([])
  const isLoading = ref(false)

  // isAuthenticated se basa en la sesión de Supabase, NO en la query al profile
  const isAuthenticated = computed(() => !!authUser.value)

  const activeModules = computed((): FeatureName[] => {
    if (!activeCompany.value) return []
    const planModules = PLAN_MODULES[activeCompany.value.plan] as FeatureName[]
    const overrideEnabled = companyFeatureOverrides.value
      .filter(f => f.is_enabled).map(f => f.feature)
    const overrideDisabled = companyFeatureOverrides.value
      .filter(f => !f.is_enabled).map(f => f.feature)
    return [...new Set([...planModules, ...overrideEnabled])]
      .filter(f => !overrideDisabled.includes(f))
  })

  // Getters de rol
  const hasModule = (feature: FeatureName) => activeModules.value.includes(feature)
  const hasRole = (...roles: MemberRole[]) => activeRole.value !== null && roles.includes(activeRole.value)
  const isAdmin = computed(() => activeRole.value === 'admin')
  const isSeller = computed(() => activeRole.value === 'seller')
  const isDoor = computed(() => activeRole.value === 'door')

  // Compatibilidad: algunos componentes usan store.user para nombre/avatar
  const user = computed(() => profile.value)

  function initialize() {
    if (!_initPromise) {
      _initPromise = (async () => {
        isLoading.value = true
        try {
          // getSession() lee del localStorage — no hace llamada de red
          const { data: { session } } = await supabase.auth.getSession()
          authUser.value = session?.user ?? null

          if (authUser.value) {
            await fetchProfileAndMemberships(authUser.value.id)
          }

          // Escuchar cambios: token refresh, logout externo, etc.
          // INITIAL_SESSION se ignora porque ya lo manejamos con getSession() arriba
          supabase.auth.onAuthStateChange(async (event, session) => {
            if (event === 'INITIAL_SESSION') return

            authUser.value = session?.user ?? null

            if (session?.user && !profile.value) {
              await fetchProfileAndMemberships(session.user.id)
            }
            if (!session?.user) {
              profile.value = null
              memberships.value = []
              activeCompany.value = null
              activeRole.value = null
              companyFeatureOverrides.value = []
            }
          })
        } finally {
          isLoading.value = false
        }
      })()
    }
    return _initPromise
  }

  async function fetchProfileAndMemberships(userId: string) {
    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (profileData) profile.value = profileData

    const { data: memberData } = await supabase
      .from('company_members')
      .select('*, company:companies(*)')
      .eq('user_id', userId)

    memberships.value = (memberData ?? []) as (CompanyMember & { company: Company })[]

    // Auto-seleccionar si solo tiene una company
    if (memberships.value.length === 1) {
      await setActiveCompany(memberships.value[0].company)
    }
  }

  async function setActiveCompany(company: Company) {
    const membership = memberships.value.find(m => m.company_id === company.id)
    if (!membership) return

    activeCompany.value = company
    activeRole.value = membership.role

    const { data } = await supabase
      .from('company_features')
      .select('*')
      .eq('company_id', company.id)

    companyFeatureOverrides.value = data ?? []
  }

  async function login(email: string, password: string) {
    isLoading.value = true
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
      authUser.value = data.user
      await fetchProfileAndMemberships(data.user.id)
    } finally {
      isLoading.value = false
    }
  }

  function clearActiveCompany() {
    activeCompany.value = null
    activeRole.value = null
    companyFeatureOverrides.value = []
  }

  async function logout() {
    await supabase.auth.signOut()
    authUser.value = null
    profile.value = null
    memberships.value = []
    activeCompany.value = null
    activeRole.value = null
    companyFeatureOverrides.value = []
    _initPromise = null
  }

  return {
    user,
    profile,
    memberships,
    activeCompany,
    activeRole,
    activeModules,
    isLoading,
    isAuthenticated,
    isAdmin,
    isSeller,
    isDoor,
    hasModule,
    hasRole,
    initialize,
    setActiveCompany,
    clearActiveCompany,
    login,
    logout,
  }
})
