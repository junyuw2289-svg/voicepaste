import { redirect } from "next/navigation";

const FALLBACK_DOWNLOAD_URL =
  "https://github.com/junyuw2289-svg/voicepaste/releases/latest/download/VoicePaste.dmg";

export async function GET() {
  redirect(process.env.VOICEPASTE_DMG_URL || FALLBACK_DOWNLOAD_URL);
}
