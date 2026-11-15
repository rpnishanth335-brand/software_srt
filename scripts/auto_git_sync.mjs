import { execSync } from 'child_process';

function run(cmd, silent = false) {
  try {
    return execSync(cmd, { encoding: 'utf-8', stdio: silent ? 'pipe' : 'inherit' });
  } catch (error) {
    if (!silent) {
      console.error(`Error executing "${cmd}":`, error.message);
    }
    throw error;
  }
}

function syncGit() {
  try {
    const status = execSync('git status --porcelain', { encoding: 'utf-8' }).trim();
    if (!status) {
      // Check if there are any unpushed commits
      try {
        const unpushed = execSync('git log origin/main..HEAD --oneline', { encoding: 'utf-8' }).trim();
        if (unpushed) {
          console.log(`[AutoGit] Pushing unpushed commits...`);
          run('git push origin HEAD');
          console.log(`[AutoGit] Successfully pushed to origin!`);
        } else {
          // No local changes or unpushed commits
        }
      } catch {
        // In case origin/main is not yet fetched or set up
        try {
          run('git push -u origin main');
          console.log(`[AutoGit] Pushed branch to origin!`);
        } catch {}
      }
      return;
    }

    const timestamp = new Date().toLocaleString();
    console.log(`\n[AutoGit] Changes detected at ${timestamp}. Auto-committing and pushing...`);
    run('git add -A');
    run(`git commit -m "auto: synchronize updates [${timestamp}]"`);
    run('git push origin HEAD');
    console.log(`[AutoGit] Successfully pushed all changes to Git!`);
  } catch (err) {
    console.error(`[AutoGit] Push failed: ${err.message}`);
  }
}

const isWatchMode = process.argv.includes('--watch');

if (isWatchMode) {
  console.log('=== ChronoForge Auto-Git Watcher Started ===');
  console.log('Monitoring repository for any changes every 15 seconds. Press Ctrl+C to stop.\n');
  syncGit();
  setInterval(syncGit, 15000);
} else {
  console.log('=== ChronoForge Auto-Git Sync ===');
  syncGit();
}
