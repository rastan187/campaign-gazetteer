[CmdletBinding()]
param(
  [string]$MapPath,
  [string]$AssetRoot = "E:\books\RPG\Hex Kit\HPS Cartography Kit",
  [switch]$NoPush
)

$ErrorActionPreference = "Stop"
$repoRoot = Split-Path -Parent $PSScriptRoot
$mapOutput = "content/region1-player-map.json"
$tileOutput = "public/map-tiles"

function Select-HexKitMap {
  Add-Type -AssemblyName System.Windows.Forms
  $dialog = New-Object System.Windows.Forms.OpenFileDialog
  $dialog.Title = "Choose the Hex Kit map to publish"
  $dialog.Filter = "Hex Kit maps (*.map)|*.map|All files (*.*)|*.*"
  $dialog.InitialDirectory = "E:\books\RPG\Hex Kit"
  $dialog.CheckFileExists = $true
  $dialog.Multiselect = $false

  try {
    if ($dialog.ShowDialog() -eq [System.Windows.Forms.DialogResult]::OK) {
      return $dialog.FileName
    }
    return $null
  }
  finally {
    $dialog.Dispose()
  }
}

function Invoke-Checked {
  param(
    [Parameter(Mandatory = $true)][string]$Command,
    [Parameter(Mandatory = $true)][string[]]$Arguments
  )

  & $Command @Arguments
  if ($LASTEXITCODE -ne 0) {
    throw "'$Command $($Arguments -join ' ')' failed with exit code $LASTEXITCODE."
  }
}

try {
  if ([string]::IsNullOrWhiteSpace($MapPath)) {
    $MapPath = Select-HexKitMap
    if ([string]::IsNullOrWhiteSpace($MapPath)) {
      Write-Host "No map selected. Nothing was published."
      exit 0
    }
  }

  if (-not (Test-Path -LiteralPath $MapPath -PathType Leaf)) {
    throw "Hex Kit map not found: $MapPath"
  }
  if (-not (Test-Path -LiteralPath $AssetRoot -PathType Container)) {
    throw "Cartography asset folder not found: $AssetRoot"
  }

  $node = (Get-Command node -ErrorAction Stop).Source
  $git = (Get-Command git -ErrorAction Stop).Source

  Push-Location $repoRoot
  try {
    Write-Host "Preparing: $([System.IO.Path]::GetFileName($MapPath))" -ForegroundColor Cyan

    if (-not $NoPush) {
      $branch = (& $git branch --show-current).Trim()
      if ($LASTEXITCODE -ne 0) { throw "Unable to read the current Git branch." }
      if ($branch -ne "main") {
        throw "Map publishing must be run from the main branch. Current branch: $branch"
      }

      $stagedFiles = @(& $git diff --cached --name-only)
      if ($LASTEXITCODE -ne 0) { throw "Unable to inspect staged files." }
      if ($stagedFiles.Count -gt 0) {
        throw "Other changes are already staged. Commit or unstage them before publishing the map."
      }

      Write-Host "Checking for newer website changes..."
      Invoke-Checked $git @("fetch", "origin", "main")
      $behindCount = [int]((& $git rev-list --count "HEAD..origin/main").Trim())
      if ($LASTEXITCODE -ne 0) { throw "Unable to compare the local and online versions." }
      if ($behindCount -gt 0) {
        Invoke-Checked $git @("pull", "--rebase", "--autostash", "origin", "main")
      }
    }

    Invoke-Checked $node @("scripts/build-hex-map.mjs", $MapPath, $AssetRoot)
    Invoke-Checked $node @("scripts/check-player-map.mjs", $MapPath)

    if ($NoPush) {
      Write-Host "Dry run complete. Nothing was committed or published." -ForegroundColor Green
      return
    }

    $mapChanges = @(& $git status --porcelain -- $mapOutput $tileOutput)
    if ($LASTEXITCODE -ne 0) { throw "Unable to inspect the generated map files." }

    if ($mapChanges.Count -gt 0) {
      Write-Host "Publishing the player-safe changes..." -ForegroundColor Cyan
      Invoke-Checked $git @("add", "--", $mapOutput, $tileOutput)
      $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm"
      Invoke-Checked $git @("commit", "-m", "Update player map ($timestamp)")
    }
    else {
      Write-Host "No new player-visible map changes were found."
    }

    $aheadCount = [int]((& $git rev-list --count "origin/main..HEAD").Trim())
    if ($LASTEXITCODE -ne 0) { throw "Unable to inspect unpublished changes." }
    if ($aheadCount -gt 0) {
      Invoke-Checked $git @("push", "origin", "main")
      Write-Host "Published. The website should refresh within about two minutes:" -ForegroundColor Green
      Write-Host "https://rastan187.github.io/campaign-gazetteer/map/"
    }
    else {
      Write-Host "The online map is already up to date." -ForegroundColor Green
    }
  }
  finally {
    Pop-Location
  }
}
catch {
  Write-Host ""
  Write-Host "Map publishing stopped: $($_.Exception.Message)" -ForegroundColor Red
  exit 1
}
