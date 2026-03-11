import { redirect } from "next/navigation";

const FALLBACK_DOWNLOAD_URL =
  "https://github.com/Jaredw2289-svg/voicepaste/releases/latest/download/VoicePaste.dmg";

export async function GET() {
  redirect(FALLBACK_DOWNLOAD_URL);
}
