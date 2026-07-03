import nodemailer from 'nodemailer';

const smtpPort = parseInt(process.env.SMTP_PORT || '587', 10);
const isSecure = process.env.SMTP_SECURE === "true" || smtpPort === 465;

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: smtpPort,
  secure: isSecure,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

transporter.verify((error, success) => {
  if (error) {
    console.error("SMTP Verify Error:", error);
  } else {
    console.log("SMTP Server Ready");
  }
});
export const sendEmail = async ({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}): Promise<void> => {
  if (process.env.NODE_ENV !== 'production') {
    console.log('\n==================================================');
    console.log(`[DEV EMAIL] Sending email to: ${to}`);
    console.log(`Subject: ${subject}`);

    // Attempt to extract 6-digit OTP
    const otpMatch = html.match(/\b(\d{6})\b/);
    if (otpMatch) {
      console.log(`>>> OTP CODE: ${otpMatch[1]} <<<`);
    }

    // Attempt to extract reset password link
    const linkMatch = html.match(/href="([^"]+)"/);
    if (linkMatch) {
      console.log(`>>> RESET LINK: ${linkMatch[1]} <<<`);
    }
    console.log('==================================================\n');
  }

  try {
    const info = await transporter.sendMail({
      from: process.env.FROM_EMAIL || 'no-reply@aicareerroadmap.com',
      to,
      subject,
      html,
    });
    console.log(`Email sent successfully: ${info.messageId}`);
  } catch (error) {
    console.error(`Error sending email: ${(error as Error).message}`);

    // Log the OTP fallback to console in case of failure so deployment testing is possible
    const otpMatch = html.match(/\b(\d{6})\b/);
    if (otpMatch) {
      console.warn(`\n==================================================`);
      console.warn(`[SMTP FAILURE] Failed to send email to ${to}`);
      console.warn(`Fallback OTP code: ${otpMatch[1]}`);
      console.warn(`==================================================\n`);
    }
  }
};
