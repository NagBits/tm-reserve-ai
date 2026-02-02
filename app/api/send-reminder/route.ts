import { NextResponse } from 'next/server';
import { Resend } from 'resend';

// 1. Initialize Resend with the API Key
const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  // 2. Retrieve the VPE Email from environment variables
  // Check both naming conventions just in case
  const vpeEmail = process.env.VPE_EMAIL || process.env.NEXT_PUBLIC_VPE_EMAIL;

  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({ error: "Missing RESEND_API_KEY" }, { status: 500 });
  }

  try {
    const { email, role, date, userName } = await request.json();

    // 3. Send the email
    const data = await resend.emails.send({
      from: 'Toastmasters <onboarding@resend.dev>', // Update this if you have a custom domain
      to: [email],
      cc: vpeEmail ? [vpeEmail] : [], // Only CC if the variable is found
      subject: `Role Confirmed: ${role} on ${date}`,
      html: `
        <div style="font-family: sans-serif; color: #333;">
          <h1 style="color: #6b21a8;">Role Confirmed!</h1>
          <p>Hi <strong>${userName}</strong>,</p>
          <p>You are officially signed up as <strong>${role}</strong> for the meeting on <strong>${date}</strong>.</p>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="font-size: 12px; color: #666;">
            Need to drop out? Please log in to the dashboard and cancel so others can take the slot.
          </p>
        </div>
      `
    });

    return NextResponse.json(data);
  } catch (error) {
    console.error("Email Error:", error);
    return NextResponse.json({ error: "Failed to send email" }, { status: 500 });
  }
}
