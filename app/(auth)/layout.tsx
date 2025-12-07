"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { EligibilityModal } from "@/components/shared/EligibilityModal";
import { ConsentModal } from "@/components/shared/ConsentModal";
import { Navbar } from "@/components/shared/Navbar";
import { Footer } from "@/components/shared/Footer";
import { ensureUserAndProfile } from "@/lib/supabase/user";
import type { Session } from "@supabase/supabase-js";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const supabase = createClient();

  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showEligibilityModal, setShowEligibilityModal] = useState(false);
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [eligibilityConfirmed, setEligibilityConfirmed] = useState(false);
  const [consentConfirmed, setConsentConfirmed] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const {
          data: { session: currentSession },
        } = await supabase.auth.getSession();

        if (!currentSession) {
          router.push("/login");
          return;
        }

        setSession(currentSession);
        await ensureUserAndProfile(supabase, currentSession.user);

        // Check if user has confirmed eligibility and consent
        const { data: userData, error: userError } = await supabase
          .from("users")
          .select("eligibility_confirmed")
          .eq("id", currentSession.user.id)
          .single();

        if (userError) {
          console.error("Error fetching user:", userError);
          setShowEligibilityModal(true);
          return;
        }

        if (!userData?.eligibility_confirmed) {
          setShowEligibilityModal(true);
        } else {
          setEligibilityConfirmed(true);
          // Check for consent
          const { data: consentData } = await supabase
            .from("consents")
            .select("id")
            .eq("user_id", currentSession.user.id)
            .order("created_at", { ascending: false })
            .limit(1)
            .single();

          if (!consentData) {
            setShowConsentModal(true);
          } else {
            setConsentConfirmed(true);
          }
        }
      } catch (error) {
        console.error("Auth check error:", error);
        router.push("/login");
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      if (!currentSession) {
        router.push("/login");
      } else {
        setSession(currentSession);
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, [router, supabase]);

  const handleEligibilityConfirm = async () => {
    if (!session) return;

    try {
      const { error } = await supabase
        .from("users")
        .update({ eligibility_confirmed: true })
        .eq("id", session.user.id);

      if (error) {
        throw error;
      }

      setEligibilityConfirmed(true);
      setShowEligibilityModal(false);
      setShowConsentModal(true);
    } catch (error) {
      console.error("Error confirming eligibility:", error);
      throw error;
    }
  };

  const handleConsentConfirm = async () => {
    if (!session) return;

    try {
      const userAgent = navigator.userAgent;
      const ipAddress = await fetch("https://api.ipify.org?format=json")
        .then((res) => res.json())
        .then((data) => data.ip)
        .catch(() => "0.0.0.0");

      const { error } = await supabase.from("consents").insert({
        user_id: session.user.id,
        terms_version: "1.0",
        privacy_version: "1.0",
        ip_address: ipAddress,
        user_agent: userAgent,
      });

      if (error) {
        throw error;
      }

      setConsentConfirmed(true);
      setShowConsentModal(false);
    } catch (error) {
      console.error("Error confirming consent:", error);
      throw error;
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="space-y-2 text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!eligibilityConfirmed || !consentConfirmed) {
    return (
      <>
        <EligibilityModal
          isOpen={showEligibilityModal}
          onConfirm={handleEligibilityConfirm}
        />
        <ConsentModal isOpen={showConsentModal} onConfirm={handleConsentConfirm} />
      </>
    );
  }

  return (
    <>
      <Navbar />
      {children}
      <Footer />
    </>
  );
}
