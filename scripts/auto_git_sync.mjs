import { execSync } from 'child_process';

let isSyncing = false;

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
  if (isSyncing) return;
  isSyncing = true;

  try {
    const status = execSync('git status --porcelain', { encoding: 'utf-8' }).trim();
    if (!status) {
      // Check if there are any unpushed commits
      try {
        const unpushed = execSync('git log origin/main..HEAD --oneline', { encoding: 'utf-8' }).trim();
        if (unpushed) {
          console.log(`[AutoGit] Pushing unpushed commits to GitHub...`);
          run('git push origin HEAD');
          console.log(`[AutoGit] Successfully pushed to GitHub!`);
        }
      } catch {
        try {
          run('git push -u origin main');
        } catch {}
      }
      return;
    }

    const timestamp = new Date().toLocaleString();
    console.log(`\n[AutoGit] Changes detected at ${timestamp}. Auto-committing and pushing to GitHub...`);
    run('git add -A');
    run(`git commit -m "auto: synchronize updates [${timestamp}]"`);
    run('git push origin HEAD');
    console.log(`[AutoGit] Successfully pushed all changes to GitHub!`);
  } catch (err) {
    console.error(`[AutoGit] Note: ${err.message}`);
  } finally {
    isSyncing = false;
  }
}

const isWatchMode = process.argv.includes('--watch');

if (isWatchMode) {
  console.log('=== ChronoForge Auto-Git Watcher Active ===');
  console.log('Actively monitoring repository. Every change will automatically commit & push to GitHub every 10 seconds.\n');
  syncGit();
  setInterval(syncGit, 10000);
} else {
  console.log('=== ChronoForge Auto-Git Sync ===');
  syncGit();
}
