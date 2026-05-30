// --- EXISTING LANDING PAGE ANIMATIONS & COUNTDOWN ---
(function () {
    if (localStorage.getItem("paymentSuccess") === "true") {
        return;
    }

    var modal = document.getElementById('enroll-modal');
    if (modal) {
        setTimeout(function () { modal.style.display = 'flex'; }, 1600);
        modal.addEventListener('click', function (e) {
            if (e.target === modal) dismissModal();
        });
        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape') dismissModal();
        });
    }
})();

function dismissModal() {
    var m = document.getElementById('enroll-modal');
    if (m) {
        m.style.transition = 'opacity .2s';
        m.style.opacity = '0';
        setTimeout(function () { m.style.display = 'none'; m.style.opacity = ''; m.style.transition = ''; }, 200);
    }
}

(function () {
    var TOTAL = 27 * 60;
    var remaining = TOTAL;
    var modalEl = document.getElementById('modal-timer');
    var barEl = document.getElementById('bar-timer');
    var progressEl = document.getElementById('bar-progress');

    function pad(n) { return String(Math.floor(n)).padStart(2, '0'); }
    function fmt(s) { return pad(s / 60) + ':' + pad(s % 60); }

    function tick() {
        if (remaining < 0) { remaining = 0; }
        var display = fmt(remaining);
        if (modalEl) modalEl.textContent = display;
        if (barEl) barEl.textContent = display;
        if (progressEl) progressEl.style.width = ((remaining / TOTAL) * 100) + '%';
        if (remaining === 0) { clearInterval(iv); return; }
        remaining--;
    }

    tick();
    var iv = setInterval(tick, 1000);

    // Slide bar up after 2.4s
    setTimeout(function () {
        var bar = document.getElementById('slot-bar');
        if (bar) bar.style.transform = 'translateY(0)';
    }, 2400);

    // Body padding so bar does not overlap page footer
    document.body.style.paddingBottom = '72px';
})();


// var BASE_URL = "https://gcc-website-prod-932479078084.europe-west1.run.app";
var BASE_URL = "https://kcglobed-gcc-website-932479078084.asia-south1.run.app";

// var mode = "production";
var mode = "sandbox";

// var GCC_BACKEND_URL = "https://gccwebsite-admin-prod-backend-738131651355.asia-south1.run.app";
var GCC_BACKEND_URL = "https://gccwebsite-admin-backend-738131651355.asia-south1.run.app"
var FORM_TYPE = 1;

var finalFormSubmitFired = false;

var OTP_BASE_URL = "https://kcglobed-gcc-website-932479078084.asia-south1.run.app";
var isOtpVerified = false;
var otpTimerInterval = null;

// Hero Form Card Prefill & Pre-assessment Redirect
async function handleHeroConfirm(e) {
    if (e) e.preventDefault();

    const heroName = document.getElementById("hero_name")?.value.trim() || "";
    const heroPhone = document.getElementById("hero_phone")?.value.trim() || "";
    const heroEmail = document.getElementById("hero_email")?.value.trim() || "";
    const heroState = document.getElementById("hero_state")?.value || "";
    const heroCity = document.getElementById("hero_city")?.value.trim() || "";

    let hasError = false;

    if (!heroName) hasError = true;
    if (!heroPhone || !/^[6-9]\d{9}$/.test(heroPhone)) hasError = true;
    if (!heroEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(heroEmail)) hasError = true;
    if (!heroState) hasError = true;
    if (!heroCity) hasError = true;

    if (hasError) return;

    showLoadingModal("Please wait, creating your account...");

    try {

        // STEP 1 : CREATE DOSSIER
        const dossierRes = await fetch(
            GCC_BACKEND_URL + "/api/career/createdossierform",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    full_name: heroName,
                    email: heroEmail,
                    phone: heroPhone,
                    city: heroCity,
                    state: heroState,
                    university: "N/A",
                    source: 14
                })
            }
        );

        const dossierData = await dossierRes.json();

        if (!dossierData.success) {
            throw new Error(
                dossierData.message || "Failed to create dossier"
            );
        }

        // STEP 2 : CREATE STUDENT
        const studentRes = await fetch(
            GCC_BACKEND_URL + "/api/users/create_student/",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    full_name: heroName,
                    email: heroEmail,
                    city: heroCity,
                    state: heroState,
                    country: "India",
                    phone1: heroPhone
                })
            }
        );

        const studentData = await studentRes.json();

        if (!studentData.success) {
            throw new Error(
                studentData.message || "Failed to create student"
            );
        }

        // SUCCESS POPUP
        showStatusModal(
            true,
            "Your NFET slot has been successfully confirmed. Our team will contact you shortly."
        );

        // CLEAR FORM
        document.getElementById("hero_name").value = "";
        document.getElementById("hero_phone").value = "";
        document.getElementById("hero_email").value = "";
        document.getElementById("hero_state").selectedIndex = 0;
        document.getElementById("hero_city").innerHTML =
            '<option value="">City *</option>';

    } catch (error) {
        console.error(error);

        showStatusModal(
            false,
            error.message || "Something went wrong. Please try again."
        );
    }
}

