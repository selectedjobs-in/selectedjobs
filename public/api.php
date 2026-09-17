<?php
if (!ob_get_level() && extension_loaded('zlib') && !ini_get('zlib.output_compression')) {
    @ob_start('ob_gzhandler');
}
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0, s-maxage=0, post-check=0, pre-check=0');
header('Pragma: no-cache');
header('Expires: -1');
header('X-Accel-Expires: 0');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, x-admin-key');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if (session_status() === PHP_SESSION_NONE) {
    @session_start();
}

$ADMIN_PASSKEY = "selectedadmin2026";
$DATA_FILE = __DIR__ . '/data/jobs.json';
$STATS_FILE = __DIR__ . '/data/stats.json';
$IG_CONFIG_FILE = __DIR__ . '/data/instagram_config.json';
$BANNERS_DIR = __DIR__ . '/assets/banners';

if (!is_dir($BANNERS_DIR)) {
    @mkdir($BANNERS_DIR, 0775, true);
}
if (!is_dir(__DIR__ . '/data')) {
    @mkdir(__DIR__ . '/data', 0775, true);
}

$dataVersion = file_exists($DATA_FILE) ? filemtime($DATA_FILE) : time();
header('ETag: "' . $dataVersion . '"');
header('X-Data-Version: ' . $dataVersion);

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

// Track a unique site visitor and active live users
function trackVisitor($file, $vid) {
    $stats = loadStats($file);
    $stats['total_page_views'] = ($stats['total_page_views'] ?? 1120) + 1;
    $now = time();

    if (!isset($stats['active_sessions']) || !is_array($stats['active_sessions'])) {
        $stats['active_sessions'] = [];
    }

    // Clean up sessions older than 300 seconds (5 minutes)
    foreach ($stats['active_sessions'] as $k => $ts) {
        if ($now - $ts > 300) {
            unset($stats['active_sessions'][$k]);
        }
    }

    if (!empty($vid)) {
        $vHash = substr(hash('sha256', $vid), 0, 16);
        $stats['active_sessions'][$vHash] = $now;

        if (!isset($stats['visitors']) || !is_array($stats['visitors'])) {
            $stats['visitors'] = [];
        }
        if (!in_array($vHash, $stats['visitors'])) {
            $stats['visitors'][] = $vHash;
            $stats['site_unique_visitors'] = ($stats['site_unique_visitors'] ?? 142) + 1;
            saveStats($file, $stats);
        } else {
            if (rand(1, 10) === 1) {
                saveStats($file, $stats);
            }
        }
    }

    $activeSessionCount = count($stats['active_sessions']);
    // Natural live activity variation: realistic base + minute wave
    $wave = ((int)date('i') * 7 + (int)date('s')) % 11;
    $liveOnline = max(18 + $wave, $activeSessionCount);

    return [
        'unique_visitors' => $stats['site_unique_visitors'] ?? 142,
        'live_visitors' => $liveOnline,
        'total_views' => $stats['total_page_views'] ?? 1120
    ];
}

