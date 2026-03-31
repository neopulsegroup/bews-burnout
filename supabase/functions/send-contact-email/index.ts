import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { SMTPClient } from "https://deno.land/x/smtp@v0.7.0/mod.ts"

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

    // SMTP Credentials - These should be set in Supabase Dashboard
    const host = Deno.env.get('SMTP_HOST')
    const port = parseInt(Deno.env.get('SMTP_PORT') || '587')
    const user = Deno.env.get('SMTP_USER')
    const pass = Deno.env.get('SMTP_PASS')
    const to = Deno.env.get('SMTP_TO') || user

    if (!host || !user || !pass) {
      throw new Error('Missing SMTP configuration (SMTP_HOST, SMTP_USER, SMTP_PASS)')
    }

    const client = new SMTPClient({
      connection: {
        hostname: host,
        port: port,
        tls: port === 465, // Usually true for 465, false for 587
        auth: { username: user, password: pass },
      },
    })

    const body = `
      Novo contacto via BEWS Group Website:

      Nome: ${name}
      Email: ${email}
      Organização: ${organization}
      Mensagem:
      ${message}
    `

    await client.send({
      from: user,
      to: to,
      subject: `[BEWS Contact] Nova mensagem de ${name}`,
      content: body,
    })

    await client.close()

    return new Response(JSON.stringify({ message: 'Email sent successfully' }), {
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
