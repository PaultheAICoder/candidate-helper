/**
 * Cost Tracking Utility
 * Tracks OpenAI API usage and monitors monthly budget cap
 */

import { createServiceRoleClient } from "@/lib/supabase/server";

interface CostTrackingEntry {
  model: "gpt-4o" | "gpt-4-turbo" | "whisper-1" | "tts-1";
  tokensUsed?: number;
  audioSeconds?: number;
  estimatedCostUsd: number;
}

// Pricing (as of 2024, update as needed)
const PRICING = {
  "gpt-4o": {
    input: 0.0025 / 1000, // $0.0025 per 1K tokens
    output: 0.01 / 1000, // $0.01 per 1K tokens
  },
  "gpt-4-turbo": {
    input: 0.01 / 1000,
    output: 0.03 / 1000,
  },
  "whisper-1": {
    perSecond: 0.0001, // $0.006 per minute / 60 seconds
  },
  "tts-1": {
    per1KChars: 0.015 / 1000, // $0.015 per 1K characters
  },
};

/**
 * Track OpenAI API cost
 */
export async function trackCost(entry: CostTrackingEntry): Promise<void> {
  const supabase = createServiceRoleClient();

  const now = new Date();
  const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  try {
    const { error } = await supabase.from("cost_tracking").insert({
      period_start: periodStart.toISOString(),
      period_end: periodEnd.toISOString(),
      model: entry.model,
      tokens_used: entry.tokensUsed,
      audio_seconds: entry.audioSeconds,
      estimated_cost_usd: entry.estimatedCostUsd,
    });

    if (error) {
      console.error("Failed to track cost:", error);
    }

    // Check if threshold reached and disable audio mode if needed
    await checkAndUpdateAudioMode();
  } catch (error) {
    console.error("Cost tracking error:", error);
  }
}

/**
 * Calculate cost from OpenAI response usage
 */
export function calculateGPTCost(
  model: "gpt-4o" | "gpt-4-turbo",
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
  }
): number {
  const pricing = PRICING[model];
  const inputCost = usage.prompt_tokens * pricing.input;
  const outputCost = usage.completion_tokens * pricing.output;
  return inputCost + outputCost;
}

/**
 * Calculate Whisper STT cost
 */
export function calculateWhisperCost(audioSeconds: number): number {
  return audioSeconds * PRICING["whisper-1"].perSecond;
}

/**
 * Calculate TTS cost
 */
export function calculateTTSCost(characterCount: number): number {
  return characterCount * PRICING["tts-1"].per1KChars;
}

/**
 * Get current month's total cost
 */
export async function getCurrentMonthCost(): Promise<number> {
  const supabase = createServiceRoleClient();

  try {
    const { data, error } = await supabase.rpc("get_current_month_cost");

    if (error) {
      console.error("Failed to get current month cost:", error);
      return 0;
    }

    return data ?? 0;
  } catch (error) {
    console.error("Error getting current month cost:", error);
    return 0;
  }
}

/**
 * Check if cost threshold reached and update audio mode flag
 */
export async function checkAndUpdateAudioMode(): Promise<void> {
  const supabase = createServiceRoleClient();

  try {
    // Get threshold from system_config
    const { data: configData } = await supabase
      .from("system_config")
      .select("value")
      .eq("key", "monthly_cost_threshold_usd")
      .single();

    const threshold = parseFloat(configData?.value ?? "285");

    // Get current month cost
    const currentCost = await getCurrentMonthCost();

    // If threshold reached, disable audio mode
    if (currentCost >= threshold) {
      const { error } = await supabase
        .from("system_config")
        .update({ value: "false" })
        .eq("key", "audio_mode_enabled");

      if (error) {
        console.error("Failed to update audio_mode_enabled:", error);
      } else {
        console.warn(
          `Cost threshold reached ($${currentCost}/$${threshold}). Audio mode disabled.`
        );
      }
    }
  } catch (error) {
    console.error("Error checking cost threshold:", error);
  }
}

/**
 * Check if audio mode is enabled
 */
export async function isAudioModeEnabled(): Promise<boolean> {
  const supabase = createServiceRoleClient();

  try {
    const { data, error } = await supabase
      .from("system_config")
      .select("value")
      .eq("key", "audio_mode_enabled")
      .single();

    if (error) {
      console.error("Failed to check audio_mode_enabled:", error);
      return true; // Fail open
    }

    return data?.value === "true";
  } catch (error) {
    console.error("Error checking audio mode:", error);
    return true; // Fail open
  }
}

/**
 * Get cost breakdown by model for current month
 */
export async function getCostBreakdown(): Promise<
  Array<{
    model: string;
    totalCost: number;
    tokensUsed: number;
    audioSeconds: number;
  }>
> {
  const supabase = createServiceRoleClient();

  const now = new Date();
  const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);

  try {
    const { data, error } = await supabase
      .from("cost_tracking")
      .select("model, estimated_cost_usd, tokens_used, audio_seconds")
      .gte("period_start", periodStart.toISOString());

    if (error) {
      console.error("Failed to get cost breakdown:", error);
      return [];
    }

    // Aggregate by model
    const breakdown = new Map<
      string,
      { totalCost: number; tokensUsed: number; audioSeconds: number }
    >();

    for (const row of data ?? []) {
      const current = breakdown.get(row.model) ?? {
        totalCost: 0,
        tokensUsed: 0,
        audioSeconds: 0,
      };

      current.totalCost += row.estimated_cost_usd;
      current.tokensUsed += row.tokens_used ?? 0;
      current.audioSeconds += row.audio_seconds ?? 0;

      breakdown.set(row.model, current);
    }

    return Array.from(breakdown.entries()).map(([model, stats]) => ({
      model,
      ...stats,
    }));
  } catch (error) {
    console.error("Error getting cost breakdown:", error);
    return [];
  }
}

/**
 * Reset audio mode on first of month (cron job)
 */
export async function resetAudioMode(): Promise<void> {
  const supabase = createServiceRoleClient();

  try {
    const { error } = await supabase
      .from("system_config")
      .update({ value: "true" })
      .eq("key", "audio_mode_enabled");

    if (error) {
      console.error("Failed to reset audio_mode_enabled:", error);
    } else {
      console.log("Audio mode reset for new billing period");
    }
  } catch (error) {
    console.error("Error resetting audio mode:", error);
  }
}
