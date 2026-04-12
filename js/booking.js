// Booking and Meeting Management Logic for Bhagawan IT
document.addEventListener('DOMContentLoaded', async () => {
    const bookingLoading = document.getElementById('booking-loading');
    const bookingGuest = document.getElementById('booking-guest');
    const consultationForm = document.getElementById('consultation-form');
    const bookingStatus = document.getElementById('booking-status');
    const bookingError = document.getElementById('booking-error');
    const cancelBtn = document.getElementById('cancel-booking-btn');

    // 1. Check Login Session
    const { data: { session }, error: sessionError } = await supabaseClient.auth.getSession();
    const user = session?.user;

    if (!user) {
        showState('guest');
        return;
    }

    // 2. Fetch Existing Booking for this user
    await fetchAndDisplayBooking(user.id);

    // --- Core Functions ---

    async function fetchAndDisplayBooking(userId) {
        showState('loading');
        
        try {
            const { data: meetings, error } = await supabaseClient
                .from('meetings')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false })
                .limit(1);

            if (error) throw error;

            if (meetings && meetings.length > 0) {
                const meeting = meetings[0];
                updateStatusUI(meeting);
                showState('status');
            } else {
                showState('form');
            }
        } catch (err) {
            console.error('Error fetching booking:', err);
            showState('form'); // Fallback to form
        }
    }

    function showState(state) {
        if (!bookingLoading) return; // Guard for non-contact pages
        
        bookingLoading.style.display = 'none';
        bookingGuest.style.display = 'none';
        consultationForm.style.display = 'none';
        bookingStatus.style.display = 'none';

        if (state === 'loading') bookingLoading.style.display = 'block';
        else if (state === 'guest') bookingGuest.style.display = 'block';
        else if (state === 'form') consultationForm.style.display = 'block';
        else if (state === 'status') bookingStatus.style.display = 'block';
    }

    function updateStatusUI(meeting) {
        const title = document.getElementById('status-title');
        const desc = document.getElementById('status-desc');
        const badge = document.getElementById('status-badge');
        const icon = document.getElementById('status-icon');
        const refId = document.getElementById('ref-id');

        refId.innerText = `#BG-${meeting.id.split('-')[0].toUpperCase()}`;
        badge.innerText = meeting.status.toUpperCase();
        badge.className = `badge-${meeting.status}`;

        if (meeting.status === 'pending') {
            title.innerText = 'Meeting Under Review';
            desc.innerText = 'Bhagawan is currently reviewing your request. We will contact you at ' + meeting.email + ' shortly.';
            icon.innerText = '⏳';
        } else if (meeting.status === 'approved') {
            title.innerText = 'Meeting Approved! 🎉';
            desc.innerText = 'Your consultation has been approved. Bhagawan will reach out to schedule the exact time.';
            icon.innerText = '✅';
            badge.style.background = '#2D6A4F';
            if (cancelBtn) cancelBtn.style.display = 'none'; // Can't cancel once approved easily
        } else if (meeting.status === 'rejected') {
            title.innerText = 'Meeting Declined';
            desc.innerText = 'Unfortunately, we cannot take on new projects at this specific moment. Please try again later.';
            icon.innerText = '❌';
            badge.style.background = '#8B0000';
        }
    }

    // --- Form Submission ---
    if (consultationForm) {
        consultationForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = document.getElementById('submit-booking-btn');
            bookingError.style.display = 'none';
            
            btn.disabled = true;
            btn.innerText = 'Submitting Request...';

            const formData = {
                user_id: user.id,
                full_name: document.getElementById('fullName').value,
                email: document.getElementById('email').value,
                phone: document.getElementById('phone').value,
                company: document.getElementById('company').value,
                service: document.getElementById('service').value,
                budget: document.getElementById('budget').value,
                message: document.getElementById('message').value,
                status: 'pending'
            };

            try {
                const { error } = await supabaseClient
                    .from('meetings')
                    .insert([formData]);

                if (error) throw error;

                // Success! Re-fetch to show status
                await fetchAndDisplayBooking(user.id);
                
                // NOTIFICATION: In a real app, you'd trigger EmailJS or Edge Function here.
                console.log('Sending notification to gautambhagawan55@gmail.com...');
                
            } catch (err) {
                bookingError.innerText = err.message || 'Failed to submit request. Please try again.';
                bookingError.style.display = 'block';
                btn.disabled = false;
                btn.innerText = 'Submit Request';
            }
        });
    }

    // --- Cancellation ---
    if (cancelBtn) {
        cancelBtn.addEventListener('click', async () => {
            if (!confirm('Are you sure you want to cancel your meeting request?')) return;
            
            try {
                const { error } = await supabaseClient
                    .from('meetings')
                    .delete()
                    .eq('user_id', user.id)
                    .eq('status', 'pending');

                if (error) throw error;
                window.location.reload();
            } catch (err) {
                alert('Failed to cancel request.');
            }
        });
    }
});
