param(
    [string]$ServerIp = ""
)

$ErrorActionPreference = "Stop"
$ProjectRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$VenvPython = Join-Path $ProjectRoot "venv\Scripts\python.exe"
$MobileDir = Join-Path $ProjectRoot "mobile"
$EnvFile = Join-Path $MobileDir ".env"
$ModelFile = Join-Path $ProjectRoot "models\melhor_modelo_v2.keras"

if (-not (Test-Path -LiteralPath $ModelFile)) {
    throw "Modelo da IA nao encontrado em models\melhor_modelo_v2.keras. Confirme se o clone foi concluido."
}

if ([string]::IsNullOrWhiteSpace($ServerIp)) {
    $ServerIp = Get-NetIPAddress -AddressFamily IPv4 |
        Where-Object {
            $_.IPAddress -notlike "127.*" -and
            $_.IPAddress -notlike "169.254.*" -and
            $_.InterfaceAlias -notmatch "Loopback|Bluetooth|WSL|vEthernet"
        } |
        Sort-Object -Property InterfaceMetric |
        Select-Object -ExpandProperty IPAddress -First 1
}

if ([string]::IsNullOrWhiteSpace($ServerIp)) {
    throw "Nao foi possivel detectar o IPv4. Execute novamente: .\scripts\setup_notebook.ps1 -ServerIp 192.168.X.X"
}

Write-Host "[1/4] Preparando o ambiente Python..." -ForegroundColor Cyan
if (-not (Test-Path -LiteralPath $VenvPython)) {
    py -3.10 -m venv (Join-Path $ProjectRoot "venv")
}
& $VenvPython -m pip install --upgrade pip
& $VenvPython -m pip install -r (Join-Path $ProjectRoot "requirements.txt")

Write-Host "[2/4] Instalando as dependencias do aplicativo..." -ForegroundColor Cyan
Push-Location $MobileDir
try {
    npm.cmd ci
}
finally {
    Pop-Location
}

Write-Host "[3/4] Criando a configuracao de rede do aplicativo..." -ForegroundColor Cyan
$EnvContent = @(
    "EXPO_PUBLIC_API_URL=http://${ServerIp}:8000"
    "EXPO_PUBLIC_WS_URL=ws://${ServerIp}:8000/ws/predict"
) -join [Environment]::NewLine
Set-Content -LiteralPath $EnvFile -Value $EnvContent -Encoding ascii

Write-Host "[4/4] Verificando os arquivos essenciais..." -ForegroundColor Cyan
Push-Location $ProjectRoot
try {
    & $VenvPython -c "from pathlib import Path; assert Path('models/melhor_modelo_v2.keras').is_file(); print('Modelo da IA: OK')"
}
finally {
    Pop-Location
}

Write-Host ""
Write-Host "Notebook preparado. IP configurado: $ServerIp" -ForegroundColor Green
Write-Host "Terminal 1 (backend):"
Write-Host ".\venv\Scripts\python.exe -m uvicorn src.ws_server:app --host 0.0.0.0 --port 8000"
Write-Host ""
Write-Host "Terminal 2 (aplicativo):"
Write-Host "cd mobile"
Write-Host "npm.cmd start -- --clear"
Write-Host ""
Write-Host "Mantenha o notebook e o celular na mesma rede Wi-Fi e libere a porta 8000 no Firewall do Windows, se solicitado."
