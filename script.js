let currentLoggedUser = null;
let currentChatTarget = null;
let authMode = 'login'; // حالت پیشفرض: ورود

// لود وضعیت پلتفرم
window.addEventListener('DOMContentLoaded', () => {
    // ایجاد اکانت پیشفرض ادمین در سیستم در صورت عدم وجود
    let userDatabase = JSON.parse(localStorage.getItem('system_users_db') || '[]');
    if (!userDatabase.find(u => u.username === 'admin')) {
        userDatabase.push({ firstName: "مدیر", lastName: "سیستم", username: "admin", password: "123" });
        localStorage.setItem('system_users_db', JSON.stringify(userDatabase));
    }

    const savedUser = localStorage.getItem('active_messenger_user');
    if (savedUser) {
        currentLoggedUser = savedUser;
        routingInterface();
    } else {
        showAuthInterface();
    }
});

// مدیریت وضعیت سوییچ بین تب ورود و ثبت نام
function toggleAuthMode(mode) {
    authMode = mode;
    document.getElementById('tabLoginBtn').classList.toggle('active', mode === 'login');
    document.getElementById('tabRegisterBtn').classList.toggle('active', mode === 'register');
    document.getElementById('authTitle').innerText = mode === 'login' ? '🔐 ورود به حساب کاربری' : '📝 ثبت‌نام حساب جدید';
    document.getElementById('btnSubmitAuth').innerText = mode === 'login' ? 'ورود به حساب 🚀' : 'ایجاد حساب و ورود ✨';
    
    // نمایش فیلدهای نام و فامیل فقط در ثبت نام
    document.querySelectorAll('.id-reg-only').forEach(el => {
        el.style.display = mode === 'register' ? 'block' : 'none';
    });
}

// هندل کردن فرآیند دکمه ثبت نام یا ورود
function handleAuthSubmit() {
    const userDb = JSON.parse(localStorage.getItem('system_users_db') || '[]');
    const username = document.getElementById('authUsername').value.trim().toLowerCase();
    const password = document.getElementById('authPassword').value.trim();
    
    if (!username || !password) {
        alert("لطفاً نام کاربری و رمز عبور را وارد کنید.");
        return;
    }

    if (authMode === 'register') {
        const firstName = document.getElementById('authFirstName').value.trim();
        const lastName = document.getElementById('authLastName').value.trim();
        
        if (!firstName || !lastName) {
            alert("لطفاً نام و نام خانوادگی خود را تکمیل کنید.");
            return;
        }
        if (userDb.find(u => u.username === username)) {
            alert("این نام کاربری از قبل وجود دارد.");
            return;
        }

        // ذخیره کاربر جدید
        userDb.push({ firstName, lastName, username, password });
        localStorage.setItem('system_users_db', JSON.stringify(userDb));
        alert("ثبت نام با موفقیت انجام شد!");
    } else {
        // فرآیند چک کردن ورود
        const foundUser = userDb.find(u => u.username === username && u.password === password);
        if (!foundUser) {
            alert("نام کاربری یا رمز عبور اشتباه است.");
            return;
        }
    }

    currentLoggedUser = username;
    localStorage.setItem('active_messenger_user', username);
    routingInterface();
}

// روتینگ هوشمند: تفکیک ادمین از کاربر عادی
function routingInterface() {
    document.getElementById('pageAuth').style.display = 'none';
    document.getElementById('globalLogoutBtn').style.display = 'block';
    
    if (currentLoggedUser === 'admin') {
        // هدایت مستقیم به پنل ادمین
        document.getElementById('pageAdminMenu').style.display = 'block';
        document.getElementById('pageMainMenu').style.display = 'none';
        document.getElementById('adminBadge').style.display = 'inline-block';
        document.getElementById('userBadge').innerText = `🛠️ ادمین کل`;
        renderAdminLogs();
    } else {
        // هدایت به منوی خدمات کاربر عادی
        document.getElementById('pageMainMenu').style.display = 'block';
        document.getElementById('pageAdminMenu').style.display = 'none';
        document.getElementById('adminBadge').style.display = 'none';
        document.getElementById('userBadge').innerText = `👤 ${currentLoggedUser}`;
    }

    // به‌روزرسانی متن خوش‌آمدگویی هوش مصنوعی بر اساس نام کاربر
    updateBotWelcomeMessage();
}

function showAuthInterface() {
    document.getElementById('pageAuth').style.display = 'block';
    document.getElementById('pageMainMenu').style.display = 'none';
    document.getElementById('pageAdminMenu').style.display = 'none';
    document.getElementById('serviceMessenger').style.display = 'none';
    document.getElementById('serviceAnonymous').style.display = 'none';
    document.getElementById('globalLogoutBtn').style.display = 'none';
    document.getElementById('adminBadge').style.display = 'none';
    document.getElementById('userBadge').innerText = "بازدیدکننده";
    
    // پاک کردن فرم‌ها
    document.getElementById('authUsername').value = '';
    document.getElementById('authPassword').value = '';
    document.getElementById('authFirstName').value = '';
    document.getElementById('authLastName').value = '';

    // بازگرداندن ربات به حالت پیشفرض (مهمان)
    updateBotWelcomeMessage();
}

function logoutSystem() {
    localStorage.removeItem('active_messenger_user');
    currentLoggedUser = null;
    currentChatTarget = null;
    showAuthInterface();
}

function openService(serviceName) {
    document.getElementById('pageMainMenu').style.display = 'none';
    if (serviceName === 'messenger') {
        document.getElementById('serviceMessenger').style.display = 'block';
        loadP2PChatMessages();
    } else if (serviceName === 'anonymous') {
        document.getElementById('serviceAnonymous').style.display = 'block';
    }
}

function backToMainMenu() {
    routingInterface();
}

