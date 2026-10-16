export const VIDEO_PROCESSING_QUEUE = 'video-processing';
export const NOTIFICATIONS_QUEUE = 'notifications';

// Notifications Queue Job Names
export const NOTIFICATION_JOBS = {
  NEW_FOLLOWER: 'notification:new_follower',
  FOLLOW_REQUEST: 'notification:follow_request',
  FOLLOW_ACCEPTED: 'notification:follow_accepted',
  VERIFICATION_APPROVED: 'notification:verification_approved',
  VERIFICATION_REJECTED: 'notification:verification_rejected',
} as const;

export const NOTIFICATIONS_QUEUE_TOKEN = 'BullQueue_notifications';

