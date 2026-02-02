// app/actions/email.ts
'use server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendNotification(
  to: string, 
  subject: string, 
  htmlContent: string
) {
  try {
    if (!to) return;

    const data = await resend.emails.send({
      from: 'TM Reserve AI <onboarding@resend.dev>', // MUST use this until you verify a domain
      to: [to], 
      subject: subject,
      html: htmlContent,
    });

    console.log(`✅ Email sent via Resend. ID: ${data.data?.id}`);
    return { success: true, id: data.data?.id };
  } catch (error) {
    console.error("❌ Resend Error:", error);
    return { success: false, error };
  }
}
