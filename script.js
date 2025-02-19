document.addEventListener('DOMContentLoaded', () => {
    const menuButton = document.querySelector('.menu-button');
    const navOverlay = document.querySelector('.nav-overlay');
    const body = document.body;

    // Toggle menu
    menuButton.addEventListener('click', () => {
        body.classList.toggle('nav-active');
    });

    // Close menu when clicking overlay
    navOverlay.addEventListener('click', () => {
        body.classList.remove('nav-active');
    });

    // Close menu when pressing escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            body.classList.remove('nav-active');
        }
    });
}); 