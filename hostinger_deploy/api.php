<?php
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Pragma: no-cache');
header('Expires: 0');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, x-admin-key');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

session_start();

$ADMIN_PASSKEY = "selectedadmin2026";
$DATA_FILE = __DIR__ . '/data/jobs.json';
$STATS_FILE = __DIR__ . '/data/stats.json';

// Helper to check admin authentication
function isAdminAuthed($passkey) {
    if (!empty($_SESSION['selectedjobs_admin']) && $_SESSION['selectedjobs_admin'] === true) {
        return true;
    }
    if (!empty($_SERVER['HTTP_X_ADMIN_KEY']) && $_SERVER['HTTP_X_ADMIN_KEY'] === $passkey) {
        return true;
    }
    if (function_exists('getallheaders')) {
        $headers = getallheaders();
        if (!empty($headers['x-admin-key']) && $headers['x-admin-key'] === $passkey) return true;
        if (!empty($headers['X-Admin-Key']) && $headers['X-Admin-Key'] === $passkey) return true;
    }
    if (!empty($_COOKIE['selectedjobs_admin_auth']) && $_COOKIE['selectedjobs_admin_auth'] === $passkey) {
        return true;
    }
    return false;
}

// Helper to read jobs
function loadJobs($file) {
    if (!file_exists($file)) {
        return [];
    }
    $json = file_get_contents($file);
    $data = json_decode($json, true);
    return is_array($data) ? $data : [];
}

// Helper to save jobs safely
function saveJobs($file, $jobs) {
    $dir = dirname($file);
    if (!is_dir($dir)) {
        @mkdir($dir, 0775, true);
    }
    return file_put_contents($file, json_encode($jobs, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES), LOCK_EX);
}

// Helper to load visitor stats
function loadStats($file) {
    if (!file_exists($file)) {
        return [
            'site_unique_visitors' => 142,
            'total_page_views' => 1120,
            'visitors' => [],
            'job_views' => []
        ];
    }
    $data = json_decode(file_get_contents($file), true);
    if (!is_array($data)) {
        return [
            'site_unique_visitors' => 142,
            'total_page_views' => 1120,
            'visitors' => [],
            'job_views' => []
        ];
    }
    return $data;
}

// Helper to save visitor stats safely
function saveStats($file, $stats) {
    $dir = dirname($file);
    if (!is_dir($dir)) {
        @mkdir($dir, 0775, true);
    }
    if (isset($stats['visitors']) && count($stats['visitors']) > 10000) {
        $stats['visitors'] = array_slice($stats['visitors'], -5000);
    }
    return file_put_contents($file, json_encode($stats, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES), LOCK_EX);
}

// Track a unique site visitor
function trackVisitor($file, $vid) {
    $stats = loadStats($file);
    $stats['total_page_views'] = ($stats['total_page_views'] ?? 1120) + 1;

    if (!empty($vid)) {
        $vHash = substr(hash('sha256', $vid), 0, 16);
        if (!isset($stats['visitors']) || !is_array($stats['visitors'])) {
            $stats['visitors'] = [];
        }
        if (!in_array($vHash, $stats['visitors'])) {
            $stats['visitors'][] = $vHash;
            $stats['site_unique_visitors'] = ($stats['site_unique_visitors'] ?? 142) + 1;
            saveStats($file, $stats);
        } else {
            if (rand(1, 15) === 1) {
                saveStats($file, $stats);
            }
        }
    }
    return $stats['site_unique_visitors'] ?? 142;
}

