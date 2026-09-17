# -*- coding: utf-8 -*-
import sys

def replace_first(content, search, replace):
    if search in content:
        return content.replace(search, replace, 1)
    return content

content = open('client/src/components/chat-interface.tsx', 'r', encoding='utf-8').read()

# 1. Philosopher Wrapper fixes
content = content.replace(
    '                ) : (\n                  <>\n                  {/* Has messages — avatar compact at top, messages below */}\n                  <div className="flex flex-col items-center pt-8 pb-3 flex-shrink-0">',
    '                ) : (\n                  <div className="absolute inset-0 overflow-y-auto flex flex-col pb-56">\n                  {/* Has messages — avatar compact at top, messages below */}\n                  <div className="flex flex-col items-center pt-8 pb-3 flex-shrink-0">'
)

content = content.replace(
    '                {/* Messages */}\n                <div className="flex-1 overflow-y-auto min-h-0 px-4 space-y-4 pb-2">',
    '                {/* Messages */}\n                <div className="flex-1 min-h-0 px-4 space-y-4 pb-2">'
)

content = content.replace(
    '                    </div>\n                  )}\n                </div>\n                </>\n                )}\n              </div>\n            )}\n          </div>\n        ) : activeTab === \'blinga-games\' ? (',
    '                    </div>\n                  )}\n                </div>\n                </div>\n                )}\n              </div>\n            )}\n          </div>\n        ) : activeTab === \'blinga-games\' ? ('
)

# 2. Header crisp-outline
content = content.replace('mb-1 ${(settingsToggles.tabsInSidebar', 'mb-1 crisp-outline ${(settingsToggles.tabsInSidebar')

# 3. Inner message composer crisp-outline
content = content.replace('${(settingsToggles.glossyOutline ?? true) ? \'glossy-outline\' : \'\'}', 'crisp-outline')

# 4. Function bar pills crisp-outline
content = content.replace('active:scale-95 ${', 'active:scale-95 crisp-outline ${')

# 5. Default/square/circle function buttons crisp-outline
content = content.replace('const squareShadow = (settingsToggles.glossyOutline ?? true) ? \'glossy-outline\' : \'\';', 'const squareShadow = \'crisp-outline\';')

# 6. Message-bar layout 3 buttons crisp-outline
content = content.replace('w-9 h-9 rounded-full transition-all ${', 'w-9 h-9 rounded-full transition-all crisp-outline ${')
content = content.replace('w-9 h-9 text-zinc-800 dark:text-white/85 hover:bg-white/10 dark:hover:bg-white/10 rounded-full transition-all', 'w-9 h-9 text-zinc-800 dark:text-white/85 hover:bg-white/10 dark:hover:bg-white/10 rounded-full transition-all crisp-outline')
content = content.replace('w-9 h-9 text-zinc-400 hover:text-white hover:bg-white/10 dark:hover:bg-white/10 rounded-full transition-all', 'w-9 h-9 text-zinc-400 hover:text-white hover:bg-white/10 dark:hover:bg-white/10 rounded-full transition-all crisp-outline')

open('client/src/components/chat-interface.tsx', 'w', encoding='utf-8').write(content)
print("Fixes applied.")
