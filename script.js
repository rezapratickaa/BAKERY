// ==========================================
// Modular Component Loader
// ==========================================

// Fungsi manual untuk memuat komponen ke elemen tertentu
function loadComponent(targetSelector, filePath) {
    fetch(filePath)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Gagal memuat ${filePath} (Status: ${response.status})`);
            }
            return response.text();
        })
        .then(html => {
            const target = document.querySelector(targetSelector);
            if (!target) return;

            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            const componentElement = doc.querySelector('nav') || doc.body.firstElementChild;

            if (componentElement) {
                // Mengganti placeholder langsung dengan elemen komponen agar struktur DOM rapi dan sticky navbar bekerja optimal
                target.replaceWith(componentElement);
            } else {
                target.innerHTML = html;
            }
        })
        .catch(err => console.error(err));
}

// Otomatis memuat semua elemen yang memiliki atribut data-component
// Contoh: <div data-component="component/navbar.html"></div>
function autoLoadComponents() {
    const elements = document.querySelectorAll('[data-component]');
    elements.forEach(el => {
        const componentPath = el.getAttribute('data-component');
        loadComponent(`[data-component="${componentPath}"]`, componentPath);
    });
}

// Jalankan saat halaman selesai dimuat
document.addEventListener('DOMContentLoaded', () => {
    // 1. Otomatis deteksi atribut data-component
    autoLoadComponents();

    // 2. Dukungan jika memakai <div id="navbar"></div>
    if (document.getElementById('navbar') && !document.querySelector('[data-component*="navbar"]')) {
        loadComponent('#navbar', 'component/navbar.html');
    }
});
