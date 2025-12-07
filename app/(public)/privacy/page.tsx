export default function PrivacyPage() {
  return (
    <main className="min-h-screen px-6 py-12 max-w-3xl mx-auto space-y-4">
      <h1 className="text-3xl font-bold">Privacy Policy</h1>
      <p className="text-muted-foreground">Version 1.0</p>
      <p>
        We respect your privacy. This page summarizes how Cindy from Cinder handles your data for the
        MVP experience.
      </p>
      <ul className="list-disc pl-6 space-y-2 text-sm text-muted-foreground">
        <li>We collect the information you provide (answers, resume, JD) to generate coaching.</li>
        <li>No audio storage; only transcripts are retained for your reports.</li>
        <li>You can export or delete your data via Settings at any time.</li>
        <li>We do not sell your data. Limited internal use to improve the service.</li>
      </ul>
      <p className="text-sm text-muted-foreground">
        Questions? Reach us at privacy@teamcinder.com.
      </p>
    </main>
  );
}
