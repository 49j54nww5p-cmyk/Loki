#!/usr/bin/env python3
"""Assemble Ramage : index.src.html + app.css + js/*.js (dans l'ordre) -> index.html d'un seul fichier."""
import os,sys,glob,shutil
here=os.path.dirname(os.path.abspath(__file__))
args=[a for a in sys.argv[1:] if not a.startswith("--")]
out=args[0] if args else os.path.join(here,"..")
tpl=open(os.path.join(here,"index.src.html"),encoding="utf-8").read()
css=open(os.path.join(here,"app.css"),encoding="utf-8").read()
sp=open(os.path.join(here,"species.txt"),encoding="utf-8").read().strip()
parts=[]
for f in sorted(glob.glob(os.path.join(here,"js","*.js"))):
    parts.append("/* ===== "+os.path.basename(f)+" ===== */\n"+open(f,encoding="utf-8").read())
js='(function(){\n"use strict";\n'+"\n".join(parts).replace("/*@SPECIES@*/",sp)+"\n})();"
html=tpl.replace("/*@CSS@*/",css).replace("/*@JS@*/",js)
open(os.path.join(out,"index.html"),"w",encoding="utf-8").write(html)
shutil.copy(os.path.join(here,"worklet.js"),os.path.join(out,"worklet.js"))
if "--check" in sys.argv: open(os.path.join(here,"_check.js"),"w").write(js)
print("ok",len(html))
