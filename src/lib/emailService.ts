export interface EmailPayload {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail(payload: EmailPayload) {
  try {
    const response = await fetch('/api/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'ইমেইল পাঠাতে ব্যর্থ হয়েছে');
    }

    return await response.json();
  } catch (error: any) {
    console.error('Email service error:', error);
    throw error;
  }
}
