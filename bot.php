<?php
// Load environment variables from Render
$BOT_TOKEN = getenv('8381157079:AAHkbJoQ4BQ7GSbzgJKrgtWmSys0jbfVpvo');

// Get the update sent by Telegram
$update = json_decode(file_get_contents('php://input'), true);

// Optional: log the update for debugging
file_put_contents('bot.log', print_r($update, true), FILE_APPEND);

// Example: respond to text messages
if (isset($update['message'])) {
    $chat_id = $update['message']['chat']['id'];
    $text = $update['message']['text'];

    // Simple reply
    $reply = "You said: " . $text;
    file_get_contents("https://api.telegram.org/bot$8381157079:AAHkbJoQ4BQ7GSbzgJKrgtWmSys0jbfVpvo/sendMessage?chat_id=$chat_id&text=".urlencode($reply));
}
?>
