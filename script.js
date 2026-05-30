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
function handleHeroConfirm(e) {
    if (e) e.preventDefault();

    const heroName = document.getElementById("hero_name")?.value.trim() || "";
    const heroPhone = document.getElementById("hero_phone")?.value.trim() || "";
    const heroEmail = document.getElementById("hero_email")?.value.trim() || "";
    const heroState = document.getElementById("hero_state")?.value || "";
    const heroCity = document.getElementById("hero_city")?.value.trim() || "";

    // Reset styles
    const heroFields = ["hero_name", "hero_phone", "hero_email", "hero_state", "hero_city"];
    heroFields.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.style.borderColor = "";
            el.style.boxShadow = "";
        }
    });

    let hasError = false;
    let firstErrEl = null;

    if (!heroName) {
        const el = document.getElementById("hero_name");
        if (el) {
            el.style.borderColor = "#EF4444";
            el.style.boxShadow = "0 0 0 2px rgba(239, 68, 68, 0.2)";
            if (!firstErrEl) firstErrEl = el;
        }
        hasError = true;
    }
    if (!heroPhone || !/^[6-9]\d{9}$/.test(heroPhone)) {
        const el = document.getElementById("hero_phone");
        if (el) {
            el.style.borderColor = "#EF4444";
            el.style.boxShadow = "0 0 0 2px rgba(239, 68, 68, 0.2)";
            if (!firstErrEl) firstErrEl = el;
        }
        hasError = true;
    }
    if (!heroEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(heroEmail)) {
        const el = document.getElementById("hero_email");
        if (el) {
            el.style.borderColor = "#EF4444";
            el.style.boxShadow = "0 0 0 2px rgba(239, 68, 68, 0.2)";
            if (!firstErrEl) firstErrEl = el;
        }
        hasError = true;
    }
    if (!heroState) {
        const el = document.getElementById("hero_state");
        if (el) {
            el.style.borderColor = "#EF4444";
            el.style.boxShadow = "0 0 0 2px rgba(239, 68, 68, 0.2)";
            if (!firstErrEl) firstErrEl = el;
        }
        hasError = true;
    }
    if (!heroCity) {
        const el = document.getElementById("hero_city");
        if (el) {
            el.style.borderColor = "#EF4444";
            el.style.boxShadow = "0 0 0 2px rgba(239, 68, 68, 0.2)";
            if (!firstErrEl) firstErrEl = el;
        }
        hasError = true;
    }

    if (hasError) {
        if (firstErrEl) {
            firstErrEl.focus();
            firstErrEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        return;
    }

    if (!isHeroOtpVerified) {
        const el = document.getElementById("hero_phone");
        if (el) {
            el.style.borderColor = "#EF4444";
            el.style.boxShadow = "0 0 0 2px rgba(239, 68, 68, 0.2)";
            el.focus();
        }
        alert("Please verify your mobile number with OTP first.");
        return;
    }

    showLoadingModal("Initializing secure checkout...");
    startPayment(heroName, heroEmail, heroPhone, heroCity, heroState, "N/A");
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

async function sendHeroOtp() {
    const phoneInput = document.getElementById("hero_phone");
    const phone = phoneInput.value.trim();
    const btn = document.getElementById("btn_hero_send_otp");

    if (!phone || !/^[6-9]\d{9}$/.test(phone)) {
        phoneInput.style.borderColor = "#EF4444";
        phoneInput.style.boxShadow = "0 0 0 2px rgba(239, 68, 68, 0.2)";
        alert("Please enter a valid 10-digit mobile number to send OTP.");
        return;
    }

    phoneInput.style.borderColor = "";
    phoneInput.style.boxShadow = "";
    btn.disabled = true;
    btn.innerText = "Sending...";

    try {
        const res = await fetch(OTP_BASE_URL + '/api/otp/send', {
            method: 'POST',
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ mobile: phone })
        });
        const data = await res.json();

        if (data.success || res.ok) {
            document.getElementById("hero_otp_section").style.display = "block";

            let otpCountdown = 60;
            btn.innerText = `Resend in ${otpCountdown}s`;

            if (heroOtpTimerInterval) clearInterval(heroOtpTimerInterval);
            heroOtpTimerInterval = setInterval(() => {
                otpCountdown--;
                if (otpCountdown > 0) {
                    btn.innerText = `Resend in ${otpCountdown}s`;
                } else {
                    clearInterval(heroOtpTimerInterval);
                    btn.innerText = "Resend OTP";
                    btn.disabled = false;
                }
            }, 1000);

        } else {
            phoneInput.style.borderColor = "#EF4444";
            alert(data.message || data.statusMessage || "Failed to send OTP");
            btn.disabled = false;
            btn.innerText = "Send OTP";
        }
    } catch (err) {
        console.error(err);
        phoneInput.style.borderColor = "#EF4444";
        alert("Failed to send OTP. Please try again.");
        btn.disabled = false;
        btn.innerText = "Send OTP";
    }
}