// Track a unique job view
function trackJobView($statsFile, $jobsFile, $jobId, $vid) {
    if (empty($jobId)) return 0;
    $stats = loadStats($statsFile);
    if (!isset($stats['job_views']) || !is_array($stats['job_views'])) {
        $stats['job_views'] = [];
    }
    if (!isset($stats['job_views'][$jobId])) {
        $stats['job_views'][$jobId] = [
            'count' => 0,
            'visitors' => []
        ];
    }

    $vHash = !empty($vid) ? substr(hash('sha256', $vid), 0, 16) : null;
    $isNew = false;

    if ($vHash && !in_array($vHash, $stats['job_views'][$jobId]['visitors'])) {
        $stats['job_views'][$jobId]['visitors'][] = $vHash;
        $stats['job_views'][$jobId]['count'] = ($stats['job_views'][$jobId]['count'] ?? 0) + 1;
        $isNew = true;
    } elseif (!$vHash && ($stats['job_views'][$jobId]['count'] ?? 0) === 0) {
        $stats['job_views'][$jobId]['count'] = 1;
        $isNew = true;
    }

    if ($isNew) {
        saveStats($statsFile, $stats);
        $jobs = loadJobs($jobsFile);
        $updated = false;
        foreach ($jobs as &$j) {
            if (($j['id'] ?? '') === $jobId) {
                $j['viewsCount'] = $stats['job_views'][$jobId]['count'];
                $updated = true;
                break;
            }
        }
        if ($updated) {
            saveJobs($jobsFile, $jobs);
        }
    }

    return $stats['job_views'][$jobId]['count'] ?? 1;
}

// Helper to normalize URLs for de-duplication
function normalizeJobUrl($url) {
    if (empty($url)) return '';
    $u = trim($url);
    $parts = parse_url($u);
    if (!$parts) return strtolower($u);

    $host = !empty($parts['host']) ? strtolower($parts['host']) : '';
    $path = !empty($parts['path']) ? rtrim(strtolower($parts['path']), '/') : '';

    $filteredQuery = '';
    if (!empty($parts['query'])) {
        parse_str($parts['query'], $qp);
        $cleanQp = [];
        foreach ($qp as $k => $v) {
            $kl = strtolower($k);
            if (strpos($kl, 'utm_') === 0 || in_array($kl, ['ref', 'source', 'fbclid', 'gclid', 'sourcetype', 'linkedin'])) {
                continue;
            }
            $cleanQp[$k] = $v;
        }
        if (!empty($cleanQp)) {
            ksort($cleanQp);
            $filteredQuery = '?' . http_build_query($cleanQp);
        }
    }

    return $host . $path . $filteredQuery;
}

// Helper to extract Requisition / Job ID numbers
function extractRequisitionId($text) {
    if (empty($text)) return '';
    // Look for explicit prefix in URL or text
    if (preg_match('/(?:gh_jid=|jobid=|req_id=|job\/|jobs\/|apply\/|roles\/|jobdetail\/|job-details\/)([a-zA-Z0-9_-]+)/i', $text, $m)) {
        return strtolower($m[1]);
    }
    // Look for standard corporate requisition codes (e.g. R171037, JR-0000115941, P-100247, 522236)
    if (preg_match('/\b(JR-[0-9]{4,}|[RP]-[0-9]{4,}|R[0-9]{5,}|[0-9]{6,})\b/i', $text, $m)) {
        return strtolower($m[1]);
    }
    return '';
}

// Helper to normalize job title for similarity matching
function normalizeTitle($title) {
    $t = strtolower($title);
    $t = preg_replace('/\(.*?\)/', '', $t);
    $t = preg_replace('/\b(?:batch\s*)?202[0-9](?:\s*-\s*202[0-9])?\b/i', '', $t);
    $t = preg_replace('/[^a-z0-9]/', '', $t);
    return $t;
}

// Helper to get core title word tokens
function extractCoreTitleTokens($title) {
    $t = strtolower($title);
    $t = preg_replace('/\(.*?\)/', '', $t);
    $t = preg_replace('/\b(?:batch\s*)?202[0-9](?:\s*-\s*202[0-9])?\b/i', '', $t);
    $t = preg_replace('/\b(?:freshers?|experienced|urgent|immediate|hiring|opening|openings|walkin|walk-in)\b/i', '', $t);
    $words = preg_split('/[^a-z0-9]+/', $t, -1, PREG_SPLIT_NO_EMPTY);
    return array_values(array_filter($words, function($w) {
        return strlen($w) > 2 && !in_array($w, ['the', 'and', 'for', 'with', 'via']);
    }));
}

