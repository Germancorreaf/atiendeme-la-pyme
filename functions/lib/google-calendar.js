// functions/lib/google-calendar.js
// Simplified version for WIF

async function getAccessToken(context) {
  // WIF binding is automatically available
  const workloadToken = context.env.WORKLOAD_OIDC_TOKEN;
  
  if (!workloadToken) {
    throw new ApiError('OIDC token not available', 500);
  }

  const provider = "projects/658233084064/locations/global/workloadIdentityPools/pyme/providers/cloudflare-provider";
  
  try {
    const response = await fetch("https://sts.googleapis.com/v1/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "urn:ietf:params:oauth:grant-type:token-exchange",
        audience: `//iam.googleapis.com/${provider}`,
        requested_token_type: "urn:ietf:params:oauth:token-type:access_token",
        subject_token: workloadToken,
        subject_token_type: "urn:ietf:params:oauth:token-type:id_token"
      })
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new ApiError(`STS failed: ${data.error}`, 400);
    }

    return data.access_token;
  } catch (err) {
    throw new ApiError(`Token exchange failed: ${err.message}`, 500);
  }
}
