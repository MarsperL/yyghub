document.addEventListener('DOMContentLoaded', async () => {

    // =================================================================
    // 1. 变量与DOM元素定义
    // =================================================================
    const tabs = document.querySelectorAll('.tab');
    const posts = document.querySelectorAll('.post');
    const channelSearchInput = document.getElementById('channel-search');
    const channelOptionsList = document.getElementById('channel-options-list');
    const channelItemsContainer = document.getElementById('channel-items');

    let selectedChannel = '全部';
    let allChannelsData = []; // 存储从 channels.json 加载的分类数据

    // =================================================================
    // 2. 频道下拉框逻辑
    // =================================================================

    /**
     * 从 channels.json 加载频道数据
     */
    async function initializeChannels() {
        try {
            // 加载新的JSON文件
            const response = await fetch('channels.json');
            if (!response.ok) throw new Error('Failed to load channels.json');
            allChannelsData = await response.json();
            console.log("Channels with names data loaded:", allChannelsData);
        } catch (error) {
            console.error('Error initializing channels:', error);
            if (channelItemsContainer) {
                channelItemsContainer.innerHTML = '<div class="channel-item">加载频道失败</div>';
            }
        }
    }

    /**
     * 渲染一个简单的、不折叠的分类和频道列表
     */
    function renderCategoriesAndItems(searchTerm = '') {
        if (!channelItemsContainer) return;
        channelItemsContainer.innerHTML = '';

        // 1. 渲染 "All" 选项
        if (searchTerm === '') {
            const allItem = document.createElement('div');
            allItem.className = 'channel-item all-channels-item';
            allItem.textContent = '关注列表';
            allItem.addEventListener('click', () => selectChannel({
                value: '全部',
                text: '关注列表'
            }));
            channelItemsContainer.appendChild(allItem);
        }

        // 2. 遍历分类并渲染
        for (const categoryName in allChannelsData) {
            const channelNames = allChannelsData[categoryName];
            if (!Array.isArray(channelNames)) continue;

            // 渲染分类标题
            const categoryTitle = document.createElement('div');
            categoryTitle.className = 'channel-category-title';
            categoryTitle.textContent = categoryName;
            channelItemsContainer.appendChild(categoryTitle);

            // 渲染该分类下的频道
            channelNames.forEach(channelName => {
                if (channelName.toLowerCase().includes(searchTerm.toLowerCase())) {
                    const item = document.createElement('div');
                    item.className = 'channel-item';
                    // 现在显示的是人类可读的频道名
                    item.textContent = channelName;
                    // selectChannel 现在也使用频道名作为 value
                    item.addEventListener('click', () => selectChannel({
                        value: channelName,
                        text: channelName
                    }));
                    channelItemsContainer.appendChild(item);
                }
            });
        }
    }

    function selectChannel(channel) {
        // selectedChannel 现在存储频道名
        selectedChannel = channel.value;
        channelSearchInput.value = channel.text;
        if (channelOptionsList) channelOptionsList.style.display = 'none';
        filterPostsByChannel();

        tabs.forEach(tab => tab.classList.remove('active'));
        const customSelectContainer = document.querySelector('.custom-select-container');
        if (customSelectContainer) customSelectContainer.classList.add('selected');
    }

    /**
     * 根据选择的频道过滤文章
     * 【核心修改】现在我们比较的是频道名
     */
    function filterPostsByChannel() {
        posts.forEach(post => {
            // 从HTML的 data-channel 属性获取频道名
            const channelName = post.getAttribute('data-channel');

            if (selectedChannel === '全部' || channelName === selectedChannel) {
                post.style.display = 'block';
            } else {
                post.style.display = 'none';
            }
        });
    }

    // =================================================================
    // 3. Tab 切换逻辑
    // =================================================================
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            const filter = tab.textContent.trim();
            posts.forEach(post => {
                const audio = parseInt(post.getAttribute('data-audio'));
                if (filter === '全部' || (filter === '文章' && audio === 0) || (filter === '播客' && audio === 1)) {
                    post.style.display = 'block';
                } else {
                    post.style.display = 'none';
                }
            });

            // 重置频道选择器
            selectedChannel = '全部';
            if (channelSearchInput) channelSearchInput.value = '关注列表';
            const customSelectContainer = document.querySelector('.custom-select-container');
            if (customSelectContainer) customSelectContainer.classList.remove('selected');
        });
    });

    // =================================================================
    // 4. 事件监听
    // =================================================================
    if (channelSearchInput) {
        channelSearchInput.addEventListener('focus', () => {
            renderCategoriesAndItems();
            if (channelOptionsList) channelOptionsList.style.display = 'block';
        });
        channelSearchInput.addEventListener('input', (e) => {
            renderCategoriesAndItems(e.target.value);
            if (channelOptionsList) channelOptionsList.style.display = 'block';
        });
    }
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.custom-select-container')) {
            if (channelOptionsList) channelOptionsList.style.display = 'none';
        }
    });

    // =================================================================
    // 5. 初始化
    // =================================================================
    await initializeChannels();
    renderCategoriesAndItems();
    selectChannel({
        value: '全部',
        text: '关注列表'
    });
