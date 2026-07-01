import { PrismaClient } from "@prisma/client";
import { notifyUser } from "./_shared/notify";

const db = new PrismaClient();
const REMINDER_WINDOW_HOURS = 2;

/**
 * Hourly sweep: query users without today's check-in nearing their deadline,
 * send a push/email reminder (sec 2.5).
 */
export async function sendRemindersJob() {
  const users = await db.user.findMany({ where: { currentHiveId: { not: null } } });

  let remindersSent = 0;
  const now = new Date();

  for (const user of users) {
    const nowInTz = new Date(now.toLocaleString("en-US", { timeZone: user.timezone }));
    const [h, m] = user.preferredCheckinTime.split(":").map(Number);

    const deadline = new Date(nowInTz);
    deadline.setHours(h, m, 0, 0);

    const hoursUntilDeadline = (deadline.getTime() - nowInTz.getTime()) / (1000 * 60 * 60);
    const isApproaching = hoursUntilDeadline > 0 && hoursUntilDeadline <= REMINDER_WINDOW_HOURS;
    if (!isApproaching) continue;

    const todayInTz = new Date(nowInTz);
    todayInTz.setHours(0, 0, 0, 0);

    const checkedInToday = await db.checkIn.findFirst({
      where: { userId: user.id, date: todayInTz },
    });
    if (checkedInToday) continue;

    await notifyUser(user.id, "reminder", {
      message: `Don't forget to check in for your ${user.habit} habit today!`,
    });
    remindersSent++;
  }

  return { usersChecked: users.length, remindersSent };
}
