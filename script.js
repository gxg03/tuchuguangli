// ---------- 存储键名 ----------
const STORAGE_USERS = "lib_users";
const STORAGE_BOOKS = "lib_books";
const STORAGE_BORROWS = "lib_borrows";
let currentUser = null;

// ---------- 默认图书数据 ----------
const defaultBooks = [
    { id: 1, title: "JavaScript高级程序设计", author: "Nicholas C. Zakas", category: "编程", available: 3, total: 5, coverIcon: "📘", description: "JS经典红宝书，前端必读。" },
    { id: 2, title: "深入理解ES6", author: "Nicholas C. Zakas", category: "编程", available: 2, total: 4, coverIcon: "📕", description: "ES6标准入门与实践。" },
    { id: 3, title: "三体", author: "刘慈欣", category: "科幻", available: 4, total: 5, coverIcon: "🌌", description: "科幻巨作，雨果奖作品。" },
    { id: 4, title: "百年孤独", author: "马尔克斯", category: "文学", available: 1, total: 3, coverIcon: "📖", description: "魔幻现实主义经典。" },
    { id: 5, title: "Vue.js设计与实现", author: "尤雨溪", category: "编程", available: 2, total: 3, coverIcon: "⚡", description: "Vue3源码解析。" },
    { id: 6, title: "CSS权威指南", author: "Eric A. Meyer", category: "前端", available: 1, total: 2, coverIcon: "🎨", description: "CSS进阶必备。" },
    { id: 7, title: "人类简史", author: "尤瓦尔·赫拉利", category: "历史", available: 3, total: 4, coverIcon: "🌍", description: "人类发展史诗。" },
    { id: 8, title: "重构", author: "Martin Fowler", category: "编程", available: 0, total: 2, coverIcon: "🔧", description: "改善代码设计。" },
    { id: 9, title: "解忧杂货店", author: "东野圭吾", category: "小说", available: 2, total: 3, coverIcon: "🏪", description: "治愈系温情小说。" },
    { id: 10, title: "Web性能实战", author: "Jeremy Wagner", category: "前端", available: 1, total: 2, coverIcon: "⚙️", description: "前端性能优化指南。" }
];

// ---------- 初始化本地存储 ----------
function initData() {
    if (!localStorage.getItem(STORAGE_BOOKS)) {
        localStorage.setItem(STORAGE_BOOKS, JSON.stringify(defaultBooks));
    }
    if (!localStorage.getItem(STORAGE_USERS)) {
        const defaultUser = { id: 1, username: "test", password: "123456" };
        localStorage.setItem(STORAGE_USERS, JSON.stringify([defaultUser]));
    }
    if (!localStorage.getItem(STORAGE_BORROWS)) {
        const initBorrow = [{ borrowId: 1001, userId: 1, bookId: 1, bookTitle: "JavaScript高级程序设计", borrowDate: "2026-04-01", dueDate: "2026-04-16", status: "borrowed", renewCount: 0 }];
        localStorage.setItem(STORAGE_BORROWS, JSON.stringify(initBorrow));
        let books = JSON.parse(localStorage.getItem(STORAGE_BOOKS));
        const targetBook = books.find(b => b.id === 1);
        if(targetBook && targetBook.available > 0) targetBook.available -= 1;
        localStorage.setItem(STORAGE_BOOKS, JSON.stringify(books));
    }
}

function getBooks() { return JSON.parse(localStorage.getItem(STORAGE_BOOKS)); }
function saveBooks(books) { localStorage.setItem(STORAGE_BOOKS, JSON.stringify(books)); }
function getUsers() { return JSON.parse(localStorage.getItem(STORAGE_USERS)); }
function saveUsers(users) { localStorage.setItem(STORAGE_USERS, JSON.stringify(users)); }
function getBorrows() { return JSON.parse(localStorage.getItem(STORAGE_BORROWS)); }
function saveBorrows(borrows) { localStorage.setItem(STORAGE_BORROWS, JSON.stringify(borrows)); }

// ---------- UI 辅助 ----------
function showToast(msg, isError = false) {
    const toast = document.getElementById("toastMsg");
    toast.textContent = msg;
    toast.style.backgroundColor = isError ? "#b91c1c" : "#0f3b2c";
    toast.style.opacity = "1";
    setTimeout(() => { toast.style.opacity = "0"; }, 2500);
}

