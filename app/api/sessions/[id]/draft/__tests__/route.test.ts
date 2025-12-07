/**
 * Draft Save API Tests
 *
 * Tests autosave, restore, and cleanup functionality for practice session drafts.
 */

import { NextRequest } from "next/server";
import { GET, POST, DELETE } from "../route";
import { createClient } from "@/lib/supabase/server";

// Mock Supabase client
jest.mock("@/lib/supabase/server", () => ({
  createClient: jest.fn(),
}));

describe("Session Draft API", () => {
  let mockSupabase: any;
  const mockSessionId = "123e4567-e89b-12d3-a456-426614174000";
  const mockUserId = "user-123";

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Create mock Supabase client
    mockSupabase = {
      auth: {
        getUser: jest.fn(),
      },
      from: jest.fn(),
    };

    (createClient as jest.Mock).mockResolvedValue(mockSupabase);
  });

  describe("GET /api/sessions/[id]/draft", () => {
    it("should return draft for authenticated user", async () => {
      // Mock auth
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: mockUserId } },
      });

      // Mock session lookup
      const mockFrom = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn(),
      };

      mockSupabase.from.mockReturnValue(mockFrom);

      // First call: session validation
      mockFrom.single.mockResolvedValueOnce({
        data: { id: mockSessionId, user_id: mockUserId },
        error: null,
      });

      // Second call: draft fetch
      const mockDraft = {
        currentQuestionId: "question-123",
        currentIndex: 2,
        mode: "text",
        answers: {},
        updatedAt: new Date().toISOString(),
      };

      mockFrom.single.mockResolvedValueOnce({
        data: { draft_save: mockDraft },
        error: null,
      });

      const req = new NextRequest("http://localhost/api/sessions/123/draft");
      const response = await GET(req, { params: { id: mockSessionId } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.draft).toEqual(mockDraft);
    });

    it("should return null for session with no draft", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: mockUserId } },
      });

      const mockFrom = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn(),
      };

      mockSupabase.from.mockReturnValue(mockFrom);

      mockFrom.single.mockResolvedValueOnce({
        data: { id: mockSessionId, user_id: mockUserId },
        error: null,
      });

      mockFrom.single.mockResolvedValueOnce({
        data: { draft_save: null },
        error: null,
      });

      const req = new NextRequest("http://localhost/api/sessions/123/draft");
      const response = await GET(req, { params: { id: mockSessionId } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.draft).toBeNull();
    });

    it("should return 404 for non-existent session", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: mockUserId } },
      });

      const mockFrom = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn(),
      };

      mockSupabase.from.mockReturnValue(mockFrom);

      mockFrom.single.mockResolvedValueOnce({
        data: null,
        error: { message: "Not found" },
      });

      const req = new NextRequest("http://localhost/api/sessions/123/draft");
      const response = await GET(req, { params: { id: mockSessionId } });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe("Session not found");
    });

    it("should return 403 for unauthorized access", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: "different-user" } },
      });

      const mockFrom = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn(),
      };

      mockSupabase.from.mockReturnValue(mockFrom);

      mockFrom.single.mockResolvedValueOnce({
        data: { id: mockSessionId, user_id: mockUserId },
        error: null,
      });

      const req = new NextRequest("http://localhost/api/sessions/123/draft");
      const response = await GET(req, { params: { id: mockSessionId } });
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe("Unauthorized");
    });

    it("should allow guest access to guest sessions", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
      });

      const mockFrom = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn(),
      };

      mockSupabase.from.mockReturnValue(mockFrom);

      mockFrom.single.mockResolvedValueOnce({
        data: { id: mockSessionId, user_id: null },
        error: null,
      });

      mockFrom.single.mockResolvedValueOnce({
        data: { draft_save: { currentIndex: 1 } },
        error: null,
      });

      const req = new NextRequest("http://localhost/api/sessions/123/draft");
      const response = await GET(req, { params: { id: mockSessionId } });

      expect(response.status).toBe(200);
    });
  });

  describe("POST /api/sessions/[id]/draft", () => {
    it("should save valid draft data", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: mockUserId } },
      });

      const mockFrom = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn(),
        update: jest.fn().mockReturnThis(),
      };

      mockSupabase.from.mockReturnValue(mockFrom);

      mockFrom.single.mockResolvedValueOnce({
        data: { id: mockSessionId, user_id: mockUserId },
        error: null,
      });

      mockFrom.eq.mockResolvedValueOnce({
        error: null,
      });

      const draftData = {
        currentQuestionId: "question-123",
        currentIndex: 3,
        mode: "text" as const,
        answers: {
          "answer-id-1": {
            text: "My answer",
            isFinal: true,
          },
        },
      };

      const req = new NextRequest("http://localhost/api/sessions/123/draft", {
        method: "POST",
        body: JSON.stringify(draftData),
      });

      const response = await POST(req, { params: { id: mockSessionId } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.draft).toMatchObject(draftData);
      expect(data.draft.updatedAt).toBeDefined();
    });

    it("should reject invalid draft schema", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: mockUserId } },
      });

      const mockFrom = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn(),
      };

      mockSupabase.from.mockReturnValue(mockFrom);

      mockFrom.single.mockResolvedValueOnce({
        data: { id: mockSessionId, user_id: mockUserId },
        error: null,
      });

      const invalidData = {
        currentIndex: "not a number", // Invalid type
      };

      const req = new NextRequest("http://localhost/api/sessions/123/draft", {
        method: "POST",
        body: JSON.stringify(invalidData),
      });

      const response = await POST(req, { params: { id: mockSessionId } });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Invalid draft payload");
    });

    it("should handle autosave during active session", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: mockUserId } },
      });

      const mockFrom = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn(),
        update: jest.fn().mockReturnThis(),
      };

      mockSupabase.from.mockReturnValue(mockFrom);

      mockFrom.single.mockResolvedValueOnce({
        data: { id: mockSessionId, user_id: mockUserId },
        error: null,
      });

      mockFrom.eq.mockResolvedValueOnce({
        error: null,
      });

      // Simulate periodic autosave
      const autosaveData = {
        currentQuestionId: "question-2",
        currentIndex: 2,
        mode: "audio" as const,
        answers: {
          "q1": { text: "Answer 1", isFinal: true },
          "q2": { text: "Partial answer", isFinal: false },
        },
      };

      const req = new NextRequest("http://localhost/api/sessions/123/draft", {
        method: "POST",
        body: JSON.stringify(autosaveData),
      });

      const response = await POST(req, { params: { id: mockSessionId } });

      expect(response.status).toBe(200);
    });

    it("should respect max text length constraint", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: mockUserId } },
      });

      const mockFrom = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn(),
      };

      mockSupabase.from.mockReturnValue(mockFrom);

      mockFrom.single.mockResolvedValueOnce({
        data: { id: mockSessionId, user_id: mockUserId },
        error: null,
      });

      const tooLongText = "a".repeat(6001);
      const invalidData = {
        answers: {
          "q1": { text: tooLongText },
        },
      };

      const req = new NextRequest("http://localhost/api/sessions/123/draft", {
        method: "POST",
        body: JSON.stringify(invalidData),
      });

      const response = await POST(req, { params: { id: mockSessionId } });

      expect(response.status).toBe(400);
    });
  });

  describe("DELETE /api/sessions/[id]/draft", () => {
    it("should clear draft on completion", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: mockUserId } },
      });

      const mockFrom = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn(),
        update: jest.fn().mockReturnThis(),
      };

      mockSupabase.from.mockReturnValue(mockFrom);

      mockFrom.single.mockResolvedValueOnce({
        data: { id: mockSessionId, user_id: mockUserId },
        error: null,
      });

      mockFrom.eq.mockResolvedValueOnce({
        error: null,
      });

      const req = new NextRequest("http://localhost/api/sessions/123/draft", {
        method: "DELETE",
      });

      const response = await DELETE(req, { params: { id: mockSessionId } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);

      // Verify draft was set to null
      expect(mockFrom.update).toHaveBeenCalledWith({ draft_save: null });
    });

    it("should prevent unauthorized draft deletion", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: "different-user" } },
      });

      const mockFrom = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn(),
      };

      mockSupabase.from.mockReturnValue(mockFrom);

      mockFrom.single.mockResolvedValueOnce({
        data: { id: mockSessionId, user_id: mockUserId },
        error: null,
      });

      const req = new NextRequest("http://localhost/api/sessions/123/draft", {
        method: "DELETE",
      });

      const response = await DELETE(req, { params: { id: mockSessionId } });

      expect(response.status).toBe(403);
    });

    it("should handle draft cleanup on session completion", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: mockUserId } },
      });

      const mockFrom = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn(),
        update: jest.fn().mockReturnThis(),
      };

      mockSupabase.from.mockReturnValue(mockFrom);

      mockFrom.single.mockResolvedValueOnce({
        data: { id: mockSessionId, user_id: mockUserId },
        error: null,
      });

      mockFrom.eq.mockResolvedValueOnce({
        error: null,
      });

      const req = new NextRequest("http://localhost/api/sessions/123/draft", {
        method: "DELETE",
      });

      const response = await DELETE(req, { params: { id: mockSessionId } });

      expect(response.status).toBe(200);
      expect(mockFrom.update).toHaveBeenCalledWith({ draft_save: null });
    });
  });

  describe("Draft Restore Flow", () => {
    it("should restore draft after page refresh", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: mockUserId } },
      });

      const existingDraft = {
        currentQuestionId: "question-5",
        currentIndex: 5,
        mode: "text",
        answers: {
          "q1": { text: "Answer 1", isFinal: true },
          "q2": { text: "Answer 2", isFinal: true },
          "q3": { text: "Answer 3", isFinal: true },
          "q4": { text: "Answer 4", isFinal: true },
          "q5": { text: "In progress...", isFinal: false },
        },
        updatedAt: new Date().toISOString(),
      };

      const mockFrom = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn(),
      };

      mockSupabase.from.mockReturnValue(mockFrom);

      mockFrom.single.mockResolvedValueOnce({
        data: { id: mockSessionId, user_id: mockUserId },
        error: null,
      });

      mockFrom.single.mockResolvedValueOnce({
        data: { draft_save: existingDraft },
        error: null,
      });

      const req = new NextRequest("http://localhost/api/sessions/123/draft");
      const response = await GET(req, { params: { id: mockSessionId } });
      const data = await response.json();

      expect(data.draft).toEqual(existingDraft);
      expect(data.draft.currentIndex).toBe(5);
      expect(data.draft.answers["q5"].isFinal).toBe(false);
    });
  });

  describe("Cleanup Scenarios", () => {
    it("should clear draft when session is completed", async () => {
      // Simulates POST to complete session followed by draft cleanup
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: mockUserId } },
      });

      const mockFrom = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn(),
        update: jest.fn().mockReturnThis(),
      };

      mockSupabase.from.mockReturnValue(mockFrom);

      mockFrom.single.mockResolvedValue({
        data: { id: mockSessionId, user_id: mockUserId },
        error: null,
      });

      mockFrom.eq.mockResolvedValue({
        error: null,
      });

      // DELETE draft after completion
      const req = new NextRequest("http://localhost/api/sessions/123/draft", {
        method: "DELETE",
      });

      const response = await DELETE(req, { params: { id: mockSessionId } });

      expect(response.status).toBe(200);
      expect(mockFrom.update).toHaveBeenCalledWith({ draft_save: null });
    });
  });
});
