import { Request, Response } from 'express';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const sendEmail = async (req: Request, res: Response): Promise<void> => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { name, email, phone, message } = req.body;
  if(!name || !email || !phone || !message) {
    res.status(400).json({ error: 'Missing required fields' });
    return;
  }

  const emailContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);">
      <div style="background: #007bff; color: #fff; padding: 15px; text-align: center; font-size: 20px;">
        📬 New Form Submission Received ✅
      </div>
      <div style="padding: 20px;">
        <p><strong>👤 Name:</strong> ${name}</p>
        <p><strong>📧 Email:</strong> ${email}</p>
        <p><strong>📞 Phone:</strong> ${phone}</p>
        <p><strong>💬 Message:</strong></p>
        <p style="background: #f1f1f1; padding: 10px; border-radius: 4px;">${message}</p>
      </div>
      <div style="background: #007bff; color: #fff; text-align: center; padding: 10px; font-size: 14px;">
        © 2025 My Company - All Rights Reserved
      </div>
    </div>
  `;

  try {
    const response = await resend.emails.send({
      from: process.env.RESEND_TESTINGEMAIL || '', 
      to: process.env.RESEND_EMAIL|| '',
      subject: 'New Form Submission Received ✅',
      text: emailContent,
    });

    res.status(200).json({
      success: true,
      message: 'Email sent successfully!',
      data: response
    });
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({
      error: 'Failed to send email',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export default { sendEmail };