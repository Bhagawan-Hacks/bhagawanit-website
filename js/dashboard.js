// Dashboard Logic for Bhagawan IT Client Area
document.addEventListener('DOMContentLoaded', async () => {
    const dashboardContent = document.getElementById('dashboard-content');
    const loadingDash = document.getElementById('loading-dashboard');
    const guestDash = document.getElementById('dashboard-guest');
    
    // Elements
    const userName = document.getElementById('user-name');
    const userEmail = document.getElementById('user-email');
    const userAvatar = document.getElementById('user-avatar');
    const meetingsList = document.getElementById('my-meetings-list');

    // 1. Check Login
    const { data: { session }, error: sessionError } = await supabaseClient.auth.getSession();
    const user = session?.user;

    if (!user) {
        if(loadingDash) loadingDash.style.display = 'none';
        if(guestDash) guestDash.style.display = 'block';
        return;
    }

    // 2. Load Dashboard Data
    await loadUserProfile(user);
    await loadUserMeetings(user.id);

    // --- Core Functions ---

    async function loadUserProfile(user) {
        try {
            const { data: profile, error } = await supabaseClient
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();

            if (error && error.code !== 'PGRST116') throw error;

            userName.innerText = profile?.full_name || user.user_metadata?.full_name || 'Bhagawan IT Client';
            userEmail.innerText = user.email;
            if (profile?.avatar_url) {
                userAvatar.src = profile.avatar_url;
            }
        } catch (err) {
            console.error('Error loading profile:', err);
        }
    }

    async function loadUserMeetings(userId) {
        try {
            const { data: meetings, error } = await supabaseClient
                .from('meetings')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false });

            if (error) throw error;

            renderMeetings(meetings);
        } catch (err) {
            console.error('Error loading meetings:', err);
            meetingsList.innerHTML = '<p class="text-danger">Failed to load meeting history.</p>';
        } finally {
            if(loadingDash) loadingDash.style.display = 'none';
            if(dashboardContent) dashboardContent.style.display = 'block';
        }
    }

    // --- Settings & Theme Logic ---
    const settingsModal = document.getElementById('settingsModal');
    const editProfileBtn = document.getElementById('edit-profile-btn');
    const closeSettings = document.getElementById('closeSettings');
    const themeBtns = document.querySelectorAll('.theme-btn');
    const saveProfileBtn = document.getElementById('saveProfileBtn');
    const settingFullName = document.getElementById('setting-full-name');
    const logoutBtnSettings = document.getElementById('logout-btn-settings');

    // Open Modal
    editProfileBtn?.addEventListener('click', (e) => {
        e.preventDefault();
        settingsModal.classList.add('active');
        // Pre-fill name
        settingFullName.value = userName.innerText !== 'Bhagawan IT Client' ? userName.innerText : '';
        // Set active theme button
        const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
        updateThemeButtons(currentTheme);
    });

    // Close Modal
    const fnCloseModal = () => settingsModal.classList.remove('active');
    closeSettings?.addEventListener('click', fnCloseModal);
    settingsModal?.addEventListener('click', (e) => {
        if (e.target === settingsModal) fnCloseModal();
    });

    // Theme Switching
    themeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const theme = btn.getAttribute('data-theme-set');
            document.documentElement.setAttribute('data-theme', theme);
            localStorage.setItem('bhagawan_it_theme', theme);
            updateThemeButtons(theme);
        });
    });

    function updateThemeButtons(currentTheme) {
        themeBtns.forEach(btn => {
            if (btn.getAttribute('data-theme-set') === currentTheme) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
    }

    // Save Profile Changes
    saveProfileBtn?.addEventListener('click', async () => {
        const newName = settingFullName.value.trim();
        if (!newName) return alert('Please enter a valid name.');

        saveProfileBtn.disabled = true;
        saveProfileBtn.innerText = 'Saving...';

        try {
            const { error } = await supabaseClient
                .from('profiles')
                .upsert({ 
                    id: user.id, 
                    full_name: newName
                });

            if (error) throw error;

            userName.innerText = newName;
            alert('Profile updated successfully! ✨');
            fnCloseModal();
        } catch (err) {
            console.error('Update failed:', err);
            alert('Error updating profile: ' + err.message);
        } finally {
            saveProfileBtn.disabled = false;
            saveProfileBtn.innerText = 'Save Profile Changes';
        }
    });

    // Logout via Settings
    logoutBtnSettings?.addEventListener('click', async () => {
        if (confirm('Are you sure you want to log out?')) {
            await supabaseClient.auth.signOut();
            window.location.href = 'login';
        }
    });

    function renderMeetings(meetings) {
        if (!meetings || meetings.length === 0) {
            meetingsList.innerHTML = `
                <div class="card glass-effect p-5 text-center dashboard-card">
                    <p class="mb-3">You haven't requested any consultations yet.</p>
                    <a href="contact.html" class="btn btn-primary">Book Your First Meeting</a>
                </div>
            `;
            return;
        }

        const serviceLabels = {
            'web': 'Website Development',
            'app': 'Mobile App Development',
            'uiux': 'UI/UX Design',
            'graphic': 'Graphic Design',
            'maintenance': 'Maintenance & Support',
            'other': 'Other / Not Sure'
        };

        meetingsList.innerHTML = '';
        meetings.forEach(meeting => {
            const card = document.createElement('div');
            card.className = 'card glass-effect dashboard-card p-4 mb-3';
            
            let statusText = meeting.status.toUpperCase();
            let statusClass = `badge-${meeting.status}`;
            
            card.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 0.5rem;">
                    <div>
                        <span class="meeting-status-badge ${statusClass}">${statusText}</span>
                        <small class="text-muted-gray ml-2">ID: #BG-${meeting.id.split('-')[0].toUpperCase()}</small>
                    </div>
                    <small class="text-muted-gray">${new Date(meeting.created_at).toLocaleDateString()}</small>
                </div>
                
                <h3 class="mb-2" style="font-size: 1.25rem;">${serviceLabels[meeting.service] || meeting.service}</h3>
                <p class="text-muted-gray mb-3" style="font-size: 0.9rem;">${meeting.message || 'Consultation request for IT services.'}</p>
                
                ${meeting.meeting_date ? `
                    <div class="scheduled-info">
                        <strong>📅 Scheduled Meeting:</strong> 
                        <span>${meeting.meeting_date} at ${meeting.meeting_time || 'TBD'}</span>
                    </div>
                ` : `
                    ${meeting.status === 'pending' ? `
                        <div style="background: rgba(255,255,255,0.03); padding: 1rem; border-radius: 8px; font-size: 0.9rem;">
                            🕒 Waiting for Bhagawan Gautam to schedule your date. Check back shortly.
                        </div>
                    ` : ''}
                `}
            `;
            meetingsList.appendChild(card);
        });
    }
});
