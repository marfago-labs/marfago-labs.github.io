# Deep git history audit — secrets, privacy paths, sensitive files (all commits).
# Usage: .\scripts\audit-git-history.ps1
# Exit 0 = PASS, 1 = BLOCK findings

$ErrorActionPreference = "Stop"

$WorkspaceRoot = Split-Path $PSScriptRoot -Parent
$ReportDir = Join-Path $PSScriptRoot "audit-reports"
New-Item -ItemType Directory -Force -Path $ReportDir | Out-Null

$Timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$ReportPath = Join-Path $ReportDir "audit-$Timestamp.md"

$RepoPaths = @(
    @{ Name = "marfago-labs"; Path = $WorkspaceRoot },
    @{ Name = "ArticleRecommender"; Path = Join-Path $WorkspaceRoot "ArticleRecommender" },
    @{ Name = "text-compressor"; Path = Join-Path $WorkspaceRoot "text-compressor" },
    @{ Name = "ner-gold-generator"; Path = Join-Path $WorkspaceRoot "ner-gold-generator" },
    @{ Name = "ner-dataset"; Path = Join-Path $WorkspaceRoot "ner-dataset" },
    @{ Name = "ner-detector"; Path = Join-Path $WorkspaceRoot "ner-detector" }
)

$Blocks = [System.Collections.Generic.List[string]]::new()
$Cautions = [System.Collections.Generic.List[string]]::new()
$Passes = [System.Collections.Generic.List[string]]::new()

function Add-Block([string]$Msg) { $Blocks.Add($Msg) }
function Add-Caution([string]$Msg) { $Cautions.Add($Msg) }
function Add-Pass([string]$Msg) { $Passes.Add($Msg) }

function Test-EnvExamplePath([string]$Path) {
    return $Path -match '\.env\.example$' -or $Path -match '\.env\..*\.example$'
}

function Test-PlaceholderSecret([string]$Line) {
    $t = $Line.Trim()
    if ($t -match '(?i)(your-key|placeholder|changeme|xxx+|example\.com|localhost|articlerecommender@localhost)') { return $true }
    if ($t -match '(?i)(OPENROUTER_API_KEY|HF_TOKEN|YOUTUBE_API_KEY)\s*=\s*$') { return $true }
    if ($t -match '(?i)(OPENROUTER_API_KEY|HF_TOKEN|YOUTUBE_API_KEY)\s*=\s*#') { return $true }
    return $false
}

