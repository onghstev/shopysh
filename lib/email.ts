import nodemailer from 'nodemailer';

let _transporter: nodemailer.Transporter | null = null;

function getTransporter() {
  if (_transporter) return _transporter;
  const port = Number(process.env.SMTP_PORT) || 587;
  _transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: process.env.SMTP_SECURE === 'true' || port === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    tls: {
      rejectUnauthorized: false,
    },
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
  });
  return _transporter;
}

export function isEmailConfigured(): boolean {
  return Boolean(
    process.env.SMTP_HOST &&
    process.env.SMTP_USER &&
    process.env.SMTP_PASS
  );
}

export async function verifyEmailConfig(): Promise<{ ok: boolean; error?: string }> {
  if (!isEmailConfigured()) {
    return { ok: false, error: 'SMTP_HOST, SMTP_USER, and SMTP_PASS are not set in environment variables.' };
  }
  try {
    await getTransporter().verify();
    return { ok: true };
  } catch (err: any) {
    _transporter = null; // reset so next call rebuilds
    return { ok: false, error: err.message };
  }
}

export function buildEmailHtml(opts: {
  preheader?: string;
  headline: string;
  body: string;
  senderName: string;
  footerNote?: string;
}): string {
  const jade = '#1a6b55';
  const gold = '#c98a1a';
  const { preheader = '', headline, body, senderName, footerNote } = opts;
  const bodyHtml = body.replace(/\n/g, '<br/>');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>${headline}</title>
  <!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->
</head>
<body style="margin:0;padding:0;background:#f5f0e8;font-family:Arial,Helvetica,sans-serif;">
  ${preheader ? `<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${preheader}</div>` : ''}
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f5f0e8;padding:32px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;">

        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,${jade},#0e3d2f);border-radius:12px 12px 0 0;padding:24px 32px;">
            <table width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td>
                  <div style="display:inline-flex;align-items:center;gap:10px;">
                    <div style="width:36px;height:36px;background:rgba(255,255,255,0.12);border-radius:10px;display:inline-block;text-align:center;line-height:36px;font-weight:bold;color:${gold};font-size:18px;">S</div>
                    <span style="font-size:20px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;">SHOPYSH</span>
                  </div>
                  <div style="margin-top:4px;font-size:11px;color:rgba(255,255,255,0.5);letter-spacing:1px;text-transform:uppercase;">AI Commerce Platform</div>
                </td>
                <td align="right">
                  <span style="font-size:11px;color:rgba(255,255,255,0.4);">From ${senderName}</span>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Gold accent bar -->
        <tr><td style="background:${gold};height:3px;line-height:3px;font-size:0;">&nbsp;</td></tr>

        <!-- Body -->
        <tr>
          <td style="background:#ffffff;padding:36px 32px 28px;border-radius:0;">
            <h1 style="margin:0 0 20px;font-size:22px;font-weight:700;color:#111827;line-height:1.3;">${headline}</h1>
            <div style="font-size:15px;color:#374151;line-height:1.7;">${bodyHtml}</div>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#f9f6f0;border-radius:0 0 12px 12px;padding:20px 32px;border-top:1px solid #e5e0d8;">
            <p style="margin:0;font-size:12px;color:#9ca3af;line-height:1.6;">
              ${footerNote ?? `This message was sent by <strong>${senderName}</strong> using the Shopysh platform.`}
            </p>
            <p style="margin:8px 0 0;font-size:11px;color:#d1cfc9;">Powered by <a href="https://shopysh.com" style="color:${jade};text-decoration:none;">Shopysh</a></p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export async function sendEmail(opts: {
  to: string;
  subject: string;
  headline: string;
  body: string;
  senderName: string;
  preheader?: string;
  footerNote?: string;
}): Promise<{ success: boolean; error?: string }> {
  if (!isEmailConfigured()) {
    return {
      success: false,
      error: 'Email not configured. Set SMTP_HOST, SMTP_USER, SMTP_PASS, and SMTP_FROM in your environment variables.',
    };
  }
  try {
    const html = buildEmailHtml(opts);
    const from = `"${opts.senderName}" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`;
    await getTransporter().sendMail({ from, to: opts.to, subject: opts.subject, html });
    return { success: true };
  } catch (err: any) {
    _transporter = null; // reset on error so next call gets a fresh connection
    return { success: false, error: err.message };
  }
}
