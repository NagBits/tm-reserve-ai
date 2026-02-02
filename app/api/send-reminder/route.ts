import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  const { email, role, date } = await req.json();

  try {
    const data = await resend.emails.send({
      from: 'VPE@yourclub.com',
      to: [email],
      subject: `Confirmation: You are the ${role}!`,
      html: `<p>Hi! You have successfully reserved the <strong>${role}</strong> role for the meeting on <strong>${date}</strong>.</p>`
    });
    return Response.json(data);
  } catch (error) {
    return Response.json({ error });
  }
}
