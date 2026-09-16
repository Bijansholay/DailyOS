// Browser Native Desktop Notifications Utility

export async function requestNotificationPermission() {
  if (!('Notification' in window)) {
    console.warn('This browser does not support desktop notifications.');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  return false;
}

export function sendDesktopNotification(title, options = {}) {
  if (!('Notification' in window) || Notification.permission !== 'granted') {
    return;
  }

  try {
    const n = new Notification(title, {
      icon: '/favicon.svg',
      badge: '/favicon.svg',
      tag: 'dailyos-notification',
      ...options
    });

    n.onclick = () => {
      window.focus();
      n.close();
    };
  } catch (e) {
    console.error('Error triggering notification:', e);
  }
}

// Check scheduled tasks every minute and send alert when time matches
export function startTaskNotificationScheduler(tasks) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return () => {};

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
