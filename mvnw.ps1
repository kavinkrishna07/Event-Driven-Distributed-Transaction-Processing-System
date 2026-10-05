param([Parameter(ValueFromRemainingArguments = $true)][string[]] $MavenArgs)
$ErrorActionPreference = "Stop"
$version = "3.9.9"
$cacheRoot = Join-Path $env:USERPROFILE ".m2\wrapper\dists\apache-maven-$version"
$mavenHome = Join-Path $cacheRoot "apache-maven-$version"
$mavenCommand = Join-Path $mavenHome "bin\mvn.cmd"

if (-not (Test-Path -LiteralPath $mavenCommand)) {
    New-Item -ItemType Directory -Path $cacheRoot -Force | Out-Null
    $archive = Join-Path $cacheRoot "apache-maven-$version-bin.zip"
    $downloadUrl = "https://repo.maven.apache.org/maven2/org/apache/maven/apache-maven/$version/apache-maven-$version-bin.zip"
    Write-Host "Downloading Apache Maven $version..."
    Invoke-WebRequest -Uri $downloadUrl -OutFile $archive
    Expand-Archive -LiteralPath $archive -DestinationPath $cacheRoot -Force
    Remove-Item -LiteralPath $archive
}

& $mavenCommand @MavenArgs
exit $LASTEXITCODE