// رندر کردن دیتای پنل ادمین
function renderAdminLogs() {
    const userListContainer = document.getElementById('adminUserList');
    const chatLogContainer = document.getElementById('adminGlobalChatLogs');
    
    const users = JSON.parse(localStorage.getItem('system_users_db') || '[]');
    const chats = JSON.parse(localStorage.getItem('p2p_messenger_data') || '[]');
    
    userListContainer.innerHTML = users.map(u => `
        <div class="admin-user-item">
            <span>${u.firstName} ${u.lastName}</span>
            <span style="color:var(--primary)">@${u.username}</span>
        </div>
    `).join('');

    if (chats.length === 0) {
        chatLogContainer.innerHTML = '<div class="anon-system-msg">هیچ گفتگویی در دیتابیس ثبت نشده.</div>';
    } else {
        chatLogContainer.innerHTML = chats.map(c => `
            <div class="admin-chat-item">
                <strong>${c.sender} ➔ ${c.receiver}:</strong> ${c.text} 
                <span style="float:left; font-size:9px; opacity:0.5;">${c.time}</span>
            </div>
        `).join('');
    }
}

// ==========================================
// موتور چت متنی پیام‌رسان چندکاربره
// ==========================================
function startChatWithUser() {
    const targetInput = document.getElementById('searchTargetUser').value.trim().toLowerCase();
    const userDb = JSON.parse(localStorage.getItem('system_users_db') || '[]');
    
    if (!targetInput) return;
    if (targetInput === currentLoggedUser) {
        alert("شما نمی‌توانید با خودتان چت کنید!");
        return;
    }
    if (!userDb.find(u => u.username === targetInput)) {
        alert("چنین نام کاربری در سیستم ثبت‌نام نکرده است!");
        return;
    }
    
    currentChatTarget = targetInput;
    document.getElementById('chattingWithTarget').innerText = targetInput;
    document.getElementById('miniChatInput').disabled = false;
    document.getElementById('miniChatInput').placeholder = `پیام به ${targetInput}...`;
    document.getElementById('miniChatSendBtn').disabled = false;
    loadP2PChatMessages();
}

function loadP2PChatMessages() {
    const streamContainer = document.getElementById('miniChatStream');
    if (!streamContainer || !currentChatTarget) return;
    streamContainer.innerHTML = '';

    let globalMessages = JSON.parse(localStorage.getItem('p2p_messenger_data') || '[]');
    let filtered = globalMessages.filter(msg => 
        (msg.sender === currentLoggedUser && msg.receiver === currentChatTarget) ||
        (msg.sender === currentChatTarget && msg.receiver === currentLoggedUser)
    );

    if (filtered.length === 0) {
        streamContainer.innerHTML = `<div class="anon-system-msg">هیچ پیامی ثبت نشده است. اولین متن را بنویسید.</div>`;
        return;
    }

    filtered.forEach(msg => {
        const bubble = document.createElement('div');
        bubble.className = `mini-msg-bubble ${msg.sender === currentLoggedUser ? 'outgoing' : 'incoming'}`;
        bubble.innerHTML = `<div>${msg.text}</div><span class="mini-msg-time">${msg.time}</span>`;
        streamContainer.appendChild(bubble);
    });
    streamContainer.scrollHeight ? streamContainer.scrollTo({ top: streamContainer.scrollHeight }) : null;
}

function sendMiniChatMessage() {
    const inputEl = document.getElementById('miniChatInput');
    const text = inputEl.value.trim();
    if (!text || !currentChatTarget) return;

    const timeString = new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' });
    let globalMessages = JSON.parse(localStorage.getItem('p2p_messenger_data') || '[]');

    globalMessages.push({ sender: currentLoggedUser, receiver: currentChatTarget, text: text, time: timeString });
    localStorage.setItem('p2p_messenger_data', JSON.stringify(globalMessages));
    inputEl.value = '';
    loadP2PChatMessages();
}

// اتصال اینتر
document.addEventListener('DOMContentLoaded', () => {
    document.body.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && document.activeElement.id === 'miniChatInput') {
            e.preventDefault();
            sendMiniChatMessage();
        }
    });
});

// ==========================================
// ربات دستیار ثابت (سمت چپ) - بخش شخصی‌سازی نام
// ==========================================
function updateBotWelcomeMessage() {
    const container = document.getElementById('chatMessages');
    if (!container) return;

    let welcomeText = "سلام! من دستیار هوشمند تو هستم. چطور می‌توانم کمکت کنم؟";

    if (currentLoggedUser) {
        const userDb = JSON.parse(localStorage.getItem('system_users_db') || '[]');
        const targetAccount = userDb.find(u => u.username === currentLoggedUser);
        
        if (targetAccount && targetAccount.firstName) {
            welcomeText = `سلام ${targetAccount.firstName} جان! من دستیار هوشمند تو هستم. چطور می‌توانم کمکت کنم؟ ✨`;
        }
    }

    // بازنشانی اولین پیام ربات با نام جدید کاربر
    container.innerHTML = `<div class="msg bot-msg">${welcomeText}</div>`;
}

function sendMessage() {
    const input = document.getElementById('chatInput');
    const container = document.getElementById('chatMessages');
    const text = input.value.trim();
    if (!text) return;

    const userDiv = document.createElement('div');
    userDiv.className = 'msg user-msg';
    userDiv.textContent = text;
    container.appendChild(userDiv);
    input.value = '';
    container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });

    setTimeout(() => {
        const botDiv = document.createElement('div');
        botDiv.className = 'msg bot-msg';
        botDiv.textContent = "درخواست شما دریافت شد. سیستم هوش مصنوعی محلی در حال ارتقا است.";
        container.appendChild(botDiv);
        container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
    }, 600);
}