// Master duplicate detector
function findDuplicateJob($existingJobs, $newJob, $excludeId = null) {
    $newUrl = normalizeJobUrl($newJob['applyValue'] ?? '');
    $newReqId = extractRequisitionId($newJob['applyValue'] ?? '') ?: extractRequisitionId($newJob['description'] ?? '');
    $newCompany = preg_replace('/[^a-z0-9]/', '', strtolower($newJob['company'] ?? ''));
    $newTitleNorm = normalizeTitle($newJob['title'] ?? '');
    $newTokens = extractCoreTitleTokens($newJob['title'] ?? '');

    foreach ($existingJobs as $j) {
        if ($excludeId && ($j['id'] ?? '') === $excludeId) continue;

        // 1. Exact or normalized URL match
        if (!empty($newUrl)) {
            $existingUrl = normalizeJobUrl($j['applyValue'] ?? '');
            if (!empty($existingUrl) && $newUrl === $existingUrl) {
                return [
                    'reason' => 'Target application URL is identical to an existing listing',
                    'duplicate_job' => $j
                ];
            }
        }

        // 2. Requisition ID match
        if (!empty($newReqId)) {
            $existingReqId = extractRequisitionId($j['applyValue'] ?? '') ?: extractRequisitionId($j['description'] ?? '');
            if (!empty($existingReqId) && $newReqId === $existingReqId) {
                return [
                    'reason' => "Requisition/Job ID '$newReqId' already exists",
                    'duplicate_job' => $j
                ];
            }
        }

        // 3. Company + Title Match (Normalized equality or strong token overlap)
        $existingCompany = preg_replace('/[^a-z0-9]/', '', strtolower($j['company'] ?? ''));
        if (!empty($newCompany) && !empty($existingCompany) && (strpos($newCompany, $existingCompany) !== false || strpos($existingCompany, $newCompany) !== false)) {
            $existingTitleNorm = normalizeTitle($j['title'] ?? '');
            if (!empty($newTitleNorm) && !empty($existingTitleNorm)) {
                if ($newTitleNorm === $existingTitleNorm || strpos($newTitleNorm, $existingTitleNorm) !== false || strpos($existingTitleNorm, $newTitleNorm) !== false) {
                    return [
                        'reason' => 'Job title and hiring company match an existing active opening',
                        'duplicate_job' => $j
                    ];
                }
            }

            // Word token overlap check
            $existingTokens = extractCoreTitleTokens($j['title'] ?? '');
            if (!empty($newTokens) && !empty($existingTokens)) {
                $intersect = array_intersect($newTokens, $existingTokens);
                $minCount = min(count($newTokens), count($existingTokens));
                if ($minCount > 0 && (count($intersect) / $minCount) >= 0.7 && count($intersect) >= 2) {
                    return [
                        'reason' => 'Role title and company match an existing opening (' . implode(' ', $intersect) . ')',
                        'duplicate_job' => $j
                    ];
                }
            }
        }
    }

    return null;
}

$action = $_GET['action'] ?? '';
$input = json_decode(file_get_contents('php://input'), true) ?? [];

