import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { accessToken } = await base44.asServiceRole.connectors.getConnection("github");
    
    const { query } = await req.json();
    
    // Search user's repos matching query
    const res = await fetch(`https://api.github.com/user/repos?per_page=100&sort=updated`, {
      headers: { 
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/vnd.github+json'
      }
    });
    const repos = await res.json();
    
    const filtered = repos.filter(r => 
      r.name.toLowerCase().includes((query || '').toLowerCase()) ||
      r.full_name.toLowerCase().includes((query || '').toLowerCase())
    );
    
    return Response.json({ repos: filtered.map(r => ({ name: r.name, full_name: r.full_name, default_branch: r.default_branch })) });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});