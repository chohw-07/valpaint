// 이 스크립트를 <head> 태그의 마지막 부분에 추가하세요

// 페이지 로드 시 실행
document.addEventListener('DOMContentLoaded', function() {
    // 모든 인라인 이벤트 속성 제거 및 이벤트 리스너로 대체
    replaceInlineEvents();
    
    // 접근성 개선
    enhanceAccessibility();
    
    // 초기화 프로세스 시작
    initialize();
});

// 인라인 이벤트 속성 제거 및 이벤트 리스너로 대체
function replaceInlineEvents() {
    // 로그인 폼
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.removeAttribute('onsubmit');
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            handleLogin(e);
        });
    }
    
    // 비회원 모드 버튼
    const guestBtn = document.querySelector('.guest-button button');
    if (guestBtn) {
        guestBtn.removeAttribute('onclick');
        guestBtn.addEventListener('click', function() {
            enableGuestMode();
        });
    }
    
    // 모달 닫기 버튼들
    document.querySelectorAll('.modal-close').forEach(btn => {
        btn.removeAttribute('onclick');
        btn.addEventListener('click', function() {
            const modal = this.closest('.modal');
            if (modal) {
                hideModal(modal);
            }
        });
    });
}

// 접근성 개선
function enhanceAccessibility() {
    // 모든 사용자명 필드에 autocomplete 속성 추가
    const usernameFields = ['loginUsername', 'accountUsername'];
    usernameFields.forEach(id => {
        const field = document.getElementById(id);
        if (field) {
            field.setAttribute('autocomplete', 'username');
        }
    });
    
    // 모든 비밀번호 필드에 적절한 autocomplete 속성 추가
    const currentPasswordFields = ['loginPassword', 'accountCurrentPassword', 'deleteConfirmPassword'];
    currentPasswordFields.forEach(id => {
        const field = document.getElementById(id);
        if (field) {
            field.setAttribute('autocomplete', 'current-password');
            field.setAttribute('aria-required', 'true');
        }
    });
    
    // 새 비밀번호 필드
    const newPasswordField = document.getElementById('accountNewPassword');
    if (newPasswordField) {
        newPasswordField.setAttribute('autocomplete', 'new-password');
    }
    
    // 계정 삭제 폼에 숨겨진 사용자명 필드 추가
    const deleteAccountForm = document.getElementById('delete-account-form');
    if (deleteAccountForm && !deleteAccountForm.querySelector('input[name="username"]')) {
        const hiddenUsername = document.createElement('div');
        hiddenUsername.style.cssText = 'position: absolute; left: -9999px; top: -9999px; width: 1px; height: 1px; overflow: hidden;';
        
        const username = localStorage.getItem('valpaint_username') || '';
        hiddenUsername.innerHTML = `
            <label for="deleteHiddenUsername">사용자명</label>
            <input type="text" id="deleteHiddenUsername" name="username" autocomplete="username" value="${username}">
        `;
        
        deleteAccountForm.prepend(hiddenUsername);
    }
}

// 모달 숨기기 함수
function hideModal(modal) {
    if (!modal) return;
    
    modal.classList.remove('show');
    setTimeout(() => {
        modal.style.display = 'none';
    }, 300);
}

// 모달 표시 함수
function showModal(modal) {
    if (!modal) return;
    
    modal.style.display = 'flex';
    setTimeout(() => {
        modal.classList.add('show');
    }, 10);
}

// 인증 모달 표시
function showAuthModal() {
    const authModal = document.getElementById('auth-modal');
    if (authModal) {
        showModal(authModal);
    }
}

// 비회원 모드 활성화
function enableGuestMode() {
    const userDisplay = document.getElementById('userDisplayName');
    if (userDisplay) userDisplay.textContent = '비회원';
    
    // 상태 업데이트
    window.appState = window.appState || {};
    window.appState.isGuestMode = true;
    window.appState.isAuthenticated = false;
    
    // 비회원 모드 배너 표시
    const guestBanner = document.getElementById('guest-mode-banner');
    if (guestBanner) guestBanner.style.display = 'flex';
    
    // 인증 모달 닫기
    const authModal = document.getElementById('auth-modal');
    if (authModal) {
        hideModal(authModal);
    }
    
    // 앱 시작
    if (typeof startApp === 'function') {
        startApp();
    } else {
        console.error('startApp 함수를 찾을 수 없습니다');
        // 대체 방안: 페이지 새로고침
        setTimeout(() => location.reload(), 1000);
    }
}

