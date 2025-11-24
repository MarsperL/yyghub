const tabs = document.querySelectorAll('.tab');
const posts = document.querySelectorAll('.post');
// const select = document.querySelector('select[name="changechannel"]');
// let selectedChannel = '全部';
// --- 新的自定义下拉框逻辑 ---
const channelSearchInput = document.getElementById('channel-search');
const channelOptionsList = document.getElementById('channel-options-list');
const originalSelect = document.querySelector('select[name="changechannel"]'); // 保留它以获取初始选项
let selectedChannel = '全部';
let allChannels = [];

// 1. 初始化：从隐藏的<select>中获取所有频道
function initializeChannels() {
    if (!originalSelect) return;
    const options = originalSelect.querySelectorAll('option');
    allChannels = Array.from(options).map(option => ({
        value: option.value,
        text: option.textContent
    }));
}

// 2. 渲染过滤后的频道列表
function renderChannelOptions(filter = '') {
    channelOptionsList.innerHTML = ''; // 清空现有列表

    const filteredChannels = allChannels.filter(channel =>
        channel.text.toLowerCase().includes(filter.toLowerCase())
    );

    filteredChannels.forEach(channel => {
        const item = document.createElement('div');
        item.textContent = channel.text;
        item.addEventListener('click', () => selectChannel(channel));
        channelOptionsList.appendChild(item);
    });
}

// 3. 选择频道
function selectChannel(channel) {
    selectedChannel = channel.value;
    channelSearchInput.value = channel.text;
    channelOptionsList.style.display = 'none'; // 隐藏列表
    filterPosts(); // 执行过滤

    // 更新UI状态
    document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
    document.querySelector('.custom-select-container').classList.add('selected');
}

// 4. 过滤文章的逻辑（从原来的select事件中提取出来）
function filterPosts() {
    posts.forEach(post => {
        const channel = post.getAttribute('data-channel');
        if (selectedChannel === '全部' || channel === selectedChannel) {
            post.style.display = 'block';
        } else {
            post.style.display = 'none';
        }
    });
}

// --- 事件监听 ---

// 当输入框获得焦点时，显示所有选项
channelSearchInput.addEventListener('focus', () => {
    renderChannelOptions();
    channelOptionsList.style.display = 'block';
});

// 当输入框内容改变时，过滤选项
channelSearchInput.addEventListener('input', (e) => {
    renderChannelOptions(e.target.value);
    channelOptionsList.style.display = 'block';
});

// 当点击页面其他地方时，隐藏选项列表
document.addEventListener('click', (e) => {
    if (!e.target.closest('.custom-select-container')) {
        channelOptionsList.style.display = 'none';
    }
});

// --- 初始化 ---
document.addEventListener('DOMContentLoaded', () => {
    initializeChannels();
    // 设置默认值
    const defaultChannel = allChannels.find(c => c.value === '全部');
    if (defaultChannel) {
        selectChannel(defaultChannel);
    }
});


tabs.forEach(tab =>
{
    tab.addEventListener('click', () =>
    {
        tabs.forEach(tab =>
        {
            tab.classList.remove('active');
        });
        tab.classList.add('active');
        const filter = tab.textContent.trim();
        posts.forEach(post =>
        {
            const audio = parseInt(post.getAttribute('data-audio'));
            const channel = post.getAttribute('data-channel');
            if (filter === '全部' || (filter === '文章' && audio === 0) || (filter === '播客' && audio === 1))
            {
                post.style.display = 'block';
            }
            else
            {
                post.style.display = 'none';
            }
        });

        // select.value = '全部';
        // select.classList.remove('selected');
        // 重置频道选择器
        selectedChannel = '全部';
        channelSearchInput.value = '关注列表'; // 或 allChannels[0].text
        document.querySelector('.custom-select-container').classList.remove('selected');
    });
});


