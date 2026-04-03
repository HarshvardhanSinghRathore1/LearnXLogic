document.addEventListener('DOMContentLoaded', () => {
    // Theme Toggle Logic (Light/Dark Mode)
    const themeToggleBtn = document.getElementById('themeToggle');
    
    // Check local storage for preference
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        document.documentElement.setAttribute('data-theme', savedTheme);
        updateThemeIcon(savedTheme);
    } else {
        // Defaults to Light Theme unless OS specifies otherwise
        const prefersDarkMenu = window.matchMedia('(prefers-color-scheme: dark)').matches;
        if(prefersDarkMenu) {
            document.documentElement.setAttribute('data-theme', 'dark');
            updateThemeIcon('dark');
        }
    }

    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', () => {
            const currentTheme = document.documentElement.getAttribute('data-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            
            document.documentElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
            
            updateThemeIcon(newTheme);
        });
    }

    function updateThemeIcon(theme) {
        if (!themeToggleBtn) return;
        themeToggleBtn.innerText = theme === 'dark' ? '☀️' : '🌙';
    }

    // --- NEW NAVBAR FUNCTIONALITY ---
    // 1. Handle Mobile Hamburger Menu
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const navMenu = document.getElementById('navMenu');
    
    if (mobileMenuBtn && navMenu) {
        mobileMenuBtn.addEventListener('click', () => {
            navMenu.classList.toggle('show');
        });
    }

    // 2. Automatically Highlight Active Nav Link
    const navLinks = document.querySelectorAll('.nav-link');
    const currentPath = window.location.pathname.split('/').pop();
    
    navLinks.forEach(link => {
        const linkPath = link.getAttribute('href');
        // Treat dashboard as 'Home' root active state if the path is empty
        if (currentPath === linkPath || (currentPath === '' && linkPath === 'dashboard.html')) {
            link.classList.add('active');
        }
    });
});
