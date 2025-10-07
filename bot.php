<?php
session_start(); // first line

$BOT_TOKEN = getenv('TELEGRAM_BOT_TOKEN'); // must match Render env variable
if (!$BOT_TOKEN) exit('Bot token not found.');

// Get Telegram updates
$update = json_decode(file_get_contents('php://input'), true);
file_put_contents('bot.log', print_r($update, true), FILE_APPEND);

if (isset($update['message'])) {
    $chat_id = $update['message']['chat']['id'];
    $text = $update['message']['text'];

    $reply = "You said: " . $text;
    file_get_contents("https://api.telegram.org/bot$BOT_TOKEN/sendMessage?chat_id=$chat_id&text=" . urlencode($reply));
}
?>
