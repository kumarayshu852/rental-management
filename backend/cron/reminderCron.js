import cron from "node-cron";
import Bill from "../models/billModel.js";

export const startReminderCron = () => {
  // Har din subah 9 baje chalega
  cron.schedule("0 9 * * *", async () => {
    try {
      const fiveDaysAgo = new Date();
      fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 1);

      const overdueBills = await Bill.find({
        isPaid: false,
        createdAt: { $lte: fiveDaysAgo }
      }).populate("userId", "name email");

      if (overdueBills.length > 0) {
        console.log(`⏰ REMINDER: ${overdueBills.length} Bills are overdue.`);
        overdueBills.forEach(b => {
          console.log(`   - ${b.userId?.name} (${b.month}) - ₹${b.totalAmount}`);
        });
      } else {
        console.log("✅There are no overdue bills today.");
      }
    } catch (error) {
      console.log("Cron error:", error);
    }
  });

  console.log("🕒 Reminder cron job started — daily 9 AM check");
};