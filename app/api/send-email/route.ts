import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(request: Request) {
  try {
    const { to, subject, html } = await request.json();

    // 1. Configure the Gmail Transporter
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER, // Your Gmail address
        pass: process.env.EMAIL_PASS, // Your App Password
      },
    });

    // 2. Define email options
    const mailOptions = {
      from: `"Toastmasters Scheduler" <${process.env.EMAIL_USER}>`,
      to: to, // Accepts "user@gmail.com, vpe@gmail.com"
      subject: subject,
      html: html,
    };

    // 3. Send
    await transporter.sendMail(mailOptions);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Nodemailer Error:', error);
    return NextResponse.json({ error: 'Failed to send email via Gmail' }, { status: 500 });
  }
}
