// IMPORTANT: Create `auth.js` to handle all Supabase authentication logic
const isAuthPage = window.location.pathname.includes('login.html') || window.location.pathname.includes('signup.html');

document.addEventListener('DOMContentLoaded', async () => {
    
    // Auth elements
    const signupForm = document.getElementById('signup-form');
    const loginForm = document.getElementById('login-form');
    const logoutBtn = document.getElementById('logout-btn');

    // Make sure we check if user is logged in everywhere to update the navbar
    const { data: { session }, error } = await supabaseClient.auth.getSession();
    const user = session?.user;

    // --- Dynamic Navbar Update ---
    updateNavigation(user);

    if (isAuthPage && user) {
        // Redirect to index if authenticated user tries to access login/signup
        window.location.href = 'index.html';
        return;
    }

    // --- Signup Logic ---
    if (signupForm) {
        // Image Preview logic (outside submit listener)
        const avatarInput = document.getElementById('avatar');
        const preview = document.getElementById('avatar-preview');
        
        if (avatarInput && preview) {
            avatarInput.addEventListener('change', () => {
                const file = avatarInput.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        preview.src = e.target.result;
                        preview.style.display = 'block';
                    };
                    reader.readAsDataURL(file);
                } else {
                    preview.style.display = 'none';
                }
            });
        }

        signupForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const fullName = document.getElementById('fullName').value;
            const avatarInput = document.getElementById('avatar');
            const avatarFile = avatarInput.files[0];
            const btn = document.getElementById('signup-btn');
            const errorDiv = document.getElementById('signup-error');
            const successDiv = document.getElementById('signup-success');
            
            btn.disabled = true;
            btn.innerText = 'Creating account...';
            errorDiv.style.display = 'none';

            try {
                // 1. Sign up user FIRST so they get authenticated
                const { data: authData, error: authError } = await supabaseClient.auth.signUp({
                    email,
                    password,
                    options: {
                        data: {
                            full_name: fullName,
                            avatar_url: '' // Will update later if image provided
                        }
                    }
                });

                if (authError) throw authError;
                
                // If email confirmations are ON, session will be null. 
                if (!authData.session) {
                    throw new Error('Check your email for a confirmation link! (Or disable Email Confirmations in your Supabase Auth Providers settings)');
                }

                // 2. Upload Avatar if provided (now that they are authenticated)
                if (avatarFile) {
                    btn.innerText = 'Uploading picture...';
                    const fileExt = avatarFile.name.split('.').pop();
                    const fileName = `${authData.user.id}_${Math.random()}.${fileExt}`;
                    const filePath = `public/${fileName}`;

                    const { error: uploadError } = await supabaseClient.storage
                        .from('avatars')
                        .upload(filePath, avatarFile);
                    
                    if (uploadError) throw uploadError;

                    // Get public URL and update profile
                    const { data: urlData } = supabaseClient.storage.from('avatars').getPublicUrl(filePath);
                    
                    await supabaseClient.from('profiles')
                        .update({ avatar_url: urlData.publicUrl })
                        .eq('id', authData.user.id);
                }

                // Success
                successDiv.style.display = 'block';
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 2000);

            } catch (err) {
                errorDiv.innerText = err.message || 'An error occurred during signup.';
                errorDiv.style.display = 'block';
                btn.disabled = false;
                btn.innerText = 'Sign Up';
            }
        });
    }

    // --- Login Logic ---
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const btn = document.getElementById('login-btn');
            const errorDiv = document.getElementById('login-error');
            
            btn.disabled = true;
            btn.innerText = 'Logging in...';
            errorDiv.style.display = 'none';

            try {
                const { data, error } = await supabaseClient.auth.signInWithPassword({
                    email,
                    password
                });

                if (error) throw error;

                // Success
                window.location.href = 'index.html';

            } catch (err) {
                errorDiv.innerText = 'Invalid email or password.';
                errorDiv.style.display = 'block';
                btn.disabled = false;
                btn.innerText = 'Log In';
            }
        });
    }

    // --- Password Recovery Logic ---
    const forgotForm = document.getElementById('forgot-password-form');
    if (forgotForm) {
        forgotForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value;
            const btn = document.getElementById('reset-request-btn');
            const errorDiv = document.getElementById('forgot-error');
            const successDiv = document.getElementById('forgot-success');
            
            btn.disabled = true;
            btn.innerText = 'Sending Link...';
            errorDiv.style.display = 'none';
            successDiv.style.display = 'none';

            try {
                // Intelligently fallback to production URL if opened via file:// to prevent Supabase default localhost:3000 errors
                let redirectUrl = new URL('reset-password.html', window.location.href).href;
                if (window.location.protocol === 'file:') {
                    redirectUrl = 'https://bhagawangautam.com.np/reset-password.html';
                }

                const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
                    redirectTo: redirectUrl,
                });

                if (error) throw error;

                successDiv.innerText = 'Reset link sent! Please check your email inbox and click the link to continue.';
                successDiv.style.display = 'block';
                forgotForm.reset();
            } catch (err) {
                errorDiv.innerText = err.message || 'Failed to send reset link.';
                errorDiv.style.display = 'block';
            } finally {
                btn.disabled = false;
                btn.innerText = 'Send Reset Link';
            }
        });
    }

    const resetForm = document.getElementById('reset-password-form');
    if (resetForm) {
        resetForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const newPassword = document.getElementById('new-password').value;
            const confirmPassword = document.getElementById('confirm-password').value;
            const btn = document.getElementById('update-password-btn');
            const errorDiv = document.getElementById('reset-error');
            const successDiv = document.getElementById('reset-success');

            if (newPassword !== confirmPassword) {
                errorDiv.innerText = 'Passwords do not match.';
                errorDiv.style.display = 'block';
                return;
            }

            btn.disabled = true;
            btn.innerText = 'Updating Password...';
            errorDiv.style.display = 'none';

            try {
                const { error } = await supabaseClient.auth.updateUser({
                    password: newPassword
                });

                if (error) throw error;

                successDiv.innerText = 'Password updated successfully! Redirecting you...';
                successDiv.style.display = 'block';
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 2000);
            } catch (err) {
                errorDiv.innerText = err.message || 'Failed to update password.';
                errorDiv.style.display = 'block';
                btn.disabled = false;
                btn.innerText = 'Update Password';
            }
        });
    }

    // --- Logout Logic ---
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            await supabaseClient.auth.signOut();
            window.location.href = 'index.html';
        });
    }
});