// =================================================================
// 5.5. 按需创建 <audio> 元素的逻辑 (Intersection Observer)
// =================================================================

/**
 * 当音频文章进入视口时，为其创建 <audio> 元素
 */
function setupLazyAudioLoading() {
    // 1. 选择所有尚未处理的占位符按钮
    const placeholderButtons = document.querySelectorAll('.audio-placeholder-btn:not(.initialized)');

    if (placeholderButtons.length === 0) return;

    // 2. 创建 Intersection Observer
    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            // 当元素进入视口
            if (entry.isIntersecting) {
                const button = entry.target;
                const audioId = button.dataset.audioId;
                const audioSrc = button.dataset.audioSrc;

                // 3. 动态创建 <audio> 元素
                const audioElement = document.createElement('audio');
                audioElement.src = audioSrc;
                audioElement.preload = 'metadata'; // 预加载元数据，获取时长等信息
                audioElement.aid = audioId; // 设置 aid 属性，与原播放器逻辑兼容
                // 注意：这里不添加 controls，因为我们用浮动播放器控制

                // 4. 将 <audio> 元素插入到按钮后面
                button.parentNode.insertBefore(audioElement, button.nextSibling);

                // 5. 将占位符按钮“升级”为普通播放按钮，并标记为已初始化
                button.classList.remove('audio-placeholder-btn');
                button.classList.add('initialized'); // 标记为已处理，避免重复观察
                // 注意：我们不添加 'playing' 类，那由播放器逻辑管理

                // 6. 停止观察这个元素（任务已完成）
                observer.unobserve(button);
            }
        });
    }, {
        rootMargin: '50px' // 提前50px开始加载，提升用户体验
    });

    // 7. 开始观察所有占位符按钮
    placeholderButtons.forEach(button => {
        observer.observe(button);
    });
}

// 初始化懒加载
setupLazyAudioLoading();

// 如果你的页面内容是动态加载的（例如通过Ajax），你可能需要在加载新内容后再次调用 setupLazyAudioLoading()
// =================================================================
// 6. 音频播放器逻辑 (重构为按需加载，兼容原有HTML结构)
// =================================================================

// --- 全局音频管理器 ---
let caudio = null; // 全局唯一的 Audio 对象，用于实际播放
let currentTrackData = null; // 存储当前播放曲目的所有信息
let isPlaying = false;

// --- DOM 元素引用 ---
const fpBtn = document.querySelector('#floating_player #playpausebutton');
const fsb = document.querySelector('#seekbar');
const closeBtn = document.getElementById('close_player');
const fp = document.querySelector('#floating_player');
const speedBtn = document.getElementById('speed');
const plus30Btn = document.getElementById('plus30');

// --- 播放器状态控制函数 ---
function updatePlayPauseButtonState() {
    if (isPlaying) {
        if (fpBtn) fpBtn.classList.add('playing');
        if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'playing';
    } else {
        if (fpBtn) fpBtn.classList.remove('playing');
        if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'paused';
    }
}

function togglePP() {
    if (!caudio) return;
    if (isPlaying) {
        caudio.pause();
    } else {
        caudio.play();
    }
}

// --- 播放器核心功能 ---
function updateAudioTime() {
    if (!caudio) return;
    document.getElementById('current_time').textContent = formatTime(caudio.currentTime);
    document.getElementById('duration').textContent = formatTime(caudio.duration);
    const progress = caudio.duration ? (caudio.currentTime / caudio.duration) * 100 : 0;
    if (fsb) fsb.value = progress;
}

function updatePositionState() {
    if (!('mediaSession' in navigator) || !caudio) return;
    navigator.mediaSession.setPositionState({
        duration: caudio.duration,
        playbackRate: caudio.playbackRate,
        position: caudio.currentTime
    });
}

