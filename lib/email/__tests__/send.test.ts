// Mock the Azure and Microsoft Graph modules
const mockPost = jest.fn().mockResolvedValue({});
const mockApi = jest.fn().mockReturnValue({ post: mockPost });

jest.mock("@azure/identity", () => ({
  ClientSecretCredential: jest.fn().mockImplementation(() => ({})),
}));

jest.mock("@microsoft/microsoft-graph-client", () => ({
  Client: {
    initWithMiddleware: jest.fn().mockImplementation(() => ({
      api: (path: string) => mockApi(path),
    })),
  },
}));

jest.mock("@microsoft/microsoft-graph-client/authProviders/azureTokenCredentials", () => ({
  TokenCredentialAuthenticationProvider: jest.fn().mockImplementation(() => ({})),
}));

// Import after mocks are set up
import { sendEmail } from "@/lib/email/send";

describe("sendEmail", () => {
  beforeEach(() => {
    process.env.GRAPH_TENANT_ID = "test-tenant-id";
    process.env.GRAPH_CLIENT_ID = "test-client-id";
    process.env.GRAPH_CLIENT_SECRET = "test-client-secret";
    process.env.GRAPH_SENDER_EMAIL = "test@example.com";
    mockPost.mockClear();
    mockApi.mockClear();

    // Reset the module to clear cached client
    jest.resetModules();
  });

  afterEach(() => {
    delete process.env.GRAPH_TENANT_ID;
    delete process.env.GRAPH_CLIENT_ID;
    delete process.env.GRAPH_CLIENT_SECRET;
    delete process.env.GRAPH_SENDER_EMAIL;
  });

  it("sends email via Microsoft Graph", async () => {
    await sendEmail({
      to: "recipient@example.com",
      subject: "Test Subject",
      html: "<p>Hello</p>",
    });

    expect(mockApi).toHaveBeenCalledWith("/users/test@example.com/sendMail");
    expect(mockPost).toHaveBeenCalledWith(
      expect.objectContaining({
        message: expect.objectContaining({
          subject: "Test Subject",
          body: {
            contentType: "HTML",
            content: "<p>Hello</p>",
          },
          toRecipients: [
            {
              emailAddress: {
                address: "recipient@example.com",
              },
            },
          ],
        }),
        saveToSentItems: true,
      })
    );
  });

  it("includes CC recipients when provided", async () => {
    await sendEmail({
      to: "recipient@example.com",
      subject: "Test",
      html: "<p>Hi</p>",
      cc: ["cc1@example.com", "cc2@example.com"],
    });

    expect(mockPost).toHaveBeenCalledWith(
      expect.objectContaining({
        message: expect.objectContaining({
          ccRecipients: [
            { emailAddress: { address: "cc1@example.com" } },
            { emailAddress: { address: "cc2@example.com" } },
          ],
        }),
      })
    );
  });

  it("throws when GRAPH_SENDER_EMAIL is missing", async () => {
    delete process.env.GRAPH_SENDER_EMAIL;

    await expect(
      sendEmail({ to: "a@b.com", subject: "x", html: "<p>x</p>" })
    ).rejects.toThrow("Missing environment variable GRAPH_SENDER_EMAIL");
  });

  it("throws with descriptive error when Graph API fails", async () => {
    mockPost.mockRejectedValueOnce(new Error("Graph API error"));

    await expect(
      sendEmail({ to: "a@b.com", subject: "x", html: "<p>x</p>" })
    ).rejects.toThrow("Failed to send email to a@b.com: Graph API error");
  });
});
