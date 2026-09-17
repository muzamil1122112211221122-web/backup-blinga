import sys
content = open('client/src/components/logo.tsx', 'r', encoding='utf-8').read()

spin_class_search = 'className="absolute inset-0 object-contain blinga-uploaded-rings-spin"'
spin_class_replace = 'className="absolute inset-0 object-contain"'
content = content.replace(spin_class_search, spin_class_replace)

tint_and_f_search = """        {/* Accent colour overlay  tints the rings via mix-blend-mode:color */}
        <div
          className="blinga-rings-accent-tint absolute inset-0 pointer-events-none"
          style={{ zIndex: 1, borderRadius: '50%' }}
        />
        {/* F letter  stays static, above the tint overlay */}
        <span
          aria-label="Blinga"
          style={{
            position: "relative",
            zIndex: 2,
            fontSize: font * 0.72,
            fontWeight: 400,
            fontFamily: "Georgia, 'Times New Roman', serif",
            lineHeight: 1,
            userSelect: "none",
            color: "currentColor",
            marginTop: `-${Math.round(font * 0.13)}px`,
            marginLeft: `${Math.round(font * 0.06)}px`,
          }}
        >
          '
        </span>"""

# I will use python string finding since the special characters might be an issue.
import re
content = re.sub(r'\{\/\* Accent colour overlay.*?<\/span>', '', content, flags=re.DOTALL)

open('client/src/components/logo.tsx', 'w', encoding='utf-8').write(content)
print("Overlay and spin removed.")
