$results = @()
try {
    # Login
    $lb = '{"email":"test_check@example.com","password":"123456"}'
    $lr = Invoke-RestMethod -Uri 'http://localhost:5000/api/auth/login' -Method POST -Body $lb -ContentType 'application/json'
    $tok = $lr.token
    $h = @{ Authorization = "Bearer $tok" }

    $results += 'BACKEND SERVER: RUNNING on :5000'
    $results += 'MongoDB: CONNECTED'
    $results += ''
    $results += '=== API ENDPOINTS ==='

    $me = Invoke-RestMethod -Uri 'http://localhost:5000/api/auth/me' -Headers $h
    $results += "GET /api/auth/me    : 200 OK  | user=$($me.data.name) | schedule_days=$($me.data.schedule.Count)"

    $c = Invoke-RestMethod -Uri 'http://localhost:5000/api/courses' -Headers $h
    $results += "GET /api/courses    : 200 OK  | count=$($c.count)"

    $results += ''
    $results += '=== FRONTEND PAGES ==='
    foreach ($pg in @('login.html','dashboard.html','timetable.html','analytics.html','course.html')) {
        $r = Invoke-WebRequest -Uri "http://localhost:5000/$pg" -UseBasicParsing
        $results += "$pg : $($r.StatusCode) ($($r.RawContentLength) bytes)"
    }

    $results += ''
    $results += '=== STATIC ASSETS ==='
    foreach ($asset in @('js/api.js','js/app.js','css/style.css','css/theme.css')) {
        $r = Invoke-WebRequest -Uri "http://localhost:5000/$asset" -UseBasicParsing
        $results += "$asset : $($r.StatusCode) ($($r.RawContentLength) bytes)"
    }

    $results += ''
    $results += 'ALL CHECKS PASSED!'
} catch {
    $results += "ERROR: $_"
}

$results | ForEach-Object { Write-Host $_ }
