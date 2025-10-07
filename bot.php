<?php
// =====================================================
// Telegram Bot for Render Deployment (Webhook Ready)
// =====================================================

// --- Session (if you need sessions; must be first)
session_start(); // MUST be at the top, no blank lines above

// --- Error logging (optional, safe for production)
ini_set('display_errors', 0);       // hide errors from browser
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/error.log');

// --- Load Telegram Bot Token from Render Environment Variables
$BOT_TOKEN = getenv('TELEGRAM_BOT_TOKEN'); 
if (!$BOT_TOKEN) {
    error_log("Telegram Bot Token not set in environment variables!");
    exit;
}

// --- Get the update from Telegram
$update = json_decode(file_get_contents('php://input'), true);

// --- Optional: Log all updates for debugging
file_put_contents(__DIR__ . '/bot.log', print_r($update, true), FILE_APPEND);

// --- Respond to messages
if (isset($update['message'])) {
    $chat_id = $update['message']['chat']['id'];
    $text = $update['message']['text'];

    // Example simple reply
    $reply = "You said: " . $text;

    // Send reply using bot token from environment variable
    $url = "https://api.telegram.org/bot$BOT_TOKEN/sendMessage?chat_id=$chat_id&text=" . urlencode($reply);
    file_get_contents($url);
}

// --- Optional: You can add more commands or Firebase integration below
