import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from './AuthContext'
import { useTenantContext } from './TenantContext'
import {
  playRingingTone,
  playTaskTone,
  vibrateDevice,
  showNativeNotification,
} from '../lib/notificationSound'
import TaskAlertToast from '../components/TaskAlertToast'

const NotificationContext = createContext({
  sendAdminRing: async () => ({ ok: false }),
  sendTaskAssigned: async () => ({ ok: false }),
  requestNotificationPermission: async () => 'default',
  incomingAlert: null,
  dismissAlert: () => {},
})

export function NotificationProvider({ children }) {
  const { user } = useAuth()
  const { tenantId } = useTenantContext()

  const [incomingAlert, setIncomingAlert] = useState(null)
  const channelRef = useRef(null)

  // Inisialisasi Realtime Broadcast Channel per Tenant
  useEffect(() => {
    if (!supabase || !tenantId || !user) {
      if (channelRef.current) {
        supabase?.removeChannel(channelRef.current)
        channelRef.current = null
      }
      return
    }

    const channelName = `tenant-task-alerts:${tenantId}`
    const channel = supabase.channel(channelName, {
      config: { broadcast: { self: false } },
    })

    channel
      .on('broadcast', { event: 'task-alert' }, ({ payload }) => {
        if (!payload) return

        // Hanya proses jika notifikasi ini memang ditujukan ke user yang sedang login
        if (payload.assigneeId === user.id) {
          if (payload.type === 'admin-ringing') {
            // 1. Bunyikan dering bel urgent (Web Audio)
            playRingingTone()
            // 2. Getarkan HP
            vibrateDevice([300, 150, 300, 150, 450])
            // 3. Tampilkan Native Notification OS / Peramban
            showNativeNotification('⏰ Panggilan Tugas dari Admin!', {
              body: `${payload.senderName || 'Manajer'} mengingatkan tugas: "${payload.taskTitle}". Segera kerjakan!`,
              tag: `ringing-${payload.taskId}`,
              url: `/worksheet?id=${payload.taskId}`,
            })
            // 4. Munculkan Toast Banner Interaktif di Layar
            setIncomingAlert({
              id: Date.now(),
              type: 'ringing',
              title: '⏰ Panggilan Tugas dari Admin!',
              message: `${payload.senderName || 'Manajer'} mengingatkanmu untuk segera mengerjakan brief "${payload.taskTitle}".`,
              taskId: payload.taskId,
            })
          } else if (payload.type === 'task-assigned') {
            // 1. Bunyikan chime tugas baru
            playTaskTone()
            // 2. Getarkan HP
            vibrateDevice([180, 100, 180])
            // 3. Tampilkan Native Notification OS / Peramban
            showNativeNotification('📋 Tugas Baru Masuk', {
              body: `Kamu ditugaskan pada brief: "${payload.taskTitle}".`,
              tag: `task-${payload.taskId}`,
              url: `/worksheet?id=${payload.taskId}`,
            })
            // 4. Munculkan Toast Banner Interaktif di Layar
            setIncomingAlert({
              id: Date.now(),
              type: 'task-assigned',
              title: '📋 Ada Tugas Baru Masuk',
              message: `${payload.senderName || 'Manajer'} baru saja menugaskanmu pada brief "${payload.taskTitle}".`,
              taskId: payload.taskId,
            })
          }
        }
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          channelRef.current = channel
        }
      })

    return () => {
      supabase.removeChannel(channel)
      channelRef.current = null
    }
  }, [tenantId, user])

  // Kirim sinyal dering / senggol dari Admin ke Staf
  const sendAdminRing = useCallback(
    async ({ taskId, taskTitle, assigneeId, note = '' }) => {
      if (!tenantId || !assigneeId) return { ok: false, error: 'Data tidak lengkap' }

      const senderName = user?.email ? user.email.split('@')[0] : 'Admin'
      const payload = {
        type: 'admin-ringing',
        taskId,
        taskTitle,
        assigneeId,
        senderId: user?.id,
        senderName,
        note,
        timestamp: new Date().toISOString(),
      }

      try {
        // 1. Kirim via Realtime Broadcast
        if (channelRef.current) {
          await channelRef.current.send({
            type: 'broadcast',
            event: 'task-alert',
            payload,
          })
        }

        // 2. Catat jejak pengingat di activity_log agar tercatat dalam riwayat
        if (supabase) {
          await supabase.from('activity_log').insert({
            tenant_id: tenantId,
            user_id: user?.id ?? null,
            content_item_id: taskId,
            action: 'ringing_reminder',
            details: {
              target_assignee: assigneeId,
              task_title: taskTitle,
              sender_name: senderName,
              note,
            },
          }).catch(() => {})
        }

        return { ok: true }
      } catch (err) {
        console.error('Gagal mengirim sinyal ringing:', err)
        return { ok: false, error: err.message }
      }
    },
    [tenantId, user]
  )

  // Kirim sinyal tugas baru saat brief dibuat & di-assign
  const sendTaskAssigned = useCallback(
    async ({ taskId, taskTitle, assigneeId }) => {
      if (!tenantId || !assigneeId) return { ok: false }

      // Jika yang menugaskan adalah diri sendiri, tidak perlu kirim notif
      if (user && assigneeId === user.id) return { ok: true }

      const senderName = user?.email ? user.email.split('@')[0] : 'Manajer'
      const payload = {
        type: 'task-assigned',
        taskId,
        taskTitle,
        assigneeId,
        senderId: user?.id,
        senderName,
        timestamp: new Date().toISOString(),
      }

      try {
        if (channelRef.current) {
          await channelRef.current.send({
            type: 'broadcast',
            event: 'task-alert',
            payload,
          })
        }

        if (supabase) {
          await supabase.from('activity_log').insert({
            tenant_id: tenantId,
            user_id: user?.id ?? null,
            content_item_id: taskId,
            action: 'task_assigned',
            details: {
              target_assignee: assigneeId,
              task_title: taskTitle,
              sender_name: senderName,
            },
          }).catch(() => {})
        }

        return { ok: true }
      } catch (err) {
        console.error('Gagal mengirim sinyal tugas baru:', err)
        return { ok: false, error: err.message }
      }
    },
    [tenantId, user]
  )

  // Meminta izin notifikasi peramban/OS
  const requestNotificationPermission = useCallback(async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported'
    try {
      const izin = await Notification.requestPermission()
      return izin
    } catch {
      return 'default'
    }
  }, [])

  const dismissAlert = useCallback(() => {
    setIncomingAlert(null)
  }, [])

  return (
    <NotificationContext.Provider
      value={{
        sendAdminRing,
        sendTaskAssigned,
        requestNotificationPermission,
        incomingAlert,
        dismissAlert,
      }}
    >
      {children}
      {/* Toast Notifikasi Ringing & Tugas Baru In-App */}
      <TaskAlertToast alert={incomingAlert} onDismiss={dismissAlert} />
    </NotificationContext.Provider>
  )
}

export function useTaskNotification() {
  return useContext(NotificationContext)
}
