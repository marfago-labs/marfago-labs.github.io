# Transfer text-compressor into marfago-labs (private).
#
# Prerequisite: create the org in the browser (GitHub has no public API for this):
#   https://github.com/account/organizations/new?organization=marfago-labs
#
# Requires: gh auth refresh -h github.com -s admin:org,repo

$ErrorActionPreference = "Stop"
$Org = "marfago-labs"
$Repo = "text-compressor"

Write-Host "Checking organization $Org exists..."
$orgJson = gh api "orgs/$Org" 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "Organization '$Org' was not found on GitHub." -ForegroundColor Red
    Write-Host "Create it first (Free plan is fine):"
    Write-Host "  https://github.com/account/organizations/new?organization=$Org"
    Write-Host ""
    Write-Host "Then run this script again."
    exit 1
}
Write-Host "Found organization: $Org"

$already = gh api "repos/$Org/$Repo" --jq .full_name 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Host "Already at $Org/$Repo — skipping transfer."
} else {
    Write-Host "Transferring marfago/$Repo -> $Org/$Repo (stays private)..."
    gh api -X POST "/repos/marfago/$Repo/transfer" -f new_owner="$Org" -f new_name="$Repo" | Out-Null
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Transfer failed." -ForegroundColor Red
        exit $LASTEXITCODE
    }
    Write-Host "Transfer initiated; waiting for $Org/$Repo..."
    for ($i = 0; $i -lt 12; $i++) {
        Start-Sleep -Seconds 2
        $ok = gh api "repos/$Org/$Repo" --jq .full_name 2>$null
        if ($LASTEXITCODE -eq 0) { break }
    }
}

Write-Host "Updating local remote..."
$tc = Join-Path $PSScriptRoot ".." $Repo
Push-Location $tc
gh auth setup-git
git remote set-url origin "https://github.com/$Org/$Repo.git"
git remote -v
Pop-Location

Write-Host ""
Write-Host "Done. Verify:" -ForegroundColor Green
gh repo view "$Org/$Repo" --json url,isPrivate