async function verifyHeroOtp() {
    const phone = document.getElementById("hero_phone").value.trim();
    const otpInput = document.getElementById("hero_otp");
    const otp = otpInput.value.trim();
    const btn = document.getElementById("btn_hero_verify_otp");

    if (!otp || otp.length !== 6) {
        otpInput.style.borderColor = "#EF4444";
        alert("Please enter a valid 6-digit OTP.");
        return;
    }

    otpInput.style.borderColor = "";
    btn.disabled = true;
    btn.innerText = "Verifying...";

    try {
        const res = await fetch(OTP_BASE_URL + '/api/otp/verify', {
            method: 'POST',
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ mobile: phone, otp: otp })
        });
        const data = await res.json();

        if (data.success || res.ok) {
            isHeroOtpVerified = true;
            if (heroOtpTimerInterval) clearInterval(heroOtpTimerInterval);
            document.getElementById("hero_otp_success_msg").style.display = "block";
            otpInput.disabled = true;
            document.getElementById("hero_phone").disabled = true;
            document.getElementById("btn_hero_send_otp").style.display = "none";
            btn.innerText = "Verified";
        } else {
            otpInput.style.borderColor = "#EF4444";
            alert(data.message || data.statusMessage || "Invalid or expired OTP");
            btn.disabled = false;
            btn.innerText = "Verify OTP";
        }
    } catch (err) {
        console.error(err);
        otpInput.style.borderColor = "#EF4444";
        alert("Failed to verify OTP. Please try again.");
        btn.disabled = false;
        btn.innerText = "Verify OTP";
    }
}

// OTP send and verify pipeline
async function sendOtp() {
    const phone = document.getElementById("gcc_phone").value.trim();
    const btn = document.getElementById("btn_send_otp");

    if (!phone || !/^[6-9]\d{9}$/.test(phone)) {
        setFieldError("gcc_phone", "Please enter a valid 10-digit mobile number to send OTP.");
        return;
    }

    setFieldError("gcc_phone", "");
    btn.disabled = true;
    btn.innerText = "Sending...";

    try {
        const res = await fetch(OTP_BASE_URL + '/api/otp/send', {
            method: 'POST',
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ mobile: phone })
        });
        const data = await res.json();

        if (data.success || res.ok) {
            document.getElementById("otp_section").style.display = "block";

            let otpCountdown = 60;
            btn.innerText = `Resend in ${otpCountdown}s`;

            if (otpTimerInterval) clearInterval(otpTimerInterval);
            otpTimerInterval = setInterval(() => {
                otpCountdown--;
                if (otpCountdown > 0) {
                    btn.innerText = `Resend in ${otpCountdown}s`;
                } else {
                    clearInterval(otpTimerInterval);
                    btn.innerText = "Resend OTP";
                    btn.disabled = false;
                }
            }, 1000);

        } else {
            setFieldError("gcc_phone", data.message || data.statusMessage || "Failed to send OTP");
            btn.disabled = false;
            btn.innerText = "Send OTP";
        }
    } catch (err) {
        console.error(err);
        setFieldError("gcc_phone", "Failed to send OTP. Please try again.");
        btn.disabled = false;
        btn.innerText = "Send OTP";
    }
}

async function verifyOtp() {
    const phone = document.getElementById("gcc_phone").value.trim();
    const otp = document.getElementById("gcc_otp").value.trim();
    const btn = document.getElementById("btn_verify_otp");

    if (!otp || otp.length !== 6) {
        setFieldError("gcc_otp", "Please enter a valid 6-digit OTP.");
        return;
    }

    setFieldError("gcc_otp", "");
    btn.disabled = true;
    btn.innerText = "Verifying...";

    try {
        const res = await fetch(OTP_BASE_URL + '/api/otp/verify', {
            method: 'POST',
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ mobile: phone, otp: otp })
        });
        const data = await res.json();

        if (data.success || res.ok) {
            isOtpVerified = true;
            if (otpTimerInterval) clearInterval(otpTimerInterval);
            document.getElementById("otp_success_msg").style.display = "block";
            document.getElementById("gcc_otp").disabled = true;
            document.getElementById("gcc_phone").disabled = true;
            document.getElementById("btn_send_otp").style.display = "none";
            btn.innerText = "Verified";
        } else {
            setFieldError("gcc_otp", data.message || data.statusMessage || "Invalid or expired OTP");
            btn.disabled = false;
            btn.innerText = "Verify";
        }
    } catch (err) {
        console.error(err);
        setFieldError("gcc_otp", "Failed to verify OTP. Please try again.");
        btn.disabled = false;
        btn.innerText = "Verify";
    }
}

