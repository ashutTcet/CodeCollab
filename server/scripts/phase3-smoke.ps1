$ErrorActionPreference = 'Stop'

$base = 'http://localhost:8080/api'
$stamp = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds()
$teacherEmail = "teacher+$stamp@test.local"
$studentEmail = "student+$stamp@test.local"
$pwd = 'Password123!'

$teacherSession = New-Object Microsoft.PowerShell.Commands.WebRequestSession
$studentSession = New-Object Microsoft.PowerShell.Commands.WebRequestSession

$teacherRegisterBody = @{ name='Teacher QA'; email=$teacherEmail; password=$pwd; confirmPassword=$pwd; role='teacher' } | ConvertTo-Json
$studentRegisterBody = @{ name='Student QA'; email=$studentEmail; password=$pwd; confirmPassword=$pwd; role='student' } | ConvertTo-Json

Invoke-RestMethod -Uri "$base/auth/register" -Method Post -WebSession $teacherSession -ContentType 'application/json' -Body $teacherRegisterBody | Out-Null
Invoke-RestMethod -Uri "$base/auth/register" -Method Post -WebSession $studentSession -ContentType 'application/json' -Body $studentRegisterBody | Out-Null

$classroomBody = @{ name='Physics 101'; subject='Physics'; description='Intro class' } | ConvertTo-Json
$created = Invoke-RestMethod -Uri "$base/classrooms" -Method Post -WebSession $teacherSession -ContentType 'application/json' -Body $classroomBody
$roomCode = $created.classroom.roomCode
$classId = $created.classroom.id

$joinBody = @{ roomCode=$roomCode } | ConvertTo-Json
$joinSuccess = Invoke-RestMethod -Uri "$base/classrooms/join" -Method Post -WebSession $studentSession -ContentType 'application/json' -Body $joinBody

$duplicateJoinStatus = ''
try {
  Invoke-RestMethod -Uri "$base/classrooms/join" -Method Post -WebSession $studentSession -ContentType 'application/json' -Body $joinBody | Out-Null
  $duplicateJoinStatus = 'unexpected-success'
} catch {
  $duplicateJoinStatus = [int]$_.Exception.Response.StatusCode
}

$invalidJoinStatus = ''
try {
  $badJoinBody = @{ roomCode='ZZZZZZ' } | ConvertTo-Json
  Invoke-RestMethod -Uri "$base/classrooms/join" -Method Post -WebSession $studentSession -ContentType 'application/json' -Body $badJoinBody | Out-Null
  $invalidJoinStatus = 'unexpected-success'
} catch {
  $invalidJoinStatus = [int]$_.Exception.Response.StatusCode
}

$studentOnTeacherEndpointStatus = ''
try {
  Invoke-RestMethod -Uri "$base/classrooms/$classId/students" -Method Get -WebSession $studentSession | Out-Null
  $studentOnTeacherEndpointStatus = 'unexpected-success'
} catch {
  $studentOnTeacherEndpointStatus = [int]$_.Exception.Response.StatusCode
}

$teacherClassrooms = Invoke-RestMethod -Uri "$base/classrooms/teacher" -Method Get -WebSession $teacherSession
$studentClassrooms = Invoke-RestMethod -Uri "$base/classrooms/student" -Method Get -WebSession $studentSession
$studentDetails = Invoke-RestMethod -Uri "$base/classrooms/$classId" -Method Get -WebSession $studentSession
$teacherDetails = Invoke-RestMethod -Uri "$base/classrooms/$classId" -Method Get -WebSession $teacherSession

Write-Output 'TEST_SUMMARY'
Write-Output "teacherEmail=$teacherEmail"
Write-Output "studentEmail=$studentEmail"
Write-Output "createdClassroomId=$classId"
Write-Output "roomCode=$roomCode"
Write-Output "joinSuccessClassId=$($joinSuccess.classroom.id)"
Write-Output "duplicateJoinStatus=$duplicateJoinStatus"
Write-Output "invalidJoinStatus=$invalidJoinStatus"
Write-Output "studentAccessTeacherEndpointStatus=$studentOnTeacherEndpointStatus"
Write-Output "teacherClassroomsCount=$($teacherClassrooms.classrooms.Count)"
Write-Output "studentClassroomsCount=$($studentClassrooms.classrooms.Count)"
Write-Output "studentDetailsClassroomId=$($studentDetails.classroom.id)"
Write-Output "teacherDetailsClassroomId=$($teacherDetails.classroom.id)"
