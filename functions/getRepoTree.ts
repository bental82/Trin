import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { accessToken } = await base44.asServiceRole.connectors.getConnection("github");
    const { owner, repo, branch, path } = await req.json();
    
    const url = path 
      ? `https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${branch || 'main'}`
      : `https://api.github.com/repos/${owner}/${repo}/git/trees/${branch || 'main'}?recursive=1`;
    
    const res = await fetch(url, {
      headers: { 
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/vnd.github+json'
      }
    });
    const data = await res.json();
    
    // If tree endpoint, return file paths
    if (data.tree) {
      return Response.json({ 
        files: data.tree
          .filter(f => f.type === 'blob')
          .map(f => ({ path: f.path, size: f.size }))
      });
    }
    
    // If contents endpoint (single file), return decoded content
    if (data.content) {
      const content = atob(data.content);
      return Response.json({ path: data.path, content });
    }
    
    // If directory listing
    if (Array.isArray(data)) {
      return Response.json({ files: data.map(f => ({ path: f.path, type: f.type, size: f.size })) });
    }

    return Response.json(data);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});