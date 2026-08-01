/**
 * Security Event Email & Audit Notification Service
 * 
 * Logs security events and dispatches email alert notifications
 * for critical administrative actions (Admin Created, Password Changed, Ownership Transferred).
 */

const prisma = require('../db');

async function sendSecurityAlert({ userId, email, eventType, details }) {
  const timestamp = new Date().toLocaleString();
  console.log(`\n📧 ================= SECURITY EMAIL ALERT =================`);
  console.log(`📩 To: ${email}`);
  console.log(`🔔 Event: ${eventType}`);
  console.log(`⏰ Timestamp: ${timestamp}`);
  console.log(`📝 Details: ${details}`);
  console.log(`==========================================================\n`);

  // Persist security notification to database audit history
  try {
    if (userId) {
      await prisma.notification.create({
        data: {
          userId,
          title: `Security Alert: ${eventType}`,
          message: details,
          type: 'warning',
        },
      });

      await prisma.activityHistory.create({
        data: {
          userId,
          action: eventType,
          metadata: details,
        },
      });
    }
  } catch (err) {
    console.warn('[Audit Log Warning] Could not persist notification to DB:', err.message);
  }
}

module.exports = {
  sendSecurityAlert,
};
