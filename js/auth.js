// IMPORTANT: Create `auth.js` to handle all Supabase authentication logic
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

    // --- Page Protection ---
    const path = window.location.pathname;
    const isFeed = path.includes('feed.html');
    const isAuthPage = path.includes('login.html') || path.includes('signup.html');

    if (isFeed && !user) {
        // Redirect to login if unauthenticated user tries to access feed
        window.location.href = 'login.html';
        return;
    }
    
    if (isAuthPage && user) {
        // Redirect to feed if authenticated user tries to access login/signup
        window.location.href = 'feed.html';
        return;
    }

    // --- Signup Logic ---
    if (signupForm) {
        signupForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const fullName = document.getElementById('fullName').value;
            const avatarFile = document.getElementById('avatar').files[0];
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
                    window.location.href = 'feed.html';
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
                window.location.href = 'feed.html';

            } catch (err) {
                errorDiv.innerText = 'Invalid email or password.';
                errorDiv.style.display = 'block';
                btn.disabled = false;
                btn.innerText = 'Log In';
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

// Function to dynamically update navbar links for existing static HTML pages
function updateNavigation(user) {
    const navLinksContainer = document.querySelector('.nav-links');
    if (!navLinksContainer) return;

    if (user) {
        // Logged In: Remove Login/Signup/Contact CTA, Add Feed and Logout
        const buttonsToRemove = navLinksContainer.querySelectorAll('a[href="login.html"], a[href="signup.html"], a.mobile-cta');
        buttonsToRemove.forEach(btn => btn.style.display = 'none');
        
        // Ensure "Feed" link exists and is shown
        let feedLink = navLinksContainer.querySelector('a[href="feed.html"]');
        if (feedLink) feedLink.style.display = 'inline-block';
        
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
        // Logged Out: Make sure Feed/Logout are hidden, ensure Login/Signup exist
        const feedLink = navLinksContainer.querySelector('a[href="feed.html"]');
        if (feedLink) feedLink.style.display = 'none';
        
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
