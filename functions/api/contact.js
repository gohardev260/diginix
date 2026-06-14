export async function onRequestPost(context) {
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  const { request, env } = context;

  try {
    // Parse the JSON payload from the contact form
    const body = await request.json();
    const name = body.name || "";
    const email = body.email || "";
    const subject = body.subject || "";
    const message = body.message || "";

    if (!name || !email || !message) {
      return new Response(JSON.stringify({ success: false, error: "Missing required fields" }), {
        status: 400,
        headers,
      });
    }

    // Verify the email binding exists
    if (!env.SEND_EMAIL) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: "Cloudflare SEND_EMAIL binding is not configured. Please add the Email Routing binding in your Cloudflare Pages Dashboard." 
      }), {
        status: 500,
        headers,
      });
    }

    // CONFIGURATION
    // 1. Destination: The verified email address where you want to receive submissions
    const DESTINATION_EMAIL = env.TO_EMAIL || "contact@diginix.com"; 

    // 2. Sender: Must be an email address matching your verified Cloudflare custom domain.
    // e.g. contact-form@yourdomain.com. We can configure this via environment variable, or fallback to the current host.
    let hostDomain = new URL(request.url).hostname;
    // Strip subdomains like pages.dev or www for standard fallback sender
    if (hostDomain.includes("pages.dev")) {
      hostDomain = "diginixit.com"; // Default fallback to production custom domain
    }
    const SENDER_EMAIL = env.FROM_EMAIL || `contact-form@${hostDomain}`;

    // Construct a standard MIME/RFC822 text message
    const rfc822Message = 
      `From: Contact Form <${SENDER_EMAIL}>\r\n` +
      `To: ${DESTINATION_EMAIL}\r\n` +
      `Subject: New Website Inquiry: ${subject || "No Subject"}\r\n` +
      `Content-Type: text/plain; charset=utf-8\r\n\r\n` +
      `You have a new contact form submission:\n\n` +
      `Name: ${name}\n` +
      `Email: ${email}\n` +
      `Subject: ${subject || "N/A"}\n\n` +
      `Message:\n${message}\n`;

    // Import EmailMessage from Cloudflare's runtime
    const { EmailMessage } = await import("cloudflare:email");
    const emailMessage = new EmailMessage(
      SENDER_EMAIL,
      DESTINATION_EMAIL,
      rfc822Message
    );

    // Send using the Cloudflare Email Routing API
    await env.SEND_EMAIL.send(emailMessage);

    return new Response(JSON.stringify({ success: true }), {
      headers,
    });
  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers,
    });
  }
}

// Support OPTIONS preflight requests for CORS
export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    }
  });
}
