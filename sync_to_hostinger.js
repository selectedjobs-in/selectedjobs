const https = require('https');
const fs = require('fs');
const path = require('path');

const SERVER_IP = '217.21.91.150';
const HOST = 'selectedjobs.in';
const ADMIN_KEY = 'selectedadmin2026';

function request(method, pathUrl, data = null) {
  return new Promise((resolve, reject) => {
    const payload = data ? JSON.stringify(data) : null;
    const req = https.request(
      {
        host: SERVER_IP,
        port: 443,
        path: pathUrl,
        method: method,
        servername: HOST,
        rejectUnauthorized: false,
        headers: {
          Host: HOST,
          'x-admin-key': ADMIN_KEY,
          'Content-Type': 'application/json',
          ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {}),
        },
      },
      (res) => {
        let body = '';
        res.on('data', (c) => (body += c));
        res.on('end', () => {
          try {
            resolve(JSON.parse(body));
          } catch {
            resolve(body);
          }
        });
      }
    );
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

async function sync() {
  console.log('1. Checking existing jobs on live server...');
  const current = await request('GET', '/api.php?action=admin_jobs&status=ALL');
  if (current && current.jobs && current.jobs.length > 0) {
    console.log(`Found ${current.jobs.length} jobs on live server. Deleting old placeholder jobs...`);
    for (const job of current.jobs) {
      await request('POST', '/api.php?action=admin_action', {
        id: job.id,
        action: 'DELETE',
      });
      process.stdout.write('.');
    }
    console.log('\nAll old placeholder jobs deleted.');
  }

  console.log('2. Reading new job posts...');
  const newJobsFile = path.join(__dirname, 'hostinger_deploy', 'data', 'jobs.json');
  const newJobs = JSON.parse(fs.readFileSync(newJobsFile, 'utf8'));

  console.log(`Uploading ${newJobs.length} new jobs to live server...`);
  for (const job of newJobs.reverse()) { // reverse so newest remains on top
    const res = await request('POST', '/api.php?action=create_job', job);
    console.log(`+ Published: ${job.title}`);
  }

  console.log('3. Verifying live server state...');
  const verify = await request('GET', '/api.php?action=get_jobs');
  console.log(`Verification: Live server now has ${verify.jobs.length} active jobs.`);
  console.log('SYNC COMPLETE!');
}

sync().catch(console.error);