async function fetchUserProfile(userId) {
    try {
        const { data, error } = await supabaseClient
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();
        
        if (error) throw error;
        return data;
    } catch (err) {
        console.error('Error fetching profile:', err);
        return null;
    }
}

// Function to dynamically update navbar links for existing static HTML pages
function updateNavigation(user) {
    const navLinksContainer = document.querySelector('.nav-links');
    if (!navLinksContainer) return;

    if (user) {
        // Logged In: Remove Login/Signup
        const buttonsToRemove = navLinksContainer.querySelectorAll('a[href="login.html"], a[href="signup.html"]');
        buttonsToRemove.forEach(btn => btn.style.display = 'none');
        
        // Fetch role to show Admin Link
        fetchUserProfile(user.id).then(profile => {
            if (profile && profile.role === 'admin') {
                if (!document.getElementById('admin-nav-link')) {
                    const adminLink = document.createElement('a');
                    adminLink.href = 'admin-portal.html';
                    adminLink.id = 'admin-nav-link';
                    adminLink.innerText = 'Admin Portal';
                    adminLink.style.color = 'var(--color-primary-red)';
                    adminLink.style.fontWeight = '700';
                    navLinksContainer.insertBefore(adminLink, navLinksContainer.firstElementChild);
                }
            }
        });

        // Add Dashboard link
        if (!document.getElementById('dashboard-nav-link')) {
            const dashboard = document.createElement('a');
            dashboard.href = 'dashboard.html';
            dashboard.id = 'dashboard-nav-link';
            dashboard.innerText = 'Dashboard';
            // Insert after Admin link if exists, otherwise at start
            const adminLink = document.getElementById('admin-nav-link');
            if (adminLink) {
                adminLink.after(dashboard);
            } else {
                navLinksContainer.insertBefore(dashboard, navLinksContainer.firstElementChild);
            }
        }

        // Add a logout button if it doesn't exist functionally
        if (!document.getElementById('logout-btn')) {
            const logout = document.createElement('a');
            logout.href = '#';
            logout.id = 'logout-btn';
            logout.className = 'btn btn-outline btn-pill mobile-cta';
            logout.style.padding = '0.5rem 1rem';
            logout.innerText = 'Log Out';
            logout.addEventListener('click', async (e) => {
                e.preventDefault();
                await supabaseClient.auth.signOut();
                window.location.href = 'index.html';
            });
            navLinksContainer.appendChild(logout);
        }
    } else {
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) logoutBtn.style.display = 'none';

        // Add Login/Signup if they don't explicitly exist (like on legacy pages)
        if (!navLinksContainer.querySelector('a[href="login.html"]')) {
            const login = document.createElement('a');
            login.href = 'login.html';
            login.innerText = 'Log In';
            navLinksContainer.insertBefore(login, navLinksContainer.lastElementChild);
        }
        if (!navLinksContainer.querySelector('a[href="signup.html"]')) {
            const signup = document.createElement('a');
            signup.href = 'signup.html';
            signup.innerText = 'Sign Up';
            signup.className = 'btn btn-primary btn-pill mobile-cta';
            navLinksContainer.appendChild(signup);
            
            // Hide the old contact CTA to make room
            const oldCta = navLinksContainer.querySelector('a[href="contact.html"].mobile-cta');
            if (oldCta) oldCta.style.display = 'none';
        }
    }
}
