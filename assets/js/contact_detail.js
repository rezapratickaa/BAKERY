// Contact Detail / My Info Management
document.addEventListener("DOMContentLoaded", function() {
    try {
        const saved = localStorage.getItem('bakery_user');
        if (saved) {
            const u = JSON.parse(saved);
            if (u.user && document.getElementById("accountName")) {
                document.getElementById("accountName").textContent = u.user;
            }
            if (u.email && document.getElementById("accountEmail")) {
                document.getElementById("accountEmail").textContent = u.email;
            }
        }
    } catch(e) {}
});

document.querySelectorAll("[data-field]").forEach(function(button) {
    button.addEventListener("click", function() {
        const field = this.dataset.field;

        if (field === "name") {
            const current = document.getElementById("accountName").textContent;
            const newName = prompt("Masukkan nama baru:", current);

            if (newName !== null && newName.trim() !== "") {
                document.getElementById("accountName").textContent = newName.trim();
                try {
                    const saved = localStorage.getItem('bakery_user');
                    const u = saved ? JSON.parse(saved) : {};
                    u.user = newName.trim();
                    localStorage.setItem('bakery_user', JSON.stringify(u));
                } catch(e) {}
                alert("Nama berhasil diubah.");
            }
        }

        if (field === "email") {
            const current = document.getElementById("accountEmail").textContent;
            const newEmail = prompt("Masukkan email baru:", current);

            if (newEmail !== null && newEmail.includes("@")) {
                document.getElementById("accountEmail").textContent = newEmail.trim();
                try {
                    const saved = localStorage.getItem('bakery_user');
                    const u = saved ? JSON.parse(saved) : {};
                    u.email = newEmail.trim();
                    localStorage.setItem('bakery_user', JSON.stringify(u));
                } catch(e) {}
                alert("Email berhasil diubah.");
            } else if (newEmail !== null) {
                alert("Masukkan alamat email yang benar.");
            }
        }

        if (field === "password") {
            const newPassword = prompt("Masukkan password baru (minimal 6 karakter):");

            if (newPassword !== null) {
                if (newPassword.length >= 6) {
                    document.getElementById("accountPassword").textContent = "••••••••";
                    alert("Password demo berhasil diubah.");
                } else {
                    alert("Password minimal harus 6 karakter.");
                }
            }
        }
    });
});

const signOutBtn = document.getElementById("signOut");
if (signOutBtn) {
    signOutBtn.addEventListener("click", function(event) {
        event.preventDefault();
        if (confirm("Apakah Anda yakin ingin sign out dari akun Anda?")) {
            localStorage.removeItem('bakery_user');
            window.location.href = "home.html";
        }
    });
}
