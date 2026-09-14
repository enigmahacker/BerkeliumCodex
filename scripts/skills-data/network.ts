import { SkillDefinition } from './types.js';

export const networkSkills: SkillDefinition[] = [
  {
    name: 'network-http',
    version: '1.0.0',
    description: 'Sends structured HTTP GET, POST, PUT, DELETE requests with headers and payload validation.',
    category: 'network',
    dir: 'http',
    risk: 'medium',
    requires_permission: true,
    required_tools: ['http_request'],
    optional_tools: ['check_connectivity'],
    fallbacks: 'Execute curl via shell_execute if http_request tool is unavailable.',
    title: 'Structured HTTP Client Operations',
    purpose: 'Execute REST and HTTP requests with status code validation and header management.',
    when_to_activate: 'Activate when testing local server endpoints, interacting with REST APIs, or health checks.',
    inputs: 'URL, HTTP method, headers, request body, timeout.',
    preconditions: 'Target host must be valid; local endpoints require running service.',
    procedure: `1. Check network permission policy and sanitize URL.
2. Formulate HTTP request payload and headers (User-Agent, Content-Type, Authorization).
3. Send request via http_request tool.
4. Capture response status code, headers, and body.
5. Parse JSON responses automatically if header indicates application/json.
6. Return structured HTTP response.`,
    tool_usage: 'Invoke http_request with method, url, headers, and body.',
    safety: 'SSRF Protection: Block private network addresses (e.g. AWS metadata 169.254.169.254) unless explicitly authorized for localhost.',
    permissions: 'Requires network capability.',
    verification: 'Check that response status is within expected range (e.g. 200-299).',
    failure_handling: 'If connection refused, check if local server is running on target port.',
    output_contract: 'HttpResponse with status, headers, body, durationMs.',
    examples: 'Sending GET request to http://127.0.0.1:11434/api/tags to query Ollama models.',
    related_skills: ['network-api', 'network-connectivity'],
  },
  {
    name: 'network-api',
    version: '1.0.0',
    description: 'Interacts with REST and GraphQL APIs, handling pagination, rate limits, and JSON schemas.',
    category: 'network',
    dir: 'api',
    risk: 'medium',
    requires_permission: true,
    required_tools: ['http_request'],
    optional_tools: [],
    fallbacks: 'Use curl with jq formatting.',
    title: 'API Integration & Query Management',
    purpose: 'Consume web APIs, handle token auth, rate limits (HTTP 429), and schema validation.',
    when_to_activate: 'Activate when integrating third-party APIs or testing backend endpoints.',
    inputs: 'API base URL, endpoint path, query parameters, auth token, payload.',
    preconditions: 'API credentials must be resolved from AuthStore or environment.',
    procedure: `1. Resolve API authentication securely without exposing raw secrets.
2. Construct URL with serialized query parameters.
3. Call http_request with appropriate auth headers.
4. If HTTP 429 (Rate Limited) is received, extract Retry-After header and back off exponentially.
5. Validate response structure against expected schema.
6. Return parsed data payload.`,
    tool_usage: 'Invoke http_request with bearer token header.',
    safety: 'Never log authorization headers or write bearer tokens to disk.',
    permissions: 'Requires network capability.',
    verification: 'Confirm API response contains expected data fields.',
    failure_handling: 'Handle auth failures (401/403) by prompting user to re-authenticate with auth store.',
    output_contract: 'ApiResponse with data: object, status: number, rateLimitRemaining: number.',
    examples: 'Querying OpenRouter API /models endpoint.',
    related_skills: ['network-http', 'security-secrets'],
  },
  {
    name: 'network-curl',
    version: '1.0.0',
    description: 'Executes robust curl commands with custom flags, timeouts, proxying, and response header extraction.',
    category: 'network',
    dir: 'curl',
    risk: 'medium',
    requires_permission: true,
    required_tools: ['shell_execute'],
    optional_tools: ['check_connectivity'],
    fallbacks: 'Use http_request tool natively.',
    title: 'cURL Network Operations',
    purpose: 'Execute CLI-based network queries, download headers, and test server responses via curl.',
    when_to_activate: 'Activate when debugging raw HTTP handshakes, SSL certificates, or custom curl scripts.',
    inputs: 'cURL command string or target URL with curl flags.',
    preconditions: 'curl binary must exist on host.',
    procedure: `1. Construct safe curl command with --silent --show-error --max-time 30.
2. Avoid curl commands that pipe directly to shell (e.g. curl ... | bash).
3. Execute curl via shell_execute.
4. Capture response stdout and inspect headers (-i or -I).
5. Return sanitized response.`,
    tool_usage: 'Call shell_execute with curl command.',
    safety: 'NEVER execute commands of the form curl <url> | sh or curl <url> | bash.',
    permissions: 'Requires network and shell execution capability.',
    verification: 'Confirm curl completes with exit code 0.',
    failure_handling: 'If curl exits with 28 (timeout) or 7 (failed to connect), report network error.',
    output_contract: 'CurlResult with exitCode, stdout, stderr, httpStatus.',
    examples: 'Executing curl -sI http://127.0.0.1:1234 to verify LM Studio health.',
    related_skills: ['network-http', 'terminal-shell'],
  },
  {
    name: 'network-downloads',
    version: '1.0.0',
    description: 'Downloads remote files, datasets, and release assets with checksum verification.',
    category: 'network',
    dir: 'downloads',
    risk: 'medium',
    requires_permission: true,
    required_tools: ['download_file'],
    optional_tools: ['shell_execute', 'file_metadata'],
    fallbacks: 'Execute curl -O or wget via shell_execute.',
    title: 'Remote File Download & Checksum Verification',
    purpose: 'Download model weights, datasets, or release tarballs with SHA256 integrity verification.',
    when_to_activate: 'Activate when downloading model GGUF files, test datasets, or external dependencies.',
    inputs: 'Remote URL, destination path, expected SHA256 checksum (optional).',
    preconditions: 'Destination directory must be writable.',
    procedure: `1. Verify destination path is inside permitted workspace.
2. Start file download stream using download_file.
3. Track progress and download speed.
4. If expected checksum is provided: compute SHA256 of downloaded file.
5. If checksum mismatches: delete corrupted download and report error.
6. Return download confirmation.`,
    tool_usage: 'Call download_file with url and destination.',
    safety: 'Validate file sizes before downloading to avoid exhausting disk space.',
    permissions: 'Requires network and filesystem write capability.',
    verification: 'Check that destination file exists and matches expected byte size/checksum.',
    failure_handling: 'If download is interrupted, resume with HTTP Range headers if supported.',
    output_contract: 'DownloadResult with localPath, sizeBytes, sha256Verified: boolean.',
    examples: 'Downloading a GGUF model checkpoint into .berkelium/models.',
    related_skills: ['filesystem-write-file', 'network-http'],
  },
  {
    name: 'network-connectivity',
    version: '1.0.0',
    description: 'Validates internet connectivity, DNS resolution, and latency to key AI and package registries.',
    category: 'network',
    dir: 'connectivity',
    risk: 'safe',
    requires_permission: false,
    required_tools: ['check_connectivity'],
    optional_tools: ['shell_execute'],
    fallbacks: 'Ping or curl public DNS (1.1.1.1) or GitHub status API.',
    title: 'Network Reachability & Connectivity Diagnostics',
    purpose: 'Determine if system is online, identify proxy issues, and test reachability to AI providers.',
    when_to_activate: 'Activate on startup, during bk doctor, or when network calls timeout.',
    inputs: 'Target host or service (github.com, openrouter.ai, registry.npmjs.org).',
    preconditions: 'None.',
    procedure: `1. Call check_connectivity tool.
2. Probe DNS resolution for key services (GitHub, NPM, Provider endpoints).
3. Measure round-trip ping/HTTP latency in milliseconds.
4. Report network state: online, offline, degraded, captive portal.
5. Return connectivity diagnostic report.`,
    tool_usage: 'Invoke check_connectivity.',
    safety: 'Safe read-only network probe.',
    permissions: 'Safe operation.',
    verification: 'Confirm connectivity test reports valid latency and status.',
    failure_handling: 'If offline, instruct agent to switch to local providers (Ollama, MLX, GGUF).',
    output_contract: 'ConnectivityStatus with isOnline: boolean, latencyMs: number, reachableEndpoints: array.',
    examples: 'Testing latency to OpenRouter API and GitHub.',
    related_skills: ['terminal-diagnostics', 'network-http'],
  },
];
