import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { supabase } from '@/shared/lib/supabase'
import { useAuthStore } from '@/stores/auth'

export function useApproveRequest() {
  const store = useAuthStore()
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async ({ requestId, userId }: { requestId: string; userId: string }) => {
      const companyId = store.activeCompany!.id

      const { error: insertError } = await supabase
        .from('company_members')
        .insert({ user_id: userId, company_id: companyId, role: 'seller' })
      if (insertError) throw insertError

      const { error: deleteError } = await supabase
        .from('member_requests')
        .delete()
        .eq('id', requestId)
      if (deleteError) throw deleteError
    },
    onSuccess: () => {
      const companyId = store.activeCompany?.id
      qc.invalidateQueries({ queryKey: ['staff-members', companyId] })
      qc.invalidateQueries({ queryKey: ['staff-requests', companyId] })
    },
  })
}

export function useRejectRequest() {
  const store = useAuthStore()
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (requestId: string) => {
      const { error } = await supabase
        .from('member_requests')
        .delete()
        .eq('id', requestId)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['staff-requests', store.activeCompany?.id] })
    },
  })
}

export function useRemoveMember() {
  const store = useAuthStore()
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (memberId: string) => {
      const { error } = await supabase.rpc('remove_company_member', { p_member_id: memberId })
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['staff-members', store.activeCompany?.id] })
    },
  })
}
