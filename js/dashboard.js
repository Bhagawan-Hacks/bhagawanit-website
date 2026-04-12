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