document.addEventListener('DOMContentLoaded', function ()
{
    const btns = document.querySelectorAll('.audio button[data-aid]');
    let caudio = null;
    let ppBtn = null;
    const fpBtn = document.querySelector('#floating_player #playpausebutton');
    const tl = document.querySelector('#timeline');
    const fsb = document.querySelector('#seekbar');

    // === 获取关闭按钮和浮动播放器容器 ===
    const closeBtn = document.getElementById('close_player');
    const fp = document.querySelector('#floating_player');

    // === 修改后的关闭按钮事件监听器 ===
    closeBtn.addEventListener('click', function() {
        // 仅隐藏UI，不干预音频播放
        fp.classList.remove("show");
        setTimeout(() => {
            fp.style.display = 'none';
        }, 300); // 等待淡出动画完成

        // 可选：清除文章的"nowplaying"高亮，但保留播放状态
        // 如果您希望即使播放器关闭，当前播放的文章仍然高亮，可以注释掉下面这行
        document.querySelectorAll('.post.nowplaying').forEach(e => e.classList.remove('nowplaying'));

        // 注意：我们不再重置 caudio, ppBtn, fpBtn 的状态，也不暂停音频
    });

    fpBtn.addEventListener('click', function ()
    {
        togglePP();
    });

    function togglePP()
    {
        if (caudio && caudio.paused)
        {
            caudio.play();
        }
        else if (caudio)
        {
            caudio.pause();
        }
    }

    tl.addEventListener('input', function (e)
    {
        const seekPercentage = fsb.value;
        const seekTime = (seekPercentage / 100) * caudio.duration;
        caudio.currentTime = seekTime;
    });

    const speeds = [1, 1.2, 1.5, 1.75, 2];
    let currentSpeedIndex = 0;
    document.getElementById('speed').addEventListener('click', () =>
    {
        currentSpeedIndex = (currentSpeedIndex + 1) % speeds.length;
        const speed = speeds[currentSpeedIndex];
        caudio.playbackRate = speed;
        document.getElementById('speed').innerText = speed + 'x';
        updatePositionState();
    });
    document.getElementById('plus30').addEventListener('click', () =>
    {
        caudio.currentTime += 30;
    });

    function updateAudioTime()
    {
        if (!caudio) return; // 如果没有音频在播放，则不执行
        const currentTime = caudio.currentTime;
        const formattedCurrentTime = formatTime(currentTime);
        const formattedDuration = formatTime(caudio.duration);

        document.getElementById('current_time').textContent = formattedCurrentTime;
        document.getElementById('duration').textContent = formattedDuration;
        const progress = (currentTime / caudio.duration) * 100;
        fsb.value = progress;
    }

    function playTime()
    {
        navigator.mediaSession.playbackState = 'playing';
        fpBtn.classList.add('playing'); // 使用 add 而不是 toggle
        if(ppBtn) ppBtn.classList.add('playing');
        updatePositionState();
    }

    function pauseTime()
    {
        navigator.mediaSession.playbackState = 'paused';
        fpBtn.classList.remove('playing'); // 使用 remove 而不是 toggle
        if(ppBtn) ppBtn.classList.remove('playing');
        updatePositionState();
    }


    function formatTime(time)
    {
        if (isNaN(time)) return "00:00";
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return ('0' + minutes).slice(-2) + ':' + ('0' + seconds).slice(-2);
    }

    btns.forEach(function (btn)
    {
        btn.addEventListener('click', function ()
        {
            const aid = this.getAttribute('data-aid');
            const audioElem = document.querySelector('audio[aid="' + aid + '"]');
            changePlayback(audioElem);
        });
    });

    function changePlayback(audioElem)
    {
        const prevPPBtn = ppBtn;
        ppBtn = document.querySelector('[data-aid="' + audioElem.getAttribute('aid') + '"]');
        const src = audioElem.getAttribute('src');

        if (caudio && caudio !== audioElem)
        {
            caudio.pause();
            caudio.removeEventListener('timeupdate', updateAudioTime);
            caudio.removeEventListener('play', playTime);
            caudio.removeEventListener('pause', pauseTime);

            if(prevPPBtn) prevPPBtn.classList.remove('playing');
            fpBtn.classList.remove('playing');
            fsb.value = '0';

            if (audioElem.readyState >= 1)
            {
                startPlayback(audioElem);
            }
            else
            {
                audioElem.addEventListener('loadedmetadata', function ()
                {
                    startPlayback(audioElem);
                });
            }
        }
        else if (caudio)
        {
            togglePP();
        }
        else
        {
            if (audioElem.readyState >= 1)
            {
                startPlayback(audioElem);
            }
            else
            {
                audioElem.addEventListener('loadedmetadata', function ()
                {
                    startPlayback(audioElem);
                });
            }
        }
    }

    function updatePositionState()
    {
        if (!navigator.mediaSession || !caudio) return;
        navigator.mediaSession.setPositionState(
        {
            duration: caudio.duration,
            playbackRate: caudio.playbackRate,
            position: caudio.currentTime,
        });
    }

    function startPlayback(audioElem)
    {
        const closestPost = audioElem.closest('.post');
        document.querySelectorAll('.post.nowplaying').forEach(e => e.classList.remove('nowplaying'));
        closestPost.classList.add('nowplaying');
        const h2text = closestPost.querySelector('h2').textContent;
        document.getElementById('title').innerHTML = h2text;
        caudio = audioElem;
        caudio.addEventListener('timeupdate', updateAudioTime);
        caudio.addEventListener('play', playTime);
        caudio.addEventListener('pause', pauseTime);
        const audioDur = caudio.duration;
        const formattedDur = formatTime(audioDur);
        document.getElementById('duration').textContent = formattedDur;
        fp.style.display = 'block';
        setTimeout(function ()
        {
            fp.classList.add("show");
        }, 10);
        caudio.play();

        document.getElementById('speed').innerText = caudio.playbackRate + 'x';
        const mediaAlbumArt = 'https://images1-focus-opensocial.googleusercontent.com/gadgets/proxy?url=' + encodeURIComponent(closestPost.querySelector('img').src) + '&container=ig';
        navigator.mediaSession.metadata = new MediaMetadata(
        {
            title: h2text,
            artist: closestPost.querySelector('.channel').textContent,
            album: "rssTea",
            artwork: [
            {
                src: closestPost.querySelector('img').src,
            }, ],
        });


        const totalAids = document.querySelectorAll('[data-aid]').length;
        let nextAid = Math.floor(audioElem.getAttribute('aid')) + 1;
        let prevAid = Math.floor(audioElem.getAttribute('aid')) - 1;
        if (nextAid > totalAids - 1)
        {
            nextAid = 0;
        }
        if (prevAid < 0)
        {
            prevAid = totalAids - 1;
        }

        navigator.mediaSession.setActionHandler("play", () =>
        {
            caudio.play();
        });
        navigator.mediaSession.setActionHandler("pause", () =>
        {
            caudio.pause();
        });

        navigator.mediaSession.setActionHandler(
            'nexttrack',
            () =>
            {
                changePlayback(document.querySelector("[aid=\"" + nextAid + "\"]"));
            }
        );
        navigator.mediaSession.setActionHandler(
            'previoustrack',
            () =>
            {
                changePlayback(document.querySelector("[aid=\"" + prevAid + "\"]"));
            }
        );
        navigator.mediaSession.setActionHandler('seekbackward', (details) =>
        {
            caudio.currentTime = caudio.currentTime - (details.seekOffset || 10);
            updatePositionState();
        });
        navigator.mediaSession.setActionHandler('seekforward', (details) =>
        {
            caudio.currentTime = caudio.currentTime + (details.seekOffset || 10);
            updatePositionState();
        });

    }


});

