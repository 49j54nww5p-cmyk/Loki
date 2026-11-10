#!/usr/bin/env python3
"""Refonte v3 : transforme la feuille de style d'origine (styles.legacy.css) en feuille « à jetons »
(styles.css) : toutes les couleurs passent par des variables (thèmes jour/nuit, plumages de saison),
les rayons et les ombres par des paliers. Relançable : lit toujours styles.legacy.css."""
import re, sys, pathlib
root = pathlib.Path(__file__).resolve().parent.parent / "src"
css = (root.parent / "tools" / "styles.legacy.css").read_text()

# 1) en-tête : polices et :root d'origine retirés (redéfinis dans look.css)
css = re.sub(r'^@font-face\{[^}]*\}\n', '', css, flags=re.M)
css = re.sub(r':root\{.*?color-scheme:dark;\n\}', '/* jetons : voir look.css */', css, count=1, flags=re.S)

KEEP = re.compile(r'\.credit|\.ret\b|\.tag-field|figcaption|\.tchoice|\.gdots|\.gstrip|leaflet|\.mfail|\.zb\b|\.mbtn|\.gthumbs|\.vw|\.bgimg|\.shot\b|\.msono|\.freq|\.qrbox|\.switch::after|\.hplate|\.wing|\.hcal|\.gmap|\.pmap|\.panel \.close|\.sono|\.spectro')
TOK = {  # triplet rgb -> jeton
 (255,203,92):'gold', (31,209,242):'acc', (59,229,157):'good', (255,139,61):'orange', (165,139,255):'lilac',
 (255,111,163):'rose', (255,92,122):'bad', (20,184,166):'teal', (61,123,255):'acc-2', (150,180,255):'text',
 (233,184,114):'gold', (255,181,71):'gold', (255,180,40):'gold', (255,160,60):'orange', (255,248,230):'text',
 (6,10,19):'bg', (3,5,10):'bg', (3,6,12):'bg', (7,12,24):'bg', (9,14,26):'bg', (11,17,31):'card', (12,19,35):'card',
 (15,23,41):'card', (20,30,52):'card-2', (255,255,255):'text',
}
HEX = {  # hex exact -> valeur
 '#1A0C02':'var(--on-gold)', '#2A1A02':'var(--on-gold)', '#2A1407':'var(--on-gold)', '#1A0716':'var(--on-rose)', '#04170E':'var(--on-good)',
 '#04121A':'var(--on-acc)', '#061018':'var(--on-acc)', '#06121A':'var(--on-gold)',
 '#FFE3A6':'var(--gold-ink)', '#FFE08A':'var(--gold-ink)', '#FFF1CC':'var(--gold-ink)', '#FFE9B8':'var(--gold-ink)', '#FFF8E8':'var(--gold-ink)',
 '#0B111F':'var(--card)', '#0B0F1A':'var(--bg-2)', '#0B1830':'var(--card-2)', '#060A13':'var(--bg)', '#1C2A4B':'var(--card-3)', '#1B2846':'var(--card-3)',
 '#152039':'var(--card-2)', '#14223B':'var(--card-2)', '#1B2230':'var(--card-2)', '#0A1222':'var(--card)',
 '#D3DAF0':'var(--text)', '#ECF1FF':'var(--text)', '#E9EEF7':'var(--text)', '#AEB8CC':'var(--muted)', '#A9B5D6':'var(--muted)', '#7884A7':'var(--faint)', '#B9CFDC':'var(--muted)',
 '#C2F7DF':'var(--good-ink)', '#BDF7DC':'var(--good-ink)', '#FFC9D3':'var(--bad-ink)', '#FFC2CE':'var(--bad-ink)', '#9FE8F7':'var(--acc-ink)', '#DDF6FF':'var(--acc-ink)',
 '#CFF8FF':'var(--acc-ink)', '#C8B9FF':'var(--lilac-ink)', '#D6CBFF':'var(--lilac-ink)', '#56A2FF':'var(--acc-2)', '#13B8D8':'var(--acc)', '#1FBF7B':'var(--good)',
 '#E2385A':'var(--bad)', '#FFB547':'var(--gold)', '#1FD1F2':'var(--acc)', '#3D7BFF':'var(--acc-2)', '#14B8A6':'var(--teal)', '#FF8B3D':'var(--orange)',
 '#FFCB5C':'var(--gold)', '#FF6FA3':'var(--rose)', '#FF5C7A':'var(--bad)', '#3BE59D':'var(--good)', '#A58BFF':'var(--lilac)', '#B6F25A':'var(--lime)',
}
INKS = ('gold','orange','rose','lilac','teal','good','bad')
VAR_RENAME = {'cyan':'acc', 'azure':'acc-2'}
stats = dict(rgba=0, hexes=0, radius=0, shadow=0, font=0, ink=0, kept=0)

def pct(a):
    v = float(a) * 100
    return ('%g' % round(v, 1))

