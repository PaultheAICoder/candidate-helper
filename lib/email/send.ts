import { ClientSecretCredential } from "@azure/identity";
import { Client } from "@microsoft/microsoft-graph-client";
import { TokenCredentialAuthenticationProvider } from "@microsoft/microsoft-graph-client/authProviders/azureTokenCredentials";

export interface MailOptions {
  to: string;
  subject: string;
  html: string;
  cc?: string[];
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing environment variable ${name}`);
  }
  return value;
}

let graphClient: Client | null = null;

function getGraphClient(): Client {
  if (graphClient) return graphClient;

  const tenantId = requireEnv("GRAPH_TENANT_ID");
  const clientId = requireEnv("GRAPH_CLIENT_ID");
  const clientSecret = requireEnv("GRAPH_CLIENT_SECRET");

  const credential = new ClientSecretCredential(tenantId, clientId, clientSecret);

  const authProvider = new TokenCredentialAuthenticationProvider(credential, {
    scopes: ["https://graph.microsoft.com/.default"],
  });

  graphClient = Client.initWithMiddleware({ authProvider });
  return graphClient;
}

export async function sendEmail({ to, subject, html, cc }: MailOptions): Promise<void> {
  const senderEmail = requireEnv("GRAPH_SENDER_EMAIL");
  const client = getGraphClient();

  const message = {
    message: {
      subject,
      body: {
        contentType: "HTML",
        content: html,
      },
      toRecipients: [
        {
          emailAddress: {
            address: to,
          },
        },
      ],
      ...(cc && cc.length > 0
        ? {
            ccRecipients: cc.map((addr) => ({
              emailAddress: { address: addr },
            })),
          }
        : {}),
    },
    saveToSentItems: true,
  };

  try {
    await client.api(`/users/${senderEmail}/sendMail`).post(message);
    console.log(`Email sent successfully to ${to}`);
  } catch (error) {
    console.error("Failed to send email via Microsoft Graph:", error);
    throw new Error(`Failed to send email to ${to}: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}