const deviceWidth = screen.width;
const deviceHeight = screen.height;
const pixelRatio = window.devicePixelRatio || 1;

const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d');

canvas.width = deviceWidth * pixelRatio;
canvas.height = deviceHeight * pixelRatio;

ctx.fillStyle = 'white';
if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches)
{
    ctx.fillStyle = 'black';

}

ctx.fillRect(0, 0, canvas.width, canvas.height);
const iconImage = new Image();
iconImage.src = '../img/apple-touch-icon.png';

iconImage.onload = function ()
{
    const x = (canvas.width - iconImage.width) / 2;
    const y = (canvas.height - iconImage.height) / 2;

    ctx.drawImage(iconImage, x, y);

    const imageDataURL = canvas.toDataURL('image/png');

    const appleTouchStartupImageLink = document.createElement('link');
    appleTouchStartupImageLink.setAttribute('rel', 'apple-touch-startup-image');
    appleTouchStartupImageLink.setAttribute('href', imageDataURL);
    document.head.appendChild(appleTouchStartupImageLink);
};

// --- 返回顶部按钮逻辑 ---
document.addEventListener('DOMContentLoaded', () => {
    const backTopContainer = document.getElementById('back-top-container');
    const backTopMain = document.getElementById('back-top-main');
    const progressCircle = document.getElementById('progress-ring-circle');

    if (!backTopContainer || !backTopMain || !progressCircle) {
        console.error("Back to top button elements not found.");
        return;
    }

    const radius = 42;
    const circumference = 2 * Math.PI * radius;

    // 初始化圆形进度条
    progressCircle.style.strokeDasharray = `${circumference}`;
    progressCircle.style.strokeDashoffset = circumference;

    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: "smooth",
        });
    };

    // 节流函数，优化滚动性能
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
        const { scrollY, innerHeight } = window;
        const { scrollHeight } = document.documentElement;
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

    // 初始化时检查一次滚动位置
    handleScroll();
});
