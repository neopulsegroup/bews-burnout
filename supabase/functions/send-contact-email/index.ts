import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import nodemailer from "npm:nodemailer"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { first_name, last_name, email, organization, message } = await req.json()
    const name = `${first_name} ${last_name}`

    // SMTP Credentials - Using Environment Variables
    const host = Deno.env.get('SMTP_HOST') || 'smtp.gmail.com'
    const port = parseInt(Deno.env.get('SMTP_PORT') || '465')
    const user = Deno.env.get('SMTP_USER')
    const pass = Deno.env.get('SMTP_PASS')
    const to = Deno.env.get('SMTP_TO') || user

    if (!user || !pass) {
      throw new Error('Missing SMTP credentials (SMTP_USER, SMTP_PASS)')
    }

    // Nodemailer Transport Configuration
    const transporter = nodemailer.createTransport({
      host: host,
      port: port,
      secure: port === 465, // Use SSL for port 465
      auth: {
        user: user,
        pass: pass,
      },
      // Important for Google/Gmail compatibility
      tls: {
        rejectUnauthorized: false
      }
    })

    const mailOptions = {
      from: `"${name}" <${user}>`,
      to: to,
      replyTo: email,
      subject: `[BEWS Website] Contacto de ${name}`,
      text: `Novo contacto de ${name} (${email})\nOrganização: ${organization}\n\nMensagem:\n${message}`,
      html: `
        <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; color: #2F3439; border: 1px solid #eee; border-radius: 8px; overflow: hidden;">
          <div style="background-color: #6F9F8E; padding: 24px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">Novo Contacto BEWS</h1>
          </div>
          <div style="padding: 24px;">
            <p><strong>Nome:</strong> ${name}</p>
            <p><strong>Email:</strong> <a href="mailto:${email}" style="color: #5E86C6;">${email}</a></p>
            <p><strong>Organização:</strong> ${organization}</p>
            <hr style="border: 0; border-top: 1px solid #eee; margin: 24px 0;">
            <p><strong>Mensagem:</strong></p>
            <div style="background-color: #f9f9f9; padding: 16px; border-radius: 4px; font-style: italic;">
              ${message.replace(/\n/g, '<br>')}
            </div>
          </div>
          <div style="background-color: #f4f4f4; padding: 16px; text-align: center; font-size: 12px; color: #777;">
            Este e-mail foi enviado automaticamente via formulário bewsgroup.eu
          </div>
        </div>
      `,
    }

    await transporter.sendMail(mailOptions)

    return new Response(JSON.stringify({ message: 'Email sent successfully via Nodemailer' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message || String(error) }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
