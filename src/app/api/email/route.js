import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import path from 'path';
import fs from 'fs';

export async function POST(request) {
  try {
    const { to, subject, html, includeLogo } = await request.json();

    if (!to || !subject || !html) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const attachments = [];

    if (includeLogo) {
      try {
        const logoPath = path.join(process.cwd(), 'public', 'cartly logo.png');
        if (fs.existsSync(logoPath)) {
          attachments.push({
            filename: 'logo.png',
            path: logoPath,
            cid: 'logo' // same cid value as in the html img src
          });
        }
      } catch (logoError) {
        console.error('Error attaching logo:', logoError);
      }
    }

    const mailOptions = {
      from: `"cartlyHub" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
      attachments,
    };

    const info = await transporter.sendMail(mailOptions);

    return NextResponse.json({ success: true, messageId: info.messageId });
  } catch (error) {
    console.error('Error sending email:', error);
    return NextResponse.json(
      { error: 'Failed to send email' },
      { status: 500 }
    );
  }
}
