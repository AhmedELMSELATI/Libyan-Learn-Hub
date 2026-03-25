import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

async function run() {
  try {
    console.log("Starting cloudinary upload...");
    const result = await cloudinary.uploader.upload("c:\\Windows\\Media\\tada.wav", {
      resource_type: "video",
      folder: "test_hls",
      // Just testing standard sp_auto streaming profile.
      // sp_hd generates adaptive bitrate HD profiles
      eager: [
        { streaming_profile: "hd", format: "m3u8" }
      ],
      eager_async: false // we want to wait to see the output
    });
    console.log("Success!");
    console.log("Url:", result.secure_url);
    console.log("Eager:", JSON.stringify(result.eager, null, 2));
  } catch(e: any) {
    console.error("Error:", e.message || e);
  }
}
run();
