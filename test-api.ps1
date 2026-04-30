# Test script for Config Storage API

# Configuration
$baseUrl = "http://127.0.0.1:8787"
$uuid = "test-config-001"
$secret = "your-secret-key-here"

# Generate SHA256 token for config
$data = [System.Text.Encoding]::UTF8.GetBytes($uuid + $secret)
$sha256 = [System.Security.Cryptography.SHA256]::Create()
$hash = $sha256.ComputeHash($data)
$token = -join ($hash | ForEach-Object { "{0:x2}" -f $_ })

# Generate SHA256 token for health check
$healthData = [System.Text.Encoding]::UTF8.GetBytes("health-check" + $secret)
$healthHash = $sha256.ComputeHash($healthData)
$healthToken = -join ($healthHash | ForEach-Object { "{0:x2}" -f $_ })

Write-Host "UUID: $uuid"
Write-Host "Config Token: $token"
Write-Host "Health Check Token: $healthToken"
Write-Host ""

# Test 1: Health Check
Write-Host "Test 1: Health Check (GET /)"
$response = Invoke-WebRequest -Uri "$baseUrl/?token=$healthToken" -Method Get
Write-Host "Status: $($response.StatusCode)"
Write-Host "Response: $($response.Content)"
Write-Host ""

# Test 2: Create Configuration
Write-Host "Test 2: Create Configuration (POST /api/config)"
$payload = @{
    uuid = $uuid
    token = $token
    name = "My Config"
    config = @{
        log = @{
            level = "info"
        }
        inbounds = @(
            @{
                type = "socks"
                listen = "127.0.0.1"
                listen_port = 1080
            }
        )
    }
} | ConvertTo-Json -Depth 10

$response = Invoke-WebRequest -Uri "$baseUrl/api/config" -Method Post -Body $payload -ContentType "application/json"
Write-Host "Status: $($response.StatusCode)"
Write-Host "Response: $($response.Content)"
Write-Host ""

# Test 3: Retrieve Configuration
Write-Host "Test 3: Retrieve Configuration (GET /api/config/$uuid)"
$response = Invoke-WebRequest -Uri "$baseUrl/api/config/$uuid" -Method Get
Write-Host "Status: $($response.StatusCode)"
Write-Host "Response: $($response.Content)"
Write-Host ""

# Test 4: Update Configuration
Write-Host "Test 4: Update Configuration (POST /api/config)"
$updatePayload = @{
    uuid = $uuid
    token = $token
    name = "Updated Config"
} | ConvertTo-Json

$response = Invoke-WebRequest -Uri "$baseUrl/api/config" -Method Post -Body $updatePayload -ContentType "application/json"
Write-Host "Status: $($response.StatusCode)"
Write-Host "Response: $($response.Content)"
Write-Host ""

# Test 5: Delete Configuration
Write-Host "Test 5: Delete Configuration (DELETE /api/config/$uuid)"
$response = Invoke-WebRequest -Uri "$baseUrl/api/config/$uuid`?token=$token" -Method Delete
Write-Host "Status: $($response.StatusCode)"
Write-Host "Response: $($response.Content)"
Write-Host ""

Write-Host "All tests completed!"

