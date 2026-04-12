// Admin Logic for Bhagawan IT Meeting Management
document.addEventListener('DOMContentLoaded', async () => {
    const adminContent = document.getElementById('admin-content');
    const adminGuard = document.getElementById('admin-auth-guard');
    const meetingsList = document.getElementById('meetings-list');
    const adminLoading = document.getElementById('admin-loading');
    
    const ADMIN_EMAIL = 'gautambhagawan55@gmail.com';

    // 1. Check Session & Auth Guard
    const { data: { session }, error } = await supabaseClient.auth.getSession();
    const user = session?.user;

    if (!user || user.email !== ADMIN_EMAIL) {
        adminGuard.style.display = 'block';
        return;
    }

    // Is Admin
    adminContent.style.display = 'block';
    await fetchMeetings();

    // --- Core Functions ---

    async function fetchMeetings() {
        if(adminLoading) adminLoading.style.display = 'block';
        
        try {
            console.log('Fetching meetings for admin...');
            const { data: meetings, error, status } = await supabaseClient
                .from('meetings')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Supabase Error:', error);
                throw error;
            }

            console.log(`Successfully fetched ${meetings ? meetings.length : 0} meetings.`);
            renderMeetings(meetings);
            updateStats(meetings);
        } catch (err) {
            console.error('Catch Error:', err);
            meetingsList.innerHTML = `
                <div class="text-center py-5">
                    <p style="color: var(--color-primary-red);">Error loading meetings.</p>
                    <small>${err.message || 'Check browser console (F12) for details.'}</small>
                    <button onclick="location.reload()" class="btn btn-outline mt-2" style="font-size: 0.8rem;">Retry</button>
                </div>
            `;
        } finally {
            if(adminLoading) adminLoading.style.display = 'none';
        }
    }

    function renderMeetings(meetings) {
        if (!meetings || meetings.length === 0) {
            meetingsList.innerHTML = '<p class="text-center py-5 w-100">No meeting requests found.</p>';
            return;
        }

        meetingsList.innerHTML = '';
        meetings.forEach(meeting => {
            const card = document.createElement('div');
            card.className = 'card glass-effect admin-card mb-3';
            card.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 1rem; flex-wrap: wrap;">
                    <div style="flex: 1; min-width: 250px;">
                        <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem;">
                            <span class="badge-${meeting.status}">${meeting.status.toUpperCase()}</span>
                            <small style="color: var(--text-muted-gray);">${new Date(meeting.created_at).toLocaleDateString()}</small>
                        </div>
                        <h3 class="mb-1">${meeting.full_name}</h3>
                        <p style="margin-bottom: 0.2rem;"><strong style="color: var(--text-off-white);">Email:</strong> ${meeting.email}</p>
                        <p style="margin-bottom: 0.2rem;"><strong style="color: var(--text-off-white);">Phone:</strong> ${meeting.phone || 'N/A'}</p>
                        <p style="margin-bottom: 0.2rem;"><strong style="color: var(--text-off-white);">Service:</strong> ${meeting.service.toUpperCase()}</p>
                        <p style="margin-bottom: 0.2rem;"><strong style="color: var(--text-off-white);">Budget:</strong> ${meeting.budget}</p>
                        <div class="mt-2 glass-effect p-2" style="border-radius: var(--radius-btn); background: rgba(0,0,0,0.2);">
                            <p style="margin: 0; font-size: 0.9rem; color: var(--text-off-white); font-style: italic;">"${meeting.message || 'No details provided.'}"</p>
                        </div>
                    </div>
                    <div class="admin-actions" style="display: flex; flex-direction: column; gap: 0.5rem;">
                        ${meeting.status === 'pending' ? `
                            <button class="btn btn-primary approve-btn" data-id="${meeting.id}">Approve Meeting</button>
                            <button class="btn btn-outline reject-btn" data-id="${meeting.id}" style="color: var(--color-primary-red); border-color: var(--color-primary-red);">Decline</button>
                        ` : `
                            <button class="btn btn-outline reset-btn" data-id="${meeting.id}" style="opacity: 0.5; font-size: 0.8rem;">Reset to Pending</button>
                        `}
                    </div>
                </div>
            `;
            meetingsList.appendChild(card);
        });

        // Add Listeners
        document.querySelectorAll('.approve-btn').forEach(btn => {
            btn.addEventListener('click', () => updateStatus(btn.dataset.id, 'approved'));
        });
        document.querySelectorAll('.reject-btn').forEach(btn => {
            btn.addEventListener('click', () => updateStatus(btn.dataset.id, 'rejected'));
        });
        document.querySelectorAll('.reset-btn').forEach(btn => {
            btn.addEventListener('click', () => updateStatus(btn.dataset.id, 'pending'));
        });
    }

    async function updateStatus(id, status) {
        try {
            const { error } = await supabaseClient
                .from('meetings')
                .update({ status: status })
                .eq('id', id);

            if (error) throw error;
            await fetchMeetings(); // Refresh
        } catch (err) {
            alert('Error updating status: ' + err.message);
        }
    }

    function updateStats(meetings) {
        const pCount = meetings.filter(m => m.status === 'pending').length;
        const aCount = meetings.filter(m => m.status === 'approved').length;
        
        document.getElementById('p-count').innerText = pCount;
        document.getElementById('a-count').innerText = aCount;
    }
});
