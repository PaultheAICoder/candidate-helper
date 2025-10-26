/**
 * Virus Scanning Utility
 * Integrates with ClamAV service for file scanning
 */

const CLAMAV_URL = process.env.CLAMAV_URL;

interface ScanResult {
  clean: boolean;
  virus?: string;
  error?: string;
}

/**
 * Scan a file for viruses using ClamAV
 * @param file - File buffer or Blob to scan
 * @returns Promise<ScanResult> - Scan result
 */
export async function scanFile(file: Buffer | Blob): Promise<ScanResult> {
  if (!CLAMAV_URL) {
    console.error("CLAMAV_URL not configured");
    // Fail open in development, fail closed in production
    if (process.env.NODE_ENV === "production") {
      return {
        clean: false,
        error: "Virus scanning not configured",
      };
    }
    return {
      clean: true,
      error: "Virus scanning skipped (dev mode)",
    };
  }

  try {
    const formData = new FormData();
    const blob = file instanceof Blob ? file : new Blob([file as unknown as BlobPart]);
    formData.append("file", blob);

    const response = await fetch(`${CLAMAV_URL}/scan`, {
      method: "POST",
      body: formData,
      signal: AbortSignal.timeout(30000), // 30 second timeout
    });

    if (!response.ok) {
      return {
        clean: false,
        error: `ClamAV service error: ${response.status}`,
      };
    }

    const result = await response.json();

    return {
      clean: result.is_clean === true,
      virus: result.virus_name,
    };
  } catch (error) {
    console.error("Virus scan error:", error);

    if (error instanceof Error && error.name === "TimeoutError") {
      return {
        clean: false,
        error: "Virus scan timeout",
      };
    }

    return {
      clean: false,
      error: "Virus scan failed",
    };
  }
}

/**
 * Scan file from FormData
 */
export async function scanFileFromFormData(formData: FormData): Promise<ScanResult> {
  const file = formData.get("file");

  if (!file || !(file instanceof Blob)) {
    return {
      clean: false,
      error: "No file provided",
    };
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  return await scanFile(buffer);
}
