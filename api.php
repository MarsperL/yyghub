<?php
// api.php

header('Content-Type: application/json');
header('Cache-Control: public, max-age=3600'); // 缓存1小时，减少服务器压力

$action = $_GET['action'] ?? '';

switch ($action) {
    case 'posts':
        $page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
        $posts_per_page = 50; // 必须和 generate.php 中的值保持一致

        $feed_file = 'public/feed.json';
        if (!file_exists($feed_file)) {
            http_response_code(503);
            echo json_encode(['error' => 'Feed data not available. Please run the generator.']);
            exit;
        }

        $all_posts = json_decode(file_get_contents($feed_file), true);
        $total_posts = count($all_posts);
        $total_pages = ceil($total_posts / $posts_per_page);

        if ($page < 1 || $page > $total_pages) {
            http_response_code(404);
            echo json_encode(['error' => 'Page not found.']);
            exit;
        }

        $offset = ($page - 1) * $posts_per_page;
        $posts_for_page = array_slice($all_posts, $offset, $posts_per_page);

        echo json_encode($posts_for_page);
        break;

    case 'meta':
        $meta_file = 'public/meta.json';
        if (file_exists($meta_file)) {
            echo file_get_contents($meta_file);
        } else {
            http_response_code(503);
            echo json_encode(['error' => 'Meta data not available. Please run the generator.']);
        }
        break;

    case 'channels':
        $channels_file = 'public/channels.json';
        if (file_exists($channels_file)) {
            echo file_get_contents($channels_file);
        } else {
            http_response_code(503);
            echo json_encode(['error' => 'Channel data not available. Please run the generator.']);
        }
        break;

    default:
        http_response_code(400);
        echo json_encode(['error' => 'Invalid action.']);
        break;
}

?>