// Payment Click validation
function handlePayClick() {
    const fields = ["gcc_name", "gcc_email", "gcc_phone", "gcc_state", "gcc_city", "gcc_degree", "gcc_commerce_graduate"];

    fields.forEach(f => {
        const errEl = document.getElementById("err_" + f);
        const inputEl = document.getElementById(f === "gcc_degree" ? "gcc_degree_search" : f);
        if (errEl) errEl.style.display = "none";
        if (inputEl) inputEl.classList.remove("invalid");
    });
    const mainErrEl = document.getElementById("gccFormError");
    if (mainErrEl) mainErrEl.style.display = "none";

    const name = document.getElementById("gcc_name").value.trim();
    const email = document.getElementById("gcc_email").value.trim();
    const phone = document.getElementById("gcc_phone").value.trim();
    const city = document.getElementById("gcc_city").value.trim();
    const state = document.getElementById("gcc_state").value.trim();
    
    // Auto-fill degree with 'N/A' to ignore university input
    const degreeEl = document.getElementById("gcc_degree");
    if (degreeEl && !degreeEl.value.trim()) {
        degreeEl.value = "N/A";
    }
    const degree = degreeEl ? degreeEl.value.trim() : "N/A";
    
    const commerceChecked = document.getElementById("gcc_commerce_graduate").checked;

    let hasError = false;

    if (!name) { setFieldError("gcc_name", "Full name is required"); hasError = true; }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setFieldError("gcc_email", "Valid email is required"); hasError = true; }
    if (!phone || !/^[6-9]\d{9}$/.test(phone)) { setFieldError("gcc_phone", "10-digit mobile number is required"); hasError = true; }
    if (!state) { setFieldError("gcc_state", "State selection is required"); hasError = true; }
    if (!city) { setFieldError("gcc_city", "City selection is required"); hasError = true; }
    // University input is ignored and auto-filled, so we comment out the required validation check
    // if (!degree) { setFieldError("gcc_degree", "University selection is required"); hasError = true; }
    if (!commerceChecked) { setFieldError("gcc_commerce_graduate", "This confirmation is required"); hasError = true; }

    if (!isOtpVerified) { setFieldError("gcc_phone", "Please verify your mobile number with OTP"); hasError = true; }

    if (hasError) {
        const firstErr = document.querySelector(".field-error[style*='display: block']");
        if (firstErr) firstErr.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
    }

    showLoadingModal("Initializing secure checkout...");
    startPayment(name, email, phone, city, state, degree);
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
    const otpSuccessMsg = document.getElementById("otp_success_msg");
    if (otpSuccessMsg) otpSuccessMsg.style.display = "none";
    const sendBtn = document.getElementById("btn_send_otp");
    if (sendBtn) { sendBtn.style.display = "block"; sendBtn.disabled = false; sendBtn.innerText = "Send OTP"; }
    const verifyBtn = document.getElementById("btn_verify_otp");
    if (verifyBtn) { verifyBtn.disabled = false; verifyBtn.innerText = "Verify"; }
    const phoneInput = document.getElementById("gcc_phone");
    if (phoneInput) phoneInput.disabled = false;
    const otpInput = document.getElementById("gcc_otp");
    if (otpInput) { otpInput.value = ""; otpInput.disabled = false; }
}

function setFieldError(fieldId, msg) {
    const errEl = document.getElementById("err_" + fieldId);
    const inputEl = document.getElementById(fieldId === "gcc_degree" ? "gcc_degree_search" : fieldId);
    if (errEl) {
        errEl.textContent = msg;
        errEl.style.display = "block";
    }
    if (inputEl) {
        inputEl.classList.add("invalid");
    }
}