function showModal(contentHtml) {
    const modal = document.getElementById("modal");
    document.getElementById("modalContent").innerHTML = contentHtml;
    modal.style.display = "flex";
    modal.onclick = (e) => { if(e.target === modal) modal.style.display = "none"; };
    const closeBtn = document.querySelector("#modalContent .close-modal-btn");
    if(closeBtn) closeBtn.onclick = () => modal.style.display = "none";
}

function escapeHtml(str) { if(!str) return ''; return str.replace(/[&<>]/g, function(m){if(m==='&') return '&amp;';if(m==='<') return '&lt;';if(m==='>') return '&gt;';return m;}); }

// ---------- 图书列表相关 ----------
let currentPage = 1;
let currentFilteredBooks = [];
const pageSize = 6;

function filterBooks() {
    let books = getBooks();
    const titleKw = document.getElementById("searchTitle")?.value.toLowerCase() || "";
    const authorKw = document.getElementById("searchAuthor")?.value.toLowerCase() || "";
    const category = document.getElementById("searchCategory")?.value || "";
    let filtered = books.filter(b => 
        (titleKw === "" || b.title.toLowerCase().includes(titleKw)) &&
        (authorKw === "" || b.author.toLowerCase().includes(authorKw)) &&
        (category === "" || b.category === category)
    );
    currentFilteredBooks = filtered;
    currentPage = 1;
    renderBooks();
    renderPagination();
}

function renderBooks() {
    const container = document.getElementById("booksContainer");
    if(!container) return;
    const start = (currentPage-1)*pageSize;
    const pageBooks = currentFilteredBooks.slice(start, start+pageSize);
    if(pageBooks.length === 0) { container.innerHTML = "<div style='padding:40px;text-align:center'>📭 暂无图书</div>"; return; }
    container.innerHTML = pageBooks.map(book => `
        <div class="book-card">
            <div class="book-cover">${book.coverIcon || "📚"}</div>
            <div class="book-info">
                <div class="book-title">${escapeHtml(book.title)}</div>
                <div class="book-author">✍️ ${escapeHtml(book.author)}</div>
                <div class="book-category">🏷️ ${escapeHtml(book.category)}</div>
                <div class="book-stock">📌 可借: ${book.available} / ${book.total}</div>
                <div class="card-actions">
                    <button class="small-btn btn-detail" data-id="${book.id}">详情</button>
                    ${book.available > 0 ? `<button class="small-btn btn-borrow" data-id="${book.id}">借阅</button>` : `<button disabled style="background:#e2e8f0;" class="small-btn">暂不可借</button>`}
                </div>
            </div>
        </div>
    `).join("");
    document.querySelectorAll(".btn-detail").forEach(btn => btn.addEventListener("click", (e) => { const id = parseInt(btn.dataset.id); showBookDetail(id); }));
    document.querySelectorAll(".btn-borrow").forEach(btn => btn.addEventListener("click", (e) => { const id = parseInt(btn.dataset.id); borrowBookById(id); }));
}

function renderPagination() {
    const total = currentFilteredBooks.length;
    const totalPages = Math.ceil(total/pageSize);
    const container = document.getElementById("paginationContainer");
    if(!container) return;
    if(totalPages <= 1) { container.innerHTML = ""; return; }
    let html = "";
    for(let i=1;i<=totalPages;i++) {
        html += `<div class="page-item ${i===currentPage ? 'active-page':''}" data-page="${i}">${i}</div>`;
    }
    container.innerHTML = html;
    document.querySelectorAll(".page-item").forEach(el => {
        el.addEventListener("click", (e) => { currentPage = parseInt(el.dataset.page); renderBooks(); renderPagination(); });
    });
}

function showBookDetail(bookId) {
    const book = getBooks().find(b=>b.id === bookId);
    if(!book) return;
    const content = `
        <h3>📖 ${escapeHtml(book.title)}</h3><hr>
        <p><strong>作者：</strong>${escapeHtml(book.author)}</p>
        <p><strong>分类：</strong>${escapeHtml(book.category)}</p>
        <p><strong>简介：</strong>${escapeHtml(book.description || "暂无简介")}</p>
        <p><strong>可借数量：</strong>${book.available} / ${book.total}</p>
        ${book.available>0 ? `<button id="modalBorrowBtn" class="btn btn-primary" style="margin-top:16px;">📘 借阅此书</button>` : `<button disabled class="btn-outline">已无库存</button>`}
        <button class="btn-outline close-modal-btn" style="margin-top:12px;">关闭</button>
    `;
    showModal(content);
    setTimeout(() => {
        const borrowBtn = document.getElementById("modalBorrowBtn");
        if(borrowBtn) borrowBtn.onclick = () => { borrowBookById(bookId); document.getElementById("modal").style.display = "none"; };
    }, 50);
}

