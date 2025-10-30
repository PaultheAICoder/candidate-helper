import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * POST /api/sessions/[id]/questions
 * Generate and fetch interview questions for a session
 *
 * For guest sessions:
 * - Fetches generic soft-skill questions from question bank
 * - Returns mix based on categories (conflict, leadership, ownership, etc.)
 *
 * For registered sessions with resume/JD:
 * - Generates tailored questions via OpenAI (US2)
 * - Mixes tailored with generic soft-skills
 *
 * Returns:
 * - questions: Array of question objects with id, text, category, order
 */
export async function POST(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const sessionId = params.id;

    // Create Supabase client
    const supabase = await createClient();

    // Fetch session details
    const { data: session, error: sessionError } = await supabase
      .from("sessions")
      .select("id, user_id, mode, question_count, low_anxiety_enabled, job_description_text")
      .eq("id", sessionId)
      .single();

    if (sessionError || !session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    // Check if questions already generated
    const { count: existingCount } = await supabase
      .from("questions")
      .select("*", { count: "exact", head: true })
      .eq("session_id", sessionId);

    // Expected question count (3 for low-anxiety, session.question_count otherwise)
    const expectedCount = session.low_anxiety_enabled ? 3 : session.question_count;

    if (existingCount && existingCount === expectedCount) {
      // Questions already exist with correct count, fetch and return them
      const { data: existingQuestions, error: fetchError } = await supabase
        .from("questions")
        .select("id, question_text, question_order, category")
        .eq("session_id", sessionId)
        .order("question_order");

      if (fetchError) {
        return NextResponse.json({ error: "Failed to fetch questions" }, { status: 500 });
      }

      return NextResponse.json({
        questions: existingQuestions.map((q) => ({
          id: q.id,
          text: q.question_text,
          order: q.question_order,
          category: q.category,
        })),
      });
    }

    // Questions count mismatch or don't exist - will regenerate below
    // Don't try to delete since this endpoint may not have RLS permission to do so
    // Test cleanup hooks should handle cleaning up stale sessions/questions

    // Generate new questions
    // For US1 (guest sessions), use in-memory question bank
    if (!session.user_id) {
      const { getRandomQuestions } = await import("@/lib/data/question-bank");

      // For Low-Anxiety Mode: 3 questions
      // For regular: use session.question_count
      const count = session.low_anxiety_enabled ? 3 : session.question_count;

      // Get random questions from the bank
      const randomQuestions = getRandomQuestions(count, session.low_anxiety_enabled ?? false);

      if (randomQuestions.length === 0) {
        return NextResponse.json(
          { error: "No questions available in question bank" },
          { status: 500 }
        );
      }

      // Insert questions into session
      const questionsToInsert = randomQuestions.map((question, index) => ({
        session_id: sessionId,
        question_order: index + 1,
        question_text: question.text,
        category: question.category,
        is_tailored: false,
      }));

      const { data: insertedQuestions, error: insertError } = await supabase
        .from("questions")
        .insert(questionsToInsert)
        .select("id, question_text, question_order, category");

      if (insertError || !insertedQuestions) {
        console.error("Error inserting questions:", {
          code: insertError?.code,
          message: insertError?.message,
          details: insertError?.details,
          hint: insertError?.hint,
          questions: questionsToInsert,
        });
        return NextResponse.json({ error: "Failed to generate questions" }, { status: 500 });
      }

      return NextResponse.json({
        questions: insertedQuestions.map((q) => ({
          id: q.id,
          text: q.question_text,
          order: q.question_order,
          category: q.category,
        })),
      });
    }

    // For US2+ (registered users with resume/JD)
    // Fetch user's resume from profiles table
    const { data: userProfile, error: profileError } = await supabase
      .from("profiles")
      .select("resume_storage_path, seniority_level")
      .eq("user_id", session.user_id)
      .single();

    if (profileError || !userProfile || !userProfile.resume_storage_path) {
      // No resume available - fall back to generic questions
      const { getGenericQuestions } = await import("@/lib/openai/questions");
      const { getRandomQuestions } = await import("@/lib/data/question-bank");

      const count = session.low_anxiety_enabled ? 3 : session.question_count;
      const genericQuestions = getGenericQuestions();
      const randomFromBank = getRandomQuestions(count, session.low_anxiety_enabled ?? false);

      // Combine generic + random from bank
      const combinedQuestions = [...genericQuestions, ...randomFromBank].slice(0, count);

      const questionsToInsert = combinedQuestions.map((question, index) => ({
        session_id: sessionId,
        question_order: index + 1,
        question_text: question.text,
        category: question.category,
        is_tailored: false,
      }));

      const { data: insertedQuestions, error: insertError } = await supabase
        .from("questions")
        .insert(questionsToInsert)
        .select("id, question_text, question_order, category");

      if (insertError || !insertedQuestions) {
        console.error("Error inserting fallback questions (no resume):", {
          code: insertError?.code,
          message: insertError?.message,
          details: insertError?.details,
          hint: insertError?.hint,
          sessionId,
          questionsToInsert,
        });
        return NextResponse.json({ error: "Failed to generate questions" }, { status: 500 });
      }

      return NextResponse.json({
        questions: insertedQuestions.map((q) => ({
          id: q.id,
          text: q.question_text,
          order: q.question_order,
          category: q.category,
        })),
      });
    }

    // Generate tailored questions if resume exists and JD is provided
    if (session.job_description_text && userProfile.resume_storage_path) {
      try {
        const { generateTailoredQuestions, mixQuestions, getGenericQuestions } = await import(
          "@/lib/openai/questions"
        );

        // Fetch resume from Supabase Storage
        const { data: resumeData, error: downloadError } = await supabase.storage
          .from("resumes")
          .download(userProfile.resume_storage_path);

        if (downloadError || !resumeData) {
          console.error("Error downloading resume:", downloadError);
          // Fall back to generic questions if resume fetch fails
          const { getRandomQuestions } = await import("@/lib/data/question-bank");
          const count = session.low_anxiety_enabled ? 3 : session.question_count;
          const fallbackQuestions = getRandomQuestions(count, session.low_anxiety_enabled ?? false);

          const questionsToInsert = fallbackQuestions.map((q, index) => ({
            session_id: sessionId,
            question_order: index + 1,
            question_text: q.text,
            category: q.category,
            is_tailored: false,
          }));

          const { data: insertedQuestions, error: insertError } = await supabase
            .from("questions")
            .insert(questionsToInsert)
            .select("id, question_text, question_order, category");

          if (insertError || !insertedQuestions) {
            console.error("Error inserting fallback questions (resume fetch failed):", {
              code: insertError?.code,
              message: insertError?.message,
              details: insertError?.details,
              hint: insertError?.hint,
              sessionId,
              questionsToInsert,
            });
            return NextResponse.json({ error: "Failed to generate questions" }, { status: 500 });
          }

          return NextResponse.json({
            questions: insertedQuestions.map((q) => ({
              id: q.id,
              text: q.question_text,
              order: q.question_order,
              category: q.category,
            })),
          });
        }

        // Convert blob to text
        const resumeText = await resumeData.text();
        const count = session.low_anxiety_enabled ? 3 : session.question_count;

        // Generate tailored questions
        const tailoredQuestions = await generateTailoredQuestions(
          resumeText,
          session.job_description_text,
          Math.max(2, Math.floor(count * 0.75)) // 75% tailored, 25% generic
        );

        // Get generic questions
        const genericQuestions = getGenericQuestions();

        // Mix them together
        const mixedQuestions = mixQuestions(
          tailoredQuestions,
          genericQuestions,
          Math.max(2, Math.floor(count * 0.75)),
          Math.max(1, Math.ceil(count * 0.25))
        );

        // Use only the required count
        const finalQuestions = mixedQuestions.slice(0, count);

        // Insert questions into session
        const questionsToInsert = finalQuestions.map((question, index) => ({
          session_id: sessionId,
          question_order: index + 1,
          question_text: question.text,
          category: question.category,
          is_tailored: question.isTailored,
          context: question.context || null,
        }));

        const { data: insertedQuestions, error: insertError } = await supabase
          .from("questions")
          .insert(questionsToInsert)
          .select("id, question_text, question_order, category, is_tailored");

        if (insertError || !insertedQuestions) {
          console.error("Error inserting tailored questions:", {
            code: insertError?.code,
            message: insertError?.message,
            details: insertError?.details,
            hint: insertError?.hint,
            sessionId,
            questionsToInsert,
          });
          // Fall back to generic questions
          const { getRandomQuestions } = await import("@/lib/data/question-bank");
          const fallbackQuestions = getRandomQuestions(count, session.low_anxiety_enabled ?? false);

          const fallbackInsert = fallbackQuestions.map((q, index) => ({
            session_id: sessionId,
            question_order: index + 1,
            question_text: q.text,
            category: q.category,
            is_tailored: false,
          }));

          const { data: fallbackData, error: fallbackError } = await supabase
            .from("questions")
            .insert(fallbackInsert)
            .select("id, question_text, question_order, category");

          if (fallbackError || !fallbackData) {
            console.error("Error inserting fallback questions (tailored failed):", {
              code: fallbackError?.code,
              message: fallbackError?.message,
              details: fallbackError?.details,
              hint: fallbackError?.hint,
              sessionId,
              fallbackInsert,
            });
            return NextResponse.json({ error: "Failed to generate questions" }, { status: 500 });
          }

          return NextResponse.json({
            questions: fallbackData.map((q) => ({
              id: q.id,
              text: q.question_text,
              order: q.question_order,
              category: q.category,
            })),
          });
        }

        return NextResponse.json({
          questions: insertedQuestions.map((q) => ({
            id: q.id,
            text: q.question_text,
            order: q.question_order,
            category: q.category,
            isTailored: q.is_tailored,
          })),
        });
      } catch (error) {
        console.error("Error generating tailored questions:", {
          message: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
          sessionId,
        });
        // Fall back to generic questions on error
        const { getRandomQuestions } = await import("@/lib/data/question-bank");
        const count = session.low_anxiety_enabled ? 3 : session.question_count;
        const fallbackQuestions = getRandomQuestions(count, session.low_anxiety_enabled ?? false);

        const questionsToInsert = fallbackQuestions.map((q, index) => ({
          session_id: sessionId,
          question_order: index + 1,
          question_text: q.text,
          category: q.category,
          is_tailored: false,
        }));

        const { data: insertedQuestions, error: insertError } = await supabase
          .from("questions")
          .insert(questionsToInsert)
          .select("id, question_text, question_order, category");

        if (insertError || !insertedQuestions) {
          console.error("Error inserting fallback in catch handler:", {
            code: insertError?.code,
            message: insertError?.message,
            details: insertError?.details,
            hint: insertError?.hint,
            sessionId,
            questionsToInsert,
          });
          return NextResponse.json({ error: "Failed to generate questions" }, { status: 500 });
        }

        return NextResponse.json({
          questions: insertedQuestions.map((q) => ({
            id: q.id,
            text: q.question_text,
            order: q.question_order,
            category: q.category,
          })),
        });
      }
    }

    // User has resume but no JD provided - use generic + skill-based mix
    const { getGenericQuestions } = await import("@/lib/openai/questions");
    const { getRandomQuestions } = await import("@/lib/data/question-bank");

    const count = session.low_anxiety_enabled ? 3 : session.question_count;
    const genericQuestions = getGenericQuestions();
    const bankQuestions = getRandomQuestions(count, session.low_anxiety_enabled ?? false);

    const combinedQuestions = [...genericQuestions.slice(0, 2), ...bankQuestions].slice(0, count);

    const questionsToInsert = combinedQuestions.map((question, index) => ({
      session_id: sessionId,
      question_order: index + 1,
      question_text: question.text,
      category: question.category,
      is_tailored: false,
    }));

    const { data: insertedQuestions, error: insertError } = await supabase
      .from("questions")
      .insert(questionsToInsert)
      .select("id, question_text, question_order, category");

    if (insertError || !insertedQuestions) {
      console.error("Error inserting final questions (no JD):", {
        code: insertError?.code,
        message: insertError?.message,
        details: insertError?.details,
        hint: insertError?.hint,
        sessionId,
        questionsToInsert,
      });
      return NextResponse.json({ error: "Failed to generate questions" }, { status: 500 });
    }

    return NextResponse.json({
      questions: insertedQuestions.map((q) => ({
        id: q.id,
        text: q.question_text,
        order: q.question_order,
        category: q.category,
      })),
    });
  } catch (error) {
    console.error("Unexpected error in POST /api/sessions/[id]/questions:", {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      sessionId: params.id,
    });
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
  }
}
