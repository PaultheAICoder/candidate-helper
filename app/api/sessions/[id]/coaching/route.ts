import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateCoaching, generateComprehensiveReport } from "@/lib/openai/coaching";
import { parseSTARScores, calculateAverageSTAR, formatScoresForDB } from "@/lib/scoring/star";
import type { CoachingResponse } from "@/types/models";

/**
 * POST /api/sessions/[id]/coaching
 * Generate coaching feedback for a completed session
 *
 * For US1 (guest sessions):
 * - Fetch all answers for session
 * - Generate coaching for each answer using OpenAI
 * - Calculate STAR scores and update answers
 * - Generate comprehensive report with strengths and clarifications
 * - Mark session as completed
 *
 * Returns:
 * - reportId: UUID
 * - sessionId: UUID
 * - completed: boolean
 */
export async function POST(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const sessionId = params.id;

    // Create Supabase client
    const supabase = await createClient();

    // Get current user (may be null for guests)
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Fetch session details
    const { data: session, error: sessionError } = await supabase
      .from("sessions")
      .select("id, user_id, mode, question_count, low_anxiety_enabled, completed_at")
      .eq("id", sessionId)
      .single();

    if (sessionError || !session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    // Check authorization
    if (session.user_id && session.user_id !== user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Check if report already exists
    const { data: existingReport } = await supabase
      .from("reports")
      .select("id")
      .eq("session_id", sessionId)
      .single();

    if (existingReport) {
      return NextResponse.json({
        reportId: existingReport.id,
        sessionId,
        completed: true,
        message: "Report already generated",
      });
    }

    // Fetch all questions and answers for this session
    const { data: questionsWithAnswers, error: fetchError } = await supabase
      .from("questions")
      .select(
        `
        id,
        question_text,
        category,
        question_order,
        answers (
          id,
          transcript_text
        )
      `
      )
      .eq("session_id", sessionId)
      .order("question_order");

    if (fetchError || !questionsWithAnswers) {
      return NextResponse.json({ error: "Failed to fetch questions and answers" }, { status: 500 });
    }

    // Check if all questions have been answered
    const answeredQuestions = questionsWithAnswers.filter((q) => q.answers !== null);

    if (answeredQuestions.length === 0) {
      return NextResponse.json({ error: "No answers submitted yet" }, { status: 400 });
    }

    // Generate coaching for each answer
    const coachingResults: Array<{
      questionId: string;
      answerId: string;
      questionText: string;
      answerText: string;
      coaching: CoachingResponse;
    }> = [];

    for (const question of answeredQuestions) {
      const answer = Array.isArray(question.answers) ? question.answers[0] : question.answers;

      if (!answer) continue; // Skip if no answer

      try {
        const coaching = await generateCoaching({
          questionText: question.question_text,
          answerText: answer.transcript_text,
          category: question.category,
          // Resume and JD context will be added in US2+
        });

        coachingResults.push({
          questionId: question.id,
          answerId: answer.id,
          questionText: question.question_text,
          answerText: answer.transcript_text,
          coaching,
        });

        // Update answer with STAR scores
        const { scores, specificityTag, impactTag, clarityTag, honestyFlag } =
          parseSTARScores(coaching);

        await supabase
          .from("answers")
          .update({
            ...formatScoresForDB(scores),
            specificity_tag: specificityTag,
            impact_tag: impactTag,
            clarity_tag: clarityTag,
            honesty_flag: honestyFlag,
          })
          .eq("id", answer.id);
      } catch (error) {
        console.error(`Error generating coaching for question ${question.id}:`, error);
        // Continue with other questions
      }
    }

    if (coachingResults.length === 0) {
      return NextResponse.json({ error: "Failed to generate coaching feedback" }, { status: 500 });
    }

    // Calculate average STAR score for session
    const allScores = coachingResults.map((r) => parseSTARScores(r.coaching).scores);
    const avgSTAR =
      allScores.reduce((sum, scores) => sum + calculateAverageSTAR(scores), 0) / allScores.length;

    // Update session with average STAR score and mark as completed
    await supabase
      .from("sessions")
      .update({
        avg_star_score: avgSTAR,
        completed_at: new Date().toISOString(),
      })
      .eq("id", sessionId);

    // Generate comprehensive report
    const comprehensiveReport = await generateComprehensiveReport({
      answers: coachingResults.map((r) => ({
        questionText: r.questionText,
        answerText: r.answerText,
        coaching: r.coaching,
      })),
      // Resume and JD context will be added in US2+
    });

    // Prepare per-question feedback
    const perQuestionFeedback = coachingResults.map((r) => ({
      question_id: r.questionId,
      narrative: r.coaching.narrative,
      example_answer: r.coaching.example_answer,
    }));

    // Delete existing report if it exists (for test idempotency)
    await supabase.from("reports").delete().eq("session_id", sessionId);

    // Insert report
    const { data: report, error: reportError } = await supabase
      .from("reports")
      .insert({
        session_id: sessionId,
        strengths: comprehensiveReport.strengths,
        clarifications: comprehensiveReport.clarifications,
        per_question_feedback: perQuestionFeedback,
      })
      .select("id")
      .single();

    if (reportError || !report) {
      console.error("Error creating report:", reportError);
      return NextResponse.json({ error: "Failed to create report" }, { status: 500 });
    }

    // Track coaching_viewed event
    await supabase.from("events").insert({
      user_id: user?.id ?? null,
      event_type: "coaching_viewed",
      session_id: sessionId,
      payload: {
        avg_star_score: avgSTAR,
        questions_answered: coachingResults.length,
      },
    });

    return NextResponse.json({
      reportId: report.id,
      sessionId,
      completed: true,
    });
  } catch (error) {
    console.error("Unexpected error in POST /api/sessions/[id]/coaching:", error);
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
  }
}
