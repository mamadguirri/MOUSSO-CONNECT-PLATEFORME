// En dev, stocker le dernier OTP pour l'afficher dans la réponse API
let lastOtpCode: string | null = null;

export function getLastOtp(): string | null {
  return lastOtpCode;
}

export async function sendOtpSms(phone: string, code: string): Promise<void> {
  if (process.env.NODE_ENV !== 'production' || !process.env.TWILIO_ACCOUNT_SID) {
    lastOtpCode = code;
    console.log(`\n========================================`);
    console.log(`  CODE OTP pour ${phone}: ${code}`);
    console.log(`========================================\n`);
    return;
  }

  const twilio = require('twilio');
  const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

  await client.messages.create({
    body: `Votre code Musso Connect : ${code}. Valable 5 minutes.`,
    from: process.env.TWILIO_PHONE_NUMBER,
    to: phone,
  });
}
