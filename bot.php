<?php
// Start session at the very beginning if needed
// session_start(); // uncomment only if you need sessions

// Load your Telegram bot token from Render environment variable
$BOT_TOKEN = getenv('TELEGRAM_BOT_TOKEN'); // <-- must match the NAME you set in Render

// Get the update sent by Telegram
$update = json_decode(file_get_contents('php://input'), true);

// Optional: log the update for debugging
file_put_contents('bot.log', print_r($update, true), FILE_APPEND);

// Respond to messages
if (isset($update['message'])) {
    $chat_id = $update['message']['chat']['id'];
    $text = $update['message']['text'];

    // Simple reply
    $reply = "You said: " . $text;

    // Send message back using correct $BOT_TOKEN
    $url = "https://api.telegram.org/bot$BOT_TOKEN/sendMessage?chat_id=$chat_id&text=" . urlencode($reply);
    file_get_contents($url);
}
?>

