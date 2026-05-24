// Outbound email helper. Currently backed by Resend
// (https://resend.com). Gated behind RESEND_API_KEY + RESEND_FROM env vars
// so dev environments without those silently skip sending instead of
// crashing. SMS will land here later in the same pattern.

type SendArgs = {
  to: string;
  subject: string;
  text: string;
  /** Optional plain-text fallback heading; defaults to the subject. */
  preheader?: string;
};

export async function sendEmail({ to, subject, text }: SendArgs): Promise<{
  ok: boolean;
  skipped?: boolean;
  error?: string;
}> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM;
  if (!apiKey || !from) {
    // Don't blow up in dev — just log so the action keeps going.
    console.warn(
      `[notify] email skipped (RESEND_API_KEY/RESEND_FROM not set). To=${to}, subject=${subject}`,
    );
    return { ok: true, skipped: true };
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from, to, subject, text }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.error("[notify] Resend error:", res.status, body);
      return { ok: false, error: `Resend ${res.status}` };
    }
    return { ok: true };
  } catch (err) {
    console.error("[notify] Resend request failed:", err);
    return {
      ok: false,
      error: err instanceof Error ? err.message : "send failed",
    };
  }
}
