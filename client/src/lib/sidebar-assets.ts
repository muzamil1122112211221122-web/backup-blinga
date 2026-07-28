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
export const SIDEBAR_ASSETS = {
  search: { light: searchLight, dark: searchDark },
  chat: { light: editLight, dark: editDark },
  voice: { light: voiceLight, dark: voiceDark },
  imagine: { light: galleryLight, dark: galleryDark },
  history: { light: historyLight, dark: historyDark },
  close: { light: '/sidebar-close-light.png', dark: '/sidebar-close-dark.png' },
  // Tab icons (string paths — served from /public/)
  ask:    { light: '/tab-ask-light.png',    dark: '/tab-ask-dark.png'    },
  nomad:  { light: '/tab-nomad-light.png',  dark: '/tab-nomad-dark.png'  },
  minds:  { light: '/tab-minds-light.png',  dark: '/tab-minds-dark.png'  },
  games:  { light: '/tab-games-light.png',  dark: '/tab-games-dark.png'  },
  labs:   { light: '/tab-labs-light.png',   dark: '/tab-labs-dark.png'   },
} as const;