foreach ($Repo in $RepoPaths) {
    $name = $Repo.Name
    $path = $Repo.Path

    if (-not (Test-Path (Join-Path $path ".git"))) {
        Add-Caution("$name`: not a git repository — skipped")
        continue
    }

    Push-Location $path
    $commitCount = (git rev-list --all 2>$null | Measure-Object -Line).Lines
    Add-Pass("$name`: $commitCount commits")

    # Gitleaks
    $gitleaksArgs = @("detect", "--source", ".", "--verbose")
    if (Test-Path ".gitleaks.toml") {
        $gitleaksArgs += @("--config", ".gitleaks.toml")
    }
    $gitleaksOut = & gitleaks @gitleaksArgs 2>&1
    $gitleaksExit = $LASTEXITCODE
    if ($gitleaksExit -ne 0) {
        Add-Block("$name`: GITLEAKS failed (exit $gitleaksExit)")
        $gitleaksOut | Select-String -Pattern "Finding|leak|Secret|File:" | ForEach-Object {
            Add-Block("  $($_.Line.Trim())")
        }
    } else {
        Add-Pass("$name`: gitleaks clean")
    }

    # .env in history (not examples)
    $envLog = git log --all --full-history --name-only --pretty=format:"COMMIT %H %s" -- ".env" ".env.*" 2>$null
    if ($envLog) {
        $currentCommit = ""
        foreach ($line in ($envLog -split "`n")) {
            if ($line -match '^COMMIT ') {
                $currentCommit = $line
            } elseif ($line -match '\.env' -and -not (Test-EnvExamplePath $line)) {
                Add-Block("$name`: ENV_IN_HISTORY $currentCommit -> $line")
            }
        }
    }

    # git log -G patterns
    $secretPatterns = @{
        openai_sk       = 'sk-[a-zA-Z0-9]{20,}'
        github_pat      = 'ghp_[a-zA-Z0-9]{36}'
        aws_key         = 'AKIA[0-9A-Z]{16}'
        private_key     = 'BEGIN RSA PRIVATE KEY'
        openrouter_key  = 'OPENROUTER_API_KEY=[a-zA-Z0-9_\-\.]{12,}'
        hf_token        = 'HF_TOKEN=[a-zA-Z0-9_\-\.]{12,}'
        youtube_key     = 'YOUTUBE_API_KEY=[a-zA-Z0-9_\-\.]{12,}'
        postgres_auth   = 'postgres(ql)?://[^:]+:[^@\s]+@'
    }
    foreach ($pname in $secretPatterns.Keys) {
        $pat = $secretPatterns[$pname]
        $hits = git log --all -G $pat --oneline 2>$null
        if (-not $hits) { continue }
        foreach ($h in ($hits -split "`n")) {
            if (-not $h) { continue }
            $sha = ($h -split ' ', 2)[0]
            $diffLine = git show $sha -U0 2>$null | Select-String -Pattern $pat | Select-Object -First 1
            if ($diffLine -and (Test-PlaceholderSecret $diffLine.Line)) {
                Add-Caution("$name`: HISTORY_$pname (placeholder) $h")
            } else {
                Add-Block("$name`: HISTORY_$pname $h")
                if ($diffLine) { Add-Block("  snippet: $($diffLine.Line.Trim().Substring(0, [Math]::Min(120, $diffLine.Line.Trim().Length)))") }
            }
        }
    }

    $pathPatterns = @{
        win_workspace = 'F:\\\\workspace\\\\marfago-labs'
        win_users     = 'C:\\\\Users\\\\'
        username      = 'fagom'
    }
    foreach ($pname in $pathPatterns.Keys) {
        $pat = $pathPatterns[$pname]
        $hits = git log --all -G $pat --oneline 2>$null
        if (-not $hits) { continue }
        foreach ($h in ($hits -split "`n")) {
            if ($h) { Add-Block("$name`: HISTORY_PATH_$pname $h") }
        }
    }

    # Sensitive filenames in history
    foreach ($fname in @("gold.log", "app_settings.json")) {
        $hits = git log --all --full-history --oneline -- "**/$fname" $fname 2>$null
        if ($hits) {
            foreach ($h in ($hits -split "`n")) {
                if ($h) { Add-Block("$name`: HISTORY_FILE_$fname $h") }
            }
        }
    }

    # Large blobs
    git rev-list --objects --all 2>$null |
        git cat-file --batch-check="%(objecttype) %(objectname) %(objectsize) %(rest)" 2>$null |
        Where-Object { $_ -match '^blob' } |
        ForEach-Object {
            $parts = $_ -split ' ', 4
            [PSCustomObject]@{ Size = [int64]$parts[2]; Path = $parts[3] }
        } |
        Where-Object { $_.Size -gt 524288 } |
        Sort-Object Size -Descending |
        Select-Object -First 5 |
        ForEach-Object {
            $mb = [math]::Round($_.Size / 1MB, 2)
            Add-Caution("$name`: LARGE_BLOB ${mb}MB $($_.Path)")
        }

    # Currently tracked sensitive paths
    git ls-files 2>$null | ForEach-Object {
        $f = $_
        if ($f -match '(^|/)\.env$' -and -not (Test-EnvExamplePath $f)) {
            Add-Block("$name`: TRACKED_ENV $f")
        }
        if ($f -match 'website/coverage/|blog/_archive/|(^|/)gold\.log$|benchmark/results/|backend/data/|text-compressor/results/') {
            Add-Block("$name`: TRACKED_SENSITIVE $f")
        }
    }

    Pop-Location
}

$signOff = "No tracked file contains live credentials; no Windows username/path leaks in published reports."
$passed = $Blocks.Count -eq 0

$report = @(
    "# Git history audit report",
    "",
    "Generated: $Timestamp",
    "",
    "## Summary",
    "",
    "| Metric | Count |",
    "|--------|------:|",
    "| BLOCK | $($Blocks.Count) |",
    "| CAUTION | $($Cautions.Count) |",
    "| PASS notes | $($Passes.Count) |",
    "",
    "## BLOCK (must fix before sign-off)",
    ""
)
if ($Blocks.Count -eq 0) {
    $report += "- (none)"
} else {
    $Blocks | ForEach-Object { $report += "- $_" }
}
$report += @("", "## CAUTION (review)", "")
if ($Cautions.Count -eq 0) {
    $report += "- (none)"
} else {
    $Cautions | ForEach-Object { $report += "- $_" }
}
$report += @("", "## Sign-off", "")
if ($passed) {
    $report += "**PASS:** $signOff"
} else {
    $report += "**FAILED** — resolve BLOCK items and re-run."
}

$report | Set-Content -Path $ReportPath -Encoding utf8

Write-Host ""
Write-Host "Report: $ReportPath"
Write-Host "BLOCK: $($Blocks.Count)  CAUTION: $($Cautions.Count)"
if ($passed) {
    Write-Host "SIGN-OFF: $signOff"
    exit 0
} else {
    $Blocks | ForEach-Object { Write-Host "BLOCK: $_" }
    exit 1
}
