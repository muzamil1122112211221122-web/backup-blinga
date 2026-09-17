import sys
content = open('client/src/components/customize-modal.tsx', 'r', encoding='utf-8').read()

start_str = '              <div className="border-t border-zinc-200 dark:border-zinc-800 pt-6 space-y-4">\n                <div>\n                  <span className="text-sm font-medium text-zinc-700 dark:text-zinc-200">Logo Style</span>'
end_str = '              <div className="border-t border-zinc-200 dark:border-zinc-800 pt-6 space-y-3">\n                <div className="flex items-center justify-between">'

start_idx = content.find(start_str)
end_idx = content.find(end_str)

if start_idx != -1 and end_idx != -1:
    content = content[:start_idx] + content[end_idx:]
    open('client/src/components/customize-modal.tsx', 'w', encoding='utf-8').write(content)
    print("Logo settings removed.")
else:
    print(f"Could not find start ({start_idx}) or end ({end_idx}) strings.")
