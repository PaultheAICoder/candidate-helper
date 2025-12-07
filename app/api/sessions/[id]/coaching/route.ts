import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateCoaching, generateComprehensiveReport } from "@/lib/openai/coaching";
import { fallbackCoaching } from "@/lib/openai/fallback-coaching";

interface FeedbackRow {
  question_id: string;
  narrative: string;
  example_answer: string;
  scores?: {
    situation: number;
    task: number;
    action: number;
    result: number;
    specificity_tag: string;
    impact_tag: string;
    clarity_tag: string;
  };
}

export async function POST(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Validate session
    const { data: session, error: sessionError } = await supabase
      .from("sessions")
      .select("id, user_id, low_anxiety_enabled, question_count, job_description_text")
      .eq("id", params.id)
      .single();

    if (sessionError || !session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    if (session.user_id && session.user_id !== user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Fetch answers with questions for ordering
    const { data: answers, error: answersError } = await supabase
      .from("answers")
      .select("id, transcript_text, questions(question_text, question_order, id)")
      .eq("session_id", session.id);

    if (answersError) {
      console.error("Error fetching answers:", answersError);
      return NextResponse.json({ error: "Failed to fetch answers" }, { status: 500 });
    }

    if (!answers || answers.length === 0) {
      return NextResponse.json({ error: "No answers submitted yet" }, { status: 400 });
    }

    const sorted = answers
      .map((a) => ({
        id: a.id,
        transcript: a.transcript_text,
        questionText: (a.questions as { question_text: string; question_order: number }).question_text,
        questionOrder: (a.questions as { question_order: number }).question_order,
        questionId: (a.questions as { id: string }).id,
      }))
      .sort((a, b) => a.questionOrder - b.questionOrder);

    const perQuestionFeedback: FeedbackRow[] = [];
    let totalScores = 0;
    let scoreCount = 0;

    for (const item of sorted) {
      const useOpenAI = Boolean(process.env.OPENAI_API_KEY);
      let coaching;
      try {
        coaching = useOpenAI
          ? await generateCoaching({
              questionText: item.questionText,
              answerText: item.transcript,
              category: "tailored_behavioral",
              jobDescriptionContext: session.job_description_text ?? undefined,
            })
          : fallbackCoaching(item.questionText, item.transcript);
      } catch (error) {
        console.error("Coaching generation failed, using fallback:", error);
        coaching = fallbackCoaching(item.questionText, item.transcript);
      }

      // Persist scores/tags to answers
      const star = coaching.star_scores;
      await supabase
        .from("answers")
        .update({
          star_situation_score: star.situation,
          star_task_score: star.task,
          star_action_score: star.action,
          star_result_score: star.result,
          specificity_tag: coaching.specificity_tag,
          impact_tag: coaching.impact_tag,
          clarity_tag: coaching.clarity_tag,
          honesty_flag: coaching.honesty_flag,
        })
        .eq("id", item.id);

      totalScores += (star.situation + star.task + star.action + star.result) / 4;
      scoreCount += 1;

      perQuestionFeedback.push({
        question_id: item.questionId,
        narrative: coaching.narrative,
        example_answer: coaching.example_answer,
        scores: {
          situation: star.situation,
          task: star.task,
          action: star.action,
          result: star.result,
          specificity_tag: coaching.specificity_tag,
          impact_tag: coaching.impact_tag,
          clarity_tag: coaching.clarity_tag,
        },
      });
    }

    const avgScore = scoreCount > 0 ? Math.round((totalScores / scoreCount) * 100) / 100 : null;

    let strengths: Array<{ text: string; evidence: string }> = [];
    let clarifications: Array<{ suggestion: string; rationale: string }> = [];

    try {
      const comprehensive = await generateComprehensiveReport({
        answers: sorted.map((item, idx) => ({
          questionText: item.questionText,
          answerText: item.transcript,
          coaching: {
            star_scores: { situation: 4, task: 4, action: 4, result: 4 },
            specificity_tag: "specific",
            impact_tag: "medium_impact",
            clarity_tag: "clear",
            honesty_flag: false,
            narrative: perQuestionFeedback[idx]?.narrative || "",
            example_answer: perQuestionFeedback[idx]?.example_answer || "",
          },
        })),
        jobDescriptionContext: session.job_description_text ?? undefined,
      });
      strengths = comprehensive.strengths ?? [];
      clarifications = comprehensive.clarifications ?? [];
    } catch (error) {
      console.error("Comprehensive report generation failed, using fallback:", error);
      strengths = sorted.slice(0, 3).map((item, idx) => ({
        text: `Strength ${idx + 1}`,
        evidence: item.questionText,
      }));
      clarifications = [
        { suggestion: "Add measurable outcomes", rationale: "Numbers make impact clear." },
        { suggestion: "Tighten the action step", rationale: "Be explicit about what you did." },
        { suggestion: "Close with a result", rationale: "End answers with outcomes or learnings." },
      ];
    }

    // Upsert report
    const { data: existingReport } = await supabase
      .from("reports")
      .select("id")
      .eq("session_id", session.id)
      .maybeSingle();

    let reportId = existingReport?.id;

    const reportPayload = {
      session_id: session.id,
      strengths,
      clarifications,
      per_question_feedback: perQuestionFeedback,
    };

    if (!reportId) {
      const { data: report, error: reportError } = await supabase
        .from("reports")
        .insert(reportPayload)
        .select("id")
        .single();

      if (reportError || !report) {
        console.error("Error inserting report:", reportError);
        return NextResponse.json({ error: "Failed to generate report" }, { status: 500 });
      }

      reportId = report.id;
    } else {
      const { error: updateError } = await supabase
        .from("reports")
        .update(reportPayload)
        .eq("id", reportId);
      if (updateError) {
        console.error("Error updating report:", updateError);
      }
    }

    // Mark session completed
    await supabase
      .from("sessions")
      .update({ completed_at: new Date().toISOString(), avg_star_score: avgScore })
      .eq("id", session.id);

    return NextResponse.json({
      reportId,
      strengths,
      clarifications,
      per_question_feedback: perQuestionFeedback,
      lowAnxietyMode: session.low_anxiety_enabled ?? false,
      id: reportId,
    });
  } catch (error) {
    console.error("Unexpected error in POST /api/sessions/[id]/coaching:", error);
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
  }
}
