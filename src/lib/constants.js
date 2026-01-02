// This file is shared between the client and server.

// ============================================================================
// Validation & Input Limits
// ============================================================================
export const MAX_CONTACT_MESSAGE_LENGTH = 10000
export const MAX_NAME_LENGTH = 100
export const MAX_EMAIL_LENGTH = 100
export const MAX_USERNAME_LENGTH = 20
export const MAX_CHAT_MESSAGE_LENGTH = 500
export const MAX_ADMIN_KICK_MESSAGE_LENGTH = 200
export const MAX_ADMIN_BAN_REASON_LENGTH = 200
export const MAX_ADMIN_KICK_TIMEOUT_SECONDS = 86400 // 24 hours
export const MIN_ADMIN_KICK_TIMEOUT_SECONDS = 1

// ============================================================================
// Canvas Constants
// ============================================================================
export const CANVAS_WIDTH = 6000
export const CANVAS_HEIGHT = 6000
export const CANVAS_PADDING = 100
export const MAX_MAGNET_RADIUS = 100

// ============================================================================
// Character Sets
// ============================================================================
export const NUMBERS = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"]
export const SYMBOLS = ["!", "@", "#", "$", "%", "&", "+", "-", "=", "(", ")", "?", "~"]
export const SPECIALS = ["♪", "↙", "↘", "↯"]
export const EMOJIS = ["😭", "😂", "🤯", "😁", "🤩", "😎", "😡", "👻", "💪", "🤦‍♂️", "💩", "👍", "👎"]

// ============================================================================
// Magnet Generation Constants
// ============================================================================
export const MAGNET_LETTER_RADIUS = 30
export const MAGNET_SPRITE_RADIUS = 30
export const MAGNET_ENHANCED_SPRITE_RADIUS = 60
export const BASE_LETTER_COUNT = 1200
export const MIN_LETTERS_PER_CHAR = 3
export const NUMBERS_PER_CHAR_COUNT = 2
export const MAX_RGB_COLOR_VALUE = 16777215

// ============================================================================
// Admin Panel Constants
// ============================================================================
export const ADMIN_KEY_COMBO = ["Control", "Shift", "Alt", "ArrowUp"]
export const ADMIN_PANEL_MIN_WIDTH = 400
export const ADMIN_PANEL_DEFAULT_WIDTH = 600
export const ADMIN_PANEL_MIN_HEIGHT = 300
export const ADMIN_PANEL_DEFAULT_HEIGHT = 600
export const ADMIN_PANEL_MAX_WIDTH_FALLBACK = 1000
export const ADMIN_PANEL_MAX_HEIGHT_FALLBACK = 800
export const ADMIN_PANEL_VIEWPORT_PADDING_HORIZONTAL = 60
export const ADMIN_PANEL_VIEWPORT_PADDING_VERTICAL = 40

export const ADMIN_LIST_MIN_HEIGHT = 70
export const ADMIN_LIST_DEFAULT_HEIGHT = 120

export const ADMIN_DATA_REFRESH_INTERVAL_MS = 1000
export const ADMIN_RESET_FEEDBACK_DELAY_MS = 2000

// ============================================================================
// Chat Constants
// ============================================================================
export const CHAT_MIN_WIDTH = 300
export const CHAT_DEFAULT_WIDTH = 400
export const CHAT_MIN_HEIGHT = 200
export const CHAT_DEFAULT_HEIGHT = 500
export const CHAT_MAX_WIDTH_FALLBACK = 800
export const CHAT_MAX_HEIGHT_FALLBACK = 600
export const CHAT_VIEWPORT_PADDING_HORIZONTAL = 60
export const CHAT_VIEWPORT_PADDING_VERTICAL = 40

export const CHAT_NAME_PROMPT_WIDTH = 400
export const CHAT_NAME_PROMPT_HEIGHT = 60

// ============================================================================
// FridgeCanvas Constants
// ============================================================================
export const FONT_SIZE_MIN = 10
export const FONT_SIZE_MAX = 200
export const FONT_SIZE_EMOJI_MULTIPLIER = 1.8
export const FONT_SIZE_TEXT_MULTIPLIER = 1.2
export const FONT_SIZE_HEIGHT_ESTIMATE_MULTIPLIER = 0.85

export const EMIT_THROTTLE_MS = 17 // ~60fps
export const RECENTLY_DRAGGED_TIMEOUT_MS = 1000
export const RECENTLY_DRAGGED_CLEANUP_MULTIPLIER = 2
export const POSITION_MATCH_THRESHOLD = 2
export const INTERPOLATION_SPEED = 0.3
export const INTERPOLATION_DISTANCE_THRESHOLD_SQUARED = 0.01

export const SORTED_MAGNETS_CACHE_TTL_MS = 100
export const CLEANUP_INTERVAL_MS = 1000

export const KEYBOARD_SCROLL_AMOUNT = 35

export const ADMIN_MOVEMENT_LABEL_FONT_SIZE = 14
export const ADMIN_MOVEMENT_LABEL_PADDING = 8

// ============================================================================
// Server Constants
// ============================================================================
export const SERVER_UPDATE_INTERVAL_MS = 16.67 // ~60fps
export const SERVER_SAVE_INTERVAL_MS = 1000
export const SERVER_CLEANUP_INTERVAL_MS = 1000
export const SERVER_ADMIN_MOVEMENT_BROADCAST_INTERVAL_MS = 100
export const SERVER_MOVEMENT_STALE_TIMEOUT_MS = 1000

export const RATE_LIMIT_WINDOW_MS = 1000 // 1 second
export const RATE_LIMIT_MAX_MOVES = 60 // Max moves per second per client

export const CHAT_RATE_LIMIT_WINDOW_MS = 10000 // 10 seconds
export const CHAT_RATE_LIMIT_MAX_MESSAGES = 15 // Max messages per 10 seconds per client

// ============================================================================
// API Rate Limiting Constants
// ============================================================================
export const API_RATE_LIMIT_MAX_REQUESTS = 5
export const API_RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000 // 15 minutes

// ============================================================================
// Turnstile Constants
// ============================================================================
export const TURNSTILE_MAX_LOAD_ATTEMPTS = 50
export const TURNSTILE_CHECK_INTERVAL_MS = 100

// ============================================================================
// Storage Keys
// ============================================================================
export const DARK_MODE_STORAGE_KEY = "fridge-magnets-dark-mode"

// ============================================================================
// Domain Constants
// ============================================================================
export const CANONICAL_HOST = "fridgemagnets.fun"
