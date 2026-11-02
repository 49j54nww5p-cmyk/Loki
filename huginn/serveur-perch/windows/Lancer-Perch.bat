@echo off
chcp 65001 >nul
title Ramage - serveur Perch
cd /d "%~dp0"
set PYTHONIOENCODING=utf-8
set "PERCH_DIR=%~dp0perch"
set PORT=7860

echo.
echo  === Ramage : serveur Perch v2 complet ===
echo.

rem --- 1. Python ---
set PY=
py -3 --version >nul 2>nul && set "PY=py -3"
if not defined PY python --version >nul 2>nul && set "PY=python"
if not defined PY (
  echo  Python n'est pas installe. Installation avec winget...
  winget install -e --id Python.Python.3.12 --accept-package-agreements --accept-source-agreements
  echo.
  echo  Python vient d'etre installe : FERME cette fenetre et relance Lancer-Perch.bat
  pause
  exit /b
)

rem --- 2. Bibliotheques (une seule fois) ---
%PY% -c "import numpy, onnxruntime" >nul 2>nul || (
  echo  Installation de numpy et onnxruntime...
  %PY% -m pip install --quiet --upgrade numpy onnxruntime
)

rem --- 3. Tunnel Cloudflare (une seule fois) ---
if not exist cloudflared.exe (
  echo  Telechargement du tunnel Cloudflare...
  curl -L -s -o cloudflared.exe https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe
)

rem --- 4. Serveur Perch dans sa propre fenetre ---
echo  Demarrage de Perch. La 1re fois, il telecharge le modele (413 Mo) : quelques minutes.
start "Perch - NE PAS FERMER" %PY% app.py

:attente
timeout /t 5 /nobreak >nul
curl -s http://localhost:7860 | findstr /c:"classes" >nul || goto attente
echo  Perch est pret.

rem --- 5. Adresse https publique ---
if exist tunnel.log del tunnel.log
start "Tunnel - NE PAS FERMER" /min cloudflared.exe tunnel --no-autoupdate --url http://localhost:7860 --logfile tunnel.log
set URL=
:tunnel
timeout /t 3 /nobreak >nul
for /f "usebackq delims=" %%u in (`powershell -NoProfile -Command "$m=Select-String -Path tunnel.log -Pattern 'https://[a-z0-9-]+\.trycloudflare\.com' -ErrorAction SilentlyContinue; if($m){$m[0].Matches[0].Value}"`) do set "URL=%%u"
if not defined URL goto tunnel

echo %URL%| clip
echo.
echo  ==========================================================
echo   Adresse du serveur (deja copiee) :
echo.
echo     %URL%
echo.
echo   Dans Ramage : Reglages ^> Modeles ^> Serveur Perch complet
echo   colle l'adresse puis touche Tester.
echo  ==========================================================
echo.
echo  Laisse le PC allume et ces fenetres ouvertes.
echo  L'adresse change a chaque lancement : recolle-la dans Ramage.
echo  Pour arreter : ferme les fenetres "Perch" et "Tunnel".
echo.
pause