// 借阅
function borrowBookById(bookId) {
    if(!currentUser) { showToast("请先登录", true); return; }
    let books = getBooks();
    const book = books.find(b=>b.id === bookId);
    if(!book || book.available <= 0) { showToast("该书已无库存", true); return; }
    const borrows = getBorrows();
    const alreadyBorrow = borrows.find(b => b.userId === currentUser.id && b.bookId === bookId && b.status === "borrowed");
    if(alreadyBorrow) { showToast("您已经借阅过此书，尚未归还", true); return; }
    book.available -= 1;
    saveBooks(books);
    const newBorrow = {
        borrowId: Date.now(),
        userId: currentUser.id,
        bookId: book.id,
        bookTitle: book.title,
        borrowDate: new Date().toISOString().slice(0,10),
        dueDate: new Date(Date.now() + 14*86400000).toISOString().slice(0,10),
        status: "borrowed",
        renewCount: 0
    };
    borrows.push(newBorrow);
    saveBorrows(borrows);
    showToast(`《${book.title}》借阅成功！应还日期: ${newBorrow.dueDate}`);
    if(document.getElementById("booksPanel").classList.contains("active-panel")) filterBooks();
    if(document.getElementById("borrowPanel").classList.contains("active-panel")) renderBorrowRecords();
}

// 归还 & 续借
function returnBook(borrowId, bookId) {
    let borrows = getBorrows();
    const borrowIndex = borrows.findIndex(b => b.borrowId === borrowId);
    if(borrowIndex === -1 || borrows[borrowIndex].status === "returned") return;
    borrows[borrowIndex].status = "returned";
    saveBorrows(borrows);
    let books = getBooks();
    const book = books.find(b=>b.id === bookId);
    if(book) { book.available += 1; saveBooks(books); }
    showToast("归还成功");
    renderBorrowRecords();
    if(document.getElementById("booksPanel").classList.contains("active-panel")) filterBooks();
}

function renewBook(borrowId) {
    let borrows = getBorrows();
    const borrow = borrows.find(b => b.borrowId === borrowId);
    if(!borrow || borrow.status !== "borrowed") { showToast("无法续借",true); return; }
    if(borrow.renewCount >= 1) { showToast("每本书仅可续借一次",true); return; }
    const newDue = new Date(Date.now() + 15*86400000).toISOString().slice(0,10);
    borrow.dueDate = newDue;
    borrow.renewCount = 1;
    saveBorrows(borrows);
    showToast(`续借成功，新应还日期: ${newDue}`);
    renderBorrowRecords();
}

// 我的借阅记录渲染
function renderBorrowRecords() {
    if(!currentUser) return;
    const borrows = getBorrows();
    const myBorrows = borrows.filter(b => b.userId === currentUser.id);
    const tbody = document.getElementById("borrowRecordsTbody");
    if(myBorrows.length === 0) { tbody.innerHTML = "<tr><td colspan='5' style='text-align:center'>暂无借阅记录</td></tr>"; return; }
    tbody.innerHTML = myBorrows.map(borrow => `
        <tr>
            <td>${escapeHtml(borrow.bookTitle)}</td>
            <td>${borrow.borrowDate}</td>
            <td>${borrow.dueDate}</td>
            <td>${borrow.status === 'borrowed' ? '📖 借阅中' : '✅ 已归还'}</td>
            <td class="action-btns">
                ${borrow.status === 'borrowed' ? `<button class="renew-btn" data-borrowid="${borrow.borrowId}">续借</button><button class="return-btn" data-borrowid="${borrow.borrowId}" data-bookid="${borrow.bookId}">归还</button>` : '--'}
            </td>
        </tr>
    `).join("");
    document.querySelectorAll(".renew-btn").forEach(btn => btn.addEventListener("click", (e) => { const bid = parseInt(btn.dataset.borrowid); renewBook(bid); }));
    document.querySelectorAll(".return-btn").forEach(btn => btn.addEventListener("click", (e) => { const bid = parseInt(btn.dataset.borrowid); const bookid = parseInt(btn.dataset.bookid); returnBook(bid, bookid); }));
}