// Payment Pipeline APIs
async function startPayment(name, email, mobile, city, state, degree) {
    console.log("Starting payment initialization...", { name, email, mobile, city, state, degree });

    const urlParams = new URLSearchParams(window.location.search);
    const utm_campaign = urlParams.get("utm_campaign") || "";
    const utm_medium = urlParams.get("utm_medium") || "";
    const utm_source = urlParams.get("utm_source") || "";

    try {
        const formRes = await fetch(GCC_BACKEND_URL + "/api/career/createdossierform", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                full_name: name,
                email,
                phone: mobile,
                city,
                state,
                university: degree,
                utm_campaign,
                utm_medium,
                utm_source,
                source: 14,
            }),
        });

        const formData = await formRes.json();
        console.log("createvslfinalform response:", formData);

        const latest_form_id = formData?.data?.id;
        if (!latest_form_id) {
            throw new Error("Form ID not received");
        }

        try {
            await fetch(BASE_URL + "/api/save-lead", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name,
                    email,
                    mobile,
                    city,
                    state,
                    form_type: 1,
                    form_id: latest_form_id,
                    source: 14,
                    action: "pay_now",
                    commingAmount: 2950
                }),
            });
        } catch (leadErr) {
            console.error("Error in save-lead:", leadErr);
        }

        const paymentRes = await fetch(BASE_URL + "/api/start-payment", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                name,
                email,
                mobile,
                city,
                state,
                form_type: 2,
                form_id: latest_form_id,
                source: 14,
                commingAmount: 2950
            }),
        });

        const paymentData = await paymentRes.json();
        console.log("start-payment response:", paymentData);

        if (!paymentData.success) {
            showStatusModal(false, paymentData.message || "Could not initiate payment. Please try again.", null);
            closeForm();
            return;
        }

        if (!finalFormSubmitFired) {
            window.dataLayer = window.dataLayer || [];
            window.dataLayer.push({
                event: "final_form_submit"
            });
            finalFormSubmitFired = true;
        }

        if (paymentData.gateway === "cashfree") {
            console.log("Launching Cashfree modal...");
            setTimeout(function () {
                closeStatusModalOnly();
                closeForm();
                launchCashfree(paymentData, { name, email, mobile, city, state, latest_form_id });
            }, 2000);
        } else {
            showStatusModal(false, "Unexpected gateway response. Please contact support.", null);
            closeForm();
        }

    } catch (err) {
        console.error("Critical error in startPayment:", err);
        showStatusModal(false, "Something went wrong. Please try again.", null);
        closeForm();
    }
}

function launchCashfree(data, form) {
    console.log("Initializing Cashfree checkout (v3)...");
    if (typeof Cashfree === "undefined") {
        showStatusModal(false, "Payment gateway could not be loaded. Please refresh the page.", data.cf_order_id);
        return;
    }
    const cashfree = Cashfree({ mode: mode });

    cashfree.checkout({
        paymentSessionId: data.payment_session_id,
        redirectTarget: "_modal",
    }).then((result) => {
        console.log("Cashfree checkout result object:", result);
        if (result.error) {
            console.warn("Cashfree checkout returned an error:", result.error);
            reportFailure(data.cf_order_id, null, result.error.message, result.error.code);
            showStatusModal(false, result.error.message, data.cf_order_id);
            closeForm();
        } else if (result.paymentDetails) {
            console.log("Cashfree checkout success (via result object):", result.paymentDetails);
            completePayment(data.cf_order_id, form);
        } else if (result.redirect) {
            console.log("Cashfree checkout redirecting...");
        } else {
            console.log("Cashfree checkout finished without specific result. Verifying order status...");
            completePayment(data.cf_order_id, form);
        }
    });
}

async function completePayment(cf_order_id, form) {
    console.log("Triggering /api/complete-payment for cf_order_id:", cf_order_id);
    showLoadingModal("Verifying your payment...");

    try {
        await new Promise(resolve => setTimeout(resolve, 2000));
        const paymentRes = await fetch(BASE_URL + "/api/complete-payment", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                cf_order_id: cf_order_id,
                re_attempt_status: false,
                source: 1,
            }),
        });

        const paymentData = await paymentRes.json();
        console.log("complete-payment response:", paymentData);

        if (paymentData.success) {
            console.log("Payment successful according to backend.");
            try {
                await fetch(GCC_BACKEND_URL + "/api/users/create_student/", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        full_name: form.name,
                        email: form.email,
                        city: form.city,
                        state: form.state,
                        country: "India",
                        phone1: form.mobile,
                    }),
                });
            } catch (studentErr) {
                console.error("Student creation failed:", studentErr);
            }
            closeForm();
            localStorage.setItem("paymentSuccess", "true");
            window.location.href = "thank-you.html?cf_order_id=" + cf_order_id;
        } else {
            console.warn("Payment verification failed.", paymentData.message || "Unknown error");
            showStatusModal(false, paymentData.message || "Payment verification failed.", cf_order_id);
            closeForm();
        }

    } catch (err) {
        console.error("complete-payment error:", err);
        showStatusModal(false, "Network error during verification.", cf_order_id);
        closeForm();
    }
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
        iconWrap.style.color = "#22C55E";
        iconWrap.innerHTML = '<svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"></polyline></svg>';
        badge.className = "status-badge";
        badge.style.background = "#DCFCE7";
        badge.style.color = "#15803D";
        badge.textContent = "✦ CONFIRMED";
        title.innerHTML = 'Thank <span>You!</span>';
        desc.innerHTML = message || 'Our team will reach out to you within 2 hours.';
        if (footer) footer.innerHTML = 'Secure Connection';
        retryBtn.style.display = "none";
    } else {
        iconWrap.className = "status-icon-wrap failed";
        iconWrap.style.background = "#FEF2F2";
        iconWrap.style.color = "#EF4444";
        iconWrap.innerHTML = '<svg viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>';
        badge.className = "status-badge failed";
        badge.style.background = "#FEE2E2";
        badge.style.color = "#B91C1C";
        badge.textContent = "✦ FAILED";
        title.innerHTML = 'Payment <span>Failed</span>';
        desc.innerHTML = message || "Your payment could not be processed.";
        if (footer) footer.innerHTML = 'System Error';
        retryBtn.style.display = "block";
    }

    if (orderId) {
        pid.style.display = "block";
        pid.textContent = "Payment ID: " + orderId;
    } else {
        pid.style.display = "none";
    }
}

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
    desc.innerHTML = message || 'Initializing payment...';

    if (footer) {
        footer.innerHTML = 'Do not refresh or close this window.';
    }

    retryBtn.style.display = "none";
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

