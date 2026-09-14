# Script to sync jobs directly to live SelectedJobs.in API
$apiUrl = "https://selectedjobs.in/api.php"
$adminKey = "selectedadmin2026"
$serverIp = "217.21.91.150"

# Fetch all existing jobs on live server
$jobsResp = curl.exe -k -s --resolve selectedjobs.in:443:$serverIp -H "x-admin-key: $adminKey" "$apiUrl?action=admin_jobs&status=ALL" | ConvertFrom-Json
if ($jobsResp.success -and $jobsResp.jobs.Count -gt 0) {
    Write-Host "Found $($jobsResp.jobs.Count) jobs on live server. Deleting old placeholder jobs..."
    foreach ($j in $jobsResp.jobs) {
        $tmpDel = [System.IO.Path]::GetTempFileName()
        @{ id = $j.id; action = "DELETE" } | ConvertTo-Json -Compress | Set-Content -Path $tmpDel -Encoding UTF8
        $res = curl.exe -k -s --resolve selectedjobs.in:443:$serverIp -X POST -H "x-admin-key: $adminKey" -H "Content-Type: application/json" --data-binary "@$tmpDel" "$apiUrl?action=admin_action"
        Remove-Item $tmpDel -ErrorAction SilentlyContinue
    }
    Write-Host "Old jobs cleared."
}

# Now post the 5 new jobs
$newJobs = Get-Content "C:\Users\DELL\Desktop\SelectedJobs\hostinger_deploy\data\jobs.json" -Raw | ConvertFrom-Json
Write-Host "Uploading $($newJobs.Count) new jobs to live server..."

foreach ($job in $newJobs) {
    $tmpFile = [System.IO.Path]::GetTempFileName()
    $job | ConvertTo-Json -Depth 5 | Set-Content -Path $tmpFile -Encoding UTF8
    
    $res = curl.exe -k -s --resolve selectedjobs.in:443:$serverIp -X POST -H "x-admin-key: $adminKey" -H "Content-Type: application/json" --data-binary "@$tmpFile" "$apiUrl?action=create_job"
    Remove-Item $tmpFile -ErrorAction SilentlyContinue
    Write-Host "Posted: $($job.title) -> $res"
}

Write-Host "ALL JOBS SUCCESSFULLY SYNCED TO LIVE SERVER!"
