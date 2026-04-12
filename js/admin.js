// Admin Logic for Bhagawan IT Meeting Management
document.addEventListener('DOMContentLoaded', async () => {
    const adminContent = document.getElementById('admin-content');
    const adminGuard = document.getElementById('admin-auth-guard');
    const meetingsList = document.getElementById('meetings-list');
    const adminLoading = document.getElementById('admin-loading');
    
    // 1. Check Session & Auth Guard
    const { data: { session }, error: sessionErr } = await supabaseClient.auth.getSession();
    const user = session?.user;

    if (!user) {
        adminGuard.style.display = 'block';
        return;
    }

    // Fetch user profile to check role
    const { data: profile, error: profileErr } = await supabaseClient
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

    if (profileErr || !profile || profile.role !== 'admin') {
        adminGuard.style.display = 'block';
        if (profileErr) console.error('Profile Load Error:', profileErr);
        return;
    }

    // Is Admin
    adminGuard.style.display = 'none';

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

        const serviceLabels = {
            'web': 'Website Development',
            'app': 'Mobile App Development',
            'uiux': 'UI/UX Design',
            'graphic': 'Graphic Design',
            'maintenance': 'Maintenance & Support',
            'other': 'Other / Not Sure'
        };

        const budgetLabels = {
            'under_1l': 'Under NPR 1L',
            '1_to_5l': 'NPR 1L - 5L',
            '5_to_10l': 'NPR 5L - 10L',
            'over_10l': 'NPR 10L+'
        };

        meetingsList.innerHTML = '';
        meetings.forEach(meeting => {
            const card = document.createElement('div');
            card.className = 'card glass-effect admin-card mb-3';
            
            // Generate a random ID for the raw data toggle
            const debugId = `debug-${meeting.id.split('-')[0]}`;
            
            card.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 1.5rem; flex-wrap: wrap;">
                    <div style="flex: 1; min-width: 300px;">
                        <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.75rem;">
                            <span class="badge-${meeting.status}">${meeting.status.toUpperCase()}</span>
                            <small style="color: var(--text-muted-gray); font-size: 0.8rem;">Submitted: ${new Date(meeting.created_at).toLocaleString()}</small>
                        </div>
                        
                        <h3 class="mb-1" style="color: var(--text-off-white); font-size: 1.5rem;">${meeting.full_name || 'Name Missing'}</h3>
                        
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
                            <div>
                                <p style="margin: 0; font-size: 0.8rem; color: var(--text-muted-gray);">EMAIL</p>
                                <p style="margin: 0; color: var(--text-off-white);">${meeting.email || 'N/A'}</p>
                            </div>
                            <div>
                                <p style="margin: 0; font-size: 0.8rem; color: var(--text-muted-gray);">PHONE</p>
                                <p style="margin: 0; color: var(--text-off-white);">${meeting.phone || 'N/A'}</p>
                            </div>
                            <div>
                                <p style="margin: 0; font-size: 0.8rem; color: var(--text-muted-gray);">COMPANY</p>
                                <p style="margin: 0; color: var(--text-off-white);">${meeting.company || 'Personal'}</p>
                            </div>
                            <div>
                                <p style="margin: 0; font-size: 0.8rem; color: var(--text-muted-gray);">BUDGET</p>
                                <p style="margin: 0; color: var(--color-primary-red); font-weight: 600;">${budgetLabels[meeting.budget] || meeting.budget || 'N/A'}</p>
                            </div>
                        </div>

                        <div class="service-tag mb-3" style="display: inline-block; background: rgba(230, 57, 70, 0.1); border: 1px solid rgba(230, 57, 70, 0.3); padding: 0.3rem 0.8rem; border-radius: 4px; color: var(--color-primary-red); font-weight: 600; font-size: 0.85rem;">
                            Service: ${serviceLabels[meeting.service] || meeting.service || 'Select Service'}
                        </div>

                        <div class="mt-2 glass-effect p-3" style="border-radius: var(--radius-btn); border: 1px solid rgba(255,255,255,0.05); background: rgba(0,0,0,0.3);">
                            <p style="margin: 0 0 0.5rem 0; font-size: 0.75rem; color: var(--text-muted-gray); text-transform: uppercase; letter-spacing: 0.05em;">Project Details</p>
                            <p style="margin: 0; line-height: 1.6; color: var(--text-off-white);">${meeting.message || 'No details provided.'}</p>
                        </div>

                        <!-- Debug Toggle -->
                        <button class="debug-toggle mt-3" style="background: none; border: none; color: var(--text-muted-gray); font-size: 0.7rem; cursor: pointer; text-decoration: underline;" onclick="document.getElementById('${debugId}').style.display = document.getElementById('${debugId}').style.display === 'none' ? 'block' : 'none'">View Raw Data (Debug)</button>
                        <pre id="${debugId}" style="display: none; background: #000; color: #0f0; padding: 1rem; font-size: 0.7rem; border-radius: 4px; margin-top: 0.5rem; overflow-x: auto;">${JSON.stringify(meeting, null, 2)}</pre>
                    </div>

                    <div class="admin-actions" style="display: flex; flex-direction: column; gap: 0.75rem; min-width: 180px;">
                        ${meeting.status === 'pending' ? `
                            <div class="mb-2">
                                <label style="font-size: 0.7rem; color: var(--text-muted-gray); display: block; margin-bottom: 0.2rem;">SCHEDULE DATE</label>
                                <input type="date" id="date-${meeting.id}" class="form-control" style="background: rgba(0,0,0,0.2); height: 35px; font-size: 0.8rem; margin-bottom: 0.5rem;">
                                <label style="font-size: 0.7rem; color: var(--text-muted-gray); display: block; margin-bottom: 0.2rem;">SCHEDULE TIME</label>
                                <input type="time" id="time-${meeting.id}" class="form-control" style="background: rgba(0,0,0,0.2); height: 35px; font-size: 0.8rem;">
                            </div>
                            <button class="btn btn-primary approve-btn" data-id="${meeting.id}">Approve Meeting</button>
                            <button class="btn btn-outline reject-btn" data-id="${meeting.id}" style="color: var(--color-primary-red); border-color: var(--color-primary-red); width: 100%;">Decline</button>
                        ` : `
                            <div class="text-center py-2 mb-2" style="background: rgba(255,255,255,0.03); border-radius: 4px;">
                                <small style="display: block; color: var(--text-muted-gray);">Action taken</small>
                                <strong style="color: ${meeting.status === 'approved' ? '#52B788' : 'var(--text-muted-gray)'}; font-size: 0.8rem;">${meeting.status.toUpperCase()}</strong>
                                ${meeting.meeting_date ? `<small style="display: block; color: var(--text-off-white); font-size: 0.7rem;">${meeting.meeting_date} @ ${meeting.meeting_time}</small>` : ''}
                            </div>
                            <button class="btn btn-outline reset-btn" data-id="${meeting.id}" style="opacity: 0.6; font-size: 0.8rem; width: 100%;">Reset to Pending</button>
                        `}
                        <button class="btn btn-outline mt-2 delete-btn" data-id="${meeting.id}" style="opacity: 0.4; font-size: 0.7rem; border: none; color: var(--color-primary-red);">Delete Permanently</button>
                    </div>
                </div>
            `;
            meetingsList.appendChild(card);
        });

        // Add Listeners
        document.querySelectorAll('.approve-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.dataset.id;
                const mDate = document.getElementById(`date-${id}`).value;
                const mTime = document.getElementById(`time-${id}`).value;
                
                if (!mDate) {
                    alert('Please select a date for the meeting.');
                    return;
                }
                
                updateStatus(id, 'approved', mDate, mTime);
            });
        });
        document.querySelectorAll('.reject-btn').forEach(btn => {
            btn.addEventListener('click', () => updateStatus(btn.dataset.id, 'rejected'));
        });
        document.querySelectorAll('.reset-btn').forEach(btn => {
            btn.addEventListener('click', () => updateStatus(btn.dataset.id, 'pending'));
        });
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', () => deleteMeeting(btn.dataset.id));
        });
    }

    async function deleteMeeting(id) {
        if (!confirm('Are you sure you want to PERMANENTLY delete this request? This cannot be undone.')) return;
        try {
            const { error } = await supabaseClient
                .from('meetings')
                .delete()
                .eq('id', id);
            if (error) throw error;
            await fetchMeetings();
        } catch (err) {
            alert('Error deleting: ' + err.message);
        }
    }

    async function updateStatus(id, status, mDate = null, mTime = null) {
        const updateData = { status: status };
        if (mDate) updateData.meeting_date = mDate;
        if (mTime) updateData.meeting_time = mTime;

        try {
            const { error } = await supabaseClient
                .from('meetings')
                .update(updateData)
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