function reportFailure(cf_order_id, payment_id, description, code) {
    console.log("Reporting payment failure to backend...", { cf_order_id, payment_id, description, code });
    fetch(BASE_URL + "/api/report-payment-failure", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            cf_order_id: cf_order_id,
            cf_payment_id: payment_id || "",
            re_attempt_status: false,
            error_code: code || "",
            error_description: description || "",
            commingAmount: 2950
        }),
    }).then(res => res.json()).then(data => {
        console.log("report-payment-failure response:", data);
    }).catch(function (e) {
        console.error("report-failure network error:", e);
    });
}

// cascading States and Cities data logic
let stateCityData = null;

function loadStateCityData() {
    fetch("./state-city.json")
        .then(res => res.json())
        .then(data => {
            stateCityData = data;
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

// Searchable University logic
let universities = [];

function loadUniversityData() {
    if (window.UNIVERSITY_DATA && Array.isArray(window.UNIVERSITY_DATA)) {
        console.log("Loading university data from embedded source");
        universities = window.UNIVERSITY_DATA.sort();
        initSearchableSelect();
        return;
    }

    fetch("./university.json")
        .then(res => res.json())
        .then(data => {
            universities = data.sort();
            initSearchableSelect();
        })
        .catch(err => console.error("Could not load university.json", err));
}

function initSearchableSelect() {
    const searchInput = document.getElementById("gcc_degree_search");
    const hiddenInput = document.getElementById("gcc_degree");
    const optionsContainer = document.getElementById("gcc_degree_options");

    if (!searchInput || !optionsContainer) return;

    const renderOptions = (filter = "") => {
        optionsContainer.innerHTML = "";
        const filtered = universities.filter(uni =>
            uni.toLowerCase().includes(filter.toLowerCase())
        ).slice(0, 100);

        if (filtered.length === 0) {
            optionsContainer.innerHTML = '<div class="cs-opt no-res">No results found</div>';
        } else {
            filtered.forEach(uni => {
                const div = document.createElement("div");
                div.className = "cs-opt";
                div.textContent = uni;
                div.title = uni;
                div.addEventListener("click", () => {
                    searchInput.value = uni;
                    hiddenInput.value = uni;
                    optionsContainer.classList.remove("active");
                    searchInput.dispatchEvent(new Event('change'));
                });
                optionsContainer.appendChild(div);
            });
        }
    };

    searchInput.addEventListener("focus", () => {
        renderOptions(searchInput.value);
        optionsContainer.classList.add("active");
    });

    searchInput.addEventListener("input", () => {
        renderOptions(searchInput.value);
        optionsContainer.classList.add("active");
        if (hiddenInput.value !== searchInput.value) {
            hiddenInput.value = "";
        }
    });

    document.addEventListener("click", (e) => {
        if (!e.target.closest(".custom-select-container")) {
            optionsContainer.classList.remove("active");
        }
    });
}

// On Loaded initializations
document.addEventListener("DOMContentLoaded", function () {
    try { loadStateCityData(); } catch (e) { console.error(e); }
    try { loadUniversityData(); } catch (e) { console.error(e); }
    console.log("GCC School Payments & Prefill Initialized");
});