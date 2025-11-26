<?php
header('Content-Type: application/json');

// 设置缓存头，提高性能
header('Cache-Control: max-age=3600, public');

// 指定JSON文件路径
 $feed_file = __DIR__ . '/feed.json';

if (!file_exists($feed_file)) {
    http_response_code(404);
    echo json_encode(['error' => 'Feed data not found.']);
    exit;
}

// 从文件中读取完整的文章数据
 $feeda = json_decode(file_get_contents($feed_file), true);

// 获取请求参数
 $page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
 $perPage = 8; // 每页加载的文章数量

// 计算偏移量
 $offset = ($page - 1) * $perPage;

// 获取当前页的数据
 $posts_to_load = array_slice($feeda, $offset, $perPage);

// 如果没有更多数据
if (empty($posts_to_load)) {
    http_response_code(204); // No Content
    exit;
}

// 准备返回给前端的数据
 $response = [
    'html' => '', // 这里将存放生成的HTML片段
    'has_more' => count($feeda) > ($offset + $perPage) // 判断是否还有更多数据
];

 $today_timestamp = strtotime('today midnight');
 $index = $offset; // 保持audio aid的唯一性

// 循环生成HTML片段
foreach ($posts_to_load as $post) {
    $isaudio = !empty($post["audio"]) ? 1 : 0;
    $channelIdentifier = htmlspecialchars($post["ch"]);
    $is_today = ($post['date'] >= $today_timestamp);
    $today_class = $is_today ? ' today' : '';
    
    // 生成HTML
    $response['html'] .= '<div class="post' . $today_class . '" data-channel="' . $channelIdentifier . '" data-category="' . htmlspecialchars($post['category']) . '" data-ts="' . $post['date'] . '" data-audio="' . $isaudio . '">';
    if (!empty($post["image"])) {
         $response['html'] .= '<div class="leftpan"><img src="' . htmlspecialchars($post['image']) . '" loading="lazy"/></div>';
    } else {
        $domain = parse_url($post["link"], PHP_URL_HOST);
        if ($domain) {
            $response['html'] .= '<div class="leftpan"><img src="https://toolb.cn/favicon/' . urlencode($domain) . '" loading="lazy"/></div>';
        } else {
            $response['html'] .= '<div class="leftpan"><img src="/yyghub/img/loading.gif" loading="lazy"/></div>';
        }
    }
   $response['html'] .= '<div class="rightpan"><div class="feedname"><span class="channel">' . htmlspecialchars($post['ch']) . '</span> &bull; <span class="date">' . date('Y-n-j', $post['date']) . '</span></div>
<h2><a href="' . htmlspecialchars($post['link']) . '" target="_blank">' . htmlspecialchars($post['title']) . '</a></h2>';
    if (!empty($post["audio"])) {
        $response['html'] .= '<div class="audio"><button data-aid="'.$index.'">Play</button><audio src="' . htmlspecialchars($post['audio']) . '" preload="metadata" aid="'.$index.'"  controls></audio></div>';
        $index++;
    }
    $response['html'] .= "</div></div>";
}

// 输出JSON格式的响应
echo json_encode($response);

?>
