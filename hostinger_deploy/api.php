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

$action = $_GET['action'] ?? '';
$input = json_decode(file_get_contents('php://input'), true) ?? [];

// Route handling
switch ($action) {
    // 1. Get Public Approved Jobs
    case 'get_jobs':
    case 'jobs':
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
        if (!empty($category) && $category !== 'All Categories') {
            $approved = array_filter($approved, function($j) use ($category) {
                return ($j['category'] ?? '') === $category;
            });
        }

        echo json_encode(['success' => true, 'jobs' => array_values($approved)]);
        break;

    // 2. Get Single Job by ID
    case 'get_job':
        $id = $_GET['id'] ?? '';
        $jobs = loadJobs($DATA_FILE);
        $found = null;
        foreach ($jobs as $j) {
            if (($j['id'] ?? '') === $id) {
                $found = $j;
                break;
            }
        }
        if ($found) {
            echo json_encode(['success' => true, 'job' => $found]);
        } else {
            http_response_code(404);
            echo json_encode(['success' => false, 'error' => 'Job not found']);
        }
        break;

    // 3. Admin Authentication Login
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

    // 4. Admin Check Session
    case 'admin_check':
        $isAuthed = isAdminAuthed($ADMIN_PASSKEY);
        echo json_encode(['success' => true, 'isAuthenticated' => $isAuthed]);
        break;

    // 5. Admin Logout
    case 'admin_logout':
        $_SESSION['selectedjobs_admin'] = false;
        session_destroy();
        setcookie('selectedjobs_admin_auth', '', time() - 3600, '/');
        echo json_encode(['success' => true, 'message' => 'Logged out']);
        break;

    // 6. Admin Get All Jobs with Stats
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

        $stats = [
            'total' => count($jobs),
            'pending' => count(array_filter($jobs, fn($j) => ($j['status'] ?? '') === 'PENDING')),
            'approved' => count(array_filter($jobs, fn($j) => ($j['status'] ?? '') === 'APPROVED')),
            'rejected' => count(array_filter($jobs, fn($j) => ($j['status'] ?? '') === 'REJECTED')),
        ];

        echo json_encode(['success' => true, 'jobs' => array_values($filtered), 'stats' => $stats]);
        break;

    // 7. Create Job (Admin Only)
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

    // 8. Admin Moderation Action (Approve, Reject, Toggle Featured, Delete)
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
                if ($subAction === 'APPROVE') {
                    $jobs[$idx]['status'] = 'APPROVED';
                    $jobs[$idx]['updatedAt'] = date('c');
                    $updatedJob = $jobs[$idx];
                } elseif ($subAction === 'REJECT') {
                    $jobs[$idx]['status'] = 'REJECTED';
                    $jobs[$idx]['rejectionReason'] = $input['reason'] ?? 'Rejected by administrator';
                    $jobs[$idx]['updatedAt'] = date('c');
                    $updatedJob = $jobs[$idx];
                } elseif ($subAction === 'TOGGLE_FEATURED') {
                    $jobs[$idx]['featured'] = !($jobs[$idx]['featured'] ?? false);
                    $jobs[$idx]['updatedAt'] = date('c');
                    $updatedJob = $jobs[$idx];
                } elseif ($subAction === 'DELETE') {
                    array_splice($jobs, $idx, 1);
                    $updatedJob = ['deleted' => true];
                }
                break;
            }
        }

        if ($updatedJob) {
            saveJobs($DATA_FILE, $jobs);
            echo json_encode(['success' => true, 'message' => 'Action performed', 'job' => $updatedJob]);
        } else {
            http_response_code(404);
            echo json_encode(['success' => false, 'error' => 'Job not found']);
        }
        break;

    default:
        echo json_encode(['success' => true, 'service' => 'SelectedJobs.in PHP Backend', 'version' => '1.0']);
        break;
}
?>