// 로그인 처리
async function handleLogin(event) {
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }
    
    // 로딩 상태 표시
    const loginBtn = document.querySelector('#login-form button[type="submit"]');
    let originalBtnText = '';
    
    if (loginBtn) {
        if (loginBtn.disabled) return; // 이미 처리 중
        
        originalBtnText = loginBtn.innerHTML;
        loginBtn.disabled = true;
        loginBtn.innerHTML = '<span style="display: inline-block; width: 16px; height: 16px; border: 2px solid #fff; border-radius: 50%; border-top-color: transparent; animation: spin 1s linear infinite;"></span> 로그인 중...';
    }
    
    // 입력값 가져오기
    const usernameField = document.getElementById('loginUsername');
    const passwordField = document.getElementById('loginPassword');
    
    if (!usernameField || !passwordField) {
        console.error('로그인 필드를 찾을 수 없습니다');
        return;
    }
    
    const username = usernameField.value.trim();
    const password = passwordField.value;
    
    if (!username || !password) {
        showToast('사용자명과 비밀번호를 입력해주세요', 'error');
        
        // 버튼 상태 복원
        if (loginBtn) {
            loginBtn.disabled = false;
            loginBtn.innerHTML = originalBtnText;
        }
        return;
    }
    
    try {
        // 로그인 처리
        if (typeof window.api !== 'undefined' && typeof window.api.loginUser === 'function') {
            const result = await window.api.loginUser(username, password);
            
            if (result.success) {
                showToast(`${username}님, 환영합니다!`, 'success');
                
                // 인증 모달 닫기
                const authModal = document.getElementById('auth-modal');
                if (authModal) {
                    hideModal(authModal);
                }
                
                // 앱 시작
                if (typeof startApp === 'function') {
                    startApp();
                } else {
                    console.warn('startApp 함수를 찾을 수 없습니다');
                    location.reload(); // 대안: 페이지 새로고침
                }
            } else {
                showToast(result.message || '로그인에 실패했습니다', 'error');
                
                // 버튼 상태 복원
                if (loginBtn) {
                    loginBtn.disabled = false;
                    loginBtn.innerHTML = originalBtnText;
                }
            }
        } else {
            // 간단한 대체 로그인 로직 (API가 없는 경우)
            console.warn('API 객체를 찾을 수 없어 간단한 로그인 시뮬레이션을 수행합니다');
            localStorage.setItem('valpaint_username', username);
            localStorage.setItem('valpaint_auth_token', 'simulated_token');
            
            // 인증 모달 닫기
            const authModal = document.getElementById('auth-modal');
            if (authModal) {
                hideModal(authModal);
            }
            
            showToast(`${username}님, 환영합니다!`, 'success');
            location.reload(); // 페이지 새로고침
        }
    } catch (error) {
        console.error('로그인 오류:', error);
        showToast(error.message || '로그인 중 오류가 발생했습니다', 'error');
        
        // 버튼 상태 복원
        if (loginBtn) {
            loginBtn.disabled = false;
            loginBtn.innerHTML = originalBtnText;
        }
    }
}

// 토스트 메시지 표시
function showToast(message, type = 'info', duration = 4000) {
    if (!message) return;
    
    let toastContainer = document.getElementById('toast-container');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toast-container';
        toastContainer.style.position = 'fixed';
        toastContainer.style.bottom = '20px';
        toastContainer.style.right = '20px';
        toastContainer.style.zIndex = '9999';
        document.body.appendChild(toastContainer);
    }
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.style.cssText = `
        padding: 12px 20px;
        margin-bottom: 10px;
        border-radius: 4px;
        box-shadow: 0 3px 10px rgba(0, 0, 0, 0.3);
        color: white;
        font-family: 'VALORANT', sans-serif;
        letter-spacing: 1px;
        max-width: 350px;
        position: relative;
        overflow: hidden;
        background-color: rgba(15, 25, 35, 0.95);
        border-left: 4px solid ${type === 'error' ? '#ff4655' : type === 'success' ? '#00c853' : '#1e90ff'};
        animation: toastIn 0.3s, toastOut 0.3s 2.7s forwards;
    `;
    
    toast.textContent = message;
    toastContainer.appendChild(toast);
    
    setTimeout(() => {
        if (toast.parentNode) {
            toast.remove();
        }
    }, duration);
}

// 초기화 함수
function initialize() {
    // 로딩 화면을 표시
    const loadingScreen = document.getElementById('loading-screen');
    if (loadingScreen) {
        loadingScreen.style.display = 'flex';
    }
    
    try {
        // 사용자 정보 확인
        const username = localStorage.getItem('valpaint_username');
        const token = localStorage.getItem('valpaint_auth_token');
        
        if (username && token) {
            // 이미 로그인된 상태면 바로 시작
            const userDisplay = document.getElementById('userDisplayName');
            if (userDisplay) {
                userDisplay.textContent = username;
            }
            
            // 로딩 화면 숨기기
            if (loadingScreen) {
                loadingScreen.style.display = 'none';
            }
            
            // 앱 시작
            if (typeof startApp === 'function') {
                startApp();
            } else {
                console.warn('startApp 함수를 찾을 수 없습니다');
            }
        } else {
            // 로그인 상태가 아니면 1초 후 인증 모달 표시
            setTimeout(() => {
                if (loadingScreen) {
                    loadingScreen.style.display = 'none';
                }
                
                showAuthModal();
            }, 1000);
        }
    } catch (error) {
        console.error('초기화 오류:', error);
        
        // 로딩 화면 숨기기
        if (loadingScreen) {
            loadingScreen.style.display = 'none';
        }
        
        // 오류 메시지 표시
        showToast('앱 초기화 중 오류가 발생했습니다', 'error');
    }
}

// VALORANT 폰트 로드 확인
function ensureFontLoaded() {
    try {
        if (document.fonts && document.fonts.check) {
            if (document.fonts.check('12px VALORANT')) {
                // 폰트가 이미 로드됨
                applyFontToElements();
            } else {
                // 폰트 로드 대기
                document.fonts.ready.then(() => {
                    applyFontToElements();
                });
            }
        } else {
            // 폰트 API를 지원하지 않는 브라우저
            setTimeout(applyFontToElements, 1000);
        }
    } catch (error) {
        console.error('폰트 로드 오류:', error);
    }
}

// VALORANT 폰트 적용
function applyFontToElements() {
    const elements = document.querySelectorAll('.valorant-text');
    elements.forEach(el => {
        el.style.opacity = '1';
    });
}
