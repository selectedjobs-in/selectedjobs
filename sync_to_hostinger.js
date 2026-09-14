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
  const args = process.argv.slice(2);
  const isPull = args.includes('--pull');

  console.log('1. Fetching live jobs from server...');
  const liveData = await request('GET', '/api.php?action=get_jobs');
  const liveJobs = (liveData && liveData.jobs) || [];
  console.log(`Live server currently has ${liveJobs.length} active jobs.`);

  if (isPull) {
    const deployJobsPath = path.join(__dirname, 'hostinger_deploy', 'data', 'jobs.json');
    const srcJobsPath = path.join(__dirname, 'src', 'data', 'jobs.json');
    fs.writeFileSync(deployJobsPath, JSON.stringify(liveJobs, null, 2));
    fs.writeFileSync(srcJobsPath, JSON.stringify(liveJobs, null, 2));
    console.log('Successfully pulled live jobs to local jobs.json!');
    return;
  }

  const localJobsPath = path.join(__dirname, 'hostinger_deploy', 'data', 'jobs.json');
  const localJobs = JSON.parse(fs.readFileSync(localJobsPath, 'utf8'));

  // Find any local jobs that are missing on live server (match by title and company)
  const missingOnLive = localJobs.filter(
    (lj) => !liveJobs.some((rj) => rj.id === lj.id || (rj.title === lj.title && rj.company === lj.company))
  );

  if (missingOnLive.length === 0) {
    console.log('All local jobs are already published on live server. In sync!');
    return;
  }

  console.log(`Publishing ${missingOnLive.length} new job(s) to live server...`);
  for (const job of missingOnLive.reverse()) {
    const res = await request('POST', '/api.php?action=create_job', job);
    if (res && res.success) {
      console.log(`+ Successfully published: ${job.title} (${job.company})`);
    } else {
      console.error(`- Failed to publish: ${job.title}`, res);
    }
  }

  // Re-fetch and update local with live server assigned IDs
  const updatedLive = await request('GET', '/api.php?action=get_jobs');
  if (updatedLive && updatedLive.jobs) {
    const deployJobsPath = path.join(__dirname, 'hostinger_deploy', 'data', 'jobs.json');
    const srcJobsPath = path.join(__dirname, 'src', 'data', 'jobs.json');
    fs.writeFileSync(deployJobsPath, JSON.stringify(updatedLive.jobs, null, 2));
    fs.writeFileSync(srcJobsPath, JSON.stringify(updatedLive.jobs, null, 2));
  }

  console.log('SYNC COMPLETE! Total active jobs on live server:', (updatedLive.jobs || []).length);
}

sync().catch(console.error);