def rgba_sub(m):
    r, g, b, a = int(m[1]), int(m[2]), int(m[3]), m[4]
    if (r, g, b) == (0, 0, 0): return m[0]  # traité par propriété
    t = TOK.get((r, g, b))
    if not t: return m[0]
    stats['rgba'] += 1
    return f'color-mix(in srgb,var(--{t}) {pct(a)}%,transparent)'

def radius_sub(m):
    n = float(m[1])
    if n >= 90 or n < 8: return m[0]
    stats['radius'] += 1
    t = 'xl' if n >= 28 else 'lg' if n >= 22 else 'md' if n >= 17 else 'sm' if n >= 12 else 'xs'
    return f'border-radius:var(--r-{t})'

def shadow_fix(val):
    # ombres portées : paliers ; halos colorés supprimés ; anneaux (0 0 0 Npx) et inset conservés
    parts = re.split(r',(?![^()]*\))', val)
    out = []
    for p in parts:
        q = p.strip()
        if 'inset' in q or re.match(r'0 0 0 ', q): out.append(q); continue
        nums = re.findall(r'(-?[\d.]+)px', q)
        blur = float(nums[1]) if len(nums) > 1 else 0
        if 'rgba(0,0,0' in q or '#000' in q or 'var(--bg)' in q or 'var(--card)' in q:
            stats['shadow'] += 1
            out.append('var(--sh-3)' if blur >= 30 else 'var(--sh-2)' if blur >= 12 else 'var(--sh-1)')
        else:
            stats['shadow'] += 1  # halo coloré : supprimé
    return ','.join(out) if out else 'none'

def font_sub(m):
    w, style, size, lh = m[1], m[2] or '', float(m[3]), m[4]
    stats['font'] += 1
    if size <= 17:
        return f'font:{max(int(w), 700)} {style}{m[3]}px/{lh} var(--f-ui)'
    s2 = round(size * 1.22)
    return f'font:800 {style}{s2}px/{lh} var(--f-display)'

def fix_decl(sel, d):
    if ':' not in d: return d
    prop, val = d.split(':', 1)
    p = prop.strip()
    keep = bool(KEEP.search(sel))
    val = re.sub(r'var\(--(cyan|azure)\b', lambda m: 'var(--' + VAR_RENAME[m[1]], val)
    val = re.sub(r'font:(\d+) (italic )?([\d.]+)px/([\d.]+) var\(--f-display\)', font_sub, p + ':' + val).split(':', 1)[1] if p == 'font' else val
    if p == 'border-radius':
        val2 = re.sub(r'^border-radius:\s*([\d.]+)px$', radius_sub, 'border-radius:' + val.strip())
        val = val2.split(':', 1)[1]
    if keep:
        stats['kept'] += 1
        return prop + ':' + val
    if p == 'box-shadow' and 'var(--sh' not in val:
        val = shadow_fix(val)
    val = re.sub(r'rgba\((\d+),(\d+),(\d+),\s*([\d.]+)\)', rgba_sub, val)
    if p in ('background', 'background-color') and 'rgba(0,0,0' in val:
        val = re.sub(r'rgba\(0,0,0,\s*([\d.]+)\)', lambda m: f'color-mix(in srgb,var(--text) {pct(float(m[1]) * .28)}%,transparent)', val)
    def hx(m):
        k = m[0].upper()
        if k in HEX: stats['hexes'] += 1; return HEX[k]
        return m[0]
    val = re.sub(r'#[0-9A-Fa-f]{6}\b', hx, val)
    if p == 'color':
        if val.strip().lower() in ('#fff', '#ffffff'): val = 'var(--text)'
        def ink(m):
            stats['ink'] += 1
            return f'var(--{m[1]}-ink)'
        val = re.sub(r'var\(--(acc|' + '|'.join(INKS) + r')\)', ink, val)
    return prop + ':' + val

def fix_rule(m):
    sel, body = m[1], m[2]
    s = sel.strip().split('\n')[-1].strip()
    decls = re.split(r';(?![^()]*\))', body)
    return sel + '{' + ';'.join(fix_decl(s, d) for d in decls) + '}'

# section « Piaf en main » (planches sur papier) : couleurs laissées telles quelles
a = css.find('/* ---------- Piaf en main')
b = css.find('/* ---------- Sur mesure en avant')
head, hand, tail = css[:a], css[a:b], css[b:]
rule = re.compile(r'([^{}]+)\{([^{}]*)\}')
head = rule.sub(fix_rule, head); tail = rule.sub(fix_rule, tail)
hand = re.sub(r'var\(--(cyan|azure)\b', lambda m: 'var(--' + VAR_RENAME[m[1]], hand)
hand = re.sub(r'font:(\d+) (italic )?([\d.]+)px/([\d.]+) var\(--f-display\)', font_sub, hand)
css = head + hand + tail
(root / "styles.css").write_text(css)
print(stats, len(css))
left = re.findall(r'rgba\(\d+,\d+,\d+,[^)]*\)|#[0-9A-Fa-f]{3,6}\b', head + tail)
from collections import Counter
print(Counter(left).most_common(40))
