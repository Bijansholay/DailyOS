// Browser and service-worker notification helpers

export function getNotificationStatus() {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return { supported: false, secure: false, permission: 'unsupported' };
  }

  const localDevelopmentHost = ['localhost', '127.0.0.1', '[::1]'].includes(window.location.hostname);
  return {
    supported: true,
    secure: window.isSecureContext || localDevelopmentHost,
    permission: Notification.permission
  };
}

export async function requestNotificationPermission() {
  const status = getNotificationStatus();
  if (!status.supported || !status.secure) {
    console.warn('Notifications require a supported browser on HTTPS or localhost.');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    try {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    } catch (error) {
    console.error('Notification permission request failed:', error);
    return false;
    }
  }

  return false;
}

export async function sendDesktopNotification(title, options = {}) {
  const status = getNotificationStatus();
  if (!status.supported || !status.secure || status.permission !== 'granted') {
    return;
  }

  try {
    const notificationOptions = {
      icon: '/favicon.svg',
      badge: '/favicon.svg',
      tag: 'dailyos-notification',
      ...options
    };

    // Service-worker notifications are the correct path for an installed PWA.
    const registration = await navigator.serviceWorker?.getRegistration();
    if (registration?.showNotification) {
      await registration.showNotification(title, notificationOptions);
      return;
    }

    const n = new Notification(title, notificationOptions);

    n.onclick = () => {
      window.focus();
      n.close();
    };
  } catch (error) {
    console.error('Error triggering notification:', error);
  }
}

// Check scheduled tasks every minute and send alert when time matches
export function startTaskNotificationScheduler(tasks) {
  const status = getNotificationStatus();
  if (!status.supported || !status.secure || status.permission !== 'granted') return () => {};

  const checkScheduledTasks = () => {
    const now = new Date();
    const currentHHMM = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    tasks.forEach(task => {
      if (task.status === 'pending' && task.scheduled_time === currentHHMM) {
        sendDesktopNotification(`⏰ Task Reminder: ${task.title}`, {
          body: `Scheduled for ${task.scheduled_time} (${task.estimated_minutes} min est). Time to focus!`,
          requireInteraction: true
        });
      }
    });
  };

  const intervalId = setInterval(checkScheduledTasks, 60000); // Check every 60 seconds
  return () => clearInterval(intervalId);
}
