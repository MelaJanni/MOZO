import { useNotificationsStore } from '@/stores/notifications'
import { useAuthStore } from '@/stores/auth'

export const staffNotificationTypes = {
  NEW_REQUEST: 'staff_request',
  REQUEST_APPROVED: 'staff_request_approved', 
  REQUEST_REJECTED: 'staff_request_rejected',
  STAFF_INVITATION: 'staff_invitation',
  INVITATION_ACCEPTED: 'staff_invitation_accepted',
  INVITATION_DECLINED: 'staff_invitation_declined'
}

export function createStaffRequestNotification(staffRequest, businessName) {
  const notificationsStore = useNotificationsStore()
  
  const notification = {
    id: `staff_req_${staffRequest.id}_${Date.now()}`,
    type: staffNotificationTypes.NEW_REQUEST,
    data: {
      title: '👥 Nueva solicitud de personal',
      message: `${staffRequest.name} quiere unirse a ${businessName}`,
      route: '/admin/staff/requests',
      staff_request_id: staffRequest.id,
      requester_name: staffRequest.name,
      business_name: businessName
    },
    created_at: new Date().toISOString()
  }
  
  notificationsStore.addNewNotification(notification)
  return notification
}

export function createStaffApprovedNotification(staffRequest, businessName) {
  const notificationsStore = useNotificationsStore()
  
  const notification = {
    id: `staff_approved_${staffRequest.id}_${Date.now()}`,
    type: staffNotificationTypes.REQUEST_APPROVED,
    data: {
      title: '✅ ¡Solicitud aprobada!',
      message: `${businessName} te ha aceptado como parte del equipo`,
      route: '/waiter/dashboard',
      staff_request_id: staffRequest.id,
      business_name: businessName
    },
    created_at: new Date().toISOString()
  }
  
  notificationsStore.addNewNotification(notification)
  return notification
}

export function createStaffRejectedNotification(staffRequest, businessName) {
  const notificationsStore = useNotificationsStore()
  
  const notification = {
    id: `staff_rejected_${staffRequest.id}_${Date.now()}`,
    type: staffNotificationTypes.REQUEST_REJECTED,
    data: {
      title: '❌ Solicitud rechazada',
      message: `${businessName} ha rechazado tu solicitud`,
      route: '/waiter/dashboard',
      staff_request_id: staffRequest.id,
      business_name: businessName
    },
    created_at: new Date().toISOString()
  }
  
  notificationsStore.addNewNotification(notification)
  return notification
}

export function createStaffInvitationNotification(staffInvitation, businessName) {
  const notificationsStore = useNotificationsStore()
  
  const notification = {
    id: `staff_invite_${staffInvitation.id}_${Date.now()}`,
    type: staffNotificationTypes.STAFF_INVITATION,
    data: {
      title: '📩 Invitación de trabajo',
      message: `${businessName} te ha invitado a trabajar con ellos`,
      route: '/staff/invitations',
      staff_invitation_id: staffInvitation.id,
      business_name: businessName,
      invitation_token: staffInvitation.invitation_token
    },
    created_at: new Date().toISOString()
  }
  
  notificationsStore.addNewNotification(notification)
  return notification
}

export function createStaffJoinSuccessNotification(businessName) {
  const notificationsStore = useNotificationsStore()
  
  const notification = {
    id: `staff_join_success_${Date.now()}`,
    type: 'staff_join_success',
    data: {
      title: '🎉 ¡Bienvenido al equipo!',
      message: `Te has unido exitosamente a ${businessName}`,
      route: '/waiter/dashboard',
      business_name: businessName
    },
    created_at: new Date().toISOString()
  }
  
  notificationsStore.addNewNotification(notification)
  return notification
}

export function getStaffNotificationIcon(type) {
  switch (type) {
    case staffNotificationTypes.NEW_REQUEST:
      return '👥'
    case staffNotificationTypes.REQUEST_APPROVED:
      return '✅'
    case staffNotificationTypes.REQUEST_REJECTED:
      return '❌'
    case staffNotificationTypes.STAFF_INVITATION:
      return '📩'
    case staffNotificationTypes.INVITATION_ACCEPTED:
      return '🤝'
    case staffNotificationTypes.INVITATION_DECLINED:
      return '⚠️'
    default:
      return '🔔'
  }
}

export function getStaffNotificationRoute(notification) {
  const authStore = useAuthStore()
  const userRole = authStore.user?.role || authStore.user?.selectedRole
  
  if (notification.data?.route) {
    return notification.data.route
  }
  
  // Rutas por defecto según el tipo y rol del usuario
  switch (notification.type) {
    case staffNotificationTypes.NEW_REQUEST:
      return userRole === 'admin' ? '/admin/staff/requests' : '/waiter/dashboard'
    case staffNotificationTypes.REQUEST_APPROVED:
    case staffNotificationTypes.REQUEST_REJECTED:
      return '/waiter/dashboard'
    case staffNotificationTypes.STAFF_INVITATION:
      return '/staff/invitations'
    default:
      return userRole === 'admin' ? '/admin/dashboard' : '/waiter/dashboard'
  }
}