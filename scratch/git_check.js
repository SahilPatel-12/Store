import { execSync } from 'child_process';

try {
  console.log('--- Git Status ---');
  console.log(execSync('git status', { encoding: 'utf8' }));
  
  console.log('\n--- Git Log ---');
  console.log(execSync('git log -n 5 --oneline', { encoding: 'utf8' }));
} catch (err) {
  console.error('Git execute failed:', err.message);
}
