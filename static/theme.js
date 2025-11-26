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
    // 6. 音频播放器逻辑 (保持不变)
    // =================================================================
    // ... (将你原来的音频播放器代码完整复制到这里) ...
    const btns = document.querySelectorAll('.audio button[data-aid]');
    let caudio = null;
    let ppBtn = null;
    const fpBtn = document.querySelector('#floating_player #playpausebutton');
    const fsb = document.querySelector('#seekbar');
    const closeBtn = document.getElementById('close_player');
    const fp = document.querySelector('#floating_player');
    if (closeBtn) {
        closeBtn.addEventListener('click', function() {
            if (fp) {
                fp.classList.remove("show");
                setTimeout(() => {
                    fp.style.display = 'none';
                }, 300);
            }
            document.querySelectorAll('.post.nowplaying').forEach(e => e.classList.remove('nowplaying'));
        });
    }
    if (fpBtn) {
        fpBtn.addEventListener('click', function() {
            togglePP();
        });
    }

    function togglePP() {
        if (caudio && caudio.paused) {
            caudio.play();
        } else if (caudio) {
            caudio.pause();
        }
    }
    if (fsb) {
        fsb.addEventListener('input', function(e) {
            if (!caudio) return;
            const seekPercentage = fsb.value;
            const seekTime = (seekPercentage / 100) * caudio.duration;
            caudio.currentTime = seekTime;
        });
    }
    const speeds = [1, 1.2, 1.5, 1.75, 2];
    let currentSpeedIndex = 0;
    const speedBtn = document.getElementById('speed');
    if (speedBtn) {
        speedBtn.addEventListener('click', () => {
            if (!caudio) return;
            currentSpeedIndex = (currentSpeedIndex + 1) % speeds.length;
            const speed = speeds[currentSpeedIndex];
            caudio.playbackRate = speed;
            speedBtn.innerText = speed + 'x';
            updatePositionState();
        });
    }
    const plus30Btn = document.getElementById('plus30');
    if (plus30Btn) {
        plus30Btn.addEventListener('click', () => {
            if (caudio) caudio.currentTime += 30;
        });
    }

    function updateAudioTime() {
        if (!caudio) return;
        const currentTime = caudio.currentTime;
        document.getElementById('current_time').textContent = formatTime(currentTime);
        document.getElementById('duration').textContent = formatTime(caudio.duration);
        const progress = (currentTime / caudio.duration) * 100;
        if (fsb) fsb.value = progress;
    }

    function playTime() {
        if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'playing';
        if (fpBtn) fpBtn.classList.add('playing');
        if (ppBtn) ppBtn.classList.add('playing');
        updatePositionState();
    }

    function pauseTime() {
        if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'paused';
        if (fpBtn) fpBtn.classList.remove('playing');
        if (ppBtn) ppBtn.classList.remove('playing');
        updatePositionState();
    }

    function formatTime(time) {
        if (isNaN(time)) return "00:00";
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return ('0' + minutes).slice(-2) + ':' + ('0' + seconds).slice(-2);
    }
    btns.forEach(function(btn) {
        btn.addEventListener('click', function() {
            const aid = this.getAttribute('data-aid');
            const audioElem = document.querySelector('audio[aid="' + aid + '"]');
            changePlayback(audioElem);
        });
    });

    function changePlayback(audioElem) {
        const prevPPBtn = ppBtn;
        ppBtn = document.querySelector('[data-aid="' + audioElem.getAttribute('aid') + '"]');
        const src = audioElem.getAttribute('src');
        if (caudio && caudio !== audioElem) {
            caudio.pause();
            caudio.removeEventListener('timeupdate', updateAudioTime);
            caudio.removeEventListener('play', playTime);
            caudio.removeEventListener('pause', pauseTime);
            if (prevPPBtn) prevPPBtn.classList.remove('playing');
            if (fpBtn) fpBtn.classList.remove('playing');
            if (fsb) fsb.value = '0';
            if (audioElem.readyState >= 1) {
                startPlayback(audioElem);
            } else {
                audioElem.addEventListener('loadedmetadata', () => startPlayback(audioElem), {
                    once: true
                });
            }
        } else if (caudio) {
            togglePP();
        } else {
            if (audioElem.readyState >= 1) {
                startPlayback(audioElem);
            } else {
                audioElem.addEventListener('loadedmetadata', () => startPlayback(audioElem), {
                    once: true
                });
            }
        }
    }

    function updatePositionState() {
        if (!('mediaSession' in navigator) || !caudio) return;
        navigator.mediaSession.setPositionState({
            duration: caudio.duration,
            playbackRate: caudio.playbackRate,
            position: caudio.currentTime
        });
    }

    function startPlayback(audioElem) {
        const closestPost = audioElem.closest('.post');
        document.querySelectorAll('.post.nowplaying').forEach(e => e.classList.remove('nowplaying'));
        closestPost.classList.add('nowplaying');
        const h2text = closestPost.querySelector('h2').textContent;
        const titleElem = document.getElementById('title');
        if (titleElem) titleElem.innerHTML = h2text;
        caudio = audioElem;
        caudio.addEventListener('timeupdate', updateAudioTime);
        caudio.addEventListener('play', playTime);
        caudio.addEventListener('pause', pauseTime);
        const durationElem = document.getElementById('duration');
        if (durationElem) durationElem.textContent = formatTime(caudio.duration);
        if (fp) {
            fp.style.display = 'block';
            setTimeout(() => {
                fp.classList.add("show");
            }, 10);
        }
        caudio.play();
        if (speedBtn) speedBtn.innerText = caudio.playbackRate + 'x';
        if ('mediaSession' in navigator) {
            navigator.mediaSession.metadata = new MediaMetadata({
                title: h2text,
                artist: closestPost.querySelector('.channel').textContent,
                album: "rssTea",
                artwork: [{
                    src: closestPost.querySelector('img').src
                }],
            });
            const totalAids = document.querySelectorAll('[data-aid]').length;
            let nextAid = Math.floor(audioElem.getAttribute('aid')) + 1;
            let prevAid = Math.floor(audioElem.getAttribute('aid')) - 1;
            if (nextAid > totalAids - 1) {
                nextAid = 0;
            }
            if (prevAid < 0) {
                prevAid = totalAids - 1;
            }
            navigator.mediaSession.setActionHandler("play", () => caudio.play());
            navigator.mediaSession.setActionHandler("pause", () => caudio.pause());
            navigator.mediaSession.setActionHandler('nexttrack', () => changePlayback(document.querySelector("[aid=\"" + nextAid + "\"]")));
            navigator.mediaSession.setActionHandler('previoustrack', () => changePlayback(document.querySelector("[aid=\"" + prevAid + "\"]")));
            navigator.mediaSession.setActionHandler('seekbackward', (details) => {
                caudio.currentTime = caudio.currentTime - (details.seekOffset || 10);
                updatePositionState();
            });
            navigator.mediaSession.setActionHandler('seekforward', (details) => {
                caudio.currentTime = caudio.currentTime + (details.seekOffset || 10);
                updatePositionState();
            });
        }
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


