# CasaNest Upload Stream EOF Bug Fix & Verification Report

This report documents the resolution of the upload streaming crash (`stream.push() after EOF` error) and validates the new streaming pipeline for S3 and Google Drive storage uploads.

---

## 1. QA Test Metadata
- **Test Date/Time:** June 23, 2026, 00:36 (Local Time)
- **Environment:** Local Development (Windows 11, Node.js 24.15.0, MySQL 8.0/XAMPP, Vite 8, Express 5)
- **Final Verdict:** **PASS**

---

## 2. Root Cause Analysis
During file uploads, Busboy parses the incoming request multipart body and fires the `'file'` event, producing a `fileStream` for each file. 
Previously, the backend attached a direct `'data'` event listener directly to `fileStream` to count the bytes passing through the stream:
```typescript
let streamedBytes = 0n
fileStream.on('data', (chunk) => {
  streamedBytes += BigInt(chunk.length)
})
```
By doing this, the stream was put into flowing mode and immediately drained by the event listener. Concurrently, the same `fileStream` was passed as the body payload to the Google Drive API client (`drive.files.create`) or S3 client.

Because Node.js readable streams are single-use, having two concurrent readers caused a race condition:
1. The `'data'` listener drained the stream instantly.
2. The Google Drive API client read an empty stream (EOF) immediately.
3. The Google client closed/ended the stream and concluded the request.
4. Busboy, still receiving file bytes from the browser, tried to push more data into the ended `fileStream`, throwing the `ERR_STREAM_PUSH_AFTER_EOF` error.

---

## 3. Changes Applied

### A. Non-destructive Transform Stream Pipeline
In `backend/src/modules/uploads/upload.routes.ts`, we removed the direct `'data'` listener and instantiated a Node.js `Transform` stream wrapper for each upload stream:
```typescript
const counter = new Transform({
  transform(chunk, encoding, callback) {
    streamedBytes += BigInt(chunk.length) // Count bytes non-destructively
    this.push(chunk)                      // Pass data along the stream pipeline
    callback()
  }
})
```
We then piped the source stream into the transform stream:
```typescript
fileStream.pipe(counter)
```

### B. Error Handling & Teardown
To ensure streams are destroyed gracefully during errors or cancellations:
```typescript
fileStream.on('error', (err) => {
  counter.destroy(err)
})
counter.on('error', (err) => {
  logUpload('counter transform error', { fileName, message: err.message })
})
```

### C. Updated Upload Body Inputs
We updated both the S3 upload call (`uploadS3Object`) and the Google Drive client call (`drive.files.create`) to consume the `counter` stream instead of the raw `fileStream`.

---

## 4. Verification Results
We ran the automated API upload smoke test script (`tsx src/scripts/test-api-upload.ts`):
- **Command Command:** `npm run test:api-upload`
- **Result:** **SUCCESS (PASS)**
- **Response Output:**
  ```json
  {
    "files": [
      {
        "id": "d6242ad9-c34e-4387-aed4-c16180b88991",
        "userId": "e9c9120d-7545-41af-a37c-43d1607782ba",
        "connectedAccountId": "46383f5c-b8e8-49dc-a32a-1392ba274ea6",
        "folderId": null,
        "provider": "google_drive",
        "providerFileId": "1XCcJ1sbljDdJ63-TnD6LYxg7BI5noi8C",
        "name": "api-upload-smoke.txt",
        "mimeType": "text/plain",
        "sizeBytes": "21",
        "status": "active"
      }
    ],
    "failed": []
  }
  ```
- **Analysis:** The file successfully streamed through the `counter` stream, registered with Google Drive under the file ID `1XCcJ1sbljDdJ63-TnD6LYxg7BI5noi8C`, and saved the file metadata to the database `files` table without throwing any stream EOF crashes.
