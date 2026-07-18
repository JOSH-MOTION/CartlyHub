import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import path from 'path';
import fs from 'fs';
import { db } from '../../../../lib/firebase';
import { collection, getDocs } from 'firebase/firestore';

export async function POST(request) {
  try {
    const { title, message } = await request.json();

    if (!title || !message) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      return NextResponse.json(
        { error: 'Server email credentials are not configured in environment variables' },
        { status: 500 }
      );
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const logoPath = path.join(process.cwd(), 'public', 'cartly logo.png');
    const attachments = [];
    if (fs.existsSync(logoPath)) {
      attachments.push({
        filename: 'logo.png',
        cid: 'logo',
        path: logoPath
      });
    }

    const querySnapshot = await getDocs(collection(db, 'sellers'));
    let successCount = 0;
    let failCount = 0;

    for (const doc of querySnapshot.docs) {
      const data = doc.data();
      const ownerName = data.ownerName || data.storeName || "Partner";
      const storeName = data.storeName || "your store";
      const email = data.contactEmail;

      if (!email || email === "N/A" || !email.includes("@")) {
        continue;
      }

      const htmlContent = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 580px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 24px; overflow: hidden; background-color: #ffffff; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.03);">
          <!-- Header -->
          <div style="background-color: #000000; padding: 35px 20px; text-align: center; border-bottom: 1px solid rgba(255, 255, 255, 0.05);">
            ${fs.existsSync(logoPath) ? '<img src="cid:logo" alt="cartlyHub" style="height: 38px; width: auto;" />' : '<h1 style="color: #ffffff; margin: 0; font-size: 20px; font-weight: 900; letter-spacing: 3px; text-transform: uppercase;">cartlyHub</h1>'}
          </div>
          
          <!-- Content Body -->
          <div style="padding: 40px; text-align: left; color: #1f2937;">
            <h2 style="font-size: 20px; font-weight: 800; color: #111827; margin: 0 0 8px 0; text-transform: uppercase; letter-spacing: -0.02em; text-align: center;">${title}</h2>
            <p style="font-size: 11px; font-weight: 800; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.15em; margin: 0 0 30px 0; text-align: center;">Infrastructure Upgrade Notice</p>
            
            <p style="font-size: 14px; line-height: 1.6; color: #4b5563; margin-bottom: 24px;">
              Dear <strong>${ownerName}</strong>,
            </p>
            
            <p style="font-size: 14px; line-height: 1.6; color: #4b5563; margin-bottom: 24px;">
              ${message.replace(/\n/g, '<br/>')}
            </p>
            
            <!-- Status Grid Block -->
            <div style="background-color: #f9fafb; border: 1px solid #f3f4f6; border-radius: 16px; padding: 20px; margin-bottom: 30px;">
              <p style="font-size: 10px; font-weight: 800; color: #9ca3af; text-transform: uppercase; tracking-wider; margin: 0 0 12px 0;">Security & Sync Status</p>
              <table style="width: 100%; border-collapse: collapse;">
                <tr style="border-bottom: 1px solid #f3f4f6;">
                  <td style="padding: 8px 0; font-size: 12px; font-weight: bold; color: #374151;">Store Profile & Badges</td>
                  <td style="padding: 8px 0; font-size: 12px; font-weight: 800; color: #10b981; text-align: right;">ACTIVE & SAFE ✅</td>
                </tr>
                <tr style="border-bottom: 1px solid #f3f4f6;">
                  <td style="padding: 8px 0; font-size: 12px; font-weight: bold; color: #374151;">Reviews & Ratings</td>
                  <td style="padding: 8px 0; font-size: 12px; font-weight: 800; color: #10b981; text-align: right;">ACTIVE & SAFE ✅</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-size: 12px; font-weight: bold; color: #374151;">Catalog Search Indexes</td>
                  <td style="padding: 8px 0; font-size: 12px; font-weight: 800; color: #f59e0b; text-align: right;">REQUIRES RE-SYNC 🔄</td>
                </tr>
              </table>
            </div>
            
            <!-- Action CTA -->
            <div style="text-align: center; margin: 30px 0;">
              <a href="https://cartlyhub.com/seller" style="display: inline-block; background-color: #000000; color: #ffffff; padding: 16px 36px; text-decoration: none; border-radius: 12px; font-weight: 800; font-size: 11px; text-transform: uppercase; letter-spacing: 0.15em; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">Re-Sync Catalog Now</a>
            </div>
            
            <p style="font-size: 14px; line-height: 1.6; color: #4b5563; margin-bottom: 24px;">
              We sincerely apologize for this extra step, and we are highly grateful for your support as we build Ghana's fastest fashion hub.
            </p>
            
            <p style="font-size: 13px; color: #6b7280; margin-top: 40px; border-top: 1px solid #e5e7eb; padding-top: 24px;">
              Best regards,<br/>
              <span style="font-weight: 800; color: #111827; text-transform: uppercase; font-size: 11px; letter-spacing: 0.05em; display: inline-block; margin-top: 4px;">The cartlyHub Team</span>
            </p>
          </div>
        </div>
      `;

      try {
        await transporter.sendMail({
          from: `"cartlyHub Support" <${process.env.EMAIL_USER}>`,
          to: email,
          subject: `Action Required: ${title}`,
          html: htmlContent,
          attachments: attachments
        });
        successCount++;
      } catch (err) {
        console.error(`Failed to send email to ${storeName}:`, err);
        failCount++;
      }
    }

    return NextResponse.json({ success: true, sent: successCount, failed: failCount });
  } catch (error) {
    console.error('Error running broadcast API:', error);
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
