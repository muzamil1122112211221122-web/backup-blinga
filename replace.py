import sys
content = open('client/src/components/chat-interface.tsx', 'r', encoding='utf-8').read()
content = content.replace("w-9 h-9 rounded-full transition-all ${", "w-9 h-9 rounded-full transition-all crisp-outline ${")
content = content.replace("w-9 h-9 text-zinc-800 dark:text-white/85 hover:bg-white/10 dark:hover:bg-white/10 rounded-full transition-all", "w-9 h-9 text-zinc-800 dark:text-white/85 hover:bg-white/10 dark:hover:bg-white/10 rounded-full transition-all crisp-outline")
content = content.replace("w-9 h-9 text-zinc-400 hover:text-white hover:bg-white/10 dark:hover:bg-white/10 rounded-full transition-all", "w-9 h-9 text-zinc-400 hover:text-white hover:bg-white/10 dark:hover:bg-white/10 rounded-full transition-all crisp-outline")
open('client/src/components/chat-interface.tsx', 'w', encoding='utf-8').write(content)
