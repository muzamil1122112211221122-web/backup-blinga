import galleryLight from "@assets/gallery_1784832046472.png";
import galleryDark from "@assets/gallery_2_1784832046466.png";
import searchLight from "@assets/search-interface-symbol_1784832046471.png";
import searchDark from "@assets/search-interface-symbol_2_1784832046467.png";
import editLight from "@assets/edit_1784832046470.png";
import editDark from "@assets/edit_2_1784832046467.png";
import voiceLight from "@assets/voice-note_1784832046470.png";
import voiceDark from "@assets/voice-note_2_1784832046468.png";
import historyLight from "@assets/search_1784832046469.png";
import historyDark from "@assets/search_2_1784832046468.png";
import sidebarLight from "@assets/sidebar_1784832478328.png";
import sidebarDark from "@assets/sidebar_2_1784832478327.png";

export const SIDEBAR_ASSETS = {
  search: { light: searchLight, dark: searchDark },
  chat: { light: editLight, dark: editDark },
  voice: { light: voiceLight, dark: voiceDark },
  imagine: { light: galleryLight, dark: galleryDark },
  history: { light: historyLight, dark: historyDark },
  close: { light: sidebarLight, dark: sidebarDark },
} as const;