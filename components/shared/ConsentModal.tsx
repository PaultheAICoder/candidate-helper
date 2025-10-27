"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import { Label } from "@/components/ui/Label";
import { ScrollArea } from "@/components/ui/ScrollArea";

interface ConsentModalProps {
  isOpen: boolean;
  onConfirm: () => Promise<void>;
}

export function ConsentModal({ isOpen, onConfirm }: ConsentModalProps) {
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isConsented = termsAccepted && privacyAccepted;

  const handleConfirm = async () => {
    if (!isConsented) {
      setError("Please accept both the Terms of Service and Privacy Policy");
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      await onConfirm();
    } catch (err) {
      setError("Failed to confirm consent. Please try again.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Review Our Policies</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <p className="text-sm text-muted-foreground">
            Before we get started, please review and accept our policies:
          </p>

          <div className="space-y-4">
            {/* Terms of Service Section */}
            <div className="border rounded-lg p-4">
              <div className="flex items-start space-x-3 mb-3">
                <Checkbox
                  id="terms"
                  checked={termsAccepted}
                  onCheckedChange={(checked: boolean | string) => setTermsAccepted(checked as boolean)}
                  disabled={isLoading}
                  aria-label="Accept Terms of Service"
                />
                <Label htmlFor="terms" className="font-semibold cursor-pointer">
                  Terms of Service
                </Label>
              </div>

              <ScrollArea className="h-40 border rounded p-3 mb-3 text-xs text-muted-foreground">
                <div className="space-y-2 pr-4">
                  <h4 className="font-semibold text-foreground">Plain English Summary:</h4>
                  <p>
                    You agree to use Cindy from Cinder for personal interview practice. You
                    acknowledge that AI feedback, while helpful, is not a substitute for
                    professional career coaching.
                  </p>
                  <p>
                    You agree not to use this service for illegal purposes, harassing others, or
                    attempting to extract proprietary information.
                  </p>
                  <p>
                    We reserve the right to modify these terms with 30 days' notice. Your
                    continued use constitutes acceptance.
                  </p>
                  <a href="/terms" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                    Read full Terms of Service →
                  </a>
                </div>
              </ScrollArea>

              {!termsAccepted && (
                <p className="text-xs text-amber-600">Please accept the Terms of Service to continue</p>
              )}
            </div>

            {/* Privacy Policy Section */}
            <div className="border rounded-lg p-4">
              <div className="flex items-start space-x-3 mb-3">
                <Checkbox
                  id="privacy"
                  checked={privacyAccepted}
                  onCheckedChange={(checked: boolean | string) => setPrivacyAccepted(checked as boolean)}
                  disabled={isLoading}
                  aria-label="Accept Privacy Policy"
                />
                <Label htmlFor="privacy" className="font-semibold cursor-pointer">
                  Privacy Policy
                </Label>
              </div>

              <ScrollArea className="h-40 border rounded p-3 mb-3 text-xs text-muted-foreground">
                <div className="space-y-2 pr-4">
                  <h4 className="font-semibold text-foreground">Plain English Summary:</h4>
                  <p>
                    <strong>Your Data is Yours:</strong> We never store audio recordings. Only
                    transcripts are saved to provide you with feedback.
                  </p>
                  <p>
                    <strong>Privacy Protection:</strong> We automatically remove sensitive info
                    like your Social Security Number and date of birth before storing your
                    resume.
                  </p>
                  <p>
                    <strong>AI Training:</strong> Your personal data is not used to train our AI
                    models. OpenAI's API has data retention turned off.
                  </p>
                  <p>
                    <strong>Your Rights:</strong> You can export or delete your data anytime with
                    one click. No questions asked.
                  </p>
                  <a href="/privacy" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                    Read full Privacy Policy →
                  </a>
                </div>
              </ScrollArea>

              {!privacyAccepted && (
                <p className="text-xs text-amber-600">Please accept the Privacy Policy to continue</p>
              )}
            </div>
          </div>

          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <Button
            onClick={handleConfirm}
            disabled={!isConsented || isLoading}
            className="w-full"
            size="lg"
          >
            {isLoading ? "Accepting..." : "Accept and Continue"}
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            By accepting, you confirm that you have read and understood our policies
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
