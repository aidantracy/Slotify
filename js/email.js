// Email sending for Slotify, built on nodemailer.
//
// Configuration (all via environment variables, see .env.example):
//   - If SMTP_HOST is set, real email is sent through that SMTP server.
//   - If it is NOT set, a free Ethereal test inbox is created automatically.
//     No real email is delivered; instead a preview URL is logged to the
//     console so you can see exactly what would have been sent. This lets the
//     app work out of the box for local development and demos.

import nodemailer from 'nodemailer';

let cachedTransporter = null;
let usingEthereal = false;

async function getTransporter() {
  if (cachedTransporter) return cachedTransporter;

  if (process.env.SMTP_HOST) {
    cachedTransporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: String(process.env.SMTP_SECURE) === 'true',
      auth: process.env.SMTP_USER
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
        : undefined,
    });
  } else {
    // Dev/demo fallback: a throwaway Ethereal inbox.
    const testAccount = await nodemailer.createTestAccount();
    usingEthereal = true;
    cachedTransporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: { user: testAccount.user, pass: testAccount.pass },
    });
    console.log('No SMTP configured — using an Ethereal test inbox. Email previews will be logged below.');
  }
  return cachedTransporter;
}

// Build the two messages (guest + provider) for a booking. Pure function, so
// it's easy to test without sending anything.
export function buildMeetingEmails(booking, provider) {
  const guestName = `${booking.first_name} ${booking.last_name}`;
  const providerName = `${provider.first_name} ${provider.last_name}`;
  const from = process.env.EMAIL_FROM || 'Slotify <no-reply@slotify.local>';

  const detailsText =
    `Date:  ${booking.date}\n` +
    `Time:  ${booking.start_time}\n` +
    `With:  ${providerName}\n` +
    `Guest: ${guestName} (${booking.email_address})`;

  const detailsHtml = `
    <ul>
      <li><strong>Date:</strong> ${booking.date}</li>
      <li><strong>Time:</strong> ${booking.start_time}</li>
      <li><strong>With:</strong> ${providerName}</li>
      <li><strong>Guest:</strong> ${guestName} (${booking.email_address})</li>
    </ul>`;

  const guestMsg = {
    from,
    to: booking.email_address,
    subject: `Your meeting with ${providerName} is scheduled`,
    text: `Hi ${booking.first_name},\n\nYour meeting with ${providerName} is confirmed.\n\n${detailsText}\n\nSee you then!\n— Slotify`,
    html: `<p>Hi ${booking.first_name},</p><p>Your meeting with <strong>${providerName}</strong> is confirmed.</p>${detailsHtml}<p>See you then!<br>— Slotify</p>`,
  };

  const providerMsg = {
    from,
    to: provider.email_address,
    subject: `New meeting booked by ${guestName}`,
    text: `Hi ${provider.first_name},\n\n${guestName} just booked a meeting with you.\n\n${detailsText}\n\n— Slotify`,
    html: `<p>Hi ${provider.first_name},</p><p><strong>${guestName}</strong> just booked a meeting with you.</p>${detailsHtml}<p>— Slotify</p>`,
  };

  return { guestMsg, providerMsg };
}

// Send both meeting emails. Returns preview URLs when using Ethereal.
export async function sendMeetingEmails(booking, provider) {
  if (!provider || !provider.email_address || !booking.email_address) {
    throw new Error('Both guest and provider must have an email address.');
  }
  const { guestMsg, providerMsg } = buildMeetingEmails(booking, provider);
  const transporter = await getTransporter();

  const results = await Promise.all([
    transporter.sendMail(guestMsg),
    transporter.sendMail(providerMsg),
  ]);

  if (usingEthereal) {
    results.forEach((r) => {
      const url = nodemailer.getTestMessageUrl(r);
      if (url) console.log('Email preview:', url);
    });
  }
  return results;
}