// Track a unique job view and real-time live viewers
function trackJobView($statsFile, $jobsFile, $jobId, $vid) {
    if (empty($jobId)) return ['count' => 0, 'live_viewers' => 2];
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

    // Dynamic live viewers on this individual job (between 2 and 6)
    $jobSeed = abs(crc32($jobId . date('H') . (int)(date('i') / 4))) % 5 + 2;

    return [
        'count' => $stats['job_views'][$jobId]['count'] ?? 1,
        'live_viewers' => $jobSeed
    ];
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
    
    // Ignore if string is a 10-12 digit phone number
    $digitsOnly = preg_replace('/[^0-9]/', '', $text);
    if (strlen($digitsOnly) >= 10 && strlen($digitsOnly) <= 12 && preg_match('/^[6-9][0-9]{9}$/', substr($digitsOnly, -10))) {
        return '';
    }

    // Look for explicit prefix in URL or text (e.g. gh_jid=7756668, jobs/10504872, roles/184192, jobid=522236)
    if (preg_match('/(?:gh_jid=|jobid=|req_id=|job\/|jobs\/|apply\/|roles\/|jobdetail\/|job-details\/)([a-zA-Z0-9_-]+)/i', $text, $m)) {
        return strtolower($m[1]);
    }

    // Look for standard corporate requisition codes with alphabetic prefix (e.g. R171037, JR-0000115941, P-100247, JR337715, R0004966)
    if (preg_match('/\b(JR-?[0-9]{4,}|[RP]-?[0-9]{4,}|R[0-9]{5,})\b/i', $text, $m)) {
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
    $t = preg_replace('/\b(?:freshers?|experienced|urgent|immediate|hiring|opening|openings|walkin|walk-in|part-time|support)\b/i', '', $t);
    $words = preg_split('/[^a-z0-9]+/', $t, -1, PREG_SPLIT_NO_EMPTY);
    return array_values(array_filter($words, function($w) {
        return strlen($w) > 2 && !in_array($w, ['the', 'and', 'for', 'with', 'via']);
    }));
}

// Helper to test if string is a Web URL
function isWebUrl($str) {
    if (empty($str)) return false;
    $s = trim($str);
    return strpos($s, 'http://') === 0 || strpos($s, 'https://') === 0 || strpos($s, 'www.') === 0;
}

// Master duplicate detector
function findDuplicateJob($existingJobs, $newJob, $excludeId = null) {
    $newUrl = normalizeJobUrl($newJob['applyValue'] ?? '');
    $newReqId = extractRequisitionId($newJob['applyValue'] ?? '') ?: extractRequisitionId($newJob['description'] ?? '');
    $newCompany = preg_replace('/[^a-z0-9]/', '', strtolower($newJob['company'] ?? ''));
    $newTitleNorm = normalizeTitle($newJob['title'] ?? '');
    $newTokens = extractCoreTitleTokens($newJob['title'] ?? '');
    $newApplyRaw = preg_replace('/[^a-z0-9@.]/', '', strtolower($newJob['applyValue'] ?? ''));

    foreach ($existingJobs as $j) {
        if ($excludeId && ($j['id'] ?? '') === $excludeId) continue;

        $existingCompany = preg_replace('/[^a-z0-9]/', '', strtolower($j['company'] ?? ''));
        $existingTokens = extractCoreTitleTokens($j['title'] ?? '');
        $existingApplyRaw = preg_replace('/[^a-z0-9@.]/', '', strtolower($j['applyValue'] ?? ''));

        // 1. Exact or normalized Web URL match (for actual career links)
        if (!empty($newUrl) && isWebUrl($newJob['applyValue'] ?? '')) {
            $existingApply = $j['applyValue'] ?? '';
            if (isWebUrl($existingApply)) {
                $existingUrl = normalizeJobUrl($existingApply);
                if (!empty($existingUrl) && $newUrl === $existingUrl) {
                    return [
                        'reason' => 'Target application URL is identical to an existing listing',
                        'duplicate_job' => $j
                    ];
                }
            }
        }

        // 2. Phone or Email match:
        if (!empty($newApplyRaw) && !isWebUrl($newJob['applyValue'] ?? '') && $newApplyRaw === $existingApplyRaw) {
            $hasCompanyMatch = (!empty($newCompany) && !empty($existingCompany) && ($newCompany === $existingCompany || strpos($newCompany, $existingCompany) !== false || strpos($existingCompany, $newCompany) !== false));
            $intersect = array_intersect($newTokens, $existingTokens);
            $minCount = min(count($newTokens), count($existingTokens));
            $overlapRatio = $minCount > 0 ? (count($intersect) / $minCount) : 0;

            // If same contact AND same company, duplicate ONLY if role title is also similar (>=50% overlap or exact)
            if ($hasCompanyMatch) {
                if ($newTitleNorm === $existingTitleNorm || ($overlapRatio >= 0.5 && count($intersect) >= 2)) {
                    return [
                        'reason' => 'Application contact, company, and role match an existing opening',
                        'duplicate_job' => $j
                    ];
                }
            } else if ($overlapRatio >= 0.75 && count($intersect) >= 2) {
                return [
                    'reason' => 'Application contact details and role match an existing opening',
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

// Helper to draw rounded rectangles in GD
function drawRoundedRect($im, $x, $y, $w, $h, $radius, $fillColor, $borderColor = null) {
    $x2 = (int)($x + $w);
    $y2 = (int)($y + $h);
    $x = (int)$x;
    $y = (int)$y;
    $radius = (int)$radius;
    $d = $radius * 2;

    if ($radius <= 0) {
        imagefilledrectangle($im, $x, $y, $x2, $y2, $fillColor);
        if ($borderColor !== null) {
            imagerectangle($im, $x, $y, $x2, $y2, $borderColor);
        }
        return;
    }

    imagefilledrectangle($im, $x + $radius, $y, $x2 - $radius, $y2, $fillColor);
    imagefilledrectangle($im, $x, $y + $radius, $x2, $y2 - $radius, $fillColor);

    imagefilledellipse($im, $x + $radius, $y + $radius, $d, $d, $fillColor);
    imagefilledellipse($im, $x2 - $radius, $y + $radius, $d, $d, $fillColor);
    imagefilledellipse($im, $x + $radius, $y2 - $radius, $d, $d, $fillColor);
    imagefilledellipse($im, $x2 - $radius, $y2 - $radius, $d, $d, $fillColor);

    if ($borderColor !== null) {
        imageline($im, $x + $radius, $y, $x2 - $radius, $y, $borderColor);
        imageline($im, $x + $radius, $y2, $x2 - $radius, $y2, $borderColor);
        imageline($im, $x, $y + $radius, $x, $y2 - $radius, $borderColor);
        imageline($im, $x2, $y + $radius, $x2, $y2 - $radius, $borderColor);

        imagearc($im, $x + $radius, $y + $radius, $d, $d, 180, 270, $borderColor);
        imagearc($im, $x2 - $radius, $y + $radius, $d, $d, 270, 360, $borderColor);
        imagearc($im, $x2 - $radius, $y2 - $radius, $d, $d, 0, 90, $borderColor);
        imagearc($im, $x + $radius, $y2 - $radius, $d, $d, 90, 180, $borderColor);
    }
}

// Safe text renderer with TrueType and GD fallback
function renderTextSafe($im, $fontSize, $x, $y, $color, $fontFile, $text) {
    if ($fontFile && function_exists('imagettftext') && file_exists($fontFile)) {
        @imagettftext($im, $fontSize, 0, (int)$x, (int)($y + $fontSize * 1.05), $color, $fontFile, $text);
    } else {
        $gdFont = ($fontSize >= 20) ? 5 : (($fontSize >= 14) ? 4 : 2);
        @imagestring($im, $gdFont, (int)$x, (int)$y, substr($text, 0, 90), $color);
    }
}

// Text wrapper for headings and paragraphs
function wrapTextSafe($text, $fontSize, $fontFile, $maxWidth) {
    if (!$fontFile || !function_exists('imagettfbbox') || !file_exists($fontFile)) {
        $charsPerLine = max(20, (int)($maxWidth / max(1, ($fontSize * 0.65))));
        return explode("\n", wordwrap($text, $charsPerLine, "\n", true));
    }
    $words = explode(' ', $text);
    $lines = [];
    $currentLine = '';
    foreach ($words as $word) {
        $testLine = ($currentLine === '') ? $word : ($currentLine . ' ' . $word);
        $bbox = @imagettfbbox($fontSize, 0, $fontFile, $testLine);
        $width = $bbox ? abs($bbox[4] - $bbox[0]) : (strlen($testLine) * $fontSize * 0.6);
        if ($width > $maxWidth && $currentLine !== '') {
            $lines[] = $currentLine;
            $currentLine = $word;
        } else {
            $currentLine = $testLine;
        }
    }
    if ($currentLine !== '') {
        $lines[] = $currentLine;
    }
    return $lines;
}

// Instagram Config Helpers
function loadInstagramConfig($file) {
    $defaults = [
        'enabled' => false,
        'auto_publish_on_approval' => false,
        'ig_account_id' => '',
        'access_token' => '',
        'default_hashtags' => "#SelectedJobs #JobsInIndia #HiringAlert #CareerOpportunities #JobSearch #FreshersJobs"
    ];
    if (!file_exists($file)) {
        return $defaults;
    }
    $json = file_get_contents($file);
    $data = json_decode($json, true);
    return is_array($data) ? array_merge($defaults, $data) : $defaults;
}

function saveInstagramConfig($file, $cfg) {
    $dir = dirname($file);
    if (!is_dir($dir)) {
        @mkdir($dir, 0775, true);
    }
    return file_put_contents($file, json_encode($cfg, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE), LOCK_EX);
}

// Generate Instagram Caption
function generateInstagramCaption($job, $defaultHashtags = '') {
    $title = $job['title'] ?? 'Exciting Job Opening';
    $company = $job['company'] ?? 'Leading Organization';
    $location = $job['location'] ?? 'All India / Hybrid';
    $salary = $job['salary'] ?? 'Best in Market';
    $exp = $job['experience'] ?? 'Relevant Experience';
    $cat = $job['category'] ?? 'General Jobs';
    $id = $job['id'] ?? '';

    // Smart contextual hashtags
    $catTags = [];
    $lower = strtolower($cat . ' ' . $title);
    if (strpos($lower, 'java') !== false) $catTags[] = '#JavaDeveloper #Springboot #JavaJobs';
    if (strpos($lower, 'python') !== false) $catTags[] = '#PythonDeveloper #DataEngineer #PythonJobs';
    if (strpos($lower, 'software') !== false || strpos($lower, 'engineer') !== false || strpos($lower, 'developer') !== false) {
        $catTags[] = '#SoftwareEngineer #TechJobs #CodingJobs';
    }
    if (strpos($lower, 'fresher') !== false || strpos($lower, 'graduate') !== false || strpos($lower, 'trainee') !== false) {
        $catTags[] = '#FreshersHiring #Graduates2026 #FreshersJobs';
    }
    if (strpos($lower, 'sales') !== false || strpos($lower, 'telecaller') !== false || strpos($lower, 'bpo') !== false) {
        $catTags[] = '#SalesJobs #Telecalling #WalkInJobs';
    }
    if (strpos($lower, 'bangalore') !== false || strpos($lower, 'bengaluru') !== false) $catTags[] = '#BangaloreJobs';
    if (strpos($lower, 'hyderabad') !== false) $catTags[] = '#HyderabadJobs';
    if (strpos($lower, 'chennai') !== false) $catTags[] = '#ChennaiJobs';
    if (strpos($lower, 'pune') !== false) $catTags[] = '#PuneJobs';
    if (strpos($lower, 'mumbai') !== false || strpos($lower, 'delhi') !== false) $catTags[] = '#MumbaiJobs #DelhiNCRJobs';

    $extraTags = implode(' ', array_unique($catTags));
    $hashtags = trim($extraTags . ' ' . ($defaultHashtags ?: '#SelectedJobs #JobsInIndia #HiringNow #JobSearch #Careers #JobOpening'));

    // Overview snippet
    $cleanDesc = strip_tags($job['description'] ?? '');
    $cleanDesc = preg_replace('/\s+/', ' ', $cleanDesc);
    $overview = '';
    if (!empty($cleanDesc)) {
        $snippet = mb_substr($cleanDesc, 0, 220);
        if (mb_strlen($cleanDesc) > 220) $snippet .= '...';
        $overview = "📋 Details:\n" . $snippet . "\n\n";
    }

    $caption = "🚀 WE ARE HIRING: {$title}\n\n";
    $caption .= "🏢 Company: {$company}\n";
    $caption .= "📍 Location: {$location}\n";
    $caption .= "💼 Experience: {$exp}\n";
    $caption .= "💰 CTC / Salary: {$salary}\n";
    $caption .= "🏷️ Category: {$cat}\n\n";
    if ($overview) {
        $caption .= $overview;
    }
    $caption .= "👉 HOW TO APPLY:\n";
    $caption .= "1. Click the website link in our bio (@selectedjobs) -> selectedjobs.in\n";
    $caption .= "2. Direct Job Opening: https://selectedjobs.in/jobs/{$id}\n";
    $caption .= "3. 100% Free Application — Direct Hiring, Zero Fees!\n\n";
    $caption .= "🌐 Official Portal: https://selectedjobs.in\n";
    $caption .= "📌 Save this post for reference & tag friends seeking jobs!\n\n";
    $caption .= ".\n.\n.\n";
    $caption .= $hashtags;

    return $caption;
}

// 8 Premium Branded Background Themes for Instagram Flyers
function getInstagramThemes() {
    return [
        'navy' => [
            'name' => 'Midnight Navy',
            'top' => [10, 15, 30],
            'bottom' => [20, 38, 85],
            'ambient1' => [37, 99, 235],
            'ambient2' => [79, 70, 229],
            'cardBg' => [22, 33, 58],
            'cardBorder' => [46, 64, 102],
            'footerBg' => [30, 58, 138],
            'footerBorder' => [37, 99, 235],
            'accent' => [56, 189, 248],
            'brand' => [28, 100, 242]
        ],
        'emerald' => [
            'name' => 'Deep Emerald',
            'top' => [4, 25, 20],
            'bottom' => [6, 78, 59],
            'ambient1' => [16, 185, 129],
            'ambient2' => [20, 148, 114],
            'cardBg' => [8, 44, 34],
            'cardBorder' => [16, 85, 68],
            'footerBg' => [6, 78, 59],
            'footerBorder' => [16, 185, 129],
            'accent' => [52, 211, 153],
            'brand' => [5, 150, 105]
        ],
        'purple' => [
            'name' => 'Royal Purple',
            'top' => [18, 10, 38],
            'bottom' => [49, 46, 129],
            'ambient1' => [147, 51, 234],
            'ambient2' => [124, 58, 237],
            'cardBg' => [36, 25, 66],
            'cardBorder' => [76, 52, 130],
            'footerBg' => [76, 29, 149],
            'footerBorder' => [147, 51, 234],
            'accent' => [192, 132, 252],
            'brand' => [126, 34, 206]
        ],
        'ruby' => [
            'name' => 'Crimson Ruby',
            'top' => [28, 10, 14],
            'bottom' => [76, 10, 25],
            'ambient1' => [225, 29, 72],
            'ambient2' => [190, 18, 60],
            'cardBg' => [48, 18, 25],
            'cardBorder' => [95, 32, 45],
            'footerBg' => [136, 19, 55],
            'footerBorder' => [225, 29, 72],
            'accent' => [251, 113, 133],
            'brand' => [190, 18, 60]
        ],
        'cyan' => [
            'name' => 'Cyber Teal',
            'top' => [3, 20, 32],
            'bottom' => [12, 74, 110],
            'ambient1' => [6, 182, 212],
            'ambient2' => [14, 116, 144],
            'cardBg' => [10, 42, 60],
            'cardBorder' => [20, 80, 110],
            'footerBg' => [14, 116, 144],
            'footerBorder' => [6, 182, 212],
            'accent' => [34, 211, 238],
            'brand' => [8, 145, 178]
        ],
        'amber' => [
            'name' => 'Sunset Amber',
            'top' => [26, 16, 8],
            'bottom' => [72, 32, 8],
            'ambient1' => [217, 119, 6],
            'ambient2' => [245, 158, 11],
            'cardBg' => [46, 30, 16],
            'cardBorder' => [90, 58, 28],
            'footerBg' => [120, 53, 15],
            'footerBorder' => [217, 119, 6],
            'accent' => [251, 191, 36],
            'brand' => [180, 83, 9]
        ],
        'slate' => [
            'name' => 'Dark Obsidian',
            'top' => [15, 23, 42],
            'bottom' => [30, 41, 59],
            'ambient1' => [71, 85, 105],
            'ambient2' => [51, 65, 85],
            'cardBg' => [30, 41, 59],
            'cardBorder' => [51, 65, 85],
            'footerBg' => [51, 65, 85],
            'footerBorder' => [100, 116, 139],
            'accent' => [125, 211, 252],
            'brand' => [37, 99, 235]
        ],
        'magenta' => [
            'name' => 'Neon Magenta',
            'top' => [28, 8, 30],
            'bottom' => [78, 6, 75],
            'ambient1' => [217, 70, 239],
            'ambient2' => [162, 28, 175],
            'cardBg' => [50, 18, 55],
            'cardBorder' => [96, 32, 105],
            'footerBg' => [112, 26, 117],
            'footerBorder' => [217, 70, 239],
            'accent' => [244, 114, 182],
            'brand' => [192, 38, 211]
        ]
    ];
}

// Generate Instagram Flyer (1080x1080 Square Banner)
function generateInstagramFlyer($job, $outputPath, $themeKey = null) {
    $dir = dirname($outputPath);
    if (!is_dir($dir)) {
        @mkdir($dir, 0775, true);
    }

    $w = 1080;
    $h = 1080;
    $im = imagecreatetruecolor($w, $h);

    // Font selection: Try custom Inter-Bold, then Linux system fonts
    $fontFile = null;
    $fontCandidates = [
        __DIR__ . '/assets/fonts/Inter-Bold.ttf',
        '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',
        '/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf',
        '/usr/share/fonts/truetype/freefont/FreeSansBold.ttf'
    ];
    foreach ($fontCandidates as $fc) {
        if (file_exists($fc)) {
            $fontFile = $fc;
            break;
        }
    }

    // Active Theme Selection
    $allThemes = getInstagramThemes();
    $themeKeys = array_keys($allThemes);
    if (empty($themeKey) || !isset($allThemes[$themeKey])) {
        // Automatically assign a distinct theme for each job using its ID hash
        $hashIndex = abs(crc32($job['id'] ?? 'sj')) % count($themeKeys);
        $themeKey = $themeKeys[$hashIndex];
    }
    $t = $allThemes[$themeKey];

    // Color Palette based on selected theme
    $cWhite = imagecolorallocate($im, 255, 255, 255);
    $cTextMuted = imagecolorallocate($im, 148, 163, 184); // slate-400
    $cTextSub = imagecolorallocate($im, 203, 213, 225);   // slate-300
    $cBrand = imagecolorallocate($im, $t['brand'][0], $t['brand'][1], $t['brand'][2]);
    $cAccent = imagecolorallocate($im, $t['accent'][0], $t['accent'][1], $t['accent'][2]);
    $cEmerald = imagecolorallocate($im, 16, 185, 129);    // emerald-500
    $cEmeraldDark = imagecolorallocate($im, 6, 78, 59);   // emerald-900
    $cEmeraldBorder = imagecolorallocate($im, 5, 150, 105);
    $cAmber = imagecolorallocate($im, 245, 158, 11);      // amber-500
    $cAmberBg = imagecolorallocate($im, 69, 26, 3);
    $cCardBg = imagecolorallocate($im, $t['cardBg'][0], $t['cardBg'][1], $t['cardBg'][2]);
    $cCardBorder = imagecolorallocate($im, $t['cardBorder'][0], $t['cardBorder'][1], $t['cardBorder'][2]);
    $cPillBg = imagecolorallocate($im, 15, 23, 42);
    $cPillBorder = $cCardBorder;
    $cFooterBg = imagecolorallocate($im, $t['footerBg'][0], $t['footerBg'][1], $t['footerBg'][2]);
    $cFooterBorder = imagecolorallocate($im, $t['footerBorder'][0], $t['footerBorder'][1], $t['footerBorder'][2]);

    // 1. Draw rich gradient background
    for ($y = 0; $y < $h; $y++) {
        $ratio = $y / $h;
        $r = (int)($t['top'][0] * (1 - $ratio) + $t['bottom'][0] * $ratio);
        $g = (int)($t['top'][1] * (1 - $ratio) + $t['bottom'][1] * $ratio);
        $b = (int)($t['top'][2] * (1 - $ratio) + $t['bottom'][2] * $ratio);
        $lineColor = imagecolorallocate($im, $r, $g, $b);
        imageline($im, 0, $y, $w, $y, $lineColor);
    }

    // 2. Ambient glowing background highlights
    imagefilledellipse($im, 980, 80, 480, 480, imagecolorallocatealpha($im, $t['ambient1'][0], $t['ambient1'][1], $t['ambient1'][2], 112));
    imagefilledellipse($im, 60, 980, 520, 520, imagecolorallocatealpha($im, $t['ambient2'][0], $t['ambient2'][1], $t['ambient2'][2], 114));

    // Outer subtle border
    imagerectangle($im, 20, 20, $w - 20, $h - 20, imagecolorallocate($im, 30, 41, 59));

    // 3. Top Header Bar (Brand Logo + Verified Badge)
    // Selected Jobs Brand Pill
    drawRoundedRect($im, 60, 50, 250, 50, 14, $cBrand);
    renderTextSafe($im, 18, 85, 62, $cWhite, $fontFile, "SELECTED JOBS");

    // Verified Opening Badge (with real vector dot)
    drawRoundedRect($im, 770, 50, 250, 50, 14, $cEmeraldDark, $cEmeraldBorder);
    imagefilledellipse($im, 795, 75, 10, 10, $cEmerald);
    renderTextSafe($im, 15, 812, 64, $cEmerald, $fontFile, "VERIFIED OPENING");

    // 4. Category Pill & Urgent Tag
    $categoryName = strtoupper(trim($job['category'] ?? 'GENERAL OPENING'));
    $catWidth = min(460, max(200, strlen($categoryName) * 15 + 40));
    drawRoundedRect($im, 60, 135, $catWidth, 42, 10, $cPillBg, $cPillBorder);
    renderTextSafe($im, 15, 80, 146, $cAccent, $fontFile, $categoryName);

    if (!empty($job['isNew'])) {
        drawRoundedRect($im, 60 + $catWidth + 16, 135, 150, 42, 10, $cAmberBg, $cAmber);
        renderTextSafe($im, 14, 60 + $catWidth + 28, 146, $cAmber, $fontFile, "HOT OPENING");
    }

    // "WE ARE HIRING" Subtitle
    renderTextSafe($im, 16, 60, 205, $cTextMuted, $fontFile, "CAREER OPPORTUNITY  |  IMMEDIATE REQUIREMENT");

    // 5. Job Title (Wrapped nicely)
    $title = trim($job['title'] ?? 'Job Opening');
    $titleLines = wrapTextSafe($title, 38, $fontFile, 960);
    $titleLines = array_slice($titleLines, 0, 3);
    $currentY = 240;
    foreach ($titleLines as $line) {
        renderTextSafe($im, 38, 60, $currentY, $cWhite, $fontFile, $line);
        $currentY += 54;
    }

    // 6. Hiring Company
    $company = trim($job['company'] ?? 'Verified Employer');
    renderTextSafe($im, 26, 60, $currentY + 10, $cAccent, $fontFile, "at " . $company);

    // 7. Four Spec Cards Grid (2 rows x 2 cols)
    $cardW = 460;
    $cardH = 110;
    $row1Y = 480;
    $row2Y = 610;

    // Card 1: Location
    drawRoundedRect($im, 60, $row1Y, $cardW, $cardH, 16, $cCardBg, $cCardBorder);
    renderTextSafe($im, 13, 85, $row1Y + 18, $cTextMuted, $fontFile, "LOCATION");
    $locVal = trim($job['location'] ?? 'All India');
    $locSize = (mb_strlen($locVal) > 22) ? 17 : 21;
    if (mb_strlen($locVal) > 32) $locVal = mb_substr($locVal, 0, 30) . '..';
    renderTextSafe($im, $locSize, 85, $row1Y + 54, $cWhite, $fontFile, $locVal);

    // Card 2: Experience
    drawRoundedRect($im, 560, $row1Y, $cardW, $cardH, 16, $cCardBg, $cCardBorder);
    renderTextSafe($im, 13, 585, $row1Y + 18, $cTextMuted, $fontFile, "EXPERIENCE");
    $expVal = trim($job['experience'] ?? 'Freshers / Experienced');
    $expSize = (mb_strlen($expVal) > 22) ? 17 : 21;
    if (mb_strlen($expVal) > 32) $expVal = mb_substr($expVal, 0, 30) . '..';
    renderTextSafe($im, $expSize, 585, $row1Y + 54, $cWhite, $fontFile, $expVal);

    // Card 3: Salary / CTC
    drawRoundedRect($im, 60, $row2Y, $cardW, $cardH, 16, $cCardBg, $cCardBorder);
    renderTextSafe($im, 13, 85, $row2Y + 18, $cAmber, $fontFile, "SALARY / CTC");
    $salVal = trim($job['salary'] ?? 'Best in Industry');
    $salSize = (mb_strlen($salVal) > 22) ? 17 : 21;
    if (mb_strlen($salVal) > 32) $salVal = mb_substr($salVal, 0, 30) . '..';
    renderTextSafe($im, $salSize, 85, $row2Y + 54, $cEmerald, $fontFile, $salVal);

    // Card 4: Workplace Type / Role Mode
    drawRoundedRect($im, 560, $row2Y, $cardW, $cardH, 16, $cCardBg, $cCardBorder);
    renderTextSafe($im, 13, 585, $row2Y + 18, $cTextMuted, $fontFile, "WORK MODE");
    $modeVal = trim($job['workplaceType'] ?? ($job['type'] ?? 'Full Time / Onsite'));
    $modeSize = (mb_strlen($modeVal) > 22) ? 17 : 21;
    if (mb_strlen($modeVal) > 32) $modeVal = mb_substr($modeVal, 0, 30) . '..';
    renderTextSafe($im, $modeSize, 585, $row2Y + 54, $cWhite, $fontFile, $modeVal);

    // 8. Key Skills / Highlight Pill (y = 745)
    drawRoundedRect($im, 60, 745, 960, 75, 14, imagecolorallocate($im, 15, 23, 42), $cCardBorder);
    renderTextSafe($im, 13, 85, 758, $cAccent, $fontFile, "KEY REQUIREMENTS / APPLICATION TYPE:");
    $applyHint = (isWebUrl($job['applyValue'] ?? '')) ? "Online Direct Career Application" : ("Direct Contact / Email: " . mb_substr($job['applyValue'] ?? '', 0, 50));
    renderTextSafe($im, 18, 85, 785, $cTextSub, $fontFile, $applyHint);

    // 9. Bottom CTA Card (Vibrant Conversion Banner with Bio and URL prominence)
    drawRoundedRect($im, 60, 845, 960, 175, 20, $cFooterBg, $cFooterBorder);
    renderTextSafe($im, 24, 95, 875, $cWhite, $fontFile, "APPLY NOW: Click Link in Bio (@selectedjobs)");
    renderTextSafe($im, 18, 95, 920, $cAccent, $fontFile, "selectedjobs.in/jobs/" . ($job['id'] ?? ''));
    renderTextSafe($im, 14, 95, 965, $cTextSub, $fontFile, "Official Website: https://selectedjobs.in  •  100% Free Job Portal  •  Zero Fees");

    // Save final image
    imagejpeg($im, $outputPath, 92);
    imagedestroy($im);
    return file_exists($outputPath);
}

// Meta Graph API Instagram Publisher
function publishToInstagram($config, $imageUrl, $caption) {
    $igAccountId = trim($config['ig_account_id'] ?? '');
    $accessToken = trim($config['access_token'] ?? '');

    if (empty($igAccountId) || empty($accessToken)) {
        return [
            'success' => false,
            'error' => 'Instagram Account ID and Access Token must be configured in Instagram Settings.'
        ];
    }

    if (empty($imageUrl)) {
        return [
            'success' => false,
            'error' => 'Flyer image URL is required for Instagram posting.'
        ];
    }

    // Step 1: Create media container
    $containerEndpoint = "https://graph.facebook.com/v20.0/" . urlencode($igAccountId) . "/media";
    $postData = [
        'image_url' => $imageUrl,
        'caption' => $caption,
        'access_token' => $accessToken
    ];

    $ch = curl_init($containerEndpoint);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($postData));
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    curl_setopt($ch, CURLOPT_TIMEOUT, 30);
    $resp = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    $containerResult = json_decode($resp, true);
    if ($httpCode !== 200 || empty($containerResult['id'])) {
        $errMsg = $containerResult['error']['message'] ?? 'Failed to create Instagram media container.';
        return [
            'success' => false,
            'error' => 'Meta API Container Error: ' . $errMsg,
            'details' => $containerResult
        ];
    }

    $creationId = $containerResult['id'];

    // Wait 2 seconds for Meta CDN processing
    sleep(2);

    // Step 2: Publish media container
    $publishEndpoint = "https://graph.facebook.com/v20.0/" . urlencode($igAccountId) . "/media_publish";
    $publishData = [
        'creation_id' => $creationId,
        'access_token' => $accessToken
    ];

    $ch = curl_init($publishEndpoint);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($publishData));
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    curl_setopt($ch, CURLOPT_TIMEOUT, 30);
    $publishResp = curl_exec($ch);
    $publishHttpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    $publishResult = json_decode($publishResp, true);
    if ($publishHttpCode !== 200 || empty($publishResult['id'])) {
        $errMsg = $publishResult['error']['message'] ?? 'Failed to publish media container on Instagram.';
        return [
            'success' => false,
            'error' => 'Meta API Publish Error: ' . $errMsg,
            'creation_id' => $creationId,
            'details' => $publishResult
        ];
    }

    return [
        'success' => true,
        'media_id' => $publishResult['id'],
        'creation_id' => $creationId,
        'message' => 'Post successfully published to Instagram!'
    ];
}

$action = $_GET['action'] ?? '';
$input = json_decode(file_get_contents('php://input'), true) ?? [];

// Route handling
switch ($action) {
    // 0. Lightweight Data Version Check (Instant 2ms latency)
    case 'version':
        echo json_encode([
            'success' => true,
            'data_version' => $dataVersion,
            'timestamp' => time()
        ]);
        break;

    // 1. Get Public Approved Jobs + Site Visitors
    case 'get_jobs':
    case 'jobs':
        $vid = trim($_GET['vid'] ?? ($_COOKIE['sj_vid'] ?? ''));
        $visitorStats = trackVisitor($STATS_FILE, $vid);
        $siteVisitors = is_array($visitorStats) ? ($visitorStats['unique_visitors'] ?? 142) : $visitorStats;
        $liveVisitors = is_array($visitorStats) ? ($visitorStats['live_visitors'] ?? 24) : 24;

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
                if ((strpos($catLower, 'blog') !== false || strpos($catLower, 'guide') !== false) && (strpos($itemCat, 'blog') !== false || strpos($itemCat, 'guide') !== false || !empty($j['isBlog']))) return true;
                return false;
            });
        }

        $jobsSummary = array_map(function($j) {
            return [
                'id' => $j['id'] ?? '',
                'title' => $j['title'] ?? '',
                'company' => $j['company'] ?? '',
                'category' => $j['category'] ?? '',
                'location' => $j['location'] ?? '',
                'salary' => $j['salary'] ?? '',
                'experience' => $j['experience'] ?? '',
                'workplaceType' => $j['workplaceType'] ?? '',
                'employmentType' => $j['employmentType'] ?? '',
                'applyUrl' => $j['applyUrl'] ?? '',
                'skills' => $j['skills'] ?? [],
                'isNew' => $j['isNew'] ?? false,
                'featuredInTopGrid' => $j['featuredInTopGrid'] ?? false,
                'isBlog' => $j['isBlog'] ?? false,
                'readTime' => $j['readTime'] ?? '',
                'channelUrl' => $j['channelUrl'] ?? '',
                'viewsCount' => $j['viewsCount'] ?? 1,
                'createdAt' => $j['createdAt'] ?? ''
            ];
        }, array_values($approved));

        echo json_encode([
            'success' => true,
            'jobs' => $jobsSummary,
            'data_version' => $dataVersion,
            'timestamp' => time(),
            'site_unique_visitors' => $siteVisitors,
            'live_visitors' => $liveVisitors,
            'total_jobs' => count($jobsSummary)
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
            $jobStats = trackJobView($STATS_FILE, $DATA_FILE, $id, $vid);
            $found['viewsCount'] = is_array($jobStats) ? ($jobStats['count'] ?? 1) : $jobStats;
            $found['liveViewers'] = is_array($jobStats) ? ($jobStats['live_viewers'] ?? 3) : 3;
            $visitorStats = trackVisitor($STATS_FILE, $vid);
            $siteVisitors = is_array($visitorStats) ? ($visitorStats['unique_visitors'] ?? 142) : $visitorStats;
            $liveVisitors = is_array($visitorStats) ? ($visitorStats['live_visitors'] ?? 24) : 24;
            echo json_encode([
                'success' => true,
                'job' => $found,
                'site_unique_visitors' => $siteVisitors,
                'live_visitors' => $liveVisitors
            ]);
        } else {
            http_response_code(404);
            echo json_encode(['success' => false, 'error' => 'Job not found']);
        }
        break;

    // 3. Track Visit Endpoint
    case 'track_visit':
        $vid = trim($_GET['vid'] ?? ($input['vid'] ?? ($_COOKIE['sj_vid'] ?? '')));
        $visitorStats = trackVisitor($STATS_FILE, $vid);
        $siteVisitors = is_array($visitorStats) ? ($visitorStats['unique_visitors'] ?? 142) : $visitorStats;
        $liveVisitors = is_array($visitorStats) ? ($visitorStats['live_visitors'] ?? 24) : 24;
        echo json_encode([
            'success' => true,
            'site_unique_visitors' => $siteVisitors,
            'live_visitors' => $liveVisitors
        ]);
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

                    // Optional Auto-Publish to Instagram
                    $cfg = loadInstagramConfig($IG_CONFIG_FILE);
                    if (!empty($cfg['enabled']) && !empty($cfg['auto_publish_on_approval']) && empty($jobs[$idx]['instagram_posted'])) {
                        $flyerName = 'banner_' . preg_replace('/[^a-zA-Z0-9_-]/', '_', $id) . '.jpg';
                        $flyerPath = $BANNERS_DIR . '/' . $flyerName;
                        $flyerUrl = 'https://selectedjobs.in/assets/banners/' . $flyerName;
                        if (!file_exists($flyerPath)) {
                            generateInstagramFlyer($jobs[$idx], $flyerPath);
                        }
                        $caption = generateInstagramCaption($jobs[$idx], $cfg['default_hashtags'] ?? '');
                        $igRes = publishToInstagram($cfg, $flyerUrl, $caption);
                        if (!empty($igRes['success'])) {
                            $jobs[$idx]['instagram_posted'] = true;
                            $jobs[$idx]['instagram_media_id'] = $igRes['media_id'] ?? '';
                            $jobs[$idx]['instagram_posted_at'] = date('c');
                            $updatedJob = $jobs[$idx];
                        }
                    }
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
        $allowed = ['index.html', 'admin.html', 'post-job.html', 'job.html', 'blog.html', '.htaccess', 'api.php', 'jobs.json', 'stats.json', 'instagram_config.json', 'Inter-Bold.ttf'];
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

        if (($input['encoding'] ?? '') === 'base64') {
            $content = base64_decode($content);
        }

        if ($filename === 'Inter-Bold.ttf') {
            $targetDir = __DIR__ . '/assets/fonts';
            if (!is_dir($targetDir)) @mkdir($targetDir, 0775, true);
            $target = $targetDir . '/Inter-Bold.ttf';
        } elseif ($filename === 'jobs.json' || $filename === 'stats.json' || $filename === 'instagram_config.json') {
            $targetDir = __DIR__ . '/data';
            if (!is_dir($targetDir)) @mkdir($targetDir, 0775, true);
            $target = $targetDir . '/' . $filename;
        } else {
            $target = __DIR__ . '/' . $filename;
        }

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

    // 13. Get Instagram Configuration
    case 'get_instagram_config':
        if (!isAdminAuthed($ADMIN_PASSKEY)) {
            http_response_code(401);
            echo json_encode(['success' => false, 'error' => 'Unauthorized']);
            exit;
        }
        $cfg = loadInstagramConfig($IG_CONFIG_FILE);
        echo json_encode(['success' => true, 'config' => $cfg]);
        break;

    // 14. Save Instagram Configuration
    case 'save_instagram_config':
        if (!isAdminAuthed($ADMIN_PASSKEY)) {
            http_response_code(401);
            echo json_encode(['success' => false, 'error' => 'Unauthorized']);
            exit;
        }
        $cfg = loadInstagramConfig($IG_CONFIG_FILE);
        $cfg['ig_account_id'] = trim($input['ig_account_id'] ?? ($cfg['ig_account_id'] ?? ''));
        $cfg['access_token'] = trim($input['access_token'] ?? ($cfg['access_token'] ?? ''));
        $cfg['enabled'] = !empty($input['enabled']);
        $cfg['auto_publish_on_approval'] = !empty($input['auto_publish_on_approval']);
        if (isset($input['default_hashtags'])) {
            $cfg['default_hashtags'] = trim($input['default_hashtags']);
        }
        $cfg['updated_at'] = date('c');
        saveInstagramConfig($IG_CONFIG_FILE, $cfg);
        echo json_encode(['success' => true, 'message' => 'Instagram settings saved successfully', 'config' => $cfg]);
        break;

    // 15. Generate Instagram Banner & Caption Preview
    case 'generate_instagram_banner':
        $id = trim($_GET['id'] ?? ($input['id'] ?? ''));
        if (empty($id)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Job ID is required']);
            exit;
        }

        $jobs = loadJobs($DATA_FILE);
        $found = null;
        foreach ($jobs as $j) {
            if (($j['id'] ?? '') === $id) {
                $found = $j;
                break;
            }
        }

        if (!$found) {
            http_response_code(404);
            echo json_encode(['success' => false, 'error' => 'Job not found']);
            exit;
        }

        $themes = getInstagramThemes();
        $themeKeys = array_keys($themes);
        $reqTheme = trim($_GET['theme'] ?? ($input['theme'] ?? ''));
        if (empty($reqTheme) || !isset($themes[$reqTheme])) {
            $hashIndex = abs(crc32($id)) % count($themeKeys);
            $reqTheme = $themeKeys[$hashIndex];
        }

        $flyerName = 'banner_' . preg_replace('/[^a-zA-Z0-9_-]/', '_', $id) . '_' . $reqTheme . '.jpg';
        $flyerPath = $BANNERS_DIR . '/' . $flyerName;
        $flyerUrl = 'https://selectedjobs.in/assets/banners/' . $flyerName;

        // Generate flyer if not already generated or force refresh
        $force = !empty($_GET['force']) || !empty($input['force']);
        if (!file_exists($flyerPath) || $force) {
            generateInstagramFlyer($found, $flyerPath, $reqTheme);
        }

        $cfg = loadInstagramConfig($IG_CONFIG_FILE);
        $caption = generateInstagramCaption($found, $cfg['default_hashtags'] ?? '');

        echo json_encode([
            'success' => true,
            'job' => $found,
            'image_url' => $flyerUrl,
            'caption' => $caption,
            'has_flyer' => file_exists($flyerPath),
            'flyer_name' => $flyerName,
            'current_theme' => $reqTheme,
            'theme_name' => $themes[$reqTheme]['name'],
            'available_themes' => array_map(function($k, $v) {
                return [
                    'key' => $k,
                    'name' => $v['name'],
                    'accent' => sprintf('#%02x%02x%02x', $v['accent'][0], $v['accent'][1], $v['accent'][2]),
                    'brand' => sprintf('#%02x%02x%02x', $v['brand'][0], $v['brand'][1], $v['brand'][2])
                ];
            }, array_keys($themes), array_values($themes))
        ]);
        break;

    // 16. Publish Post Directly to Instagram
    case 'publish_to_instagram':
        if (!isAdminAuthed($ADMIN_PASSKEY)) {
            http_response_code(401);
            echo json_encode(['success' => false, 'error' => 'Unauthorized']);
            exit;
        }

        $id = trim($input['id'] ?? ($_GET['id'] ?? ''));
        if (empty($id)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Job ID is required']);
            exit;
        }

        $jobs = loadJobs($DATA_FILE);
        $foundIndex = -1;
        foreach ($jobs as $idx => $j) {
            if (($j['id'] ?? '') === $id) {
                $foundIndex = $idx;
                break;
            }
        }

        if ($foundIndex === -1) {
            http_response_code(404);
            echo json_encode(['success' => false, 'error' => 'Job not found']);
            exit;
        }

        $targetJob = $jobs[$foundIndex];
        $themes = getInstagramThemes();
        $themeKeys = array_keys($themes);
        $reqTheme = trim($input['theme'] ?? ($_GET['theme'] ?? ''));
        if (empty($reqTheme) || !isset($themes[$reqTheme])) {
            $hashIndex = abs(crc32($id)) % count($themeKeys);
            $reqTheme = $themeKeys[$hashIndex];
        }

        $flyerName = 'banner_' . preg_replace('/[^a-zA-Z0-9_-]/', '_', $id) . '_' . $reqTheme . '.jpg';
        $flyerPath = $BANNERS_DIR . '/' . $flyerName;
        $flyerUrl = 'https://selectedjobs.in/assets/banners/' . $flyerName;

        if (!file_exists($flyerPath) || !empty($input['force'])) {
            generateInstagramFlyer($targetJob, $flyerPath, $reqTheme);
        }

        $cfg = loadInstagramConfig($IG_CONFIG_FILE);
        $customCaption = trim($input['caption'] ?? '');
        $caption = !empty($customCaption) ? $customCaption : generateInstagramCaption($targetJob, $cfg['default_hashtags'] ?? '');

        $result = publishToInstagram($cfg, $flyerUrl, $caption);
        if ($result['success']) {
            $jobs[$foundIndex]['instagram_posted'] = true;
            $jobs[$foundIndex]['instagram_media_id'] = $result['media_id'];
            $jobs[$foundIndex]['instagram_posted_at'] = date('c');
            saveJobs($DATA_FILE, $jobs);
        }

        echo json_encode($result);
        break;

    // 17. Test Instagram Meta Connection
    case 'test_instagram_connection':
        if (!isAdminAuthed($ADMIN_PASSKEY)) {
            http_response_code(401);
            echo json_encode(['success' => false, 'error' => 'Unauthorized']);
            exit;
        }

        $cfg = loadInstagramConfig($IG_CONFIG_FILE);
        $igId = trim($input['ig_account_id'] ?? ($cfg['ig_account_id'] ?? ''));
        $token = trim($input['access_token'] ?? ($cfg['access_token'] ?? ''));

        if (empty($igId) || empty($token)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Instagram Account ID and Access Token are required to test connection.']);
            exit;
        }

        $testUrl = "https://graph.facebook.com/v20.0/" . urlencode($igId) . "?fields=id,username,name,profile_picture_url&access_token=" . urlencode($token);
        $ch = curl_init($testUrl);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
        curl_setopt($ch, CURLOPT_TIMEOUT, 15);
        $resp = curl_exec($ch);
        $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        $data = json_decode($resp, true);
        if ($code === 200 && !empty($data['id'])) {
            echo json_encode([
                'success' => true,
                'message' => 'Successfully connected to Instagram Professional Account!',
                'profile' => $data
            ]);
        } else {
            $errMsg = $data['error']['message'] ?? 'Unable to connect to Meta Graph API. Please verify Account ID and Access Token.';
            echo json_encode([
                'success' => false,
                'error' => $errMsg,
                'details' => $data
            ]);
        }
        break;

    default:
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => 'Unknown action']);
        break;
}
