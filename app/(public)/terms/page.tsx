export default function TermsPage() {
  return (
    <main className="min-h-screen px-6 py-12 max-w-3xl mx-auto space-y-4">
      <h1 className="text-3xl font-bold">Terms of Service</h1>
      <p className="text-muted-foreground">Version 1.0</p>
      <p>
        These Terms govern your use of Cindy from Cinder. By using the service you agree to follow
        these rules. You must be 18+ and a U.S. user for the MVP.
      </p>
      <ul className="list-disc pl-6 space-y-2 text-sm text-muted-foreground">
        <li>Your content remains yours. You can export or delete it at any time.</li>
        <li>We do not store audio; we store transcripts for coaching and reports.</li>
        <li>Do not submit sensitive personal data (SSN, DOB); we attempt to redact when detected.</li>
        <li>Service is provided as-is with no guarantees of employment outcomes.</li>
      </ul>
      <p className="text-sm text-muted-foreground">
        For questions, contact support@teamcinder.com.
      </p>
    </main>
  );
}