// 分类下拉填充
function fillCategoryOptions() {
    const books = getBooks();
    const cats = [...new Set(books.map(b=>b.category))];
    const select = document.getElementById("searchCategory");
    if(select) {
        select.innerHTML = '<option value="">全部分类</option>' + cats.map(c => `<option value="${c}">${c}</option>`).join("");
    }
}

// 切换面板
function switchTab(tabId) {
    document.querySelectorAll(".panel").forEach(p => p.classList.remove("active-panel"));
    document.querySelectorAll(".tab-btn").forEach(btn => btn.classList.remove("active"));
    if(tabId === "booksTab") {
        document.getElementById("booksPanel").classList.add("active-panel");
        document.querySelector("[data-tab='booksTab']").classList.add("active");
        filterBooks();
    } else {
        document.getElementById("borrowPanel").classList.add("active-panel");
        document.querySelector("[data-tab='borrowTab']").classList.add("active");
        renderBorrowRecords();
    }
}

// 登录注册逻辑
function login(username, pwd) {
    const users = getUsers();
    const user = users.find(u => u.username === username && u.password === pwd);
    if(user) {
        currentUser = { id: user.id, username: user.username };
        sessionStorage.setItem("curUser", JSON.stringify(currentUser));
        document.getElementById("authView").style.display = "none";
        document.getElementById("mainView").style.display = "block";
        document.getElementById("currentUserSpan").innerText = currentUser.username;
        fillCategoryOptions();
        filterBooks();
        renderBorrowRecords();
        showToast(`欢迎回来，${username}`);
        return true;
    } else { showToast("用户名或密码错误", true); return false; }
}

function register(username, pwd, confirm) {
    if(username.length<3 || !/^[a-zA-Z0-9\u4e00-\u9fa5]{3,12}$/.test(username)) { showToast("用户名需3~12位字母数字汉字",true); return false; }
    if(pwd.length < 6) { showToast("密码至少6位",true); return false; }
    if(pwd !== confirm) { showToast("两次密码不一致",true); return false; }
    const users = getUsers();
    if(users.find(u=>u.username===username)) { showToast("用户名已存在",true); return false; }
    const newId = users.length+1;
    const newUser = { id: newId, username, password: pwd };
    users.push(newUser);
    saveUsers(users);
    showToast("注册成功，请登录");
    return true;
}

function logout() {
    currentUser = null;
    sessionStorage.removeItem("curUser");
    document.getElementById("authView").style.display = "flex";
    document.getElementById("mainView").style.display = "none";
    document.getElementById("loginUsername").value = "";
    document.getElementById("loginPassword").value = "";
    showToast("已退出登录");
}

// ---------- 页面启动与事件绑定 ----------
document.addEventListener("DOMContentLoaded", () => {
    initData();
    const saved = sessionStorage.getItem("curUser");
    if(saved) {
        try{ currentUser = JSON.parse(saved); 
            document.getElementById("authView").style.display = "none";
            document.getElementById("mainView").style.display = "block";
            document.getElementById("currentUserSpan").innerText = currentUser.username;
            fillCategoryOptions(); filterBooks(); renderBorrowRecords();
        } catch(e){}
    }
    // 登录/注册UI切换
    document.getElementById("showRegBtn")?.addEventListener("click",()=>{document.getElementById("loginForm").style.display="none";document.getElementById("regForm").style.display="block";});
    document.getElementById("showLoginBtn")?.addEventListener("click",()=>{document.getElementById("loginForm").style.display="block";document.getElementById("regForm").style.display="none";});
    document.getElementById("doLoginBtn")?.addEventListener("click",()=>{const u=document.getElementById("loginUsername").value,p=document.getElementById("loginPassword").value; if(u&&p) login(u,p); else showToast("请输入完整",true);});
    document.getElementById("doRegBtn")?.addEventListener("click",()=>{const u=document.getElementById("regUsername").value,p=document.getElementById("regPassword").value,c=document.getElementById("regConfirmPwd").value; if(register(u,p,c)){document.getElementById("loginForm").style.display="block";document.getElementById("regForm").style.display="none";}});
    document.getElementById("logoutBtn")?.addEventListener("click",logout);
    document.querySelectorAll(".tab-btn").forEach(btn=>btn.addEventListener("click",(e)=>switchTab(btn.dataset.tab)));
    document.getElementById("searchBtn")?.addEventListener("click",filterBooks);
    document.getElementById("resetSearchBtn")?.addEventListener("click",()=>{ document.getElementById("searchTitle").value=""; document.getElementById("searchAuthor").value=""; document.getElementById("searchCategory").value=""; filterBooks(); });
});