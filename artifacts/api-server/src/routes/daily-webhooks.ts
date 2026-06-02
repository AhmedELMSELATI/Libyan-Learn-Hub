import { Router } from "express";
import { db } from "@workspace/db";
import { liveSessionsTable } from "@workspace/db";
import { like } from "drizzle-orm";

const router = Router();

router.post("/daily", async (req, res) => {
  try {
    const payload = req.body;
    
    // Daily webhooks have a type field
    if (payload.type === "recording.ready-to-download") {
      const roomName = payload.payload?.room_name;
      // In a real implementation, you might use a signed download URL or S3 bucket URL.
      // We will use the recording's download URL or access link if available.
      // Daily.co usually provides an S3 URL or an API link.
      const downloadUrl = payload.payload?.download_link || payload.payload?.url;
      
      if (roomName && downloadUrl) {
        // Find session by matching the room_name in the meetingUrl
        // Our meeting urls look like https://mock.daily.co/edulibya-1-abc1234
        await db.update(liveSessionsTable)
          .set({ recordingUrl: downloadUrl })
          .where(like(liveSessionsTable.meetingUrl, `%${roomName}%`));
          
        console.log(`Updated session recording for room ${roomName} with URL: ${downloadUrl}`);
      }
    }
    
    // Always return 200 OK so Daily doesn't retry
    res.status(200).json({ received: true });
  } catch (error) {
    console.error("Daily webhook error:", error);
    res.status(500).send("Internal Server Error");
  }
});

export default router;
