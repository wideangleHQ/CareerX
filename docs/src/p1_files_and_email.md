# Files and email

# Files

Files: `server/src/storage/` and `server/src/modules/files/`.

## Buckets

Five Supabase buckets, configured in `storage/storage.config.ts` with defaults
so a missing environment variable does not break the boot:

| Constant | Env var | Default | Holds |
| --- | --- | --- | --- |
| `CANDIDATE` | `SUPABASE_STORAGE_BUCKET_CANDIDATE` | `candidate-documents` | resumes, org proofs |
| `OFFERS` | `SUPABASE_STORAGE_BUCKET_OFFERS` | `offer-documents` | offer letters |
| `INTERVIEWS` | `SUPABASE_STORAGE_BUCKET_INTERVIEWS` | `interview-assets` | interview material |
| `ORGANIZATION` | `SUPABASE_STORAGE_BUCKET_ORGANIZATION` | `organization-assets` | logos, branding |
| `EXPORTS` | `SUPABASE_STORAGE_BUCKET_EXPORTS` | `exports` | generated reports |

Separate buckets rather than prefixes in one bucket. That lets access policies
be set per bucket, which matters because candidate documents and organisation
branding have very different sensitivity.

```ts
export const StorageConfig = {
  signedUrlExpiry: parseInt(process.env.SIGNED_URL_EXPIRY ?? '', 10) || 900,
  maxUploadSizeBytes:
    (parseInt(process.env.MAX_UPLOAD_SIZE_MB ?? '', 10) || 10) * 1024 * 1024,
};
```

## URLs are never stored

`candidate_files` stores `bucket` and `storage_path`, not a URL. Every access
generates a fresh signed URL with a 900 second default expiry through
`GET /files/:id/download-url`.

This is the right call and it should not be changed for convenience. A stored
public URL to a resume is a permanent, unauthenticated link to a stranger's
personal data. Signed URLs expire.

The one place a URL is persisted is `applications.previous_org_proof_url`, which
predates the signed URL approach. Treat it as legacy and do not add more columns
like it.

## Upload verification

`SupabaseStorageService.upload()` does something worth keeping: after Supabase
reports success, it calls `objectExists()` and throws if the object is not
actually there.

```
Supabase upload reported success but object was not found at <bucket>/<path>
```

That guards against the case where the API returns 200 and the object is
missing, which leaves a `candidate_files` row pointing at nothing. Preserve the
check if you refactor the service.

The signed URL reader also handles both `signedURL` and `signedUrl` in the
response, because Supabase has returned both spellings across versions.

## Endpoints

| Method | Path | Auth |
| --- | --- | --- |
| GET | `/files/application/:applicationId` | HR, permission guarded |
| GET | `/files/:id/download-url` | HR, permission guarded |

There is no upload endpoint. `modules/resumes/` exists but its controller file
is empty and `ResumesModule` is not imported into `AppModule`.

Uploads happen inside application submission: `applications.service.ts` builds
the storage path, pushes the file to Supabase, and writes the `candidate_files`
row in the same operation. If you need a standalone upload endpoint, that is new
work, not a wiring fix.

## Size and type validation

`maxUploadSizeBytes` defaults to 10 MB. Confirm it is enforced at the multer
layer as well as checked afterwards; rejecting a 500 MB upload after buffering
it is not much of a rejection.

MIME type checking is worth verifying before Phase 2. A resume upload endpoint
that accepts any content type is an open file host.

# Email

Files: `server/src/modules/email/`.

## Templates

Ten templates under `modules/email/templates/`, each a function returning a
subject and an HTML body:

```
application-received      acknowledgement on submission
application-selected      candidate selected
application-rejected      candidate rejected
candidate-shortlisted     moved to shortlist
hr-assignment             an HR user was assigned an application
interview-invitation      slot booking link
interview-reminder        before the interview
interview-rescheduled     time changed
interview-cancelled       interview cancelled
offer-released            offer sent
```

This is the pattern PerformX should copy when Phase 2 needs leave and project
emails. See the PerformX handbook's notification engine page.

## Sending

Email goes through the `email` BullMQ queue, not directly. The producer enqueues
a job, `EmailWorker` consumes it and calls Resend. Queue defaults are three
attempts with exponential backoff starting at 2 seconds.

Every send writes an `email_logs` row with the recipient, the template name, a
status (`QUEUED`, `SENT`, `FAILED`), and an error message on failure. That table
is the audit trail for candidate communication and the first place to look when
somebody says they never got the invitation.

## Monitoring

```
GET /email/logs         recent sends with status
GET /email/queue/stats  queue depth and counts
GET /email/queue/failed failed jobs
```

The monitoring module has more: `GET /monitoring/queues/:name/failed` and
`POST /monitoring/queues/:name/jobs/:jobId/retry` let an admin retry a specific
failed job without redeploying.

## Environment

`RESEND_API_KEY` and `EMAIL_FROM` are both required. `EMAIL_FROM` must be a
verified sender on the Resend account or every send fails at the provider with a
message that does not obviously say so.

`NEXT_PUBLIC_APP_URL` is read on the server to build links inside emails. If
interview invitations arrive with `localhost` links in production, this is why.