// --- 播放器初始化与事件绑定 ---
function initializePlayer() {
    if (fpBtn) fpBtn.addEventListener('click', togglePP);
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            if (caudio) {
                caudio.pause();
                caudio.src = ''; // 清除源，释放资源
            }
            if (fp) {
                fp.classList.remove("show");
                setTimeout(() => fp.style.display = 'none', 300);
            }
            // 重置所有按钮和文章的UI状态
            document.querySelectorAll('.post.nowplaying').forEach(e => e.classList.remove('nowplaying'));
            document.querySelectorAll('.audio button.playing').forEach(e => {
                e.textContent = '▶';
                e.classList.remove('playing');
            });
            caudio = null;
            currentTrackData = null;
            isPlaying = false;
            updatePlayPauseButtonState();
        });
    }
    if (fsb) {
        fsb.addEventListener('input', (e) => {
            if (!caudio || !caudio.duration) return;
            caudio.currentTime = (e.target.value / 100) * caudio.duration;
        });
    }
    if (speedBtn) {
        const speeds = [1, 1.2, 1.5, 1.75, 2];
        let currentSpeedIndex = 0;
        speedBtn.addEventListener('click', () => {
            if (!caudio) return;
            currentSpeedIndex = (currentSpeedIndex + 1) % speeds.length;
            const speed = speeds[currentSpeedIndex];
            caudio.playbackRate = speed;
            speedBtn.innerText = speed + 'x';
            updatePositionState();
        });
    }
    if (plus30Btn) {
        plus30Btn.addEventListener('click', () => {
            if (caudio) caudio.currentTime += 30;
        });
    }
}

// --- 核心函数：加载并播放新曲目 ---
function loadAndPlayTrack(trackData) {
    const { src, title, channel, image, aid, buttonElement } = trackData;

    // 1. 如果点击的是当前正在播放的曲目，则只切换播放/暂停状态
    if (caudio && currentTrackData && currentTrackData.aid === aid) {
        togglePP();
        return;
    }

    // 2. 清理上一个曲目的UI状态
    document.querySelectorAll('.post.nowplaying').forEach(e => e.classList.remove('nowplaying'));
    document.querySelectorAll('.audio button.playing').forEach(btn => {
        btn.textContent = '▶';
        btn.classList.remove('playing');
    });

    // 3. 更新UI到“加载中”状态
    if (buttonElement) {
        buttonElement.textContent = '⏳';
        buttonElement.classList.add('playing');
    }
    
    // 4. 设置浮动播放器信息
    const titleElem = document.getElementById('title');
    if (titleElem) titleElem.innerHTML = title;

    // 5. 创建或复用 Audio 对象
    if (!caudio) {
        caudio = new Audio();
        caudio.addEventListener('timeupdate', updateAudioTime);
        caudio.addEventListener('play', () => { isPlaying = true; updatePlayPauseButtonState(); });
        caudio.addEventListener('pause', () => { isPlaying = false; updatePlayPauseButtonState(); });
        caudio.addEventListener('ended', () => {
            // 播放结束，自动播放下一首
            playNextTrack();
        });
        caudio.addEventListener('error', (e) => {
            console.error("音频播放错误:", e);
            if(buttonElement) {
                buttonElement.textContent = '❌';
            }
        });
    }

    // 6. 加载新曲目并播放
    currentTrackData = trackData;
    caudio.src = src; // 设置新的音频源，浏览器开始按需加载
    caudio.play().then(_ => {
        // 播放成功
        if (buttonElement) buttonElement.textContent = '⏸';
        
        // 显示浮动播放器
        if (fp) {
            fp.style.display = 'block';
            setTimeout(() => fp.classList.add("show"), 10);
        }
        
        // 高亮当前文章
        const currentPost = buttonElement.closest('.post');
        if(currentPost) currentPost.classList.add('nowplaying');

        setupMediaSession();

    }).catch(error => {
        console.error("播放失败:", error);
        if(buttonElement) {
            buttonElement.textContent = '▶';
            buttonElement.classList.remove('playing');
        }
    });
}

