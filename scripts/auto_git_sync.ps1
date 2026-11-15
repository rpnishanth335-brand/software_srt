# PowerShell Auto-Git Sync & Watcher Script
param(
    [switch]$Watch = $false,
    [int]$IntervalSeconds = 15
)

function Sync-GitRepository {
    $status = git status --porcelain
    $unpushed = $null
    try {
        $unpushed = git log origin/main..HEAD --oneline 2>$null
    } catch {}

    if ([string]::IsNullOrWhiteSpace($status) -and [string]::IsNullOrWhiteSpace($unpushed)) {
        return
    }

    $timestamp = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")
    Write-Host "[AutoGit] Syncing changes at $timestamp..." -ForegroundColor Cyan

    if (-not [string]::IsNullOrWhiteSpace($status)) {
        git add -A
        git commit -m "auto: synchronize updates [$timestamp]"
    }

    Write-Host "[AutoGit] Pushing to remote..." -ForegroundColor Yellow
    git push origin HEAD
    if ($LASTEXITCODE -eq 0) {
        Write-Host "[AutoGit] Successfully pushed to Git!" -ForegroundColor Green
    } else {
        Write-Host "[AutoGit] Push encountered an issue. Please verify authentication permissions." -ForegroundColor Red
    }
}

if ($Watch) {
    Write-Host "=== Auto-Git Watcher Started (Interval: ${IntervalSeconds}s) ===" -ForegroundColor Green
    Write-Host "Press Ctrl+C to stop.`n"
    while ($true) {
        Sync-GitRepository
        Start-Sleep -Seconds $IntervalSeconds
    }
} else {
    Sync-GitRepository
}
