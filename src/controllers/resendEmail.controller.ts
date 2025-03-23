import { Request, Response } from 'express';
import { Resend } from 'resend';
import ENV from '../common/env.js';
import {  ValidationErr } from '../common/routeerror.js';
const resend = new Resend(ENV.RESEND_API_KEY);

const sendEmail = async (req: Request, res: Response): Promise<void> => {

  const { name, email, phone, message } = req.body;
  
  if(!name || !email || !phone || !message) {
    throw new ValidationErr("Missing required fields");
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

    const response = await resend.emails.send({
      from: ENV.RESEND_EMAIL,
      to: email,
      subject: 'New Form Submission Received ✅',
      text: emailContent,
    });

    if (response.data) {
      res.status(200).json({ message: 'Email sent successfully' });
    } else {
      console.error('Failed to send email:', response.error);
      res.status(500).json({ message: 'Failed to send email' });
    }

};

export default { sendEmail };