// --- 辅助函数：播放下一首 ---
function playNextTrack() {
    const allButtons = Array.from(document.querySelectorAll('.audio button[data-aid]'));
    if (allButtons.length === 0) return;

    const currentIndex = allButtons.findIndex(btn => btn.dataset.aid == currentTrackData.aid);
    const nextIndex = (currentIndex + 1) % allButtons.length;
    const nextButton = allButtons[nextIndex];
    const nextAudioElem = nextButton.nextElementSibling; // 获取对应的 <audio> 元素

    const nextTrackData = {
        src: nextAudioElem.dataset.src, // 从 data-src 获取
        title: nextButton.closest('.post').querySelector('h2').textContent,
        channel: nextButton.closest('.post').querySelector('.channel').textContent,
        image: nextButton.closest('.post').querySelector('img').src,
        aid: nextButton.dataset.aid,
        buttonElement: nextButton
    };
    loadAndPlayTrack(nextTrackData);
}

// --- 辅助函数：设置 Media Session API ---
function setupMediaSession() {
    if (!('mediaSession' in navigator) || !currentTrackData) return;

    navigator.mediaSession.metadata = new MediaMetadata({
        title: currentTrackData.title,
        artist: currentTrackData.channel,
        album: "rssTea",
        artwork: [{ src: currentTrackData.image }],
    });

    navigator.mediaSession.setActionHandler("play", () => caudio.play());
    navigator.mediaSession.setActionHandler("pause", () => caudio.pause());
    navigator.mediaSession.setActionHandler('nexttrack', playNextTrack);
}

// --- 初始化 ---
initializePlayer();

// 修改为事件委托
document.querySelector('.posts-container') || document.body).addEventListener('click', function(event) {
    // 检查点击的是否是音频播放按钮
    const button = event.target.closest('.audio button[data-aid]');
    if (!button) return;

    // 阻止默认行为（如果有的话）
    event.preventDefault();

    // --- 从这里开始，是你原来的点击处理逻辑 ---
    // 我们需要从按钮和它旁边的 <audio> 元素获取信息
    const audioElem = button.nextElementSibling;
    if (!audioElem || audioElem.tagName !== 'AUDIO') {
        console.error("Could not find the associated audio element.");
        return;
    }

    const trackData = {
        src: audioElem.src, // 现在可以直接从 src 读取
        title: button.closest('.post').querySelector('h2').textContent,
        channel: button.closest('.post').querySelector('.channel').textContent,
        image: button.closest('.post').querySelector('img').src,
        aid: button.dataset.aid,
        buttonElement: button
    };
    loadAndPlayTrack(trackData);
    // --- 原来的逻辑结束 ---
});

// --- 保留原有的辅助函数 ---
function formatTime(time) {
    if (isNaN(time)) return "00:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return ('0' + minutes).slice(-2) + ':' + ('0' + seconds).slice(-2);
}
    // =================================================================
    // 7. 返回顶部按钮逻辑 (保持不变)
    // =================================================================
    // ... (将你原来的返回顶部代码完整复制到这里) ...
    const backTopContainer = document.getElementById('back-top-container');
    const backTopMain = document.getElementById('back-top-main');
    const progressCircle = document.getElementById('progress-ring-circle');
    if (backTopContainer && backTopMain && progressCircle) {
        const radius = 42;
        const circumference = 2 * Math.PI * radius;
        progressCircle.style.strokeDasharray = `${circumference}`;
        progressCircle.style.strokeDashoffset = circumference;
        const scrollToTop = () => window.scrollTo({
            top: 0,
            behavior: "smooth"
        });

        function throttle(fn, delay = 50) {
            let timer = null;
            return function(...args) {
                if (!timer) {
                    timer = setTimeout(() => {
                        fn.apply(this, args);
                        timer = null;
                    }, delay);
                }
            };
        }
        const updateScrollProgress = () => {
            const {
                scrollY,
                innerHeight
            } = window;
            const {
                scrollHeight
            } = document.documentElement;
            const totalScrollableHeight = scrollHeight - innerHeight;
            if (totalScrollableHeight <= 0) {
                progressCircle.style.strokeDashoffset = circumference;
                return;
            }
            const scrollProgress = Math.min(scrollY / totalScrollableHeight, 1);
            const offset = circumference - (scrollProgress * circumference);
            progressCircle.style.strokeDashoffset = offset;
        };
        const handleScroll = throttle(() => {
            const shouldShow = window.scrollY > 100;
            if (shouldShow) {
                backTopContainer.classList.add('show');
            } else {
                backTopContainer.classList.remove('show');
            }
            updateScrollProgress();
        });
        backTopMain.addEventListener('click', scrollToTop);
        window.addEventListener("scroll", handleScroll);
        handleScroll();
    }

});