// Route handling
switch ($action) {
    // 1. Get Public Approved Jobs + Site Visitors
    case 'get_jobs':
    case 'jobs':
        $vid = trim($_GET['vid'] ?? ($_COOKIE['sj_vid'] ?? ''));
        $siteVisitors = trackVisitor($STATS_FILE, $vid);

        $jobs = loadJobs($DATA_FILE);
        $approved = array_filter($jobs, function($j) {
            return ($j['status'] ?? 'APPROVED') === 'APPROVED';
        });

        // Search filter
        $search = strtolower(trim($_GET['search'] ?? ''));
        if (!empty($search)) {
            $approved = array_filter($approved, function($j) use ($search) {
                $title = strtolower($j['title'] ?? '');
                $company = strtolower($j['company'] ?? '');
                $cat = strtolower($j['category'] ?? '');
                $loc = strtolower($j['location'] ?? '');
                return strpos($title, $search) !== false ||
                       strpos($company, $search) !== false ||
                       strpos($cat, $search) !== false ||
                       strpos($loc, $search) !== false;
            });
        }

        // Category filter
        $category = trim($_GET['category'] ?? '');
        if (!empty($category) && strtolower($category) !== 'all categories') {
            $catLower = strtolower($category);
            $approved = array_filter($approved, function($j) use ($catLower) {
                $itemCat = strtolower($j['category'] ?? '');
                if ($itemCat === $catLower) return true;
                if (strpos($catLower, 'tech') !== false && strpos($itemCat, 'tech') !== false) return true;
                if (strpos($catLower, 'bank') !== false && strpos($itemCat, 'bank') !== false) return true;
                if ((strpos($catLower, 'bpo') !== false || strpos($catLower, 'private') !== false) && (strpos($itemCat, 'bpo') !== false || strpos($itemCat, 'private') !== false)) return true;
                if (strpos($catLower, 'engineering') !== false && strpos($itemCat, 'engineering') !== false) return true;
                if (strpos($catLower, 'state') !== false && (strpos($itemCat, 'state') !== false || strpos(strtolower($j['location'] ?? ''), 'state') !== false)) return true;
                if (strpos($catLower, 'govt') !== false && strpos($itemCat, 'govt') !== false) return true;
                if (strpos($catLower, 'defence') !== false && strpos($itemCat, 'defence') !== false) return true;
                if (strpos($catLower, 'railway') !== false && strpos($itemCat, 'railway') !== false) return true;
                if (strpos($catLower, 'teaching') !== false && strpos($itemCat, 'teaching') !== false) return true;
                return false;
            });
        }

        echo json_encode([
            'success' => true,
            'jobs' => array_values($approved),
            'site_unique_visitors' => $siteVisitors,
            'total_jobs' => count($approved)
        ]);
        break;

    // 2. Get Single Job by ID + Track Unique View
    case 'get_job':
        $id = $_GET['id'] ?? '';
        $vid = trim($_GET['vid'] ?? ($_COOKIE['sj_vid'] ?? ''));
        $jobs = loadJobs($DATA_FILE);
        $found = null;
        foreach ($jobs as $j) {
            if (($j['id'] ?? '') === $id) {
                $found = $j;
                break;
            }
        }
        if ($found) {
            $jobViews = trackJobView($STATS_FILE, $DATA_FILE, $id, $vid);
            $found['viewsCount'] = $jobViews;
            $siteVisitors = trackVisitor($STATS_FILE, $vid);
            echo json_encode([
                'success' => true,
                'job' => $found,
                'site_unique_visitors' => $siteVisitors
            ]);
        } else {
            http_response_code(404);
            echo json_encode(['success' => false, 'error' => 'Job not found']);
        }
        break;

    // 3. Track Visit Endpoint
    case 'track_visit':
        $vid = trim($_GET['vid'] ?? ($input['vid'] ?? ($_COOKIE['sj_vid'] ?? '')));
        $siteVisitors = trackVisitor($STATS_FILE, $vid);
        echo json_encode(['success' => true, 'site_unique_visitors' => $siteVisitors]);
        break;

    // 4. Real-time Duplicate Check
    case 'check_duplicate':
        $jobs = loadJobs($DATA_FILE);
        $duplicate = findDuplicateJob($jobs, $input, $input['excludeId'] ?? null);
        if ($duplicate) {
            echo json_encode([
                'success' => true,
                'isDuplicate' => true,
                'reason' => $duplicate['reason'],
                'duplicateJob' => [
                    'id' => $duplicate['duplicate_job']['id'],
                    'title' => $duplicate['duplicate_job']['title'],
                    'company' => $duplicate['duplicate_job']['company']
                ]
            ]);
        } else {
            echo json_encode(['success' => true, 'isDuplicate' => false]);
        }
        break;

    // 5. Admin Authentication Login
    case 'admin_auth':
        $key = trim($input['key'] ?? '');
        if ($key === $ADMIN_PASSKEY) {
            $_SESSION['selectedjobs_admin'] = true;
            setcookie('selectedjobs_admin_auth', $ADMIN_PASSKEY, [
                'expires' => time() + (86400 * 30),
                'path' => '/',
                'httponly' => false,
                'samesite' => 'Lax'
            ]);
            echo json_encode(['success' => true, 'message' => 'Admin authenticated']);
        } else {
            http_response_code(401);
            echo json_encode(['success' => false, 'error' => 'Invalid admin passkey']);
        }
        break;

    // 6. Admin Check Session
    case 'admin_check':
        $isAuthed = isAdminAuthed($ADMIN_PASSKEY);
        echo json_encode(['success' => true, 'isAuthenticated' => $isAuthed]);
        break;

    // 7. Admin Logout
    case 'admin_logout':
        $_SESSION['selectedjobs_admin'] = false;
        session_destroy();
        setcookie('selectedjobs_admin_auth', '', time() - 3600, '/');
        echo json_encode(['success' => true, 'message' => 'Logged out']);
        break;

    // 8. Admin Get All Jobs with Stats
    case 'admin_jobs':
        if (!isAdminAuthed($ADMIN_PASSKEY)) {
            http_response_code(401);
            echo json_encode(['success' => false, 'error' => 'Unauthorized']);
            exit;
        }

        $jobs = loadJobs($DATA_FILE);
        $statusParam = $_GET['status'] ?? 'ALL';
        $filtered = $jobs;

        if ($statusParam !== 'ALL') {
            $filtered = array_filter($jobs, function($j) use ($statusParam) {
                return ($j['status'] ?? '') === $statusParam;
            });
        }

        $statsData = loadStats($STATS_FILE);
        $stats = [
            'total' => count($jobs),
            'pending' => count(array_filter($jobs, fn($j) => ($j['status'] ?? '') === 'PENDING')),
            'approved' => count(array_filter($jobs, fn($j) => ($j['status'] ?? '') === 'APPROVED')),
            'rejected' => count(array_filter($jobs, fn($j) => ($j['status'] ?? '') === 'REJECTED')),
            'site_unique_visitors' => $statsData['site_unique_visitors'] ?? 142
        ];

        echo json_encode(['success' => true, 'jobs' => array_values($filtered), 'stats' => $stats]);
        break;

    // 9. Create Job (Admin Only with Duplicate Prevention)
    case 'create_job':
        if (!isAdminAuthed($ADMIN_PASSKEY)) {
            http_response_code(401);
            echo json_encode(['success' => false, 'error' => 'Unauthorized']);
            exit;
        }

        if (empty($input['title']) || empty($input['company'])) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Title and company are required']);
            exit;
        }

        $jobs = loadJobs($DATA_FILE);

        // Duplicate Detection Enforcement
        $force = !empty($input['force']);
        if (!$force) {
            $duplicate = findDuplicateJob($jobs, $input);
            if ($duplicate) {
                http_response_code(409); // Conflict
                echo json_encode([
                    'success' => false,
                    'isDuplicate' => true,
                    'error' => "Duplicate job opening detected: {$duplicate['reason']}. An active opening '{$duplicate['duplicate_job']['title']}' at '{$duplicate['duplicate_job']['company']}' is already published.",
                    'duplicateJob' => [
                        'id' => $duplicate['duplicate_job']['id'],
                        'title' => $duplicate['duplicate_job']['title'],
                        'company' => $duplicate['duplicate_job']['company']
                    ]
                ]);
                exit;
            }
        }

        $newId = 'job_' . bin2hex(random_bytes(6));
        $newJob = [
            'id' => $newId,
            'title' => trim($input['title']),
            'company' => trim($input['company']),
            'companyWebsite' => trim($input['companyWebsite'] ?? ''),
            'companyLogo' => trim($input['companyLogo'] ?? ''),
            'category' => trim($input['category'] ?? 'ALL STATE JOBS'),
            'workplaceType' => trim($input['workplaceType'] ?? 'On-site'),
            'location' => trim($input['location'] ?? 'All India'),
            'employmentType' => trim($input['employmentType'] ?? 'Full-time'),
            'experience' => trim($input['experience'] ?? 'Fresher (0-1 yrs)'),
            'salary' => trim($input['salary'] ?? 'Standard Pay Scale'),
            'skills' => is_array($input['skills'] ?? null) ? $input['skills'] : [],
            'description' => trim($input['description'] ?? ''),
            'applyMethod' => trim($input['applyMethod'] ?? 'url'),
            'applyValue' => trim($input['applyValue'] ?? ''),
            'recruiterName' => trim($input['recruiterName'] ?? 'SelectedJobs Editorial'),
            'recruiterEmail' => trim($input['recruiterEmail'] ?? 'admin@selectedjobs.in'),
            'status' => ($input['status'] ?? 'APPROVED') === 'PENDING' ? 'PENDING' : 'APPROVED',
            'featured' => !empty($input['featured']),
            'featuredInTopGrid' => !empty($input['featuredInTopGrid']),
            'isNew' => $input['isNew'] ?? true,
            'viewsCount' => 0,
            'createdAt' => date('c'),
            'updatedAt' => date('c')
        ];

        array_unshift($jobs, $newJob);
        saveJobs($DATA_FILE, $jobs);

        echo json_encode(['success' => true, 'message' => 'Job created successfully', 'job' => $newJob]);
        break;

    // 10. Admin Moderation Action (Approve, Reject, Toggle Featured, Delete)
    case 'admin_action':
        if (!isAdminAuthed($ADMIN_PASSKEY)) {
            http_response_code(401);
            echo json_encode(['success' => false, 'error' => 'Unauthorized']);
            exit;
        }

        $id = $input['id'] ?? '';
        $subAction = $input['action'] ?? '';
        $jobs = loadJobs($DATA_FILE);
        $updatedJob = null;

        foreach ($jobs as $idx => $j) {
            if (($j['id'] ?? '') === $id) {
                if ($subAction === 'approve') {
                    $jobs[$idx]['status'] = 'APPROVED';
                    $jobs[$idx]['updatedAt'] = date('c');
                    $updatedJob = $jobs[$idx];
                } elseif ($subAction === 'reject') {
                    $jobs[$idx]['status'] = 'REJECTED';
                    $jobs[$idx]['updatedAt'] = date('c');
                    $updatedJob = $jobs[$idx];
                } elseif ($subAction === 'toggle_featured') {
                    $jobs[$idx]['featured'] = !($jobs[$idx]['featured'] ?? false);
                    $jobs[$idx]['updatedAt'] = date('c');
                    $updatedJob = $jobs[$idx];
                } elseif ($subAction === 'toggle_top_grid') {
                    $jobs[$idx]['featuredInTopGrid'] = !($jobs[$idx]['featuredInTopGrid'] ?? false);
                    $jobs[$idx]['updatedAt'] = date('c');
                    $updatedJob = $jobs[$idx];
                } elseif ($subAction === 'delete') {
                    array_splice($jobs, $idx, 1);
                    $updatedJob = ['deleted' => true, 'id' => $id];
                }
                break;
            }
        }

        if ($updatedJob) {
            saveJobs($DATA_FILE, $jobs);
            echo json_encode(['success' => true, 'job' => $updatedJob]);
        } else {
            http_response_code(404);
            echo json_encode(['success' => false, 'error' => 'Job not found']);
        }
        break;

    // 11. Admin Update HTML/Code File (Allows remote frontend updates)
    case 'admin_update_file':
        if (!isAdminAuthed($ADMIN_PASSKEY)) {
            http_response_code(401);
            echo json_encode(['success' => false, 'error' => 'Unauthorized']);
            exit;
        }

        $filename = basename($input['filename'] ?? '');
        $allowed = ['index.html', 'admin.html', 'post-job.html', 'job.html', '.htaccess', 'api.php', 'jobs.json', 'stats.json'];
        if (!in_array($filename, $allowed)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Invalid or disallowed file name']);
            exit;
        }

        $content = $input['content'] ?? null;
        if ($content === null) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Content cannot be null']);
            exit;
        }

        $target = ($filename === 'jobs.json' || $filename === 'stats.json') ? (__DIR__ . '/data/' . $filename) : (__DIR__ . '/' . $filename);
        $written = file_put_contents($target, $content, LOCK_EX);
        if ($written !== false) {
            echo json_encode(['success' => true, 'message' => "File $filename updated successfully", 'bytes' => $written]);
        } else {
            http_response_code(500);
            echo json_encode(['success' => false, 'error' => "Failed to write file $filename"]);
        }
        break;

    // 12. Admin Bulk Replace / Sync All Jobs
    case 'admin_replace_all_jobs':
        if (!isAdminAuthed($ADMIN_PASSKEY)) {
            http_response_code(401);
            echo json_encode(['success' => false, 'error' => 'Unauthorized']);
            exit;
        }

        $jobs = $input['jobs'] ?? null;
        if (!is_array($jobs)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Jobs array is required']);
            exit;
        }

        saveJobs($DATA_FILE, $jobs);
        echo json_encode(['success' => true, 'message' => 'All jobs replaced successfully', 'count' => count($jobs)]);
        break;

    default:
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => 'Unknown action']);
        break;
}
