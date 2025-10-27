"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import { Label } from "@/components/ui/Label";

interface EligibilityModalProps {
  isOpen: boolean;
  onConfirm: () => Promise<void>;
}

export function EligibilityModal({ isOpen, onConfirm }: EligibilityModalProps) {
  const [isAge18Plus, setIsAge18Plus] = useState(false);
  const [isUSBased, setIsUSBased] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEligible = isAge18Plus && isUSBased;

  const handleConfirm = async () => {
    if (!isEligible) {
      setError("Please confirm all eligibility requirements");
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      await onConfirm();
    } catch (err) {
      setError("Failed to confirm eligibility. Please try again.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Confirm Your Eligibility</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <p className="text-sm text-muted-foreground">
            To use Cindy from Cinder, please confirm that you meet the following requirements:
          </p>

          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <Checkbox
                id="age-18-plus"
                checked={isAge18Plus}
                onCheckedChange={(checked: boolean | string) => setIsAge18Plus(checked as boolean)}
                disabled={isLoading}
                aria-label="Confirm you are 18 years old or older"
              />
              <Label
                htmlFor="age-18-plus"
                className="flex flex-col space-y-1 font-normal cursor-pointer"
              >
                <span>I am 18 years old or older</span>
                <span className="text-xs text-muted-foreground">Required for eligible participation</span>
              </Label>
            </div>

            <div className="flex items-start space-x-3">
              <Checkbox
                id="us-based"
                checked={isUSBased}
                onCheckedChange={(checked: boolean | string) => setIsUSBased(checked as boolean)}
                disabled={isLoading}
                aria-label="Confirm you are based in the United States"
              />
              <Label
                htmlFor="us-based"
                className="flex flex-col space-y-1 font-normal cursor-pointer"
              >
                <span>I am based in the United States</span>
                <span className="text-xs text-muted-foreground">
                  Current MVP scope (international coming soon)
                </span>
              </Label>
            </div>
          </div>

          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <p className="text-xs text-muted-foreground">
            By confirming, you agree to our{" "}
            <a href="/terms" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
              Terms of Service
            </a>{" "}
            and{" "}
            <a
              href="/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              Privacy Policy
            </a>
          </p>

          <Button
            onClick={handleConfirm}
            disabled={!isEligible || isLoading}
            className="w-full"
            size="lg"
          >
            {isLoading ? "Confirming..." : "Confirm and Continue"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
