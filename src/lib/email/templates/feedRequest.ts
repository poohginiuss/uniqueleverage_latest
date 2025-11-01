export interface FeedRequestEmailOptions {
  providerName: string;
  dealerName: string;
  dealerWebsite: string;
  dealerAddress: string;
  dealerContactName: string;
  dealerContactEmail: string;
  filename: string;
  ftpHost: string;
  ftpUser: string;
  ftpPass: string;
}

export function buildFeedRequestEmail(opts: FeedRequestEmailOptions) {
  const subject = `Inventory Feed Request - ${opts.dealerName} (${opts.providerName})`;
  
  const text = `IMPORTANT: Please "Reply-All" on this email for approval.

${opts.providerName} needs to see the approval to finalize an inventory request.


DEALERSHIP:
${opts.dealerWebsite.replace(/^https?:\/\//, '')}
${opts.dealerAddress}

FTP DETAILS:
Host: ${opts.ftpHost}
User: ${opts.ftpUser}
Pass: ${opts.ftpPass}
FileName: ${opts.filename}

Thank you,
Unique Leverage Team`.trim();

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.4; color: #333; margin: 0; padding: 16px; font-size: 14px;">
  <h2 style="margin: 0 0 16px 0; font-size: 18px;">Inventory Feed Request</h2>
  
  <h3 style="margin: 0 0 6px 0; font-size: 12px; font-weight: bold; background-color: #fef08a; color: #000000; padding: 2px 4px; display: inline-block; border-radius: 3px;">IMPORTANT:</h3>
  <p style="margin: 0 0 8px 0; font-size: 13px;">Please "Reply-All" on this email for approval.</p>
  <p style="margin: 0 0 12px 0; font-size: 13px;">${opts.providerName} needs to see the approval to finalize an inventory request.</p>
  
  <h3 style="margin: 0 0 6px 0; font-size: 12px; font-weight: bold; background-color: #fef08a; color: #000000; padding: 2px 4px; display: inline-block; border-radius: 3px;">Dealership:</h3>
  <p style="margin: 0 0 8px 0; font-size: 13px;"><a href="${opts.dealerWebsite}" style="color: #0066cc;">${opts.dealerWebsite.replace(/^https?:\/\//, '')}</a><br>
  ${opts.dealerAddress.replace(/\n/g, '<br>')}</p>
  
  <h3 style="margin: 0 0 6px 0; font-size: 12px; font-weight: bold; background-color: #fef08a; color: #000000; padding: 2px 4px; display: inline-block; border-radius: 3px;">FTP Details:</h3>
  <p style="margin: 0 0 12px 0; font-size: 13px;"><strong>Host:</strong> ${opts.ftpHost}<br>
  <strong>User:</strong> ${opts.ftpUser}<br>
  <strong>Pass:</strong> ${opts.ftpPass}<br>
  <strong>FileName:</strong> ${opts.filename}</p>
  
  <p style="margin: 0;">Thank you,<br>
  Unique Leverage Team</p>
</body>
</html>`.trim();

  const bodyContent = `
  <h3 style="margin: 0 0 6px 0; font-size: 12px; font-weight: bold; background-color: #fef08a; color: #000000; padding: 2px 4px; display: inline-block; border-radius: 3px;">IMPORTANT:</h3>
  <p style="margin: 0 0 8px 0; font-size: 13px;">Please "Reply-All" on this email for approval.</p>
  <p style="margin: 0 0 12px 0; font-size: 13px;">${opts.providerName} needs to see the approval to finalize an inventory request.</p>
  
  <h3 style="margin: 0 0 6px 0; font-size: 12px; font-weight: bold; background-color: #fef08a; color: #000000; padding: 2px 4px; display: inline-block; border-radius: 3px;">Dealership:</h3>
  <p style="margin: 0 0 8px 0; font-size: 13px;"><a href="${opts.dealerWebsite}" style="color: #0066cc;">${opts.dealerWebsite.replace(/^https?:\/\//, '')}</a><br>
  ${opts.dealerAddress.replace(/\n/g, '<br>')}</p>
  
  <h3 style="margin: 0 0 6px 0; font-size: 12px; font-weight: bold; background-color: #fef08a; color: #000000; padding: 2px 4px; display: inline-block; border-radius: 3px;">FTP Details:</h3>
  <p style="margin: 0 0 12px 0; font-size: 13px;"><strong>Host:</strong> ${opts.ftpHost}<br>
  <strong>User:</strong> ${opts.ftpUser}<br>
  <strong>Pass:</strong> ${opts.ftpPass}<br>
  <strong>FileName:</strong> ${opts.filename}</p>
  
  <p style="margin: 0; font-size: 13px;">Thank you,<br>
  Unique Leverage Team</p>`.trim();

  return {
    subject,
    text,
    html,
    bodyContent
  };
}
