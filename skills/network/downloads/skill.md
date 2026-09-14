---
name: network-downloads
version: 1.0.0
description: Downloads remote files, datasets, and release assets with checksum verification.
category: network
risk: medium
requires_permission: true
required_tools:
  - download_file
optional_tools:
  - shell_execute
  - file_metadata
---

# Remote File Download & Checksum Verification

## Purpose
Download model weights, datasets, or release tarballs with SHA256 integrity verification.

## When to Activate
Activate when downloading model GGUF files, test datasets, or external dependencies.

## Required Tools
- `download_file`

## Optional Tools
- `shell_execute`
- `file_metadata`

## Inputs
Remote URL, destination path, expected SHA256 checksum (optional).

## Preconditions
Destination directory must be writable.

## Procedure
1. Verify destination path is inside permitted workspace.
2. Start file download stream using download_file.
3. Track progress and download speed.
4. If expected checksum is provided: compute SHA256 of downloaded file.
5. If checksum mismatches: delete corrupted download and report error.
6. Return download confirmation.

## Tool Usage
Call download_file with url and destination.

## Safety
Validate file sizes before downloading to avoid exhausting disk space.

## Permissions
Requires network and filesystem write capability.

## Verification
Check that destination file exists and matches expected byte size/checksum.

## Failure Handling
If download is interrupted, resume with HTTP Range headers if supported.

## Output Contract
DownloadResult with localPath, sizeBytes, sha256Verified: boolean.

## Examples
Downloading a GGUF model checkpoint into .berkelium/models.

## Related Skills
- `filesystem-write-file`
- `network-http`
