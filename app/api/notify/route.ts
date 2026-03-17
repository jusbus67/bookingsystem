import { NextResponse } from "next/server";
import twilio from "twilio";

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromNumber = process.env.TWILIO_PHONE_NUMBER;

function toE164(phoneNumber: string): string {
  const digits = phoneNumber.replace(/\D/g, "");
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  return `+${digits}`;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { phoneNumber, firstName } = body as {
      phoneNumber?: string;
      firstName?: string;
    };

    if (!phoneNumber || typeof phoneNumber !== "string") {
      return NextResponse.json(
        { error: "phoneNumber is required" },
        { status: 400 }
      );
    }

    if (!accountSid || !authToken || !fromNumber) {
      return NextResponse.json(
        { error: "Twilio is not configured" },
        { status: 503 }
      );
    }

    const client = twilio(accountSid, authToken);
    const to = toE164(phoneNumber);
    const name = typeof firstName === "string" && firstName.trim() ? firstName.trim() : "there";
    const messageBody = `Hey ${name}, it's time! You are up next at inked empire. Please head back to the lobby.`;

    await client.messages.create({
      body: messageBody,
      from: fromNumber,
      to,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Notify API error:", err);
    return NextResponse.json(
      { error: "Failed to send message" },
      { status: 500 }
    );
  }
}
