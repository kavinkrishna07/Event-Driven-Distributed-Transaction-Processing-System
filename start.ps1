$ErrorActionPreference = "Stop"
$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $projectRoot

$hasJdk = -not [string]::IsNullOrWhiteSpace($env:JAVA_HOME) -and
    (Test-Path -LiteralPath (Join-Path $env:JAVA_HOME "bin\javac.exe"))
if (-not $hasJdk) {
    $jdkRoots = @(
        "C:\Program Files\Java\jdk-*",
        "C:\Program Files\Eclipse Adoptium\jdk-*",
        "C:\Program Files\Microsoft\jdk-*",
        "C:\Program Files\Amazon Corretto\jdk*",
        "C:\Program Files\Zulu\zulu-*"
    )
    $jdk = $jdkRoots | ForEach-Object {
        Get-ChildItem $_ -Directory -ErrorAction SilentlyContinue
    } | Where-Object {
        Test-Path -LiteralPath (Join-Path $_.FullName "bin\javac.exe")
    } | Sort-Object FullName -Descending | Select-Object -First 1
    if ($null -eq $jdk) {
        throw "A JDK 17 or newer is required. Install a JDK and run this script again."
    }
    $env:JAVA_HOME = $jdk.FullName
}
$env:PATH = "$(Join-Path $env:JAVA_HOME 'bin');$env:PATH"
Write-Host "Using $env:JAVA_HOME to build Java 17-compatible bytecode."

$mysql = Get-Service MySQL80 -ErrorAction SilentlyContinue
if ($null -eq $mysql -or $mysql.Status -ne "Running") {
    throw "MySQL80 is not running. Start the MySQL service, then run this script again."
}

if (-not (Test-Path -LiteralPath (Join-Path $projectRoot "node_modules"))) {
    Write-Host "Installing the frontend dependencies..."
    npm install
    if ($LASTEXITCODE -ne 0) { throw "npm install failed." }
}

if ([string]::IsNullOrWhiteSpace($env:DB_PASSWORD)) {
    $securePassword = Read-Host "Enter your local MySQL root password" -AsSecureString
    $passwordPointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($securePassword)
    try {
        $env:DB_PASSWORD = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($passwordPointer)
    } finally {
        [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($passwordPointer)
    }
}

$backend = $null
try {
    $health = Invoke-RestMethod -Uri "http://127.0.0.1:8080/api/health" -TimeoutSec 2
    if ($health.status -ne "ok") { $health = $null }
} catch {
    $health = $null
}
if ($null -eq $health) {
    $backend = Start-Process powershell.exe -PassThru -WorkingDirectory $projectRoot -ArgumentList @(
        "-NoExit", "-ExecutionPolicy", "Bypass", "-Command", "& '.\mvnw.ps1' spring-boot:run"
    )
}

$frontend = $null
try {
    $page = Invoke-WebRequest -Uri "http://127.0.0.1:5173" -UseBasicParsing -TimeoutSec 2
    if ($page.StatusCode -ne 200 -or $page.Content -notmatch "BrightCart") { $page = $null }
} catch {
    $page = $null
}
if ($null -eq $page) {
    $frontend = Start-Process powershell.exe -PassThru -WorkingDirectory $projectRoot -ArgumentList @(
        "-NoExit", "-ExecutionPolicy", "Bypass", "-Command", "npm run dev"
    )
}

Write-Host "Starting BrightCart..."
if ($null -ne $backend -or $null -ne $frontend) { Start-Sleep -Seconds 8 }
if ($null -ne $backend -and $backend.HasExited) { throw "The Java server stopped during startup. Check the backend console for details." }
if ($null -ne $frontend -and $frontend.HasExited) { throw "The React server stopped during startup. Check the frontend console for details." }
Write-Host "Frontend: http://127.0.0.1:5173"
Write-Host "Backend:  http://127.0.0.1:8080/api/health"
Write-Host "Keep both server windows open while using the demo."
