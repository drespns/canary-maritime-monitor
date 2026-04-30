$ErrorActionPreference = "SilentlyContinue"

$root = (Resolve-Path "$PSScriptRoot\..").Path

Get-CimInstance Win32_Process | Where-Object {
  $_.CommandLine -match "src/ingestion/producer.py" -or
  $_.CommandLine -match "src/ingestion/consumer_test.py" -or
  $_.CommandLine -match "src/processing/spark_stream.py"
} | ForEach-Object {
  Stop-Process -Id $_.ProcessId -Force
}

Set-Location (Join-Path $root "docker")
docker compose --profile spark --profile web down

Write-Host "Procesos y contenedores detenidos."