// Registration Modal open/close actions
function openForm() {
    const modal = document.getElementById('registrationModal');
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

// Connect all close buttons on form closing
function closeForm() {
    const modal = document.getElementById('registrationModal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
        resetGccForm();
    }
}

// Global open-popup event delegation
document.addEventListener("click", function (e) {
    const btn = e.target.closest('.open-popup');
    if (btn) {
        console.log("Open-popup button clicked");
        e.preventDefault();

        // Smoothly scroll to the hero-card form (#confirm)
        const target = document.getElementById('confirm');
        if (target) {
            target.scrollIntoView({ behavior: 'smooth', block: 'center' });

            // Focus the Full Name input field after the scroll finishes
            const firstInput = document.getElementById('hero_name');
            if (firstInput) {
                setTimeout(() => firstInput.focus(), 800);
            }
        }
    }
});

// Hero OTP send and verify pipeline
var isHeroOtpVerified = false;
var heroOtpTimerInterval = null;

let stateCityData = null;

function loadStateCityData() {
    fetch("./state-city.json")
        .then(res => res.json())
        .then(data => {
            stateCityData = data;

            // Populate GCC State select
            const stateSelect = document.getElementById("gcc_state");
            if (stateSelect) {
                while (stateSelect.options.length > 1) {
                    stateSelect.remove(1);
                }

                const states = Object.keys(data).sort();
                states.forEach(state => {
                    const option = document.createElement("option");
                    option.value = state;
                    option.textContent = state;
                    stateSelect.appendChild(option);
                });

                stateSelect.addEventListener("change", function () {
                    updateCityDropdown(this.value);
                });

                if (stateSelect.value) {
                    updateCityDropdown(stateSelect.value);
                }
            }

            // Populate Hero State select
            const heroStateSelect = document.getElementById("hero_state");
            if (heroStateSelect) {
                while (heroStateSelect.options.length > 1) {
                    heroStateSelect.remove(1);
                }

                const states = Object.keys(data).sort();
                states.forEach(state => {
                    const option = document.createElement("option");
                    option.value = state;
                    option.textContent = state;
                    heroStateSelect.appendChild(option);
                });

                heroStateSelect.addEventListener("change", function () {
                    updateHeroCityDropdown(this.value);
                });

                if (heroStateSelect.value) {
                    updateHeroCityDropdown(heroStateSelect.value);
                }
            }
        })
        .catch(err => console.error("Could not load state-city.json", err));
}

function updateCityDropdown(selectedState) {
    const citySelect = document.getElementById("gcc_city");
    if (!citySelect) return;

    citySelect.innerHTML = '<option value="">Select city</option>';

    if (selectedState && stateCityData && stateCityData[selectedState]) {
        const cities = stateCityData[selectedState].sort();
        cities.forEach(city => {
            const option = document.createElement("option");
            option.value = city;
            option.textContent = city;
            citySelect.appendChild(option);
        });
    }
}

function updateHeroCityDropdown(selectedState) {
    const citySelect = document.getElementById("hero_city");
    if (!citySelect) return;

    citySelect.innerHTML = '<option value="">City *</option>';

    if (selectedState && stateCityData && stateCityData[selectedState]) {
        const cities = stateCityData[selectedState].sort();
        cities.forEach(city => {
            const option = document.createElement("option");
            option.value = city;
            option.textContent = city;
            citySelect.appendChild(option);
        });
    }
}

// On Loaded initializations
document.addEventListener("DOMContentLoaded", function () {
    try { loadStateCityData(); } catch (e) { console.error(e); }
    try { loadUniversityData(); } catch (e) { console.error(e); }
    console.log("GCC School Payments & Prefill Initialized");
});

// --- ACCIDENTALLY DELETED MODAL & FORM RESET HELPERS ---

function showLoadingModal(message) {
    var overlay = document.getElementById("statusModalOverlay");
    if (!overlay) return;

    var iconWrap = document.getElementById("statusIconWrap");
    var title = document.getElementById("statusTitle");
    var desc = document.getElementById("statusDesc");
    var badge = document.getElementById("statusBadge");
    var footer = document.querySelector(".status-footer");
    var retryBtn = document.getElementById("statusRetryBtn");
    var closeBtn = document.querySelector(".status-close-btn");

    overlay.classList.add("active");
    if (closeBtn) closeBtn.style.display = "none";

    iconWrap.className = "status-icon-wrap loading";
    iconWrap.innerHTML = '<div class="spinner-ring"></div>';

    badge.className = "status-badge loading";
    badge.textContent = "✦ PROCESSING";

    title.innerHTML = 'Please <span>Wait</span>';
    desc.innerHTML = message || 'Creating your account...';

    if (footer) {
        footer.innerHTML = 'Do not refresh or close this window.';
    }

    retryBtn.style.display = "none";
}

function showStatusModal(isSuccess, message, orderId) {
    var overlay = document.getElementById("statusModalOverlay");
    if (!overlay) return;

    var iconWrap = document.getElementById("statusIconWrap");
    var title = document.getElementById("statusTitle");
    var desc = document.getElementById("statusDesc");
    var badge = document.getElementById("statusBadge");
    var footer = document.querySelector(".status-footer");
    var pid = document.getElementById("statusPaymentId");
    var retryBtn = document.getElementById("statusRetryBtn");
    var closeBtn = document.querySelector(".status-close-btn");

    overlay.classList.add("active");
    if (closeBtn) closeBtn.style.display = "flex";

    if (isSuccess) {
        iconWrap.className = "status-icon-wrap";
        iconWrap.style.background = "#F0FDF4";
        iconWrap.style.color = "#c212b4ff";
        iconWrap.innerHTML = '<svg viewBox="0 0 24 24" style="width: 32px; height: 32px; fill: none; stroke: currentColor; stroke-width: 2;"><polyline points="20 6 9 17 4 12"></polyline></svg>';
        badge.className = "status-badge";
        badge.style.background = "#DCFCE7";
        badge.style.color = "#971ea7ff";
        badge.textContent = "✦ SUCCESS";
        title.innerHTML = 'Thank <span>You!</span>';
        desc.innerHTML = message || 'Your account has been created successfully.';
        if (footer) footer.innerHTML = 'Secure Connection';
        retryBtn.style.display = "none";
    } else {
        iconWrap.className = "status-icon-wrap failed";
        iconWrap.style.background = "#FEF2F2";
        iconWrap.style.color = "#EF4444";
        iconWrap.innerHTML = '<svg viewBox="0 0 24 24" style="width: 32px; height: 32px; fill: none; stroke: currentColor; stroke-width: 2;"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>';
        badge.className = "status-badge failed";
        badge.style.background = "#FEE2E2";
        badge.style.color = "#B91C1C";
        badge.textContent = "✦ FAILED";
        title.innerHTML = 'Registration <span>Failed</span>';
        desc.innerHTML = message || "Your registration could not be completed.";
        if (footer) footer.innerHTML = 'System Error';
        retryBtn.style.display = "block";
    }

    if (orderId) {
        pid.style.display = "block";
        pid.textContent = "ID: " + orderId;
    } else {
        pid.style.display = "none";
    }
}

function closeStatusModal() {
    var overlay = document.getElementById("statusModalOverlay");
    if (overlay) overlay.classList.remove("active");
    closeForm();
}

function closeStatusModalOnly() {
    var overlay = document.getElementById("statusModalOverlay");
    if (overlay) overlay.classList.remove("active");
}

function resetGccForm() {
    const formIds = ["gcc_name", "gcc_email", "gcc_phone", "gcc_state", "gcc_city", "gcc_degree", "gcc_degree_search"];
    formIds.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = "";
    });

    const checkbox = document.getElementById("gcc_commerce_graduate");
    if (checkbox) checkbox.checked = false;

    const citySelect = document.getElementById("gcc_city");
    if (citySelect) {
        citySelect.innerHTML = '<option value="">Select city</option>';
    }

    const fieldsForErrors = ["gcc_name", "gcc_email", "gcc_phone", "gcc_state", "gcc_city", "gcc_degree", "gcc_commerce_graduate", "gcc_otp"];
    fieldsForErrors.forEach(f => {
        const errEl = document.getElementById("err_" + f);
        if (errEl) errEl.style.display = "none";
        const inputEl = document.getElementById(f === "gcc_degree" ? "gcc_degree_search" : f);
        if (inputEl) inputEl.classList.remove("invalid");
    });

    const mainErrEl = document.getElementById("gccFormError");
    if (mainErrEl) mainErrEl.style.display = "none";

    finalFormSubmitFired = false;
    isOtpVerified = false;
    if (otpTimerInterval) clearInterval(otpTimerInterval);
    const otpSection = document.getElementById("otp_section");
    if (otpSection) otpSection.style.display = "none";
}

function loadUniversityData() {
    console.log("University data ignored since registration modal is in simple direct mode.");
}