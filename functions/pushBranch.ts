import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { accessToken } = await base44.asServiceRole.connectors.getConnection("github");
    const { owner, repo, baseBranch, newBranch, files, commitMessage } = await req.json();

    const headers = {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/vnd.github+json',
      'Content-Type': 'application/json',
    };
    const api = (path, opts) => fetch(`https://api.github.com/repos/${owner}/${repo}${path}`, { headers, ...opts });

    // 1. Get the SHA of the base branch's HEAD
    const refRes = await api(`/git/ref/heads/${baseBranch}`);
    if (!refRes.ok) {
      const err = await refRes.json();
      return Response.json({ error: `Failed to get base branch: ${err.message}` }, { status: 400 });
    }
    const refData = await refRes.json();
    const baseSha = refData.object.sha;

    // 2. Create the new branch ref
    const createRefRes = await api(`/git/refs`, {
      method: 'POST',
      body: JSON.stringify({ ref: `refs/heads/${newBranch}`, sha: baseSha }),
    });
    if (!createRefRes.ok) {
      const err = await createRefRes.json();
      // Branch might already exist — try to update it
      if (err.message && err.message.includes('Reference already exists')) {
        // We'll just commit on top of the existing branch
        console.log('Branch already exists, will commit on top');
      } else {
        return Response.json({ error: `Failed to create branch: ${err.message}` }, { status: 400 });
      }
    }

    // 3. Get the current commit tree of the new branch
    const branchRefRes = await api(`/git/ref/heads/${newBranch}`);
    const branchRefData = await branchRefRes.json();
    const branchHeadSha = branchRefData.object.sha;

    const commitRes = await api(`/git/commits/${branchHeadSha}`);
    const commitData = await commitRes.json();
    const baseTreeSha = commitData.tree.sha;

    // 4. Create blobs for each file
    const treeItems = [];
    for (const file of files) {
      const blobRes = await api(`/git/blobs`, {
        method: 'POST',
        body: JSON.stringify({ content: file.content, encoding: 'utf-8' }),
      });
      const blobData = await blobRes.json();
      treeItems.push({
        path: file.path,
        mode: '100644',
        type: 'blob',
        sha: blobData.sha,
      });
    }

    // 5. Create a new tree
    const treeRes = await api(`/git/trees`, {
      method: 'POST',
      body: JSON.stringify({ base_tree: baseTreeSha, tree: treeItems }),
    });
    const treeData = await treeRes.json();

    // 6. Create a new commit
    const newCommitRes = await api(`/git/commits`, {
      method: 'POST',
      body: JSON.stringify({
        message: commitMessage || 'Update from Base44 app',
        tree: treeData.sha,
        parents: [branchHeadSha],
      }),
    });
    const newCommitData = await newCommitRes.json();

    // 7. Update the branch ref to point to the new commit
    const updateRefRes = await api(`/git/refs/heads/${newBranch}`, {
      method: 'PATCH',
      body: JSON.stringify({ sha: newCommitData.sha }),
    });
    const updateRefData = await updateRefRes.json();

    return Response.json({
      success: true,
      branch: newBranch,
      commit: newCommitData.sha,
      url: `https://github.com/${owner}/${repo}/tree/${newBranch}`,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});